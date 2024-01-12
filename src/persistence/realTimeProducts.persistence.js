import categoryModel from "../daos/models/category.model.js";
import productModel from "../daos/models/product.model.js";

export const postRealTimeProductToDatabase = async (productData) => {
  try {
    const { productName, productDescription, productPrice, productCode, productStock, productCategory } = productData;
    let thumbnails = [];

    const category = await categoryModel.findOne({ _id: productCategory });

    // Verifica si se enviaron archivos
    if (productData.thumbnails && productData.thumbnails.length > 0) {
      // Si hay archivos adjuntos, asigna sus nombres
      thumbnails = productData.thumbnails;
    } else {
      // Si no se enviaron archivos, asigna la imagen predeterminada
      thumbnails.push('defaultImage.jpg');
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
    throw error;
  }
};

export const getRealTimeProductsFromDatabase = async () => {
  try {
    return await productModel
      .find({ isVisible: true })
      .populate('category', 'nameCategory')
      .lean()
      .exec();
  } catch (error) {
    throw error;
  }
};