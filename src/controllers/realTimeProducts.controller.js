import categoryModel from "../daos/mongo/models/category.model.js";
import { io } from '../app.js';

import * as realTimeProductsServices from '../services/realTimeProducts.service.js';


export const getRealTimeProducts = async (req, res) => {
  try {
    const reqLogger = req.logger;
    const products = await realTimeProductsServices.getRealTimeProducts(reqLogger);
    const categories = await categoryModel.find().lean().exec();
    req.logger.debug("En realTimeProducts.controller.js: getRealTimeProducts - Productos en tiempo real obtenidos.");
    res.render('realTimeProducts', {
      products,
      categories, // Enviar las categorías al renderizar la vista
      style: 'realTimeProducts.css',
      title: 'Productos en tiempo real',
    });
  } catch (error) {
    req.logger.error("En realTimeProducts.controller.js: getRealTimeProducts - Error:", error);
    res.sendServerError(error);
  }
};

    

export const postRealTimeProduct = async (req, res) => {
  try {
    const productData = req.body;
    const reqLogger = req.logger;
    const thumbnails = req.files.map(file => file.filename);
    productData.thumbnails = thumbnails;
    const addedProduct = await realTimeProductsServices.postRealTimeProduct(productData, reqLogger);
    req.logger.debug("En realTimeProducts.controller.js: postRealTimeProduct - Producto añadido en tiempo real. Resultado:", addedProduct);
    io.emit('product-added', addedProduct);
  } catch (error) {
    req.logger.error("En realTimeProducts.controller.js: postRealTimeProduct - Error:", error);
    res.sendServerError(error);
  }
};

