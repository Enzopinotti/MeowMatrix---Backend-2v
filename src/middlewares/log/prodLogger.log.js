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
<<<<<<< HEAD
            filename: "./logs/errors.log",
            level: "error",
=======
            filename: "./logs/warn.log",
            level: "warn",
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
            format: winston.format.simple()
        }),
    ]
});