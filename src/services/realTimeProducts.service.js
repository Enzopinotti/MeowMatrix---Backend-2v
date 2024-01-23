import { RealTimeProductsDao } from "../daos/factory.js";



export const postRealTimeProduct = async (productData) => {
  try {
    return await RealTimeProductsDao.add(productData);
  } catch (error) {
    throw error;
  }
};

export const getRealTimeProducts = async () => {
  try {
    return await RealTimeProductsDao.get();
  } catch (error) {
    console.log(error);
    throw error;
  }
};