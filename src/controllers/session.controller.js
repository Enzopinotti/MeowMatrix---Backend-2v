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
        console.log(user);
        delete user.password;
        req.session.user = user;
        res.json({ status: 'success', message: 'Registration successful' });
    } catch (error) {
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
        let user = req.user;
        console.log(user.phone)
        if (!user)
            return res.status(400).send({ status: 'error', error: 'User not found' });
        delete user.password;
        req.session.user = user;
        //console.log(req.session.user);
        const token = generateToken(user);
        res.cookie('access_token', token, { maxAge: 600000, httpOnly: true });
        res.send({ status: 'success', message: 'Login successful'});
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





