import multer from "multer"; 
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from './config/server.config.js'
import * as passport from 'passport';



//Ahora uso fileURLToPath para obtener la ruta absoluta del archivo y dirname para obtener la ruta relativa
const __filename = fileURLToPath(import.meta.url);



export const __dirname = dirname(__filename);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'avatar') {
            cb(null, path.join(__dirname, 'public', 'img', 'avatars')); // Ruta para las imágenes de usuarios
        } else if (file.fieldname === 'productImage') {
            cb(null, path.join(__dirname, 'public', 'img')); // Ruta para las imágenes de productos
        } else {
            cb(new Error('Invalid field name'), null);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.originalname.replace(/\.[^.]+$/, '') + '-' + uniqueSuffix + path.extname(file.originalname)); // Nombre del archivo
    }
});

// Función para filtrar los archivos que se pueden subir
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('El archivo subido no es una imagen'), false);
    }
};

// Configuración de multer
export const uploader = multer({
    storage: storage,
    fileFilter: fileFilter
});


export function hashPassword(password) {
    
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    //genSaltSync(10) es la cantidad de vueltas que se hace para encriptar la contraseña
}

export function isValidPassword(password, user) {
    return bcrypt.compareSync(password, user.password);
    //compareSync compara la contraseña ingresada con la contraseña encriptada del usuario
}

export async function comparePasswords(password, hashedPassword) {
    try {
        // Comparar la contraseña sin hashear con la contraseña hasheada
        const match = await bcrypt.compare(password, hashedPassword);
        return match;
    } catch (error) {
        console.error('Error al comparar las contraseñas:', error);
        throw new Error('Error al comparar las contraseñas');
    }
}

export function validatePassword(password) {
    // Verifica si la contraseña tiene al menos una mayúscula, una minúscula, un número y longitud mayor a 6 caracteres
    const lowercaseRegex = /[a-z]/;
    const uppercaseRegex = /[A-Z]/;
    const numberRegex = /[0-9]/;
    const lengthCheck = password.length > 6;
    const hasLowercase = lowercaseRegex.test(password);
    const hasUppercase = uppercaseRegex.test(password);
    const hasNumber = numberRegex.test(password);
    return lengthCheck && hasLowercase && hasUppercase && hasNumber;
}

const PRIVATE_KEY = config.tokenKey;

export function generateToken(user) {
    const token = jwt.sign({ user }, PRIVATE_KEY, { expiresIn: '1h' });
    return token;
};

export function authToken(token) {
    const authHeader =req.headers.authorization;
    if (!authHeader) return res.status(401).send({status: "error", error:"Unauthorized"});
    token = authHeader.split(" ")[1];
    jwt.verify(token, PRIVATE_KEY, (error, credentials) => {
        console.log(error)
        if (error) return res.status(403).send({status: "error", error:"Forbidden"});
        req.user = credentials.user;
        next();
    });

};
//!Manejo de errores de passport
export const passportCall = (strategy) => {
    return async (req, res, next) => {
        passport.authenticate(strategy, function (err, user, info) {
            if (err) return next(err);
            if (!user) return res.status(401).send({error: info.messages? info.messages: info.toString()});
            req.user = user;
            next();
        })(req, res, next);
    }
};
//! Autorización según roles
export const authorization = (roles) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).redirect('/login').send({ error: 'Unauthorized' }); // Redirigir al inicio de sesión si el usuario no está autenticado
        } else if (req.user.rol === 'admin' || roles.includes(req.user.rol)) {
            next(); // Permitir el acceso si el usuario es un administrador o tiene uno de los roles especificados
        } else {
            return res.status(403).redirect('/login'); // Redirigir al inicio de sesión si el usuario no tiene permisos adecuados
        }
    };
};
export const calculateTotalPrice = (products) => {
    return products.reduce((total, product) => total + (product.quantity * product.product.price), 0);
};