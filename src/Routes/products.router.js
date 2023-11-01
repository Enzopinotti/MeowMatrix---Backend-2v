import express from 'express';
import { ProductManager } from '../ProductManager.js';
import { uploader } from '../utils.js';


const productRouter = express.Router();


const filePath = 'archivos/productos.json';
const manager = new ProductManager(filePath);


productRouter.put('/:pid', async (req, res) => {
    const productId = req.params.pid;
    const numericProductId = parseInt(productId);
    const updatedFields = req.body;
    try {
        const updatedProduct = await manager.updateProduct(numericProductId, updatedFields);
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


productRouter.delete('/:pid', async (req, res) => {

    const productId = req.params.pid;
    const numericProductId = parseInt(productId);

    try {
        const result = await manager.deleteProductById(numericProductId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

productRouter.get('/', async (req, res) => {

    const limit = req.query.limit; // Obtén el límite de productos desde los parámetros de consulta
  
    try {
        
        const products = await manager.getProducts();
  
      if (limit) {

        const limitedProducts = products.slice(0, parseInt(limit));

        res.json(limitedProducts);

      } else {

        res.status(200).json(products);

      }

    } catch (error) {

      res.status(500).json({ error: error.message });

    }
});

productRouter.get('/:productId', async (req, res) => {

    const productId = req.params.productId;
    
  
    try {

      const product = await manager.getProductById(parseInt(productId));

      console.log(product);
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.status(200).json(product);

    } catch (error) {

      res.status(500).json({ error: error.message });
      
    }
  });


productRouter.post('/', uploader.single('image') , async (req, res) => {

    console.log(req.body);
    const { name, description, price, image, code, stock, category } = req.body;

    // Convierte el precio y el stock de cadena a número
    const numericPrice = parseFloat(price);
    const numericStock = parseInt(stock);

    // Verifica si la conversión es válida
    if (isNaN(numericPrice) || isNaN(numericStock)) {
        return res.status(400).json({ error: 'El precio y el stock deben ser números válidos.' });
    }
    
    const newProduct = {
        name: name,
        description: description,
        price: numericPrice,
        code: code,
        stock: numericStock,
        category: category,
        thumbnails: image,
    };

    try {
        console.log(newProduct);
        const addedProduct = await manager.addProduct(newProduct);
        res.status(201).json(addedProduct);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }

});




export { productRouter };