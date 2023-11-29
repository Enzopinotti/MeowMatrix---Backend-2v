import express from 'express';
import { ProductManager } from '../config/filesystem/ProductManager.js';
import { uploader } from '../utils.js';
import productModel from '../config/models/product.model.js';


const productRouter = express.Router();


const filePath = 'archivos/productos.json';
const manager = new ProductManager(filePath);


productRouter.get('/', async (req, res) => {

  const { page = 1, limit = 5, sort, query } = req.query;

  try {

    let queryOptions = {}; //Acá guardo las Querys que haga 
    let sortOptions = {}; //Acá guardo el tipo de ordenamiento que haga
    
    // Filtros basados en la query
    if (query && query.name) {
      queryOptions.name = { $regex: new RegExp(query.name, 'i') };
    }

    if (query && query.categoryId) {
      queryOptions.category = mongoose.Types.ObjectId(query.categoryId);
    }

    if (query && query.priceMin && query.priceMax) {
      queryOptions.price = { $gte: parseInt(query.priceMin), $lte: parseInt(query.priceMax) };
    }

    // Obtener el número total de documentos
    const totalDocs = await productModel.countDocuments(queryOptions);

    // Lógica de ordenamiento
    if (sort === 'date') {
      sortOptions = { createdAt: sort === 'asc' ? 1 : -1 };
    } else if (sort === 'price') {
      sortOptions = { price: sort === 'asc' ? 1 : -1 };
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions,
    };

    productModel.paginate(queryOptions, options, lean = true , (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json({
        status: 'success',
        totalDocs: totalDocs,
        payload: result.docs,
        totalPages: result.totalPages,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevLink: result.prevPage ? `/products?page=${result.prevPage}&limit=${limit}` : null,
        nextLink: result.nextPage ? `/products?page=${result.nextPage}&limit=${limit}` : null,
      });
    });
    
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