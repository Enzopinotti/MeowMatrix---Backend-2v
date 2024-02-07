import winston from "winston";
import { customLoggerOptions } from "../../utils/customLoggerOptions.util.js"; 

export const logger = winston.createLogger({
    levels: customLoggerOptions.level,
    transports: [
        new winston.transports.Console({
            level: "debug",  // Cambiado a "debug" para cumplir con la consigna
            format: winston.format.combine(
                winston.format.colorize({ colors: customLoggerOptions.colors }),
                winston.format.simple()
            )
        }),
    ]
});