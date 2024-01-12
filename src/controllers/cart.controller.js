import * as cartService from "../services/cart.service.js";
import * as productService from "../services/product.service.js";
import moment from 'moment';

//! Vista de carrito
export const getCart = async (req, res) => {
    try {
        const cartId = req.params.cid;

        // Encuentra el carrito específico por su ID
        const cart = await cartService.getCartById(cartId);
        
        if (!cart) {
            return res.sendNotFound('Carrito no encontrado');
        }

        // Extrae los IDs de los productos del carrito
        const productIdsInCart = cart.products.map(product => product.product._id);

        // Obtiene los productos asociados a esos IDs
        const productsInCart = await productService.getProductsByIds(productIdsInCart);
        
        // Renderiza la vista de carrito y pasa la información
        res.render('cart', {
            cartId: cartId,
            quantity: cart.quantity,
            cartProducts: productsInCart,
            title: 'Detalles del carrito',
            style: 'cart.css',

        });
    } catch (error) {
        res.sendServerError(error);
    }
};

//!Router de carrito

export const getCarts = async (req, res) => {
    try {
      const carts = await cartService.getCarts();
  
      if (!carts || carts.length === 0) {
        return res.sendNotFound('Carritos no encontrados');
      }
  
      res.sendSuccess(carts);
    } catch (error) {
      res.sendServerError(error);
    }
};

export const getCartById = async (req, res) => {
    try {
        const cartId = req.params.cid;
        const cart = await cartService.getCartById(cartId);
        if (!cart) {
            return res.sendNotFound('Carrito no encontrado');
        }
        res.sendSuccess(cart);
    } catch (error) {
        res.sendServerError(error);
    }
};

export const postCart = async (req, res) => {
    const cartData = req.body;
    try {
      const addedCart = await cartService.createCart(cartData);
      res.sendSuccess(addedCart);
    } catch (error) {
      res.sendServerError(error);
    }
};

export const addProductToCart = async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;

    try {
        const updatedCart = await cartService.addProductToCart(cartId, productId);

        if (!updatedCart) {
            return res.sendNotFound('Carrito no encontrado');
        }

        res.sendSuccess(updatedCart);
    } catch (error) {
        res.sendServerError(error);
    }
};

export const updateCart = async (req, res) => {
    const cartId = req.params.cid;
    const products = req.body.products;

    try {
        const updatedCart = await cartService.updateCart(cartId, products);

        if (!updatedCart) {
        return res.sendNotFound('Carrito no encontrado');
        }

        res.sendSuccess(updatedCart);
    } catch (error) {
        res.sendServerError(error);
    }
};

export const changeQuantity = async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;
    const { quantity } = req.body;

    try {
        const updatedCart = await cartService.changeProductQuantity(cartId, productId, quantity);

        if (!updatedCart) {
            return res.sendNotFound('Carrito no encontrado o producto no encontrado en el carrito');
        }

        res.sendSuccess(updatedCart);
    } catch (error) {
        res.sendServerError(error);
    }
};

export const deleteProductFromCart = async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;

    try {
        const updatedCart = await cartService.deleteProductFromCart(cartId, productId);

        if (!updatedCart) {
            return res.sendNotFound('Carrito no encontrado o producto no encontrado en el carrito');
        }

        res.sendSuccess(updatedCart);
    } catch (error) {
        res.sendUserError(error.message);
    }
};


export const deleteAllProducts = async (req, res) => {
    const cartId = req.params.cid;

    try {
        const updatedCart = await cartService.deleteAllProducts(cartId);

        if (!updatedCart) {
        return res.sendNotFound('Carrito no encontrado');
        }

        res.sendSuccess(updatedCart);
    } catch (error) {
        res.sendServerError(error);
    }
};