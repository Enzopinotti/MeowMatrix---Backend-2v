import { MongoClient } from "mongodb";
import { loadConfig } from "./config/env.js";
import { runMongoDataPreflight } from "./operations/mongo-data-preflight.js";

const config = loadConfig();
if (config.mongoUrl === null) {
  throw new Error("Data preflight requires MONGO_URL");
}

const client = new MongoClient(config.mongoUrl, {
  appName: "meow-matrix-data-preflight-2026",
});

try {
  await client.connect();
  const db = config.mongoDbName ? client.db(config.mongoDbName) : client.db();
  const report = await runMongoDataPreflight({ client, db });
  process.stdout.write(`${JSON.stringify(report)}\n`);
  if (!report.ok) process.exitCode = 1;
} finally {
  await client.close();
}
