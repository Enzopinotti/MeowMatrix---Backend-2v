import winston from "winston";

import { customLoggerOptions } from "../../utils/customLoggerOptions.util.js"; 

export const logger = winston.createLogger({
    levels: customLoggerOptions.level,
    transports: [
        new winston.transports.Console({
            level: "info",
            format: winston.format.combine(
                winston.format.colorize({ colors: customLoggerOptions.colors }),
                winston.format.simple()
            )
        }),
        new winston.transports.File({
            filename: "./logs/errors.log",
            level: "error",
            format: winston.format.simple()
        }),
    ]
});