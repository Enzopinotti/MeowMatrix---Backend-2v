import { MockDao } from '../daos/factory.js'
import { ProductDao } from '../daos/factory.js'
import { CategoryDao } from '../daos/factory.js'

export const getMockProductsService = async () => {
    try {
        console.log('se encontro a getmockproducts')
        const mockProducts = await MockDao.getMockProducts();
        console.log('productos llegan al service: ', mockProducts[0])
        return mockProducts;
    } catch (error) {
        throw error;
    }
};


export const getMockProductsView = async () => {
    try {

      const productsResult = await MockDao.getView();
 
      return productsResult;
    } catch (error) {
      console.error("Error in getProductsView:", error);
      throw error;
    }
  };