import userModel from "../daos/models/user.model.js";
import { hashPassword } from "../utils.js";
import MongoStore from 'connect-mongo';
import session from 'express-session';
export const registerUser = async (req, res) => {
    try {
        const { name, lastName, email, password, birthDate } = req.body;

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
        res.status(500).redirect('/');
    }

}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (user) {
            const hashedPassword = hashPassword(password); // Hashea la contraseña ingresada

            if (hashedPassword === user.password) {
                // Las contraseñas coinciden
                // Verificar si el usuario es administrador o usuario regular
                const isAdmin = (email === 'admin@example.com' && password === 'admin123'); // Cambia esto por tu lógica real de verificación de administrador

                // Asignar el rol correspondiente
                const rol = isAdmin ? 'admin' : 'usuario';

                // Actualizar el rol del usuario en la base de datos
                await userModel.findOneAndUpdate({ email }, { $set: { rol: rol } });
                
                 // Establecer la sesión del usuario
                req.session.user = {
                    id: user._id,
                    name: user.name,
                    lastName: user.lastName,
                    email: user.email,
                    rol: user.rol,
                    avatar: user.avatar,
                    birthDate: user.birthDate,
                    phone: user.phone,

                };
                console.log (req.session.user)
                res.status(200).redirect('/products');
            } else {
                // Las contraseñas no coinciden
                res.status(401).send('Contraseña incorrecta');
            }
        } else {
            // Usuario no encontrado
            res.status(404).send('Usuario no encontrado');
        }
    } catch (error) {
        console.log('Error al iniciar sesión. Error:', error);
        res.status(500).redirect('/');
    }

}

export const logoutUser = async (req, res) => {
    try {
        console.log('Llegó al controlador de logout');
        if (req.session.user) {
            console.log('Usuario encontrado en la sesión');
            delete req.session.user;
            req.session.destroy(error => {
                if (error) {
                    console.log('Error al destruir la sesión:', error);
                    res.status(500).send("Error al cerrar sesión");
                } else {
                    console.log('Sesión destruida exitosamente');
                    res.status(200).redirect('/login');
                }
            });
        } else {
            console.log('No se encontró ningún usuario en la sesión');
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