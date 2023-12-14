import multer from "multer"; 
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import "dotenv/config"



//Ahora uso fileURLToPath para obtener la ruta absoluta del archivo y dirname para obtener la ruta relativa
const __filename = fileURLToPath(import.meta.url);



export const __dirname = dirname(__filename);

// Configuración de multer para el almacenamiento de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public', 'img', 'avatars')); // Ruta donde se guardarán las imágenes
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



const PRIVATE_KEY = process.env.tokenkey;

export function generateToken(user) {
    const token = jwt.sign({ user }, PRIVATE_KEY, { expiresIn: '1h' });
    console.log(token);
    return token;
}
/*
export function authToken(token) {
    const authHeader =req.headers.authorization;
    if (!authHeader) return res.status(401).send({status: "error", error:"Unauthorized"});
    console.log(authHeader);
    token = authHeader.split(" ")[1];
    console.log(token);
    jwt.verify(token, PRIVATE_KEY, (error, credentials) => {
        console.log(error)
        if (error) return res.status(403).send({status: "error", error:"Forbidden"});
        req.user = credentials.user;
        next();
    });

};

*/