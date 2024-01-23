import categoryModel from "../models/category.model.js";
import productModel  from "../models/product.model.js";

export default class realTimeProductsManager {
    constructor(){}

    get = async () => {
        try {
            return await productModel.find({ isVisible: true })
            .populate('category', 'nameCategory')
            .lean()
            .exec();
        }catch (error) {
            
            throw error;
        }
    }
    add = async (productData) => {
        try {
            const { productName, productDescription, productPrice, productCode, productStock, productCategory } = productData;
            let thumbnails = [];
        
            const category = await categoryModel.findOne({ _id: productCategory });
            console.log(productData.thumbnails);
            // Verifica si se enviaron archivos
            if (productData.thumbnails && productData.thumbnails.length > 0) {
                // Si hay archivos adjuntos, asigna sus nombres
                
                thumbnails = productData.thumbnails;
            } else {
                // Si no se enviaron archivos, asigna la imagen predeterminada
                
                thumbnails.push('defaultImage.png');
            }
        
            // Crea un nuevo producto con la información recibida, incluyendo las imágenes
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
        
            return await productModel.findById(savedProduct._id).populate('category', 'nameCategory').lean();
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}