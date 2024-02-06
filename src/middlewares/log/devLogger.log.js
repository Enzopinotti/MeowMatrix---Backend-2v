import winston from "winston";
<<<<<<< HEAD
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
=======

export const logger = winston.createLogger({
    transports: [new winston.transports.Console({level: "verbose"})],
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
});