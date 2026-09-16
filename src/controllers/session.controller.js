import { comparePasswords, hashPassword, obtenerTokenDeCookie, validatePassword } from "../utils.js";
import { generateToken } from "../utils.js";
import * as userService from '../services/user.service.js';
import { sendRecoveryEmail } from "./mail.controller.js";
import config from '../config/server.config.js';
import jwt from 'jsonwebtoken';

const PRIVATE_KEY = config.tokenKey;
const isProduction = config.mode === 'production';
const accessTokenCookieBaseOptions = Object.freeze({
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
});

const sanitizeUser = (user) => {
    const plainUser = user?.toObject ? user.toObject() : { ...user };
    delete plainUser.password;
    delete plainUser.resetPasswordToken;
    delete plainUser.resetPasswordExpires;
    return plainUser;
};

export const showLogin = (req, res) => {
    res.render('login', {
        title: 'Iniciar Sesión',
        style: 'login.css',
    });
};

export const showRegister = (req, res) => {
    res.render('register', {
        title: 'Registro',
        style: 'register.css',
    });
};

export const registerUser = async (req, res) => {
    try {
        res.sendSuccess({ status: 'success', payload: sanitizeUser(req.user) });
    } catch (error) {
        res.sendServerError(error);
    }
};

export const showRecovery = (req, res) => {
    res.render('recoveryPass', {
        title: 'Recuperar Contraseña',
        style: 'recoveryPass.css',
    });
};

export const showReset = async (req, res) => {
    const tokenId = req.params.tokenId;
    const reqLogger = req.logger;

    const user = await userService.getUserByResetToken(tokenId, reqLogger);
    if (!user) {
        req.logger.debug('En session.controller.js: showReset - No se encontró ningún usuario con el token proporcionado.');
        return res.redirect('/login');
    }

    const now = new Date();
    if (user.resetPasswordExpires && now > user.resetPasswordExpires) {
        req.logger.debug('En session.controller.js: showReset - El token de recuperación expiró.');
        return res.render('resetPassExpired', {
            title: 'Token expirado',
            style: 'resetPassExpired.css',
            token: tokenId,
        });
    }

    req.logger.debug('En session.controller.js: showReset - Token válido, mostrando vista de restablecimiento.');
    res.render('resetPass', {
        title: 'Restablecer Contraseña',
        style: 'resetPass.css',
        token: tokenId,
    });
};

export const loginUser = async (req, res) => {
    try {
        const safeUser = sanitizeUser(req.user);
        await userService.updateLastConnection(safeUser._id);
        const token = generateToken(safeUser);

        res.cookie('access_token', token, {
            ...accessTokenCookieBaseOptions,
            maxAge: 60 * 60 * 1000,
        });

        res.sendSuccess(safeUser);
    } catch (error) {
        res.sendServerError(error);
    }
};

export const logoutUser = async (req, res) => {
    try {
        const token = obtenerTokenDeCookie(req.headers.cookie);
        if (!token) {
            throw Error('Usuario no encontrado');
        }

        const decoded = jwt.verify(token, PRIVATE_KEY);
        const userId = decoded.user._id;
        await userService.updateLastConnection(userId);
        res.clearCookie('access_token', accessTokenCookieBaseOptions);
        res.sendSuccess('Sesión cerrada correctamente');
    } catch (error) {
        res.sendServerError('Error al cerrar sesión');
    }
};

export const getUserByToken = async (req, res) => {
    try {
        const token = obtenerTokenDeCookie(req.headers.cookie);
        if (!token) {
            throw new Error('Token no encontrado');
        }

        const decoded = jwt.verify(token, PRIVATE_KEY);
        const userId = decoded.user._id;
        const updatedUser = await userService.getUserById(userId, req.logger);
        if (!updatedUser) {
            throw new Error('Usuario no encontrado');
        }
        res.sendSuccess(sanitizeUser(updatedUser));
    } catch (error) {
        res.sendUnauthorized(error);
    }
};

export const recoveryPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const reqLogger = req.logger;
        const user = await userService.getUserByEmail(email, reqLogger);

        if (user == null) {
            return res.sendNotFound('El usuario no existe');
        }

        req.logger.debug('session.controller.js: recoveryPassword - Usuario encontrado.');
        const token = generateToken(sanitizeUser(user));
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();
        await sendRecoveryEmail(email, token);
        req.logger.debug('session.controller.js: recoveryPassword - Email de recuperación enviado.');
        res.sendSuccess({ message: 'Email de recuperación enviado.' });
    } catch (error) {
        req.logger?.error('session.controller.js: recoveryPassword - Falló el flujo de recuperación.');
        res.status(500).json({ error: 'Error al recuperar la contraseña' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const reqLogger = req.logger;
        const user = await userService.getUserByResetToken(token, reqLogger);

        if (!user) {
            return res.sendNotFound('El usuario no existe');
        }
        if (await comparePasswords(password, user.password)) {
            req.logger.error('En session.controller.js: resetPassword - La contraseña no puede ser igual a la anterior.');
            return res.sendUserError('La contraseña no puede ser igual a la anterior');
        }
        if (!validatePassword(password)) {
            req.logger.error('En session.controller.js: resetPassword - La contraseña no cumple con los criterios de seguridad.');
            return res.sendUserError('La contraseña no cumple con los criterios de seguridad');
        }

        user.password = hashPassword(password);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();
        res.sendSuccess({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        res.sendServerError(error);
    }
};

export const verifyPassword = async (req, res) => {
    try {
        const { userId, password, newPassword } = req.body;
        const reqLogger = req.logger;
        const user = await userService.getUserById(userId, reqLogger);

        if (!user) {
            throw new Error('El usuario no existe');
        }
        if (await comparePasswords(newPassword, user.password)) {
            req.logger.error('En session.controller.js: verifyPassword - La contraseña no puede ser igual a la anterior.');
            throw new Error('La contraseña no puede ser igual a la anterior');
        }
        return res.sendSuccess({ passwordMatched: await comparePasswords(password, user.password) });
    } catch (error) {
        res.sendServerError(error.message);
    }
};
