import cartModel from "../daos/models/cart.model.js";
import productModel from "../daos/models/product.model.js";


//! Vista de carrito
export const getCart = async (req, res) => {
    try {
        const cartId = req.params.cid;

        // Encuentra el carrito específico por su ID
        const cart = await cartModel.findOne({ _id: cartId });
        
        if (!cart) {
            return res.sendNotFound('Carrito no encontrado');
        }

        // Extrae los IDs de los productos del carrito
        const productIdsInCart = cart.products.map(product => product.product._id);

        // Obtiene los productos asociados a esos IDs
        const productsInCart = await productModel.find({ _id: { $in: productIdsInCart } });
        


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
        const cart = await cartModel.find();
        if (!cart) {
            return res.sendNotFound('Carrito no encontrado');
        }
        res.sendSuccess(cart);
    } catch (error) {
        res.sendServerError(error);
        
    }
};

export const getCartById = async (req, res) => {

    const cartId = req.params.cid;
    
    try {
        const cart = await cartModel.findOne({ _id: cartId });
        if (!cart) {
            return res.sendNotFound('Carrito no encontrado');
        }
        res.sendSuccess(cart);
    } catch (error) {
        res.sendServerError(error);
    }
};

export const postCart = async (req, res) => {
    const cart = new cartModel(req.body)
    try {
        const addedCart = await cart.save(); 
        res.sendSuccess(addedCart);
    }
    catch (error) {
        res.sendServerError(error);
    };
};

export const addProductToCart = async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;

    try {
        const cart = await cartModel.findOne({ _id: cartId });

        if (!cart) {
            return res.sendNotFound('Carrito no encontrado');
        }

        const existingProductIndex = cart.products.findIndex(
            (item) => item.product._id.toString() === productId
        );

        if (existingProductIndex !== -1) {
            cart.products[existingProductIndex].quantity += 1;
        } else {
            cart.products.push({ product: productId, quantity: 1 });
        }

        const updatedCart = await cart.save();
        res.sendSuccess(updatedCart);
    } catch (error) {
        res.sendUserError(error.message);
    }
};

export const deleteProductFromCart = async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;

    try {
        const cart = await cartModel.findById(cartId);

        if (!cart) {
            return res.sendNotFound('Carrito no encontrado');
        }

        const productIndex = cart.products.findIndex(
            (item) => item.product._id.toString() === productId
        );

        if (productIndex === -1) {
            return res.sendNotFound('Producto no encontrado en el carrito');
        }

        cart.products.splice(productIndex, 1);
        await cart.save();
        res.sendSuccess(cart);
    } catch (error) {
        res.sendUserError(error.message);
    }
};

export const updateCart = async (req, res) => {
    const cartId = req.params.cid;
    const products = req.body.products;

    try {
        const cart = await cartModel.findByIdAndUpdate(
            cartId,
            { products: products },
            { new: true }
        );

        if (!cart) {
            return res.sendNotFound('Carrito no encontrado');
        }

        res.sendSuccess(cart);
    } catch (error) {
        res.sendServerError(error);
    }
};

export const changeQuantity = async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;
    const { quantity } = req.body;

    try {
        const cart = await cartModel.findById(cartId);

        if (!cart) {
            return res.sendNotFound('Carrito no encontrado');
        }

        const productIndex = cart.products.findIndex(
            (item) => item.product._id.toString() === productId
        );

        if (productIndex === -1) {
            return res.sendNotFound('Producto no encontrado en el carrito');
        }

        cart.products[productIndex].quantity = quantity;
        const updatedCart = await cart.save();
        res.sendSuccess(updatedCart);
    } catch (error) {
        res.sendServerError(error);
    }
};

export const deleteAllProducts = async (req, res) => {
    const cartId = req.params.cid;

    try {
        const updatedCart = await cartModel.findByIdAndUpdate(
            cartId,
            { $set: { products: [] } },
            { new: true }
        );

        if (!updatedCart) {
            return res.sendNotFound('Carrito no encontrado');
        }

        res.sendSuccess(updatedCart);
    } catch (error) {
        res.sendServerError(error);
    }
};