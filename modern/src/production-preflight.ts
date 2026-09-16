import { loadConfig } from "./config/env.js";

const config = loadConfig();

if (config.nodeEnv !== "production") {
  throw new Error("Production preflight requires NODE_ENV=production");
}

console.log("Meow production preflight passed", {
  nodeEnv: config.nodeEnv,
  frontendOrigins: config.frontendOrigins,
  trustProxyHops: config.trustProxyHops,
  sessionCookieSecure: config.sessionCookieSecure,
  sessionCookieSameSite: config.sessionCookieSameSite,
  mongoConfigured: config.mongoUrl !== null,
  privateStorageConfigured: config.privateStorageRoot !== null,
  smtpConfigured: config.smtpHost !== null && config.smtpFrom !== null,
  passwordResetConfigured: config.passwordResetUrl !== null,
});
