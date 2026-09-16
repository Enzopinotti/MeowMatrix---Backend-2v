import type { Db, MongoClient } from "mongodb";

export type DataPreflightCheck = Readonly<{
  name: string;
  status: "ok" | "blocked";
  count?: number;
  reason?: string;
}>;

export type DataPreflightReport = Readonly<{
  ok: boolean;
  checks: readonly DataPreflightCheck[];
}>;

async function countInvalidUsers(db: Db): Promise<number> {
  const [result] = await db
    .collection("users")
    .aggregate<{ count: number }>([
      {
        $project: {
          invalid: {
            $or: [
              { $ne: [{ $type: "$name" }, "string"] },
              { $eq: ["$name", ""] },
              { $ne: [{ $type: "$email" }, "string"] },
              { $eq: ["$email", ""] },
              {
                $and: [
                  { $ne: [{ $type: "$password" }, "string"] },
                  { $ne: [{ $type: "$passwordHash" }, "string"] },
                ],
              },
            ],
          },
        },
      },
      { $match: { invalid: true } },
      { $count: "count" },
    ])
    .toArray();
  return result?.count ?? 0;
}

async function countDuplicateNormalizedEmails(db: Db): Promise<number> {
  const [result] = await db
    .collection("users")
    .aggregate<{ count: number }>([
      { $match: { email: { $type: "string" } } },
      {
        $project: {
          normalizedEmail: {
            $toLower: { $trim: { input: "$email" } },
          },
        },
      },
      { $match: { normalizedEmail: { $ne: "" } } },
      { $group: { _id: "$normalizedEmail", documents: { $sum: 1 } } },
      { $match: { documents: { $gt: 1 } } },
      { $count: "count" },
    ])
    .toArray();
  return result?.count ?? 0;
}

async function countInvalidProducts(db: Db): Promise<number> {
  const [result] = await db
    .collection("products")
    .aggregate<{ count: number }>([
      {
        $project: {
          invalid: {
            $or: [
              { $ne: [{ $type: "$name" }, "string"] },
              { $eq: ["$name", ""] },
              { $not: [{ $isNumber: "$price" }] },
              { $lt: ["$price", 0] },
              { $not: [{ $isNumber: "$stock" }] },
              { $lt: ["$stock", 0] },
              { $ne: [{ $type: "$code" }, "string"] },
              { $eq: ["$code", ""] },
            ],
          },
        },
      },
      { $match: { invalid: true } },
      { $count: "count" },
    ])
    .toArray();
  return result?.count ?? 0;
}

async function countInvalidCategories(db: Db): Promise<number> {
  const [result] = await db
    .collection("categories")
    .aggregate<{ count: number }>([
      {
        $project: {
          validName: {
            $or: [
              {
                $and: [
                  { $eq: [{ $type: "$nameCategory" }, "string"] },
                  { $ne: ["$nameCategory", ""] },
                ],
              },
              {
                $and: [
                  { $eq: [{ $type: "$name" }, "string"] },
                  { $ne: ["$name", ""] },
                ],
              },
            ],
          },
        },
      },
      { $match: { validName: false } },
      { $count: "count" },
    ])
    .toArray();
  return result?.count ?? 0;
}

async function countBrokenProductCategoryReferences(db: Db): Promise<number> {
  const [result] = await db
    .collection("products")
    .aggregate<{ count: number }>([
      { $match: { category: { $type: "objectId" } } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "matchedCategory",
        },
      },
      { $match: { matchedCategory: { $size: 0 } } },
      { $count: "count" },
    ])
    .toArray();
  return result?.count ?? 0;
}

function countCheck(name: string, count: number): DataPreflightCheck {
  return count === 0
    ? { name, status: "ok", count }
    : { name, status: "blocked", count };
}

export async function runMongoDataPreflight(input: {
  client: MongoClient;
  db: Db;
}): Promise<DataPreflightReport> {
  const checks: DataPreflightCheck[] = [];

  const hello = await input.db.admin().command({ hello: 1 });
  const transactionTopology =
    hello.isWritablePrimary === true &&
    typeof hello.setName === "string" &&
    hello.setName.length > 0 &&
    typeof hello.logicalSessionTimeoutMinutes === "number";
  checks.push(
    transactionTopology
      ? { name: "mongo_transaction_topology", status: "ok" }
      : {
          name: "mongo_transaction_topology",
          status: "blocked",
          reason: "Mongo must be a writable replica-set primary with sessions",
        },
  );

  const session = input.client.startSession();
  try {
    session.startTransaction({ readConcern: { level: "snapshot" } });
    await input.db.collection("users").findOne({}, { session });
    await session.abortTransaction();
    checks.push({ name: "mongo_snapshot_transaction", status: "ok" });
  } catch {
    if (session.inTransaction()) await session.abortTransaction().catch(() => undefined);
    checks.push({
      name: "mongo_snapshot_transaction",
      status: "blocked",
      reason: "Read-only snapshot transaction failed",
    });
  } finally {
    await session.endSession();
  }

  const [invalidUsers, duplicateEmails, invalidProducts, invalidCategories, brokenCategories] =
    await Promise.all([
      countInvalidUsers(input.db),
      countDuplicateNormalizedEmails(input.db),
      countInvalidProducts(input.db),
      countInvalidCategories(input.db),
      countBrokenProductCategoryReferences(input.db),
    ]);

  checks.push(
    countCheck("users_runtime_shape", invalidUsers),
    countCheck("users_normalized_email_uniqueness", duplicateEmails),
    countCheck("products_runtime_shape", invalidProducts),
    countCheck("categories_runtime_shape", invalidCategories),
    countCheck("product_category_references", brokenCategories),
  );

  return {
    ok: checks.every((check) => check.status === "ok"),
    checks,
  };
}
