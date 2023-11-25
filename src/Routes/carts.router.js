import express from 'express';
import { CartManager } from '../config/filesystem/CartManager.js'
import cartModel from '../config/models/cart.model.js';

const cartRouter = express.Router();

const filePath = 'archivos/carritos.json';
const manager = new CartManager(filePath);


cartRouter.get('/:cid', async (req, res) => {

    const cartId = req.params.cid;
    
    try {
        const cart = await cartModel.findById(cartId);
        if (!cart) {
          return res.status(404).json({ error: 'Carrito no encontrado' });
        }
        res.status(200).json(cart);
      } catch (error) {
        res.status(500).json({ error: error.message });
        
      }
});


cartRouter.post('/', async (req, res) => {
    const cart = new cartModel(req.body)

    try {
        const addedCart = await cart.save();
        
        res.status(201).json(addedCart);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Agregar un producto a un carrito

cartRouter.post('/:cid/product/:pid', async (req, res) => {

    const cartId = req.params.cid;
    const productId = req.params.pid;
  
    try {
        const cart = await cartModel.findById(cartId);

        // Verificar si el producto ya existe en el carrito
        const existingProductIndex = cart.products.findIndex(
            (item) => item.product.toString() === productId
        );

        if (existingProductIndex !== -1) {
            // Si el producto ya existe, aumenta la cantidad en uno
            cart.products[existingProductIndex].quantity += 1;
        } else {
            // Si el producto no está en el carrito, se agrega con cantidad 1
            cart.products.push({ product: productId, quantity: 1 });
        }

        // Guardar el carrito actualizado
        const updatedCart = await cart.save();
        res.status(201).json(updatedCart);
        return updatedCart;
    } catch (error) {
        res.status(400).json({ error: error.message });
    }

});

cartRouter.delete('/:cid/product/:pid', async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;
    try {
        const cart = await cartModel.findById(cartId);

        if (!cart) {
            throw new Error('Cart not found');
        }

        // Encuentra el índice del producto en el array
        const productIndex = cart.products.findIndex(
            (product) => product._id.toString() === productId
        );

        if (productIndex === -1) {
            throw new Error('Product not found in cart');
        }

        // Eliminamos el producto del array
        cart.products.splice(productIndex, 1);
        
        // Guarda los cambios en la base de datos
        await cart.save();
        res.status(200).json(cart);
        return cart;
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
export { cartRouter };