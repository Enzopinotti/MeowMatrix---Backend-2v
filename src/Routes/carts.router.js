import express from 'express';
import { CartManager } from '../CartManager.js'
const cartRouter = express.Router();

const filePath = 'archivos/carritos.json';
const manager = new CartManager(filePath);


cartRouter.get('/:cid', async (req, res) => {

    const cartId = req.params.cid;
    
   
    try {

        const cart = await manager.getCartById(parseInt(cartId));
  
        console.log(cart);

        if (!cart) {
          return res.status(404).json({ error: 'Carrito no encontrado' });
        }
  
        res.status(200).json(cart);
  
      } catch (error) {
  
        res.status(500).json({ error: error.message });
        
      }
});


cartRouter.post('/', async (req, res) => {
    try {
        const newCart = await manager.addCart({});
        res.status(201).json(newCart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Agregar un producto a un carrito

cartRouter.post('/:cid/product/:pid', async (req, res) => {

    const cartId = req.params.cid;
    const productId = req.params.pid;
  
    try {
        const updatedCart = await manager.addProductToCart(parseInt(cartId), parseInt(productId));
        res.status(200).json(updatedCart);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }

});


export { cartRouter };