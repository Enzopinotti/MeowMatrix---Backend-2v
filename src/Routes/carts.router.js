import express from 'express';
import { CartManager } from '../daos/filesystem/CartManager.js'
import cartModel from '../daos/models/cart.model.js';

const cartRouter = express.Router();

const filePath = 'archivos/carritos.json';
const manager = new CartManager(filePath);

cartRouter.get('/', async (req, res) => {
    
    try {
        const cart = await cartModel.find();
        if (!cart) {
          return res.status(404).json({ error: 'Carrito no encontrado' });
        }
        res.status(200).json(cart);
      } catch (error) {
        res.status(500).json({ error: error.message });
        
      }
});


cartRouter.get('/:cid', async (req, res) => {

    const cartId = req.params.cid;
    
    try {
        const cart = await cartModel.findOne({ _id: cartId });
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

        const cart = await cartModel.findOne({ _id: cartId });

        if (!cart) {
            throw new Error('Cart not found');
        }

        // Verificar si el producto ya existe en el carrito
        const existingProductIndex = cart.products.findIndex(
            (item) => item.product._id.toString() === productId
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
            (item) => item.product._id.toString() === productId
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


//Para cambiar el arreglo de productos en el carrito, primero debemos encontrar el carrito por su ID y luego actualizar el campo products con el nuevo arreglo de productos.
cartRouter.put('/:cid', async (req, res) => {
    const cartId = req.params.cid;
    const products = req.body.products; // Arreglo de productos a actualizar en el carrito

    try {
        const cart = await cartModel.findByIdAndUpdate(
            cartId,
            { products: products },
            { new: true }
        );

        if (!cart) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
        }

        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Para cambiar la cantidad de un producto en un carrito, primero debemos encontrar el carrito por su ID y luego actualizar el campo quantity del producto con el nuevo valor.
cartRouter.put('/:cid/products/:pid', async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;
    const { quantity } = req.body; // Nueva cantidad del producto

    try {
        const cart = await cartModel.findById(cartId);

        if (!cart) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
        }

        const productIndex = cart.products.findIndex(
            (item) => item.product._id.toString() === productId
        );

        if (productIndex === -1) {
            return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
        }

        cart.products[productIndex].quantity = quantity;
        const updatedCart = await cart.save();

        res.status(200).json(updatedCart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Elimina todos los productos del carrito. Primero debemos encontrar el carrito por su ID y luego actualizar el campo products con un arreglo vacío.
cartRouter.delete('/:cid', async (req, res) => {
    const cartId = req.params.cid;

    try {
        const updatedCart = await cartModel.findByIdAndUpdate(
            cartId,
            { $set: { products: [] } }, // Establece el array de productos como vacío
            { new: true }
        );

        if (!updatedCart) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
        }

        res.status(200).json(updatedCart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export { cartRouter };