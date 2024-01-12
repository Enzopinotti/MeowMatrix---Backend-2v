import cartModel from "../daos/models/cart.model.js";

export const getCartsFromDatabase = async () => {
    try {
      return await cartModel.find();
    }catch (error) {
      throw error;
    }
};

export const getCartByIdFromDatabase = async (cartId) => {
  try {
    return await cartModel.findOne({ _id: cartId });
  }catch (error) {
    throw error;
  }
};

export const createCartInDatabase = async (cartData) => {
    try {
      const cart = new cartModel(cartData);
      return await cart.save();
    }catch (error) {
      throw error;
    }
};

export const addProductToCartInDatabase = async (cartId, productId) => {
    try {
      const cart = await getCartByIdFromDatabase(cartId);
  
      if (!cart) {
        return null; // Indica que el carrito no fue encontrado
      }
  
      const existingProductIndex = cart.products.findIndex(
        (item) => item.product._id.toString() === productId
      );
  
      if (existingProductIndex !== -1) {
        cart.products[existingProductIndex].quantity += 1;
      } else {
        cart.products.push({ product: productId, quantity: 1 });
      }
  
      return await cart.save();
    } catch (error) {
      throw error;
    }
};

export const updateCartInDatabase = async (cartId, products) => {
    try {
      return await cartModel.findByIdAndUpdate(
        cartId,
        { products: products },
        { new: true }
      );
    } catch (error) {
      throw error;
    }
};

export const changeProductQuantityInDatabase = async (cartId, productId, quantity) => {
    try {
      const cart = await cartModel.findById(cartId);
  
      if (!cart) {
        return null; // Indica que el carrito no fue encontrado
      }
  
      const productIndex = cart.products.findIndex(
        (item) => item.product._id.toString() === productId
      );
  
      if (productIndex === -1) {
        return null; // Indica que el producto no fue encontrado en el carrito
      }
  
      cart.products[productIndex].quantity = quantity;
      return await cart.save();
    } catch (error) {
      throw error;
    }
};

export const deleteProductFromCartInDatabase = async (cartId, productId) => {
    try {
        const cart = await cartModel.findById(cartId);
    
        if (!cart) {
            return null; // Indica que el carrito no fue encontrado
        }
    
        const productIndex = cart.products.findIndex(
            (item) => item.product._id.toString() === productId
        );
    
        if (productIndex === -1) {
            return null; // Indica que el producto no fue encontrado en el carrito
        }
    
        cart.products.splice(productIndex, 1);
        await cart.save();
        return cart;
    } catch (error) {
        throw error;
    }
};
  
export const deleteAllProductsInDatabase = async (cartId) => {
    try {
        return await cartModel.findByIdAndUpdate(
            cartId,
            { $set: { products: [] } },
            { new: true }
        );
    } catch (error) {
        throw error;
    }
};