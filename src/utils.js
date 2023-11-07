import multer from "multer"; 
import { fileURLToPath } from "url";
import { dirname } from "path";

//uso multer para subir archivos al servidor y guardarlos en la carpeta public/img
const storage = multer.diskStorage({

    //Destination es para indicar donde se va a guardar el archivo
    destination: (req, file, cb) => {
        cb(null, './src/public/img');//Se especifica la carpeta
    },
    //Filename es para indicar el nombre del archivo
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const originalName = file.originalname;
        const extension = originalName.split('.').pop();
        const filename = `${timestamp}_Archivo${extension}`
        cb(null, filename);
    }

});

export const uploader = multer({ storage });

//Ahora uso fileURLToPath para obtener la ruta absoluta del archivo y dirname para obtener la ruta relativa
const __filename = fileURLToPath(import.meta.url);



export const __dirname = dirname(__filename);



