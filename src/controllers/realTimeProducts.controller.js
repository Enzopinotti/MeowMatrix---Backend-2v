import categoryModel from "../daos/models/category.model.js";
import productModel from "../daos/models/product.model.js";
import { io } from '../app.js';

import * as realTimeProductsServices from '../services/realTimeProducts.service.js';

export const postRealTimeProduct = async (req, res) => {
  try {
    const productData = req.body;
    const addedProduct = await realTimeProductsServices.postRealTimeProduct(productData);
    io.emit('product-added', addedProduct);
  } catch (error) {
    res.sendServerError(error);
  }
};

export const getRealTimeProducts= async (req, res) => {
  try {
    const products = await realTimeProductsServices.getRealTimeProducts();
    const categories = await categoryModel.find().lean().exec();
    res.render('realTimeProducts', {
      products,
      categories, // Enviar las categorías al renderizar la vista
      style: 'realTimeProducts.css',
      title: 'Productos en tiempo real',
    });
  } catch (error) {
    res.sendServerError(error);
  }
};

    