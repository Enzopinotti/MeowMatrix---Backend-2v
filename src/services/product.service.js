import * as productPersistence from "../persistence/product.persistence.js";

export const getAllProducts = async () => {
  try {
    return await productPersistence.getAllProductsInDatabase();
  } catch (error) {
    throw error;
  }
};

export const getProductsView = async (page, limit, sort, query) => {
  try {
    return await productPersistence.getProductsViewInDatabase(page, limit, sort, query);
  } catch (error) {
    throw error;
  }
};

export const getProductsByIds = async (productIds) => {
  try {
    return await productPersistence.getProductsByIdsFromDatabase(productIds);
  } catch (error) {
    throw error;
  }
};

export const updateProduct = async (productId, newData) => {
  try {
    return await productPersistence.updateProductInDatabase(productId, newData);
  } catch (error) {
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    return await productPersistence.deleteProductFromDatabase(productId);
  } catch (error) {
    throw error;
  }
};

export const createProduct = async (productData) => {
  try {
    return await productPersistence.createProductInDatabase(productData);
  } catch (error) {
    throw error;
  }
};