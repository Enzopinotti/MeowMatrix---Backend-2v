import { comparePasswords, hashPassword, obtenerTokenDeCookie, validatePassword } from "../utils.js";
import { generateToken } from "../utils.js";
import * as sessionServices from '../services/session.service.js';
import * as userService from '../services/user.service.js';
import { v4 as uuidv4 } from 'uuid';
import { sendRecoveryEmail } from "./mail.controller.js";
import { format } from "morgan";
import config from '../config/server.config.js'
import jwt from 'jsonwebtoken';

const PRIVATE_KEY = config.tokenKey;

export const showLogin = (req, res) => {
    console.log('atendido por el worker: ', process.pid)
    res.render('login',{
        title: 'Iniciar Sesión',
        style: 'login.css',
    });
};

export const showRegister = (req, res) => {
    res.render('register',{
        title: 'Registro',
        style: 'register.css',
    });
}

export const registerUser = async (req, res) => {
    try {
        res.sendSuccess( { status: 'success', payload: req.user } );
    } catch (error) {
        res.sendServerError(error);
    }
};

export const showRecovery = (req, res) => {
    res.render('recoveryPass',{
        title: 'Recuperar Contraseña',
        style: 'recoveryPass.css',
    });
}
export const showReset = async (req, res) => {
    const tokenId = req.params.tokenId;
    const reqLogger = req.logger;

    const user = await userService.getUserByResetToken(tokenId, reqLogger);
    if (!user) {
        // Si no se encuentra ningún usuario con el token, redirigir a una vista de error
        req.logger.debug('En session.controller.js: showReset - No se encontró ningún usuario con el token proporcionado.');
        return res.redirect('/login');
    }
    // Verificar si el token ha expirado
    const now = new Date();
    if (user.resetPasswordExpires && now > user.resetPasswordExpires) {
        // Si el token ha expirado, redirigir a una vista para generar un nuevo correo de restablecimiento
        req.logger.debug(`En session.controller.js: showReset - El token ha expirado. Fecha actual:  ${now} Fecha del token:  ${user.resetPasswordExpires}`);
        return res.render('resetPassExpired', {
            title: 'Token expirado',
            style: 'resetPassExpired.css',
            token: tokenId,
        });
    }
    // Si el token no ha expirado, mostrar la vista para restablecer la contraseña
    req.logger.debug('En session.controller.js: showReset - Token válido, mostrando vista para restablecer la contraseña.');
    res.render('resetPass', {
        title: 'Restablecer Contraseña',
        style: 'resetPass.css',
        token: tokenId,
    });
};

export const loginUser = async (req, res) => {
    try {
        console.log('entré')
        let user = req.user;
        delete user.password;
        await userService.updateLastConnection(user._id);
        const token = generateToken(user);
        // Devuelve la información del usuario junto con el token de acceso
        res.cookie('access_token', token, { maxAge: 3600000, httpOnly: true, rolling: true });
        res.sendSuccess( user );
    } catch (error) {
        res.sendServerError(error);
    }
}

export const logoutUser = async (req, res) => {
    try {
        let user = req.user;
        if (!user) {
            res.redirect('/login');
        }else{
            await userService.updateLastConnection(user._id);
            res.clearCookie('access_token');
            res.redirect('/login'); // Redirección directa en el lado del servidor
        }
        
    } catch (error) {
        res.sendServerError('Error al cerrar sesión');
    }
};

export const getUserByToken = async (req, res) => {
    try {

        const token = obtenerTokenDeCookie(req.headers.cookie);
        if (!token) {
            console.log('no encontré el token')
            throw new Error('Token no encontrado');

        }
        // Extrae el token del encabezado de autorización
        const decoded = jwt.verify(token, PRIVATE_KEY);
        // Decodifica el token JWT
        const userId = decoded.user._id; // Obtiene la información del usuario utilizando el ID del token
        const updatedUser = await userService.getUserById(userId, req.logger);
        if (!updatedUser) {
            console.log('no encontré el usuario')
            throw new Error('Usuario no encontrado');
        }
        res.sendSuccess(updatedUser); // Envia la información del usuario como respuesta
    } catch (error) {
        res.sendUnauthorized(error); // Maneja los errores y envia una respuesta de error
    }
}



export const recoveryPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const reqLogger = req.logger;

        // Verificar si el correo electrónico existe en la base de datos
        const user = await userService.getUserByEmail(email, reqLogger);
        if (user == null) {
            // Si el usuario no existe, mostrar un mensaje de error o redirigir a una página de error
            return res.sendNotFound('El usuario no existe');
        }
        req.logger.debug("session.controller.js: recoveryPassword - Usuario encontrado.");
        // Generar un token único para el usuario (puedes usar una biblioteca como `uuid` para esto)
        const token = generateToken(user);
        req.logger.debug("session.controller.js: recoveryPassword - Token Generado.");
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
        await user.save();
        // Send recovery email
        await sendRecoveryEmail(email, token);
        req.logger.debug("session.controller.js: recoveryPassword - Email de recuperacion enviado.");
        res.sendSuccess({ error: 'Email de recuperación enviado.' });
    } catch (error) {
        // Manejar cualquier error que ocurra durante el proceso de recuperación de contraseña
        console.error('Error al recuperar la contraseña:', error);
        res.status(500).json({ error: 'Error al recuperar la contraseña' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const reqLogger = req.logger;

        // Verificar si el token es válido y si el usuario existe
        const user = await userService.getUserByResetToken(token, reqLogger);
        if (!user) {
            return res.sendNotFound('El usuario no existe');
        }
        console.log('user: ', user)
        console.log('password nuevo: ', password, 'password nuevo hasheado: ', hashPassword(password))
        if (await comparePasswords(password, user.password)) {
            req.logger.error("En session.controller.js: resetPassword - La contraseña no puede ser igual a la anterior.");
            return res.sendUserError('La contraseña no puede ser igual a la anterior');
        }
        if (!validatePassword(password)) {
            req.logger.error("En session.controller.js: resetPassword - La contraseña no cumple con los criterios de seguridad.");
            return res.sendUserError('La contraseña no cumple con los criterios de seguridad');
        }
        // Actualizar la contraseña del usuario
        user.password = hashPassword(password);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();
        res.sendSuccess({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        res.sendServerError(error);
    }
}

export const verifyPassword = async (req, res) => {
    try {
        const { userId , password, newPassword } = req.body;
        console.log('userId: ', userId, 'password: ', password, 'newPassword: ', newPassword)
        const reqLogger = req.logger;
        const user = await userService.getUserById(userId, reqLogger);
        if (!user) {
            throw new Error('El usuario no existe');
        }
        if (await comparePasswords(newPassword, user.password)) {
            req.logger.error("En session.controller.js: verifyPassword - La contraseña no puede ser igual a la anterior.");
            throw new Error('La contraseña no puede ser igual a la anterior');
        }
        return res.sendSuccess({ passwordMatched: await comparePasswords(password, user.password) }); // Envia la respuesta de validación como respuesta.
    } catch (error) {
        res.sendServerError(error.message);
    }
}
