import { hashPassword } from "../utils.js";
import { generateToken } from "../utils.js";
import * as sessionServices from '../services/session.service.js';
import * as userService from '../services/user.service.js';
import CustomError from "../utils/customError.util.js";
import { generateInvalidValuesErrorInfo } from "../utils/infoError.util.js";
import EnumError from "../utils/enumError.util.js";
import userModel from "../daos/mongo/models/user.model.js";

export const showLogin = (req, res) => {
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
        req.logger.debug("session.controller.js: registerUser - Creando usuario");   
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

export const loginUser = async (req, res) => {
    try {
        let user = req.user;
        delete user.password;
        const token = generateToken(user);
        res.cookie('access_token', token, { maxAge: 3600000, httpOnly: true, rolling: true });
        res.sendSuccess({ message: 'Login successful' });
    } catch (error) {
        res.sendServerError(error);
    }
}

export const logoutUser = async (req, res) => {
    try {
        res.clearCookie('access_token');
        res.redirect('/login'); // Redirección directa en el lado del servidor
    } catch (error) {
        res.sendServerError('Error al cerrar sesión');
    }
};

export const isAuthenticated = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.sendUnauthorized('Acceso no autorizado');
    }
};

export const recoveryPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        const newPassword = hashPassword(password);
        await sessionServices.updatePassword(email, newPassword);
        res.redirect('/login');
      } catch (error) {
        res.sendServerError('Error al recuperar la contraseña');
      }
}