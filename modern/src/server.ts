import { createApp } from "./app.js";
import { loadConfig } from "./config/env.js";

const config = loadConfig();
const app = createApp({
  allowedOrigins: config.frontendOrigins,
  sessionCookieOptions: {
    secure: config.sessionCookieSecure,
    sameSite: config.sessionCookieSameSite,
    maxAgeSeconds: config.sessionTtlSeconds,
  },
});

const server = app.listen(config.port, () => {
  console.log("Meow API listening", {
    port: config.port,
    nodeEnv: config.nodeEnv,
  });
});

function shutdown(signal: string) {
  console.log("Meow API shutting down", { signal });
  server.close((error) => {
    if (error) {
      console.error("Meow API shutdown failed", { name: error.name });
      process.exitCode = 1;
      return;
    }

    process.exitCode = 0;
  });
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
