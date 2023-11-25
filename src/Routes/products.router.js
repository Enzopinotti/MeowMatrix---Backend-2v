import express from 'express';
import { ProductManager } from '../config/filesystem/ProductManager.js';
import { uploader } from '../utils.js';
import productModel from '../config/models/product.model.js';


const productRouter = express.Router();


const filePath = 'archivos/productos.json';
const manager = new ProductManager(filePath);


productRouter.get('/', async (req, res) => {

  const limit = req.query.limit; // Obtén el límite de productos desde los parámetros de consulta

  try {
    const products = await productModel.find( { isVisible:true } );
    if (limit) {
      const limitedProducts = products.slice(0, parseInt(limit));
      res.status(200).json(limitedProducts);
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
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
    
  }
});

productRouter.put('/:pid', async (req, res) => {

    try {
      const updatedProduct = await productModel.findByIdAndUpdate(
        req.params.pid, req.body, { new: true, }  
      );
      if(!updatedProduct){
        return res.status(404).json({message: 'Product not found'});
      }
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



productRouter.delete('/:pid', async (req, res) => {

  const productId = req.params.pid;
  

  try {
      const result = await productModel.findById(productId);
      const productEliminated = await productModel.deleteOne(result);
      res.status(200).json(productEliminated);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});






productRouter.post('/', uploader.single('image') , async (req, res) => {

  const product = new productModel(req.body)

  try {
      const addedProduct = await product.save();
      //io.emit('producto-agregado', { producto: addedProduct });
      res.status(201).json(addedProduct);
  }
  catch (error) {
      res.status(500).json({ error: error.message });
  }
});




export { productRouter };