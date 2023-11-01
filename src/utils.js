import multer from "multer";

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