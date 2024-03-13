import { RealTimeProductsDao } from "../daos/factory.js";


export const getRealTimeProducts = async (reqLogger) => {
  try {
    reqLogger.debug("En realTimeProducts.service.js: getRealTimeProducts - Intentando obtener productos en tiempo real.");
    const products = await RealTimeProductsDao.get(reqLogger);
    reqLogger.debug("En realTimeProducts.service.js: getRealTimeProducts - Productos en tiempo real obtenidos.");
    return products;
  } catch (error) {
    reqLogger.error("En realTimeProducts.service.js: getRealTimeProducts - Error al obtener productos en tiempo real:", error);
    throw error;
  }
};

export const postRealTimeProduct = async (productData, reqLogger) => {
  try {
    reqLogger.debug("En realTimeProducts.service.js: postRealTimeProduct - Intentando añadir producto en tiempo real.");
    const addedProduct = await RealTimeProductsDao.add(productData, reqLogger);
    reqLogger.debug("En realTimeProducts.service.js: postRealTimeProduct - Producto añadido en tiempo real. Resultado:", addedProduct);
    return addedProduct;
  } catch (error) {
    reqLogger.error("En realTimeProducts.service.js: postRealTimeProduct - Error al añadir producto en tiempo real:", error);
    throw error;
  }
};