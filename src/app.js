import express from 'express';
import fs from 'fs'
import { ProductManager } from './ProductManager.js';


const filePath = 'archivos/productos.json';

const app = express();
const manejador = new ProductManager(filePath);
const port = 8080;

app.use(express.urlencoded({extended:true}));



app.get('/products', async (req, res) => {

    const limit = req.query.limit; // Obtén el límite de productos desde los parámetros de consulta
  
    try {
        
        const productos = await manejador.getProducts();
  
      if (limit) {

        const productosLimitados = productos.slice(0, parseInt(limit));

        res.json(productosLimitados);

      } else {

        res.json(productos);

      }

    } catch (error) {

      res.status(500).json({ error: error.message });

    }
});

app.get('/products/:pid', async (req, res) => {

    const pid = req.params.pid;
  
    try {

      const producto = await manejador.getProductById(parseInt(pid));

      res.json(producto);

    } catch (error) {

      res.status(500).json({ error: error.message });
      
    }
  });



app.listen(port, ()=>{
    console.log(`El servidor esta escuchando en el puerto ${port}`)
});
