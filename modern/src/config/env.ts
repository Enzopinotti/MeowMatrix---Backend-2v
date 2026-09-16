const allowedNodeEnvs = ["development", "test", "production"] as const;

type NodeEnv = (typeof allowedNodeEnvs)[number];

export type AppConfig = {
  port: number;
  nodeEnv: NodeEnv;
};

function parsePort(value: string | undefined): number {
  if (!value) {
    return 8080;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return port;
}

function parseNodeEnv(value: string | undefined): NodeEnv {
  const candidate = value ?? "development";

  if (!allowedNodeEnvs.includes(candidate as NodeEnv)) {
    throw new Error("NODE_ENV must be development, test, or production");
  }

  return candidate as NodeEnv;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: parsePort(env.PORT),
    nodeEnv: parseNodeEnv(env.NODE_ENV),
  };
}
