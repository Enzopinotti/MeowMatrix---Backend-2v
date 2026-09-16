import { MongoClient, ObjectId, type Db, type Document } from "mongodb";

type PreflightMode = "source" | "target";

type DataPreflightReport = {
  mode: PreflightMode;
  topology: {
    transactionCapable: true;
    kind: "replicaSet" | "mongos";
    sessions: true;
  };
  counts: Record<string, number>;
  integrity: {
    invalidUsers: number;
    duplicateNormalizedEmails: number;
    invalidProducts: number;
    invalidCategories: number;
    orphanSessions: number;
    orphanPasswordResets: number;
    orphanCarts: number;
    orphanCartLines: number;
    orphanOrders: number;
    orphanOutboxEvents: number;
    orphanPrivateFiles: number;
  };
  missingCollections: readonly string[];
  missingIndexes: readonly string[];
};

const sourceCollections = ["users", "products"] as const;
const targetCollections = [
  "users",
  "products",
  "auth_sessions",
  "auth_password_resets",
  "auth_rate_limits",
  "commerce_carts",
  "commerce_orders",
  "commerce_outbox",
  "private_files",
] as const;

const expectedTargetIndexes: Readonly<Record<string, readonly string[]>> = {
  users: ["auth_email_unique_ci"],
  auth_sessions: ["token_hash_unique", "session_user", "session_ttl"],
  auth_password_resets: [
    "reset_token_hash_unique",
    "reset_user_unique",
    "reset_ttl",
  ],
  auth_rate_limits: ["auth_rate_limits_expiry"],
  commerce_carts: ["commerce_cart_user_unique"],
  commerce_orders: [
    "commerce_order_idempotency_unique",
    "commerce_order_history",
  ],
  commerce_outbox: [
    "commerce_outbox_pending",
    "commerce_outbox_order",
    "commerce_outbox_delivery_claim",
  ],
  private_files: [
    "private_file_current_slot_unique",
    "private_file_owner_status",
    "private_file_recovery",
  ],
};

function parseMode(value: string | undefined): PreflightMode {
  if (value === undefined || value === "target") return "target";
  if (value === "source") return "source";
  throw new Error("DATA_PREFLIGHT_MODE must be source or target");
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function validUser(document: Document): boolean {
  return (
    optionalString(document.name) !== null &&
    optionalString(document.email) !== null &&
    (optionalString(document.password) !== null ||
      optionalString(document.passwordHash) !== null)
  );
}

function validProduct(document: Document): boolean {
  return (
    document._id instanceof ObjectId &&
    optionalString(document.name) !== null &&
    optionalString(document.code) !== null &&
    typeof document.price === "number" &&
    Number.isFinite(document.price) &&
    document.price >= 0 &&
    typeof document.stock === "number" &&
    Number.isSafeInteger(document.stock) &&
    document.stock >= 0
  );
}

function validCategory(document: Document): boolean {
  const name = document.nameCategory ?? document.name;
  return document._id instanceof ObjectId && optionalString(name) !== null;
}

async function countInvalidDocuments(
  db: Db,
  collectionName: string,
  projection: Document,
  predicate: (document: Document) => boolean,
): Promise<number> {
  const names = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map(
      (entry) => entry.name,
    ),
  );
  if (!names.has(collectionName)) return 0;

  let invalid = 0;
  const cursor = db.collection(collectionName).find({}, { projection });
  for await (const document of cursor) {
    if (!predicate(document)) invalid += 1;
  }
  return invalid;
}

async function duplicateNormalizedEmails(db: Db): Promise<number> {
  const result = await db
    .collection("users")
    .aggregate<{ count: number }>([
      { $match: { email: { $type: "string" } } },
      {
        $project: {
          normalized: { $toLower: { $trim: { input: "$email" } } },
        },
      },
      { $match: { normalized: { $ne: "" } } },
      { $group: { _id: "$normalized", occurrences: { $sum: 1 } } },
      { $match: { occurrences: { $gt: 1 } } },
      { $count: "count" },
    ])
    .next();
  return result?.count ?? 0;
}

async function countMissingObjectIdReference(
  db: Db,
  collectionName: string,
  localStringField: string,
  foreignCollection: string,
): Promise<number> {
  const result = await db
    .collection(collectionName)
    .aggregate<{ count: number }>([
      {
        $set: {
          __preflightObjectId: {
            $convert: {
              input: `$${localStringField}`,
              to: "objectId",
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $lookup: {
          from: foreignCollection,
          localField: "__preflightObjectId",
          foreignField: "_id",
          as: "__preflightForeign",
        },
      },
      {
        $match: {
          $expr: { $eq: [{ $size: "$__preflightForeign" }, 0] },
        },
      },
      { $count: "count" },
    ])
    .next();
  return result?.count ?? 0;
}

async function countOrphanCartLines(db: Db): Promise<number> {
  const result = await db
    .collection("commerce_carts")
    .aggregate<{ count: number }>([
      { $unwind: "$lines" },
      {
        $lookup: {
          from: "products",
          localField: "lines.productId",
          foreignField: "_id",
          as: "__preflightProduct",
        },
      },
      {
        $match: {
          $expr: { $eq: [{ $size: "$__preflightProduct" }, 0] },
        },
      },
      { $count: "count" },
    ])
    .next();
  return result?.count ?? 0;
}

async function missingIndexes(
  db: Db,
  existingCollections: ReadonlySet<string>,
): Promise<string[]> {
  const missing: string[] = [];
  for (const [collectionName, expectedNames] of Object.entries(
    expectedTargetIndexes,
  )) {
    if (!existingCollections.has(collectionName)) {
      for (const indexName of expectedNames) {
        missing.push(`${collectionName}:${indexName}`);
      }
      continue;
    }
    const names = new Set(
      (await db.collection(collectionName).indexes()).map((index) => index.name),
    );
    for (const indexName of expectedNames) {
      if (!names.has(indexName)) missing.push(`${collectionName}:${indexName}`);
    }
  }
  return missing.sort();
}

async function run(): Promise<DataPreflightReport> {
  const mode = parseMode(process.env.DATA_PREFLIGHT_MODE);
  const mongoUrl = requiredEnv("MONGO_URL");
  const dbName = process.env.MONGO_DB_NAME?.trim() || undefined;
  const client = new MongoClient(mongoUrl, { appName: "meow-data-preflight" });

  try {
    await client.connect();
    const db = dbName ? client.db(dbName) : client.db();
    const hello = await db.admin().command({ hello: 1 });
    const transactionKind =
      typeof hello.setName === "string" && hello.setName.length > 0
        ? "replicaSet"
        : hello.msg === "isdbgrid"
          ? "mongos"
          : null;
    if (transactionKind === null) {
      throw new Error(
        "Mongo topology is not transaction-capable; replica set or mongos is required",
      );
    }
    if (typeof hello.logicalSessionTimeoutMinutes !== "number") {
      throw new Error("Mongo topology does not advertise logical sessions");
    }

    const collectionNames = new Set(
      (await db.listCollections({}, { nameOnly: true }).toArray()).map(
        (entry) => entry.name,
      ),
    );
    const requiredCollections =
      mode === "source" ? sourceCollections : targetCollections;
    const missingCollections = requiredCollections.filter(
      (name) => !collectionNames.has(name),
    );

    const counts: Record<string, number> = {};
    for (const collectionName of requiredCollections) {
      counts[collectionName] = collectionNames.has(collectionName)
        ? await db.collection(collectionName).countDocuments({})
        : 0;
    }
    if (collectionNames.has("categories")) {
      counts.categories = await db.collection("categories").countDocuments({});
    }

    const invalidUsers = collectionNames.has("users")
      ? await countInvalidDocuments(
          db,
          "users",
          { name: 1, email: 1, password: 1, passwordHash: 1 },
          validUser,
        )
      : 0;
    const invalidProducts = collectionNames.has("products")
      ? await countInvalidDocuments(
          db,
          "products",
          { name: 1, code: 1, price: 1, stock: 1 },
          validProduct,
        )
      : 0;
    const invalidCategories = collectionNames.has("categories")
      ? await countInvalidDocuments(
          db,
          "categories",
          { name: 1, nameCategory: 1 },
          validCategory,
        )
      : 0;

    const targetIntegrity =
      mode === "target" && missingCollections.length === 0
        ? {
            orphanSessions: await countMissingObjectIdReference(
              db,
              "auth_sessions",
              "userId",
              "users",
            ),
            orphanPasswordResets: await countMissingObjectIdReference(
              db,
              "auth_password_resets",
              "userId",
              "users",
            ),
            orphanCarts: await countMissingObjectIdReference(
              db,
              "commerce_carts",
              "userId",
              "users",
            ),
            orphanCartLines: await countOrphanCartLines(db),
            orphanOrders: await countMissingObjectIdReference(
              db,
              "commerce_orders",
              "purchaserId",
              "users",
            ),
            orphanOutboxEvents: await countMissingObjectIdReference(
              db,
              "commerce_outbox",
              "aggregateId",
              "commerce_orders",
            ),
            orphanPrivateFiles: await countMissingObjectIdReference(
              db,
              "private_files",
              "ownerId",
              "users",
            ),
          }
        : {
            orphanSessions: 0,
            orphanPasswordResets: 0,
            orphanCarts: 0,
            orphanCartLines: 0,
            orphanOrders: 0,
            orphanOutboxEvents: 0,
            orphanPrivateFiles: 0,
          };

    const report: DataPreflightReport = {
      mode,
      topology: {
        transactionCapable: true,
        kind: transactionKind,
        sessions: true,
      },
      counts,
      integrity: {
        invalidUsers,
        duplicateNormalizedEmails: collectionNames.has("users")
          ? await duplicateNormalizedEmails(db)
          : 0,
        invalidProducts,
        invalidCategories,
        ...targetIntegrity,
      },
      missingCollections,
      missingIndexes:
        mode === "target" ? await missingIndexes(db, collectionNames) : [],
    };

    const failed =
      report.missingCollections.length > 0 ||
      report.missingIndexes.length > 0 ||
      Object.values(report.integrity).some((count) => count > 0);

    console.log(JSON.stringify(report));
    if (failed) process.exitCode = 2;
    return report;
  } finally {
    await client.close();
  }
}

await run();
