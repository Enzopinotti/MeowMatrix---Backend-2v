import * as userService from '../../services/user.service.js'

export const verifyToken = async (req, res, next) => {
    try {
        const tokenId = req.params.tokenId;
        const reqLogger = req.logger;
        // Buscar un usuario con el token proporcionado
        const user = await userService.getUserByResetToken(tokenId, reqLogger);
        if (!user) {
            // Si no se encuentra ningún usuario con el token, redirigir a una vista de error
            req.logger.debug('En verification.token.js: verifyToken - No se encontró ningún usuario con el token proporcionado.');
            return res.redirect('/recoveryPass');
        }

        // Verificar si el token ha expirado
        const now = new Date();
        if (user.resetPasswordExpires && now > user.resetPasswordExpires) {
            // Si el token ha expirado, redirigir a una vista para generar un nuevo correo de restablecimiento
            req.logger.debug('En verification.token.js: verifyToken - El token ha expirado.');
            return res.sendUserError({error: 'Token Expirado'});
        }

        // Si el token es válido y no ha expirado, continuar con la siguiente función de middleware
        req.user = user;
        next();
    } catch (error) {
        // Manejar cualquier error que ocurra durante la verificación del token
        req.logger.error('En verification.token.js: verifyToken - Error Verificando el token.');
        res.sendServerError('Error Verificando el token.');
    }
};