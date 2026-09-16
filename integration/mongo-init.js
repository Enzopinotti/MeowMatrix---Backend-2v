const replicaConfig = {
  _id: "rs0",
  members: [{ _id: 0, host: "mongo:27017" }],
};

try {
  rs.status();
} catch (error) {
  if (error.codeName !== "NotYetInitialized" && error.code !== 94) {
    throw error;
  }
  const initiated = rs.initiate(replicaConfig);
  if (initiated.ok !== 1) {
    throw new Error(`Replica-set initiation failed: ${JSON.stringify(initiated)}`);
  }
}

for (let attempt = 0; attempt < 120; attempt += 1) {
  const hello = db.adminCommand({ hello: 1 });
  if (hello.ok === 1 && hello.isWritablePrimary === true) {
    print("Mongo replica set rs0 is writable primary");
    quit(0);
  }
  sleep(500);
}

throw new Error("Mongo replica set rs0 did not become writable primary in time");
