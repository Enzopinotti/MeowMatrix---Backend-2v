import userModel from "../daos/models/user.model.js";
import { hashPassword, isValidPassword } from "../utils.js";
import MongoStore from 'connect-mongo';
import session from 'express-session';
import Swal from "sweetalert2";

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
        const { name, lastName, email, password, birthDate } = req.body;
        if(!name || !lastName || !email || !password || !birthDate) return res.status(401).send({status: "Error", error: "Incomplete Values"}).redirect('/register');
        
        // Hashear la contraseña antes de guardarla
        
        const hashedPassword = hashPassword(password);
        
        const newUser = new userModel({
            name,
            lastName,
            email,
            password: hashedPassword,
            birthDate,
        });
        
        await newUser.save();
        res.redirect('/login');

    } catch (error) {
        console.log('Error al registrar el usuario. Error:',error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al registrar el usuario',
            confirmButtonText: 'Aceptar'
        });
        res.status(500).redirect('/register');
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
        const { email, password } = req.body;
        const user = await userModel.findOne({ email }, { email: 1, name: 1, password:1 });

        if(!user) return res.status(401).send({status: "Error", error: "User not found"}).redirect('/login');

        if(!isValidPassword(password, user)){
           return res.status(401).send({status: "Error", error: "Invalid Credentials"}).redirect('/login');
            
        }
        delete user.password;
        req.session.user = user;
        res.status(200).redirect('/products');

    } catch (error) {
        console.log('Error al iniciar sesión. Error:', error);
        res.status(500).redirect('/');
    }

}

export const logoutUser = async (req, res) => {
    try {
        
        if (req.session.user) {
           
            delete req.session.user;
            req.session.destroy(error => {
                if (error) {
                    
                    res.status(500).send("Error al cerrar sesión");
                } else {
                    
                    res.status(200).redirect('/login');
                }
            });
        } else {
           
            res.redirect('/login'); // Si no hay sesión, redirecciona a /login
        }
    } catch (error) {
        console.log('Error al cerrar sesión. Error:', error);
        res.status(500).send('Error al cerrar la sesión').redirect('/');
    }
}

export const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
      // Si el usuario está autenticado, continúa con la solicitud
      next();
    } else {
      // Si el usuario no está autenticado, redirige a la página de inicio de sesión o muestra un mensaje de error
      res.status(401).send('Acceso no autorizado');
    }
};

export const recoveryPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        await userModel.updateOne({ email }, { $set: { password: hashPassword(password) } });
        res.redirect('/login');
    } catch (error) {
        console.log('Error al recuperar la contraseña. Error:', error);
        res.status(500).send('Error al recuperar la contraseña');
    }
}



