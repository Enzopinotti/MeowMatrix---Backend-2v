import { CartDao } from "../daos/factory.js";
import { ProductDao } from "../daos/factory.js";

<<<<<<< HEAD
export const getCarts = async (reqLogger) => {
  try {
    reqLogger.debug("En cart.service.js: pasó");
    return await CartDao.get(reqLogger);
  } catch (error) {
    reqLogger.error("En cart.service.js: Error al obtener todos los carritos: ", error);
=======



export const getCarts = async () => {
  try {
    return await CartDao.get();
  } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    throw error;
  }
};

<<<<<<< HEAD
export const getCartById = async (cartId, reqLogger) => {
  try {
    reqLogger.debug("En cart.service.js: pasó");
    return await CartDao.getById(cartId, reqLogger);
  } catch (error) {
    reqLogger.error("En cart.service.js: Error al obtener el carrito por ID: ", error); 
=======
export const getCartById = async (cartId) => {
  try {
    return await CartDao.getById(cartId);
  } catch (error) { 
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    throw error;
  }
};

<<<<<<< HEAD
export const getCartByUserId = async (userId, reqLogger) => {
  try {
    reqLogger.debug("En cart.service.js: pasó");
    return await CartDao.getByUserId(userId, reqLogger);
  } catch (error) {
    reqLogger.error("En cart.service.js: Error al obtener el carrito por UserId: ", error); 
=======
export const getCartByUserId = async (userId) => {
  try {
    return await CartDao.getByUserId(userId);
  } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    throw error;
  }
}

<<<<<<< HEAD
export const createCart = async (cartData, reqLogger) => {
    try {
      reqLogger.debug("En cart.service.js: pasó");
      return await CartDao.add(cartData, reqLogger);
    } catch (error) {
      reqLogger.error("En cart.service.js: Error al crear el carrito: ", error); 
      throw error;
    }
}
export const addToCurrentCart = async (userId, productId, reqLogger) => {
  try {
    reqLogger.debug("En cart.service.js: addToCurrentCart - pasó");
    
    // Verifica si el usuario tiene un carrito existente
    const existingCart = await CartDao.getByUserId(userId, reqLogger);
    const product = await ProductDao.getById(productId, reqLogger);

    if (existingCart.status === 'success') {
      // Si el usuario tiene un carrito existente, agrega el producto al carrito actual
      const result = await CartDao.addProduct(existingCart.payload._id, product, reqLogger);
      reqLogger.debug("En cart.service.js: addToCurrentCart - Producto añadido al carrito existente.");
      return result;
    } else {
      // Si el usuario no tiene un carrito, crea un nuevo carrito y agrega el producto
      const newCart = await CartDao.add({ user: userId, products: [] }, reqLogger);
      const result = await CartDao.addProduct(newCart.payload._id, product, reqLogger);
      reqLogger.debug("En cart.service.js: addToCurrentCart - Producto añadido a un nuevo carrito.");
      return result;
    }
  } catch (error) {
    reqLogger.error("En cart.service.js: addToCurrentCart - Error:", error);
=======
export const createCart = async (cartData) => {
    try {
      return await CartDao.add(cartData);
    } catch (error) {
      throw error;
    }
}

export const addToCurrentCart = async (userId, productId) => {
  try {
    // Verifica si el usuario tiene un carrito existente
    const existingCart = await CartDao.getByUserId(userId);
    const product = await ProductDao.getById(productId);
    if (existingCart.status === 'success') {
      // Si el usuario tiene un carrito existente, agrega el producto al carrito actual
      const result = await CartDao.addProduct(existingCart.payload._id, product);
      return result;
    } else {
      // Si el usuario no tiene un carrito, crea un nuevo carrito y agrega el producto
      const newCart = await CartDao.add({ user: userId, products: [] });
      const result = await CartDao.addProduct(newCart.payload._id, product);
      return result;
    }
  } catch (error) {
    console.error(error);
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    throw error;
  }
};

<<<<<<< HEAD
export const addProductToCart = async (req, cartId, productId, reqLogger) => {
  try {
    reqLogger.debug("En cart.service.js: addProductToCart - pasó");
    
    const product = await ProductDao.getById(productId, reqLogger);
    const result = await CartDao.addProduct(cartId, product, reqLogger);
    reqLogger.debug("En cart.service.js: addProductToCart - Producto añadido al carrito.");
    return result;
  } catch (error) {
    reqLogger.error("En cart.service.js: addProductToCart - Error:", error);
    throw error;
  }
};

export const updateCart = async (cartId, products, reqLogger) => {
  try {
    reqLogger.debug("En cart.service.js: updateCart - pasó");
    
    const result = await CartDao.update(cartId, products, reqLogger);
    reqLogger.debug("En cart.service.js: updateCart - Carrito actualizado.");
    return result;
  } catch (error) {
    reqLogger.error("En cart.service.js: updateCart - Error:", error);
    throw error;
  }
};

export const changeProductQuantity = async (req, cartId, productId, quantity, reqLogger) => {
  try {
    reqLogger.debug("En cart.service.js: changeProductQuantity - pasó");
    
    const result = await CartDao.updateProductQuantity(cartId, productId, quantity, reqLogger);
    reqLogger.debug("En cart.service.js: changeProductQuantity - Cantidad de producto en el carrito modificada. Resultado:", result);
    return result;
  } catch (error) {
    reqLogger.error("En cart.service.js: changeProductQuantity - Error:", error);
    throw error;
  }
};

export const deleteProductFromCart = async (cartId, productId, reqLogger) => {
  try {
    reqLogger.debug("En cart.service.js: deleteProductFromCart - pasó");
    
    const result = await CartDao.deleteProduct(cartId, productId, reqLogger);
    reqLogger.debug("En cart.service.js: deleteProductFromCart - Producto eliminado del carrito.");
    return result;
  } catch (error) {
    reqLogger.error("En cart.service.js: deleteProductFromCart - Error:", error);
    throw error;
  }
};

export const deleteAllProducts = async (cartId, reqLogger) => {
  try {
    reqLogger.debug("En cart.service.js: deleteAllProducts - pasó con id: ", cartId);
    const result = await CartDao.clear(cartId, reqLogger);
    reqLogger.debug("En cart.service.js: deleteAllProducts - Todos los productos eliminados del carrito.");
    return result;
  } catch (error) {
    reqLogger.error("En cart.service.js: deleteAllProducts - Error:", error);
    throw error;
  }
};

export const deleteCart = async (id, reqLogger) => {
  try {
    reqLogger.debug("En cart.service.js: deleteCart - pasó");
    
    const result = await CartDao.delete(id, reqLogger);
    reqLogger.debug("En cart.service.js: deleteCart - Carrito eliminado.",);
    return result;
  } catch (error) {
    reqLogger.error("En cart.service.js: deleteCart - Error:", error);
    throw error;
  }
};

export const getCartSummary = async (userId, reqLogger) => {
  try {
    reqLogger.debug("En cart.service.js: getCartSummary - pasó");
    
    const cartSummary = await CartDao.getCartSummary(userId, reqLogger);
    reqLogger.debug("En cart.service.js: getCartSummary - Resumen del carrito obtenido. Resultado:", cartSummary);
    return cartSummary;
  } catch (error) {
    reqLogger.error("En cart.service.js: getCartSummary - Error:", error);
    throw error;
=======
export const addProductToCart = async (cartId, productId) => {
    try {
        const product = await ProductDao.getById(productId);
        return await CartDao.addProduct(cartId, product);
    } catch (error) {
        throw error;
    }
};

export const updateCart = async (cartId, products) => {
    try {
      return await CartDao.update(cartId, products);
    } catch (error) {
      throw error;
    }
};

export const changeProductQuantity = async (cartId, productId, quantity) => {
    try {
      return await CartDao.updateProductQuantity(cartId, productId, quantity);
    } catch (error) {
      throw error;
    }
};

export const deleteProductFromCart = async (cartId, productId) => {
    try {
        return await CartDao.deleteProduct(cartId, productId);
    } catch (error) {
        throw error;
    }
};
  
export const deleteAllProducts = async (cartId) => {
    try {
        return await CartDao.clear(cartId);
    } catch (error) {
        throw error;
    }
};

export const deleteCart = async (id) => {
  try {
    return await CartDao.delete(id);
  }catch (error) {
    throw new Error(`Error al eliminar el carrito: ${error.message}`);
  }
};

export const getCartSummary = async (userId) => {
  try {
    
      // Llama a la capa de persistencia para obtener el resumen del carrito desde la base de datos
      const cartSummary = await CartDao.getCartSummary(userId);
      return cartSummary;
  } catch (error) {

      throw new Error('Error al obtener el resumen del carrito desde la capa de servicio');
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
  }
};