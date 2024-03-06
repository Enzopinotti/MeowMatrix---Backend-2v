import { Command } from "commander";
import dotenv from "dotenv";

const commander = new Command();

commander.option(
    `--mode <mode>`,
    "Modo del servidor: development o production"
);

commander.parse();

const mode = commander.opts().mode;
let envPath

if (mode === undefined) {
    envPath = ".env.development";
}else{
    envPath = `.env.${mode}`;
}

dotenv.config({ path: envPath });

export default {
    port: process.env.PORT,
    mode: process.env.MODE,
    mongoUrl: process.env.MONGO_URL,
    jwtSecret: process.env.JWT_SECRET,
    tokenKey: process.env.TOKEN_KEY,
    gitClientSecret: process.env.GIT_CLIENT_SECRET,
    gitCallbackUrl: process.env.GIT_CALLBACK_URL,
    gitClientId: process.env.GIT_CLIENT_ID,
    gitAppId: process.env.GIT_APP_ID,
    hashKey: process.env.HASH_KEY,
    persistence: process.env.PERSISTENCE,
}