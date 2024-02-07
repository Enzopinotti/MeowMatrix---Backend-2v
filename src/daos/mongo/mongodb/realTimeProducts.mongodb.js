import categoryModel from "../models/category.model.js";
import productModel  from "../models/product.model.js";

export default class realTimeProductsManager {
    constructor() {}

  get = async (reqLogger) => {
    try {
      reqLogger.debug("En realTimeProducts.service.js: get - Intentando obtener productos en tiempo real.");
      const products = await productModel.find({ isVisible: true })
        .populate('category', 'nameCategory')
        .lean()
        .exec();
      reqLogger.debug("En realTimeProducts.service.js: get - Productos en tiempo real obtenidos. Resultado:", products);
      return products;
    } catch (error) {
      reqLogger.error("En realTimeProducts.service.js: get - Error al obtener productos en tiempo real:", error);
      throw error;
    }
  };

  add = async (productData, reqLogger) => {
    try {
      const { productName, productDescription, productPrice, productCode, productStock, productCategory } = productData;
      let thumbnails = [];

      const category = await categoryModel.findOne({ _id: productCategory });
      reqLogger.debug("En realTimeProducts.service.js: add - Categoría encontrada:", category);

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
      reqLogger.debug("En realTimeProducts.service.js: add - Producto añadido en tiempo real. Resultado:", savedProduct);

      const populatedProduct = await productModel.findById(savedProduct._id).populate('category', 'nameCategory').lean();
      return populatedProduct;
    } catch (error) {
      reqLogger.error("En realTimeProducts.service.js: add - Error al añadir producto en tiempo real:", error);
      throw error;
    }
  };
}