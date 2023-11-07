import express from 'express';
import { __dirname } from '../utils.js';
export const viewsRouter = express.Router();
import { ProductManager } from '../ProductManager.js';
const filePath = 'archivos/productos.json';
const manager = new ProductManager(filePath);


viewsRouter.get('/', async (req, res) => {
    try {
        const products = await manager.getProducts(); // Obtén la lista de productos desde tu ProductManager
        res.render('home', { products });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

viewsRouter.get('/realTimeProducts', async (req, res) => {
    try {
        const products = await manager.getProducts(); // Obtén la lista de productos desde tu ProductManager
        res.render('realTimeProducts', { products });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

  
  
  
  
  
  
  
