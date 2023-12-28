import cartModel from "../daos/models/cart.model.js";
import productModel from "../daos/models/product.model.js";


//! Vista de carrito
export const getCart = async (req, res) => {
    try {
        const cartId = req.params.cid;

        // Encuentra el carrito específico por su ID
        const cart = await cartModel.findOne({ _id: cartId });
        
        if (!cart) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
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
        res.status(500).json({ error: error.message });
    }
};

//!Router de carrito

export const getCarts = async (req, res) => {
    try {
        const cart = await cartModel.find();
        if (!cart) {
          return res.status(404).json({ error: 'Carrito no encontrado' });
        }
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
        
    }
};

export const getCartById = async (req, res) => {

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

};

export const postCart = async (req, res) => {
    const cart = new cartModel(req.body)

    try {
        const addedCart = await cart.save();
        
        res.status(201).json(addedCart);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const addProductToCart = async (req, res) => {
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
};

export const deleteProductFromCart = async (req, res) => {
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
};

export const updateCart = async (req, res) => {
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
}

export const changeQuantity = async (req, res) => {
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
}

export const deleteAllProducts = async (req, res) => {
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
}