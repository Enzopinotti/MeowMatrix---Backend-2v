import express from 'express';
import { __dirname } from '../utils.js';
export const viewsRouter = express.Router();
import { ProductManager } from '../daos/filesystem/ProductManager.js';
import productModel from '../daos/models/product.model.js';
import  categoryModel from '../daos/models/category.model.js';
import cartModel from '../daos/models/cart.model.js';
const filePath = 'archivos/productos.json';
const manager = new ProductManager(filePath);
import { uploader } from '../utils.js';
import { io } from '../app.js'; // Importa la instancia de Socket.IO
import messageModel from '../daos/models/message.model.js';
import userModel from '../daos/models/user.model.js';
import { registerUser, loginUser, logoutUser, recoveryPassword } from '../controllers/auth.controller.js';
import { showProfile, uploadAvatar } from '../controllers/user.controller.js';



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
        res.render('home', { 
            products,
            style: 'index.css',
            title: 'Home',
         });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


viewsRouter.post('/realTimeProducts', uploader.array('productImage', 1), async (req, res) => {
    
    try {
        const { productName, productDescription, productPrice, productCode, productStock, productCategory } = req.body;
        let thumbnails = [];

        // Verifica si se enviaron archivos
        if (req.files && req.files.length > 0) {
            // Si hay archivos adjuntos, asigna sus nombres
            thumbnails = req.files.map(file => file.filename);
        } else {
            // Si no se enviaron archivos, asigna la imagen predeterminada
            thumbnails.push('defaultImage.jpg');
        }

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
        //console.log(JSON.stringify(products));  //Luego poner en https://jsoneditoronline.org/
        res.render('realTimeProducts', { 
            products,
            style: 'realTimeProducts.css',
            title: 'Productos en tiempo real',
         });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


viewsRouter.get('/message', async (req, res) => {
    try {
        const messages = await messageModel.find();
        res.render("message", { 
            messages,
            style: 'chat.css',
            title: 'Mensajes en tiempo real',
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
  
viewsRouter.post('/message', async (req, res) => {
    try {
        const newMessage = new messageModel(req.body)
    
        
        await newMessage.save();
        io.emit('message-received', newMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
  
// Ruta para mostrar la vista de productos
viewsRouter.get('/products', async (req, res) => {
    const { page = 1, limit = 4, sort, query } = req.query;

    try {
        let queryOptions = { isVisible: true }; // Acá guardo las Queries que haga 
        let sortOptions = {}; // Acá guardo el tipo de ordenamiento que haga

        // Filtros basados en la query
        if (query && query.name) {
            queryOptions.name = { $regex: new RegExp(query.name, 'i') };
        }


        // Obtener el número total de documentos
        const totalDocs = await productModel.countDocuments(queryOptions);

        // Lógica de ordenamiento
        if (sort === 'date') {
            sortOptions = { createdAt: sort === 'asc' ? 1 : -1 };
        } else if (sort === 'price') {
            sortOptions = { price: sort === 'asc' ? 1 : -1 };
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: sortOptions,
        };

        const products = await productModel.paginate(queryOptions, options);
        const categoryIds = products.docs.map(product => product.category);

        // Elimina IDs duplicados
        const uniqueCategoryIds = [...new Set(categoryIds)];
        const categories = await categoryModel.find({ _id: { $in: uniqueCategoryIds } }, 'nameCategory');
        const categoryMap = {};
        categories.forEach(category => {
            categoryMap[category._id.toString()] = category.nameCategory;
        });
        const productsWithCategoryNames = products.docs.map(product => {
            return {
                ...product.toObject(),
                category: categoryMap[product.category.toString()]
            };
        });

        const user = req.session.user;


        res.render('products', {
            products: productsWithCategoryNames,
            totalPages: products.totalPages,
            currentPage: products.page,
            hasNextPage: products.hasNextPage,
            hasPrevPage: products.hasPrevPage,
            prevLink: products.prevPage ? `/products?page=${products.prevPage}&limit=${limit}` : null,
            nextLink: products.nextPage ? `/products?page=${products.nextPage}&limit=${limit}` : null,
            totalDocs: totalDocs,
            style: 'products.css',
            title: 'Productos',
            user: user
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//ruta para mostrar la vista de detalles del producto
viewsRouter.get('/products/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
       
        const product = await productModel.findById(productId).populate('category', 'nameCategory').lean(); // Asumiendo que 'category' es una referencia al modelo de categorías     
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Renderizar la vista de detalles del producto y pasar la información
        res.render('details', {
            product: product,
            style: 'details.css',
            title: 'Detalles del producto',
            // Otros datos que quieras enviar a la vista
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


viewsRouter.get('/carts/:cid', async (req, res) => {
    try {
        const cartId = req.params.cid;

        // Encuentra el carrito específico por su ID
        const cart = await cartModel.findOne({ _id: cartId });
        
        if (!cart) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
        }

        // Extrae los IDs de los productos del carrito
        const productIdsInCart = cart.products.map(product => product.product._id);

        // Obtiene los productos asociados a esos IDs
        const productsInCart = await productModel.find({ _id: { $in: productIdsInCart } });
        


        // Renderiza la vista de carrito y pasa la información
        res.render('cart', {
            cartId: cartId,
            quantity: cart.quantity,
            cartProducts: productsInCart,
            title: 'Detalles del carrito',
            style: 'cart.css',

        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



viewsRouter.post('/upload-avatar', uploader.single('avatar'), uploadAvatar);