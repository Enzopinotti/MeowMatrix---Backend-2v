import jwt from 'jsonwebtoken';
import config from '../config/server.config.js'

const PRIVATE_KEY = config.tokenKey;

export function authToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    // Verificar si el encabezado de autorización existe
    if (!authHeader) {
        return res.status(401).send({ status: "error", error: "Unauthorized" });
    }

    // Extraer el token del encabezado de autorización
    const token = authHeader.split(" ")[1];

    // Verificar la validez del token utilizando jwt.verify
    jwt.verify(token, PRIVATE_KEY, (error, credentials) => {
        if (error) {
            // Si hay un error en la verificación del token, devuelve un error 403 Forbidden
            return res.status(403).send({ status: "error", error: "Forbidden" });
        }

        // Si el token es válido, establece req.user con las credenciales decodificadas y pasa al siguiente middleware
        req.user = credentials.user;
        next();
    });
}
