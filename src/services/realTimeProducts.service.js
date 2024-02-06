import { RealTimeProductsDao } from "../daos/factory.js";


<<<<<<< HEAD
export const getRealTimeProducts = async (reqLogger) => {
  try {
    reqLogger.debug("En realTimeProducts.service.js: getRealTimeProducts - Intentando obtener productos en tiempo real.");
    const products = await RealTimeProductsDao.get(reqLogger);
    reqLogger.debug("En realTimeProducts.service.js: getRealTimeProducts - Productos en tiempo real obtenidos. Resultado:", products);
    return products;
  } catch (error) {
    reqLogger.error("En realTimeProducts.service.js: getRealTimeProducts - Error al obtener productos en tiempo real:", error);
=======

export const postRealTimeProduct = async (productData) => {
  try {
    return await RealTimeProductsDao.add(productData);
  } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    throw error;
  }
};

<<<<<<< HEAD
export const postRealTimeProduct = async (productData, reqLogger) => {
  try {
    reqLogger.debug("En realTimeProducts.service.js: postRealTimeProduct - Intentando añadir producto en tiempo real.");
    const addedProduct = await RealTimeProductsDao.add(productData, reqLogger);
    reqLogger.debug("En realTimeProducts.service.js: postRealTimeProduct - Producto añadido en tiempo real. Resultado:", addedProduct);
    return addedProduct;
  } catch (error) {
    reqLogger.error("En realTimeProducts.service.js: postRealTimeProduct - Error al añadir producto en tiempo real:", error);
=======
export const getRealTimeProducts = async () => {
  try {
    return await RealTimeProductsDao.get();
  } catch (error) {
    console.log(error);
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    throw error;
  }
};