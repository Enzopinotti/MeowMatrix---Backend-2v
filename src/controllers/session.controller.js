import { hashPassword } from "../utils.js";
import { generateToken } from "../utils.js";
import * as sessionServices from '../services/session.service.js';
import * as userService from '../services/user.service.js';
import CustomError from "../utils/customError.util.js";
import { generateInvalidValuesErrorInfo } from "../utils/infoError.util.js";
import EnumError from "../utils/enumError.util.js";


export const showLogin = (req, res) => {
    res.render('login',{
        title: 'Iniciar Sesión',
        style: 'login.css',
    });
};

export const showRegister = (req, res) => {
    req.logger.warn('Se entró a register user')
    res.render('register',{
        title: 'Registro',
        style: 'register.css',
    });
}

export const registerUser = async (req, res) => {
    try {
        
        const addedUser = await userService.addUser(req.body);
        res.sendSuccess({ status: 'success', payload: addedUser });
    } catch (error) {
        let userErrorInfo = '';

        switch (error.code) {
            case EnumError.INVALID_VALUES_ERROR:
                userErrorInfo = infoError.generateInvalidValuesErrorInfo(
                    req.body.name,
                    req.body.lastName,
                    req.body.email,
                    req.body.password,
                    req.body.birthDate
                );
                res.sendUserError({ status: 'error', message: userErrorInfo });
                break;
            case EnumError.DUPLICATE_EMAIL_ERROR:
                userErrorInfo = infoError.generateDuplicateEmailErrorInfo(req.body.email);
                res.sendUserError({ status: 'error', message: userErrorInfo });
                break;
            case EnumError.WEAK_PASSWORD_ERROR:
                userErrorInfo = infoError.generateWeakPasswordErrorInfo();
                res.sendUserError({ status: 'error', message: userErrorInfo });
                break;
            default:
                res.sendServerError({ status: 'error', message: error.message });
        }
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
        console.log(error);
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