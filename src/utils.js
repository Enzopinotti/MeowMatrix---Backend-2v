import multer from "multer"; 
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from './config/server.config.js'
import * as passport from 'passport';
import fs from 'fs';

const PRIVATE_KEY = config.tokenKey;
//Ahora uso fileURLToPath para obtener la ruta absoluta del archivo y dirname para obtener la ruta relativa
const __filename = fileURLToPath(import.meta.url);



export const __dirname = dirname(__filename);

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        

        console.log('Entre')
        if (file.fieldname === 'avatar') {
            cb(null, path.join(__dirname, 'public', 'img', 'profiles')); // Ruta para las imágenes de usuarios
        } else if (file.fieldname === 'productImage') {
            cb(null, path.join(__dirname, 'public', 'img', 'products')); // Ruta para las imágenes de productos
        } else if(file.fieldname === 'identification' || file.fieldname === 'address' || file.fieldname === 'bankStatement') {
            const token = obtenerTokenDeCookie(req.headers.cookie);
            const decoded = jwt.verify(token, PRIVATE_KEY);
            const user = decoded.user;
            const userId = user._id;
            const documentDirectory = path.join(__dirname, 'public', 'documents');
            const filename = `${file.fieldname}-${userId}${path.extname(file.originalname)}`;
            // Ruta completa del archivo
            const filePath = path.join(documentDirectory, filename);
            // Verificar si ya existe un archivo con el mismo nombre
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (!err) {
                    console.log('Encontró un archivo igual')
                    // Si el archivo ya existe, eliminarlo antes de guardar el nuevo archivo
                    fs.unlinkSync(filePath);
                }
                cb(null, documentDirectory);
            });

        } 
        
        else {
            cb(new Error('Invalid field name'), null);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Math.round(Math.random() * 1E9);
        const token = obtenerTokenDeCookie(req.headers.cookie);
        const decoded = jwt.verify(token, PRIVATE_KEY);
        const user = decoded.user;
        const userId = user._id;
        
        if(file.fieldname === 'identification'){
            cb(null, file.fieldname +'-'+ userId + path.extname(file.originalname));
        } else if (file.fieldname === 'address'){
            cb(null, file.fieldname +'-'+ userId + path.extname(file.originalname));
        } else if (file.fieldname === 'bankStatement') {
            cb(null, file.fieldname +'-'+ userId + path.extname(file.originalname));
        }else{
            cb(null, file.originalname.replace(/\.[^.]+$/, '') + '-' + uniqueSuffix + path.extname(file.originalname));
        }
            
         // Nombre del archivo
    }
});

const fileFilter = (req, file, cb) => {
    cb(null, true);
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



export function generateToken(user) {
    const token = jwt.sign({ user }, PRIVATE_KEY, { expiresIn: '1h' });
    return token;
};

export function authToken(token) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send({status: "error", error:"Unauthorized"});
    token = authHeader.split(" ")[1];
    jwt.verify(token, PRIVATE_KEY, (error, credentials) => {
        console.log(error)
        if (error) return res.status(403).send({status: "error", error:"Forbidden"});
        req.user = credentials.user;
        next();
    });

};

export const obtenerTokenDeCookie = (cookieString) => {
    if (!cookieString) {
        return null;
    }
    
    const cookies = cookieString.split(';');
    
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'access_token') {
            return value;
        }
    }
    
    return null;
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
        const token = obtenerTokenDeCookie(req.headers.cookie);
        const decoded = jwt.verify(token, PRIVATE_KEY);
        const user = decoded.user;

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' }); // Devuelve un mensaje de error JSON si el usuario no está autenticado
        } else if (user.rol === 'admin' || roles.includes(user.rol)) {
            next(); // Permite el acceso si el usuario es un administrador o tiene uno de los roles especificados
        } else {
            return res.status(403).json({ error: 'Forbidden' }); // Devuelve un mensaje de error JSON si el usuario no tiene permisos adecuados
        }
    };
};
export const calculateTotalPrice = (products) => {
    return products.reduce((total, product) => total + (product.quantity * product.product.price), 0);
};