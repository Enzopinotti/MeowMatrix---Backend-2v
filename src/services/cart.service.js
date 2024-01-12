import * as cartPersistence from "../persistence/cart.persistence.js";

export const getCartById = async (cartId) => {
  try {
    return await cartPersistence.getCartByIdFromDatabase(cartId);
  } catch (error) {
    throw error;
  }
};

export const getCarts = async () => {
  try {
    return await cartPersistence.getCartsFromDatabase();
  } catch (error) {
    throw error;
  }
};

export const createCart = async (cartData) => {
    try {
      return await cartPersistence.createCartInDatabase(cartData);
    } catch (error) {
      throw error;
    }
};

export const addProductToCart = async (cartId, productId) => {
    try {
        return await cartPersistence.addProductToCartInDatabase(cartId, productId);
    } catch (error) {
        throw error;
    }
};

export const updateCart = async (cartId, products) => {
    try {
      return await cartPersistence.updateCartInDatabase(cartId, products);
    } catch (error) {
      throw error;
    }
};

export const changeProductQuantity = async (cartId, productId, quantity) => {
    try {
      return await cartPersistence.changeProductQuantityInDatabase(cartId, productId, quantity);
    } catch (error) {
      throw error;
    }
};

export const deleteProductFromCart = async (cartId, productId) => {
    try {
        return await cartPersistence.deleteProductFromCartInDatabase(cartId, productId);
    } catch (error) {
        throw error;
    }
};
  
export const deleteAllProducts = async (cartId) => {
    try {
        return await cartPersistence.deleteAllProductsInDatabase(cartId);
    } catch (error) {
        throw error;
    }
};
  