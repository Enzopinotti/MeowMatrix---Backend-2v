import * as cartService from "../services/cart.service.js";
import * as productService from "../services/product.service.js";
import moment from 'moment';
import * as userService from "../services/user.service.js";
import { createTicket } from "./ticket.controller.js";
import url from 'url';
import { sendMailWithPdf } from "./mail.controller.js";
import { io } from '../app.js'
import { calculateTotalPrice } from "../utils.js";




//!Router de carrito

export const getCarts = async (req, res) => {
    try {
        const reqLogger = req.logger;
        const carts = await cartService.getCarts(reqLogger);
    
        if (!carts || carts.length === 0) {
            req.logger.warn("cart.controller.js: getCarts - Producto no encontrado con ID:", productId);
            return res.sendNotFound('Carritos no encontrados');
        }
        req.logger.debug("cart.controller.js: getCarts - Carritos obtenidos.");
        res.sendSuccess(carts);
    } catch (error) {
        req.logger.error("cart.controller.js: getCarts - Error al obtener carritos:", error);
        res.sendServerError(error);
    }
};

//! Vista de carrito
export const getCartView = async (req, res) => {
    try {
        const reqLogger = req.logger;
        const userId = req.user._id;
        if (!userId) {
            req.logger.warn("cart.controller.js: getCartView - El id es indefinido");
            throw new Error('El id es indefinido');
        }
        // Encuentra el carrito específico por su ID
        const cart = await cartService.getCartByUserId(userId, reqLogger);
        req.logger.debug("cart.controller.js: getCartView - Carrito encontrado con el id: ", cart);
        if (cart.status != 'success' ) {
            req.logger.warn("cart.controller.js: getCartView - Carrito no encontrado con el id: ", userId);
            const newCart = await cartService.createCart({ user: req.user._id, products: [] }, reqLogger);
            req.logger.debug("cart.controller.js: getCartView - Vista de detalles del carrito obtenida con carrito ", newCart.payload);
            res.render('cart', {
                user: req.user, // Pasar información del usuario
                cart: newCart.payload, // Pasar información del carrito
                calculateTotalPrice: calculateTotalPrice(newCart.payload.products),
                title: 'Detalles del carrito',
                style: 'cart.css',
    
            });
        }else{
            req.logger.debug("cart.controller.js: getCartView - Vista de detalles del carrito obtenida");
            res.render('cart', {
            user: req.user, // Pasar información del usuario
            cart: cart.payload, // Pasar información del carrito
            calculateTotalPrice: calculateTotalPrice(cart.payload.products),
            title: 'Detalles del carrito',
            style: 'cart.css',

        });
        }
        
    } catch (error) {
        req.logger.error("cart.controller.js: getCartView - Error al obtener la vista del carrito:", error);
        res.sendServerError(error.message);
    }
};

export const getCartById = async (req, res) => {
    try {
        const reqLogger = req.logger;
        const cartId = req.params.cid;
        const cart = await cartService.getCartById(cartId, reqLogger);
        if (!cart) {
            req.logger.warn("cart.controller.js: getCartById - Carrito no encontrado con el id: ", cartId);
            return res.sendNotFound('Carrito no encontrado');
        }
        req.logger.debug("cart.controller.js: getCartById - Carrito obtenido por ID.");
        res.sendSuccess(cart);
    } catch (error) {
        req.logger.error("cart.controller.js: getCartById - Error al obtener el carrito por Id: ", error);
        res.sendServerError(error);
    }
};

export const postCart = async (req, res) => {
    const cartData = req.body;
    const reqLogger = req.logger;
    try {
        const addedCart = await cartService.createCart(cartData, reqLogger);
        req.logger.debug("cart.controller.js: postCart - Carrito creado con exito.");
        res.sendSuccess(addedCart);
    } catch (error) {
        req.logger.error("cart.controller.js: postCart - Error al crear el carrito: ", error);
        res.sendServerError(error);
    }
};

export const updateCart = async (req, res) => {
    const cartId = req.params.cid;
    const products = req.body.products;
    const reqLogger = req.logger;
    try {
        const updatedCart = await cartService.updateCart(cartId, products, reqLogger);

        if (!updatedCart) {
            req.logger.warn("cart.controller.js: updateCart - Carrito no encontrado para actualizar con el ID:", cartId);
            return res.sendNotFound('Carrito no encontrado');
        }
        req.logger.debug("cart.controller.js: updateCart - Carrito actualizado con exito.");
        res.sendSuccess(updatedCart);
    } catch (error) {
        req.logger.error("cart.controller.js: updateCart - Error al actualizar el Carrito:", error);
        res.sendServerError(error);
    }
};

export const addProductToCart = async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;
    const reqLogger = req.logger;
    try {
        const updatedCart = await cartService.addProductToCart(cartId, productId, reqLogger);
        if (!updatedCart) {
            req.logger.warn("cart.controller.js: addProductToCart - No llegó ningun carrito actualizado");
            return res.sendNotFound('Carrito no encontrado');
        }
        req.logger.debug("cart.controller.js: addProductToCart - Producto Añadido con exito.");
        res.sendSuccess(updatedCart);
    } catch (error) {
        req.logger.error("cart.controller.js: addProductToCart - Error al añadir un producto el carrito: ", error);
        res.sendServerError(error.message);
    }
};

export const addToCurrentCart = async (req, res) => {
    if(!req.user){
        req.logger.warn("cart.controller.js: addToCurrentCart - El usuario no está autenticado");
        return res.sendUnauthorized('El usuario no está autenticado');
    }
    const userId = req.user._id;
    const reqLogger = req.logger; 
    try {
        const productId = req.params.pid;
        console.log('llega el id: ', productId);
        const result = await cartService.addToCurrentCart(userId, productId, reqLogger);
        req.logger.debug("cart.controller.js: addToCurrentCart - Producto Añadido al carrito con éxito.");
        res.sendSuccess(result.payload);
    } catch (error) {
        req.logger.error("cart.controller.js: addToCurrentCart - Error al añadir un producto el carrito (current): ", error);
        res.sendServerError(error.message);
    }
};



export const changeQuantity = async (req, res) => {
    
    const cartId = req.params.cid;
   
    const productId = req.params.pid;
    const { quantity } = req.body;
    const reqLogger = req.logger;
    
    try {
        
        const updatedCart = await cartService.changeProductQuantity(cartId, productId, quantity, reqLogger);
        
        if (!updatedCart) {
            req.logger.warn("cart.controller.js: changeQuantity - Carrito no encontrado o producto no encontrado en el carrito");
            return res.sendNotFound('Carrito no encontrado o producto no encontrado en el carrito');
        }
        req.logger.debug("cart.controller.js: changeQuantity - Cantidad Cambiada con exito.");
        res.sendSuccess(updatedCart);
    } catch (error) {
        req.logger.error("cart.controller.js: changeQuantity - Error en changeQuantity.");
        res.sendServerError(error.message);
    }
};

export const deleteProductFromCart = async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;
    const reqLogger = req.logger;
    try {
        const updatedCart = await cartService.deleteProductFromCart(cartId, productId, reqLogger);

        if (!updatedCart) {
            req.logger.warn("cart.controller.js: deleteProductFromCart - Carrito no encontrado o producto no encontrado en el carrito");
            return res.sendNotFound('Carrito no encontrado o producto no encontrado en el carrito');
        }
        // Emite un evento a todos los clientes conectados para actualizar la vista del carrito
        io.emit('updateCart', { cartId, productId });
        req.logger.debug("cart.controller.js: deleteProductFromCart - Carrito actualizado después de eliminar un producto");
        res.sendSuccess(updatedCart);
    } catch (error) {
        req.logger.error("cart.controller.js: deleteProductFromCart - Error en deleteProductFromCart:", error);
        res.sendUserError(error.message);
    }
};

export const deleteAllProducts = async (req, res) => {
    const cartId = req.params.cid;
    const reqLogger = req.logger;
    
    try {
        const updatedCart = await cartService.deleteAllProducts(cartId, reqLogger);

        if (!updatedCart) {
            req.logger.warn("cart.controller.js: deleteAllProducts - Carrito no encontrado");
            return res.sendNotFound('Carrito no encontrado');
        }
        req.logger.debug("cart.controller.js: deleteAllProducts - Carrito actualizado después de eliminar todos los productos.");
        io.emit('updateAllCart', { cartId });
        res.sendSuccess(updatedCart);
    } catch (error) {
        req.logger.error("cart.controller.js: deleteAllProducts - Error en deleteAllProducts:", error);
        res.sendServerError(error);
    }
    
};

export const deleteCart = async (req, res) => {
    const cartId = req.params.cid;
    const reqLogger = req.logger;
    try {
        const deletedCart = await cartService.deleteCart(cartId, reqLogger);

        if (deletedCart.status === "success") {
            req.logger.debug("cart.controller.js: deleteCart - Carrito eliminado exitosamente:", deletedCart);
            res.sendSuccess(deletedCart);
        } else {
            req.logger.warn("cart.controller.js: deleteCart - Carrito no encontrado al intentar eliminar:", deletedCart);
            res.sendNotFound(deletedCart);
        }
    } catch (error) {
        req.logger.error("cart.controller.js: deleteCart - Error en deleteCart:", error);
        res.sendServerError({ status: "error", error: error.message });
    }
};

export const purchaseCart = async (req, res) => {
    const { cid } = req.params;
    const reqLogger = req.logger;
    let updatedCart;
    try {
        // Obtener el carrito por id //
        if(!req.user){
            req.logger.warn("cart.controller.js: purchaseCart - El usuario no está autenticado");
            return res.sendUnauthorized('El usuario no está autenticado');
        }
        const cart = await cartService.getCartById(cid, reqLogger);
        reqLogger.debug("cart.controller.js: purchaseCart - Carrito obtenido por ID.");
        // Verificar el stock y procesar la compra //
        const result = await processPurchase(cart, reqLogger);
        reqLogger.debug("cart.controller.js: purchaseCart - Proceso de compra finalizado.");
        // Crear un ticket con los detalles de la compra //
        const ticket = await createTicket(result, cart.payload.user, reqLogger);
        const user = await userService.getUserById(cart.payload.user, reqLogger);
  
        
        reqLogger.debug("cart.controller.js: purchaseCart - Ticket Creado");
        // Eliminar productos comprados del carrito //
        
        for (const productPurchased of result.purchasedProducts) {
            updatedCart = await cartService.deleteProductFromCart(cart.payload._id, productPurchased._id, reqLogger);
        };
        const products =  result.purchasedProducts;

        // Enviar el ticket por correo electrónico //
        await sendMailWithPdf({
            to: req.user.email, 
            subject: 'Confirmación de compra',
            message: 'Gracias por tu compra. Adjunto encontrarás el ticket de la transacción.',
            ticket,
            products,
            user
        });
        const serverUrl = url.format({
            protocol: req.protocol,
            host: req.get('host'),
        });
        req.logger.debug("cart.controller.js: purchaseCart - Compra realizada con exito.");
        res.redirect(`${serverUrl}/ticket`);
    } catch (error) {
        req.logger.error("cart.controller.js: purchaseCart - Error en purchaseCart:", error);
        res.sendServerError({ status: 'error', message: error.message });
    }
};



async function processPurchase(cart, reqLogger) {
    reqLogger.debug("cart.controller.js: processPurchase - Procesando carrito");
    const productsToPurchase = cart.payload.products;
    const result = {
      purchasedProducts: [],
      failedProducts: [],
    };
    for (const productData of productsToPurchase) {
        const { product, quantity } = productData;
        try {
            // Verificar el stock del producto
            const availableStock = await productService.checkProductStock(product, quantity, reqLogger);
            
            // Si hay suficiente stock, procesar la compra
            if (availableStock) {
                await productService.updateProductStock(product, quantity, reqLogger);
                product.quantity = quantity;
                result.purchasedProducts.push(product);
            } else {
                result.failedProducts.push(product);
            }
        } catch (error) {
            // Manejar errores según sea necesario
            reqLogger.error(`cart.controller.js: processPurchase - Error procesando producto,  ${product}: ${error.message}`);
            result.failedProducts.push(product);
        }
    }
    return result;
}

export const getCartSummary = async (req, res) => {
    try {
        const reqLogger = req.logger;
        const userId = req.user._id;
        if (!userId) {
            req.logger.warn("cart.controller.js: getCartSummary - El usuario no está autenticado");
            return res.sendServerError('El usuario no está autenticado');
        }

        // Llama a la capa de servicio para obtener el resumen del carrito
        const cartSummary = await cartService.getCartSummary(userId, reqLogger);

        // Devuelve los datos del resumen del carrito al cliente
        req.logger.debug("cart.controller.js: getCartSummary - Resumen del carrito obtenido:", cartSummary);
        res.sendSuccess(cartSummary);
    } catch (error) {
        req.logger.error("cart.controller.js: getCartSummary - Error al obtener el resumen del carrito:", error);
        res.sendServerError(error.message);
    }
};
