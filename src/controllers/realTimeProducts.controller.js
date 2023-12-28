import categoryModel from "../daos/models/category.model.js";
import productModel from "../daos/models/product.model.js";

export const postRealTimeProducts = async (req, res) => {
    try {
        const { productName, productDescription, productPrice, productCode, productStock, productCategory } = req.body;
        let thumbnails = [];
        
        const category = await categoryModel.findOne({ _id: productCategory });
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
            category: category ? category._id : null,
            thumbnails: thumbnails
        });

        // Guarda el producto en la base de datos
        const savedProduct = await newProduct.save();

        const addedProduct = await productModel.findById(savedProduct._id).populate('category', 'nameCategory').lean();
        
        io.emit( 'product-added', addedProduct );
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getRealTimeProducts = async (req, res) => {
    try {
        const products = await productModel
            .find({ isVisible: true }) 
            .populate('category', 'nameCategory')
            .lean()
            .exec();

        const categories = await categoryModel.find().lean().exec();
        console.log(products)
        res.render('realTimeProducts', { 
            products,
            categories, // Enviar las categorías al renderizar la vista
            style: 'realTimeProducts.css',
            title: 'Productos en tiempo real',
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

