import multer from "multer"; 
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from 'path';
import crypto from 'crypto';


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
    const hash = crypto.createHash('sha512');
    hash.update(password);
    return hash.digest('hex');
  }