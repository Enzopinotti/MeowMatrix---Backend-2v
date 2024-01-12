import userModel from "../daos/models/user.model.js";
import { hashPassword } from "../utils.js";
import { generateToken } from "../utils.js";


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
        let user = req.user;
        delete user.password;
        req.session.user = user;
        res.sendSuccess({ status: 'success', message: 'Registration successful' });
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
        if (!user)
            return res.sendUserError({ status: 'error', error: 'User not found' });
        delete user.password;
        const token = generateToken(user);
        res.cookie('access_token', token, { maxAge: 600000, httpOnly: true });
        res.sendSuccess({ status: 'success', message: 'Login successful' });
    } catch (error) {
        res.sendServerError(error);
        res.redirect('/login');
    }
}

export const logoutUser = async (req, res) => {
    try {
        console.log(req.session.user);
        if (req.session.user) {
            delete req.session.user;
            req.session.destroy(error => {
                if (error) {
                    res.sendServerError("Error al cerrar sesión");
                } else {
                    res.sendSuccess('Sesión cerrada correctamente');
                }
            });
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        res.sendServerError('Error al cerrar la sesión');
    }
};

export const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.sendUnauthorized('Acceso no autorizado');
    }
};

export const recoveryPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        await userModel.updateOne({ email }, { $set: { password: hashPassword(password) } });
        res.redirect('/login');
    } catch (error) {
        res.sendServerError('Error al recuperar la contraseña');
    }
}