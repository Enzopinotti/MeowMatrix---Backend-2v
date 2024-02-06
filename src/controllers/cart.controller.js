import * as cartService from "../services/cart.service.js";
import * as productService from "../services/product.service.js";
import moment from 'moment';
import * as userService from "../services/user.service.js";
import { createTicket } from "./ticket.controller.js";
import url from 'url';
import { sendMail } from "./mail.controller.js";
import { io } from '../app.js'
import { calculateTotalPrice } from "../utils.js";

<<<<<<< HEAD


//!Router de carrito

export const getCarts = async (req, res) => {
    try {
        const reqLogger = req.logger;
        const carts = await cartService.getCarts(reqLogger);
    
        if (!carts || carts.length === 0) {
            req.logger.warn("cart.controller.js: getCarts - Producto no encontrado con ID:", productId);
            return res.sendNotFound('Carritos no encontrados');
        }
        req.logger.debug("cart.controller.js: getCarts - Productos obtenidos:", products);
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
        if (userId === undefined) {
            req.logger.warn("cart.controller.js: getCartView - El id es indefinido");
            return res.sendServerError('El usuario no está autenticado');
        }
        // Encuentra el carrito específico por su ID
        const cart = await cartService.getCartByUserId(userId, reqLogger);
        if (!cart) {
            req.logger.warn("cart.controller.js: getCartView - Carrito no encontrado con el id: ", userId);
            return res.sendNotFound('Carrito no encontrado');
        }
        req.logger.debug("cart.controller.js: getCartView - Vista de detalles del carrito obtenida");
=======
//! Vista de carrito
export const getCartView = async (req, res) => {
    try {
        const userId = req.user._id;
        if (userId === undefined) {
             return res.sendServerError('El usuario no está autenticado');
        }
        // Encuentra el carrito específico por su ID
        const cart = await cartService.getCartByUserId(userId);
        if (!cart) {
            return res.sendNotFound('Carrito no encontrado');
        }
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        res.render('cart', {
            user: req.user, // Pasar información del usuario
            cart: cart.payload, // Pasar información del carrito
            calculateTotalPrice: calculateTotalPrice(cart.payload.products),
            title: 'Detalles del carrito',
            style: 'cart.css',

        });
    } catch (error) {
<<<<<<< HEAD
        req.logger.error("cart.controller.js: getCartView - Error al obtener la vista del carrito:", error);
=======
        console.log(error);
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        res.sendServerError(error);
    }
};

<<<<<<< HEAD
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
=======
//!Router de carrito

export const getCarts = async (req, res) => {
    try {
        console.log('entro a get cart')
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
    console.log('entro a get cart by id')
    try {
        const cartId = req.params.cid;
        const cart = await cartService.getCartById(cartId);
        if (!cart) {
            return res.sendNotFound('Carrito no encontrado');
        }
        res.sendSuccess(cart);
    } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        res.sendServerError(error);
    }
};

export const postCart = async (req, res) => {
    const cartData = req.body;
<<<<<<< HEAD
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
=======
    try {
      const addedCart = await cartService.createCart(cartData);
      res.sendSuccess(addedCart);
    } catch (error) {
      res.sendServerError(error);
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    }
};

export const addProductToCart = async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;
<<<<<<< HEAD
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
=======

    try {
        const updatedCart = await cartService.addProductToCart(cartId, productId);
        
        if (!updatedCart) {
            return res.sendNotFound('Carrito no encontrado');
        }

        res.sendSuccess(updatedCart);
    } catch (error) {
        console.log(error);
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        res.sendServerError(error.message);
    }
};

export const addToCurrentCart = async (req, res) => {
<<<<<<< HEAD
    const userId = req.user._id;
    const reqLogger = req.logger; 
    try {
        const productId = req.params.pid;
        const result = await cartService.addToCurrentCart(userId, productId, reqLogger);
        req.logger.debug("cart.controller.js: addToCurrentCart - Producto Añadido al carrito con éxito.");
        res.sendSuccess(result.payload);
    } catch (error) {
        req.logger.error("cart.controller.js: addToCurrentCart - Error al añadir un producto el carrito (current): ", error);
        res.sendServerError(error.message);
    }
};


=======
    
    const userId = req.user._id; 
    try {
        const productId = req.params.pid;
        const result = await cartService.addToCurrentCart(userId, productId);
        res.sendSuccess(result.payload);
      
    } catch (error) {
        console.log('error en current: ',error);
      res.sendServerError(error.message);
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
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd

export const changeQuantity = async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;
    const { quantity } = req.body;
<<<<<<< HEAD
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
        req.logger.error("cart.controller.js: changeQuantity - Error en changeQuantity:", error);
=======

    try {
        const updatedCart = await cartService.changeProductQuantity(cartId, productId, quantity);

        if (!updatedCart) {
            return res.sendNotFound('Carrito no encontrado o producto no encontrado en el carrito');
        }
        res.sendSuccess(updatedCart);
    } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        res.sendServerError(error);
    }
};

export const deleteProductFromCart = async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;
<<<<<<< HEAD
    const reqLogger = req.logger;
    try {
        const updatedCart = await cartService.deleteProductFromCart(cartId, productId, reqLogger);

        if (!updatedCart) {
            req.logger.warn("cart.controller.js: deleteProductFromCart - Carrito no encontrado o producto no encontrado en el carrito");
=======

    try {
        const updatedCart = await cartService.deleteProductFromCart(cartId, productId);

        if (!updatedCart) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
            return res.sendNotFound('Carrito no encontrado o producto no encontrado en el carrito');
        }
        // Emite un evento a todos los clientes conectados para actualizar la vista del carrito
        io.emit('updateCart', { cartId, productId });
<<<<<<< HEAD
        req.logger.debug("cart.controller.js: deleteProductFromCart - Carrito actualizado después de eliminar un producto");
        res.sendSuccess(updatedCart);
    } catch (error) {
        req.logger.error("cart.controller.js: deleteProductFromCart - Error en deleteProductFromCart:", error);
=======
        res.sendSuccess(updatedCart);
    } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        res.sendUserError(error.message);
    }
};

<<<<<<< HEAD
export const deleteAllProducts = async (req, res) => {
    const cartId = req.params.cid;
    const reqLogger = req.logger;
    
    try {
        const updatedCart = await cartService.deleteAllProducts(cartId, reqLogger);

        if (!updatedCart) {
            req.logger.warn("cart.controller.js: deleteAllProducts - Carrito no encontrado");
            return res.sendNotFound('Carrito no encontrado');
        }
        io.emit('updateAllCart', { cartId, reqLogger });
        req.logger.debug("cart.controller.js: deleteAllProducts - Carrito actualizado después de eliminar todos los productos:", updatedCart);
        res.sendSuccess(updatedCart);
    } catch (error) {
        req.logger.error("cart.controller.js: deleteAllProducts - Error en deleteAllProducts:", error);
=======

export const deleteAllProducts = async (req, res) => {
    const cartId = req.params.cid;

    try {
        const updatedCart = await cartService.deleteAllProducts(cartId);

        if (!updatedCart) {
        return res.sendNotFound('Carrito no encontrado');
        }
        io.emit('updateAllCart', { cartId });
        res.sendSuccess(updatedCart);
    } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        res.sendServerError(error);
    }
};

export const deleteCart = async (req, res) => {
    const cartId = req.params.cid;
<<<<<<< HEAD
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
=======
    try {
        const deletedCart = await cartService.deleteCart(cartId);

        if (deletedCart.status === "success") {
            res.sendSuccess(deletedCart);
        } else {
            res.sendNotFound(deletedCart);
        }
    } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        res.sendServerError({ status: "error", error: error.message });
    }
};

<<<<<<< HEAD
export const purchaseCart = async (req, res) => {
    const { cid } = req.params;
    const reqLogger = req.logger;
    try {
        // Obtener el carrito por id //
        const cart = await cartService.getCartById(cid, reqLogger);
        // Verificar el stock y procesar la compra //
        const result = await processPurchase(cart, reqLogger);
        // Crear un ticket con los detalles de la compra //
        const ticket = await createTicket(result, cart.payload.user, reqLogger);
        // Eliminar productos comprados del carrito //
        for (const productPurchased of result.purchasedProducts) {
            const updatedCart = await cartService.deleteProductFromCart(cart.payload._id, productPurchased._id, reqLogger);
        };
        // Generar HTML del ticket (sustituye con tu propia lógica) //
        const user = await userService.getUserById(ticket.purchaser, reqLogger) 
=======

export const purchaseCart = async (req, res) => {
    const { cid } = req.params;
    
    try {
        // Obtener el carrito por id //
        const cart = await cartService.getCartById(cid);
        // Verificar el stock y procesar la compra //
        const result = await processPurchase(cart);
        // Crear un ticket con los detalles de la compra //
        const ticket = await createTicket(result, cart.payload.user);
        // Eliminar productos comprados del carrito //
        for (const productPurchased of result.purchasedProducts) {
            const updatedCart = await cartService.deleteProductFromCart(cart.payload._id, productPurchased._id);
        };
        // Generar HTML del ticket (sustituye con tu propia lógica) //
        const user = await userService.getUserById(ticket.purchaser) 
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        const ticketHTML = `
        <html>
            <h1>Ticket de Compra</h1>
            <p><strong>Código de Ticket:</strong> ${ticket.code}</p>
            <p><strong>Fecha de Compra:</strong> ${moment(ticket.purchase_datetime).format('DD/MM/YYYY HH:mm:ss')}</p>
            <p><strong>Monto Total: </strong> $${ticket.amount.toFixed(2)}</p>
            <p><strong>Comprador:</strong> ${user.name} ${user.lastName}</p> 
        </html>
        `;
        // Enviar el ticket por correo electrónico //
        await sendMail({
            to: req.user.email, 
            subject: 'Confirmación de compra',
            message: 'Gracias por tu compra. Adjunto encontrarás el ticket de compra.',
            ticketHTML,
        });
        const serverUrl = url.format({
            protocol: req.protocol,
            host: req.get('host'),
        });
<<<<<<< HEAD
        req.logger.debug("cart.controller.js: purchaseCart - Compra realizada con exito.");
        res.redirect(`${serverUrl}/ticket`);
    } catch (error) {
        req.logger.error("cart.controller.js: purchaseCart - Error en purchaseCart:", error);
        res.sendServerError({ status: 'error', message: error.message });
=======
        res.redirect(`${serverUrl}/ticket`);
    } catch (error) {
      res.sendServerError({ status: 'error', message: error.message });
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    }
};

export const getCartSummary = async (req, res) => {
    try {
<<<<<<< HEAD
        const reqLogger = req.logger;
        const userId = req.user._id;
        if (!userId) {
            req.logger.warn("cart.controller.js: getCartSummary - El usuario no está autenticado");
=======
        const userId = req.user._id;
        if (!userId) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
            return res.sendServerError('El usuario no está autenticado');
        }

        // Llama a la capa de servicio para obtener el resumen del carrito
<<<<<<< HEAD
        const cartSummary = await cartService.getCartSummary(userId, reqLogger);

        // Devuelve los datos del resumen del carrito al cliente
        req.logger.debug("cart.controller.js: getCartSummary - Resumen del carrito obtenido:", cartSummary);
        res.sendSuccess(cartSummary);
    } catch (error) {
        req.logger.error("cart.controller.js: getCartSummary - Error al obtener el resumen del carrito:", error);
        res.sendServerError(error.message);
    }
};


async function processPurchase(cart, reqLogger) {
    req.logger.debug("cart.controller.js: processPurchase - Procesando carrito");
=======
        const cartSummary = await cartService.getCartSummary(userId);

        // Devuelve los datos del resumen del carrito al cliente
        res.sendSuccess(cartSummary);
    } catch (error) {
        console.error('Error al obtener el resumen del carrito:', error);
        res.sendServerError(error.message);
    }
}

async function processPurchase(cart) {

>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    const productsToPurchase = cart.payload.products;
    const result = {
      purchasedProducts: [],
      failedProducts: [],
    };
    for (const productData of productsToPurchase) {
        const { product, quantity } = productData;
        try {
            // Verificar el stock del producto
<<<<<<< HEAD
            const availableStock = await productService.checkProductStock(product, quantity, reqLogger);
            
            // Si hay suficiente stock, procesar la compra
            if (availableStock) {
                await productService.updateProductStock(product, quantity, reqLogger);
=======
            const availableStock = await productService.checkProductStock(product, quantity);
            
            // Si hay suficiente stock, procesar la compra
            if (availableStock) {
                await productService.updateProductStock(product, quantity);
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
                product.quantity = quantity;
                result.purchasedProducts.push(product);
            } else {
                result.failedProducts.push(product);
            }
        } catch (error) {
            // Manejar errores según sea necesario
<<<<<<< HEAD
            reqLogger.error(`cart.controller.js: processPurchase - Error procesando producto,  ${product}: ${error.message}`);
=======
            console.error(`Error processing product ${product}: ${error.message}`);
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
            result.failedProducts.push(product);
        }
    }
    return result;
}