import * as realTimeProductsPersistence from '../persistence/realTimeProducts.persistence.js';

export const postRealTimeProduct = async (productData) => {
  try {
    return await realTimeProductsPersistence.postRealTimeProductToDatabase(productData);
  } catch (error) {
    throw error;
  }
};

export const getRealTimeProducts = async () => {
  try {
    return await realTimeProductsPersistence.getRealTimeProductsFromDatabase();
  } catch (error) {
    throw error;
  }
};