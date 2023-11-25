import express from 'express';
import { __dirname } from '../utils.js';
export const viewsRouter = express.Router();
import { ProductManager } from '../config/filesystem/ProductManager.js';
import productModel from '../config/models/product.model.js';
const filePath = 'archivos/productos.json';
const manager = new ProductManager(filePath);
import { uploader } from '../utils.js';
import { io } from '../app.js'; // Importa la instancia de Socket.IO
import messageModel from '../config/models/message.model.js';


viewsRouter.get('/', async (req, res) => {
    try {
        const products = await productModel
            .find( {isVisible:true} )
            .populate('category', 'nameCategory') // Poblar el campo 'category' y proyectar solo 'nameCategory'
            .lean()
            .exec();

        products.forEach(product => {
            product.category = product.category.nameCategory;
        });
        res.render('home', { products });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


viewsRouter.post('/realTimeProducts', uploader.array('productImage', 1), async (req, res) => {
    
    try {
        const { productName, productDescription, productPrice, productCode, productStock, productCategory } = req.body;
        const thumbnails = req.files.map(file => file.filename);

        // Crea  un nuevo producto con la información recibida, incluyendo las imágenes
        const newProduct = new productModel({
            name: productName,
            description: productDescription,
            price: productPrice,
            code: productCode,
            stock: productStock,
            category: productCategory,
            thumbnails: thumbnails
        });

        // Guarda el producto en la base de datos
        const savedProduct = await newProduct.save();

        const addedProduct = await productModel.findById(savedProduct._id).populate('category', 'nameCategory').lean();
        console.log(addedProduct);
        io.emit( 'product-added', addedProduct );
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



viewsRouter.get('/realTimeProducts', async (req, res) => {
    try {
        const products = await productModel
            .find( { isVisible:true } )
            .populate('category', 'nameCategory') // Poblar el campo 'category' y proyectar solo 'nameCategory'
            .lean()
            .exec();

        products.forEach(product => {
            product.category = product.category.nameCategory;
        });
        res.render('realTimeProducts', { products });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


viewsRouter.get('/message', async (req, res) => {
    try {
        const messages = await messageModel.find();
        res.render("message", { messages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
  
viewsRouter.post('/message', async (req, res) => {
    console.log(req.body);
    

    try {
        const newMessage = new messageModel(req.body)
    
        
        await newMessage.save();
        io.emit('message-received', newMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
  
  
  
  
