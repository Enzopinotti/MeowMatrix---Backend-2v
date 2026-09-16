import { createHmac } from "node:crypto";
import type { Collection, Db } from "mongodb";
import type {
  RateLimitBucket,
  RateLimitStore,
  RateLimitStoreIncrement,
} from "../security/rate-limit.js";

type RateLimitDocument = {
  _id: string;
  scope: string;
  keyHash: string;
  count: number;
  resetAt: Date;
  updatedAt: Date;
};

function hashRateLimitKey(
  scope: string,
  value: string,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(scope)
    .update("\0")
    .update(value)
    .digest("hex");
}

export async function ensureRateLimitIndexes(db: Db): Promise<void> {
  await db.collection<RateLimitDocument>("auth_rate_limits").createIndex(
    { resetAt: 1 },
    {
      name: "auth_rate_limits_expiry",
      expireAfterSeconds: 0,
    },
  );
}

export class MongoRateLimitStore implements RateLimitStore {
  private readonly buckets: Collection<RateLimitDocument>;
  private readonly hmacSecret: string;

  constructor(db: Db, hmacSecret: string) {
    this.buckets = db.collection<RateLimitDocument>("auth_rate_limits");
    this.hmacSecret = hmacSecret;
  }

  async increment(input: RateLimitStoreIncrement): Promise<RateLimitBucket> {
    const keyHash = hashRateLimitKey(input.scope, input.key, this.hmacSecret);
    const id = `${input.scope}:${keyHash}`;
    const now = new Date(input.now);
    const nextResetAt = new Date(input.now + input.policy.windowMs);
    const expired = {
      $lte: [{ $ifNull: ["$resetAt", new Date(0)] }, now],
    };

    const bucket = await this.buckets.findOneAndUpdate(
      { _id: id },
      [
        {
          $set: {
            scope: input.scope,
            keyHash,
            count: {
              $cond: [expired, 1, { $add: [{ $ifNull: ["$count", 0] }, 1] }],
            },
            resetAt: {
              $cond: [expired, nextResetAt, "$resetAt"],
            },
            updatedAt: now,
          },
        },
      ],
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    if (
      bucket === null ||
      typeof bucket.count !== "number" ||
      !(bucket.resetAt instanceof Date)
    ) {
      throw new Error("Mongo rate-limit store returned an invalid bucket");
    }

    return {
      count: bucket.count,
      resetAt: bucket.resetAt.getTime(),
    };
  }
}
