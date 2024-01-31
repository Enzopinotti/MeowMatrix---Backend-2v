import * as cartService from "../services/cart.service.js";
import * as productService from "../services/product.service2.js";
import moment from 'moment';
import * as userService from "../services/user.service.js";
import { createTicket } from "./ticket.controller.js";
import url from 'url';
import { sendMail } from "./mail.controller.js";


const calculateTotalPrice = (products) => {
    return products.reduce((total, product) => total + (product.quantity * product.product.price), 0);
};

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
        res.render('cart', {
            user: req.user, // Pasar información del usuario
            cart: cart.payload, // Pasar información del carrito
            calculateTotalPrice: calculateTotalPrice(cart.payload.products),
            title: 'Detalles del carrito',
            style: 'cart.css',

        });
    } catch (error) {
        console.log(error);
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

    console.log("id del carrito",cartId);
    console.log("id del producto",productId);

    try {
        const updatedCart = await cartService.addProductToCart(cartId, productId);
        
        if (!updatedCart) {
            return res.sendNotFound('Carrito no encontrado');
        }

        res.sendSuccess(updatedCart);
    } catch (error) {
        console.log(error);
        res.sendServerError(error.message);
    }
};

export const addToCurrentCart = async (req, res) => {
    
    const userId = req.user._id; // Supongo que tienes el ID del usuario en req.user
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

export const deleteCart = async (req, res) => {
    const cartId = req.params.cid;
    try {
        const deletedCart = await cartService.deleteCart(cartId);

        if (deletedCart.status === "success") {
            res.sendSuccess(deletedCart);
        } else {
            res.sendNotFound(deletedCart);
        }
    } catch (error) {
        res.sendServerError({ status: "error", error: error.message });
    }
};


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
            if (updatedCart) {
                console.log(`Producto ${productPurchased} eliminado del carrito con éxito.`);
            } else {
                console.log(`Error al eliminar el producto ${productPurchased} del carrito.`);
            }
        };
        // Generar HTML del ticket (sustituye con tu propia lógica) //
        const user = await userService.getUserById(ticket.purchaser) 
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
        res.redirect(`${serverUrl}/ticket`);
    } catch (error) {
      res.sendServerError({ status: 'error', message: error.message });
    }
};

async function processPurchase(cart) {

    const productsToPurchase = cart.payload.products;
    const result = {
      purchasedProducts: [],
      failedProducts: [],
    };
    for (const productData of productsToPurchase) {
        const { product, quantity } = productData;
        try {
            // Verificar el stock del producto
            const availableStock = await productService.checkProductStock(product, quantity);
            
            // Si hay suficiente stock, procesar la compra
            if (availableStock) {
                await productService.updateProductStock(product, quantity);
                product.quantity = quantity;
                result.purchasedProducts.push(product);
            } else {
                result.failedProducts.push(product);
            }
        } catch (error) {
            // Manejar errores según sea necesario
            console.error(`Error processing product ${product}: ${error.message}`);
            result.failedProducts.push(product);
        }
    }
    return result;
}