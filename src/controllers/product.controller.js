import * as productServices from "../services/product.service.js";
import * as categoryServices from '../services/category.service.js';
import config from '../config/server.config.js';
import jwt from 'jsonwebtoken';
import { obtenerTokenDeCookie } from "../utils.js";
import fs from 'fs';
import path from 'path';


const PRIVATE_KEY = config.tokenKey;

export const getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 12, sort, query } = req.query;
        const reqLogger = req.logger;
        const { products, totalDocs } = await productServices.getProductsView(page, limit, sort, query, reqLogger);
        
        reqLogger.debug("product.controller.js: getProducts - productos obtenidos correctamente");
        
        res.sendSuccess({
            products,
            
        });
    } catch (error) {
        req.logger.error("product.controller.js: getProducts - Error al obtener productos:", error);
        res.sendServerError(error.message);
    }
}

export const getProductsView = async (req, res) => {
    const { page = 1, limit = 8, sort, query } = req.query;
    try {
        const reqLogger = req.logger;
        
        const { products, totalDocs } = await productServices.getProductsView(page, limit, sort, query, reqLogger);
        
        req.logger.debug("product.controller.js: getProductsView - Vista de productos obtenida");
        
        // Resto del código para manejar la respuesta y renderizar la vista
        const user = req.user;
        res.render('products', {
            products: products.docs,
            totalPages: products.totalPages,
            currentPage: products.page,
            hasNextPage: products.hasNextPage,
            hasPrevPage: products.hasPrevPage,
            prevLink: products.prevPage ? `/products?page=${products.prevPage}&limit=${limit}` : null,
            nextLink: products.nextPage ? `/products?page=${products.nextPage}&limit=${limit}` : null,
            totalDocs: totalDocs,
            style: 'products.css',
            title: 'Productos',
            user: user
        });
    } catch (error) {
        req.logger.error("product.controller.js: getProductsView - Error al obtener la vista de productos:", error);
        res.sendServerError(error.message);
    }
};

export const getProductByIdView  = async (req, res) => {
    const productId = req.params.productId;
    const reqLogger = req.logger;
    try {
        const product = await productServices.getProductsByIds(productId, reqLogger);
        
        if (!product) {
            req.logger.warn("product.controller.js: getProductByIdView - Producto no encontrado con ID:", productId);
            return res.sendNotFound({ error: 'Producto no encontrado' });
        }

        req.logger.debug("product.controller.js: getProductByIdView - Vista de detalles del producto obtenida");
        const user = req.user;
        // Renderizar la vista de detalles del producto y pasar la información
        res.render('details', {
            product: product,
            user: user,
            style: 'details.css',
            title: 'Detalles del producto',
            // Otros datos que quieras enviar a la vista
        });
    } catch (error) {
        req.logger.error("product.controller.js: getProductByIdView - Error al obtener detalles del producto:", error);
        res.sendServerError(error.message);
    }
};

export const getMyProductsView = async (req, res) => {
    const reqLogger = req.logger;
    const user = req.user;
    try {
        const products = await productServices.getMyProducts(user.email, reqLogger);
        console.log('productos por usuario: ', products)
        req.logger.debug("product.controller.js: getMyProductsView - Vista de mis productos obtenida");
        res.render('myProducts', {
            products: products,
            style: 'myProducts.css',
            title: 'Mis productos',
            user: user
        });
    }
    catch (error) {
        req.logger.error("product.controller.js: getMyProductsView - Error al obtener la vista de mis productos:", error);
        res.sendServerError(error.message);
    }

}

export const getEditProductView = async (req, res) => {
    const productId = req.params.productId;
    const reqLogger = req.logger;
    try {
        const product = await productServices.getProductsByIds(productId, reqLogger);
        const categories = await categoryServices.getCategories(reqLogger);
        if (!product) {
            req.logger.warn("product.controller.js: getEditProductView - Producto no encontrado con ID:", productId);
            return res.sendNotFound({ error: 'Producto no encontrado' });
        }
        req.logger.debug("product.controller.js: getEditProductView - Vista de edición de producto obtenida");
        console.log('categorias: ', categories)
        res.render('editProduct', {
            product: product,
            style: 'editProduct.css',
            title: 'Editar producto',
            user: req.user,
            categories: categories.payload,
        });
        
    } catch (error) {
        
    }
}

export const getProductCreateView = async (req, res) => {
    const reqLogger = req.logger;
    try {
        const user = req.user;
        const categories = await categoryServices.getCategories(reqLogger);
        req.logger.debug("product.controller.js: getProductCreateView - Vista de creación de producto obtenida");
        res.render('createProduct', {
            style: 'createProduct.css',
            title: 'Crear producto',
            user: user,
            categories: categories,
        });
    }catch (error) {
        req.logger.error("product.controller.js: getProductCreateView - Error al obtener la vista de creación de producto:", error);
        res.sendServerError(error);
    }

}

export const getMyProducts = async (req, res) => {
    const reqLogger = req.logger;
    const token = obtenerTokenDeCookie(req.headers.cookie);
    const decoded = jwt.verify(token, PRIVATE_KEY);
    const user = decoded.user
    try {
        const products = await productServices.getMyProducts(user.email, reqLogger);
        req.logger.debug("product.controller.js: getMyProducts - Productos obtenidos por usuario");
        res.sendSuccess(products);
    } catch (error) {
        req.logger.error("product.controller.js: getMyProducts - Error al obtener productos por usuario:", error);
        res.sendServerError(error.message);
    }
}

export const getProductById  = async (req, res) => {
    const productId = req.params.productId;
    const reqLogger = req.logger;
    
    try {
        const product = await productServices.getProductsByIds(productId, reqLogger);
        if (!product) {
            req.logger.warn("product.controller.js: getProductById - Producto no encontrado con ID:", productId);
            return res.sendNotFound({ error: 'Producto no encontrado' });
        }
        req.logger.debug("product.controller.js: getProductById - Producto obtenido por ID.");
        res.sendSuccess(product);
    } catch (error) {
        req.logger.error("product.controller.js: getProductById - Error al obtener producto por ID:", error);
        res.sendServerError(error.message);
    }
}

export const createProduct = async (req, res) => {
    console.log('entre')
    const productData = req.body;
    const reqLogger = req.logger;
    const token = obtenerTokenDeCookie(req.headers.cookie);
    const decoded = jwt.verify(token, PRIVATE_KEY);
    const user = decoded.user

    if (!req.file) {
        req.logger.error("En user.controller.js: uploadAvatar - No se ha seleccionado ningún archivo al subir el avatar");
        return res.sendUserError('No se ha seleccionado ningún archivo.');
    }
    if(user.rol = 'admin'){
        productData.owner = 'admin';
    }else{
        productData.owner = user.email;
    }
    console.log('files: ', req.file)
    const productImg = `/img/products/${req.file.filename}`;

    if (!productData.thumbnails) {
        productData.thumbnails = [productImg];
    } else {
        productData.thumbnails.push(productImg);
    }
    try {
        const addedProduct = await productServices.createProduct(productData, reqLogger);
        req.logger.debug("product.controller.js: createProduct - Producto creado con exito.");
        res.sendSuccess(addedProduct);
    } catch (error) {
        req.logger.error("product.controller.js: createProduct - Error al crear producto:", error);
        res.sendServerError(error.message);
    }
};

export const updateProduct = async (req, res) => {
    const productId = req.params.pid;
    const newData = req.body;
    const reqLogger = req.logger;
    try {
        const updatedProduct = await productServices.updateProduct(productId, newData, reqLogger);
        if (!updatedProduct) {
            req.logger.warn("product.controller.js: updateProduct - Producto no encontrado para actualizar con ID:", productId);
            return res.sendNotFound({ message: 'Producto no encontrado' });
        }
        req.logger.debug("product.controller.js: updateProduct - Producto actualizado con exito.");
        res.sendSuccess(updatedProduct);
    } catch (error) {
        req.logger.error("product.controller.js: updateProduct - Error al actualizar producto:", error);
        res.sendServerError(error.message);
    }
};

export const deleteProduct = async (req, res) => {
    const productId = req.params.pid;
    const reqLogger = req.logger;
    
    try {
        const product = await productServices.getProductsByIds(productId, reqLogger);

        if (!product) {
            reqLogger.warn("product.controller.js: deleteProduct - Producto no encontrado para eliminar con ID:", productId);
            return res.sendNotFound({ message: 'Producto no encontrado' });
        }

        // Verificar si el producto pertenece a un usuario premium
        if (product.owner !== 'admin') {
            // Producto pertenece a un usuario, enviar correo electrónico al usuario premium
            await sendProductDeletionEmail(product.owner, product.name);
        }

        const productEliminated = await productServices.deleteProduct(productId, reqLogger);

        reqLogger.debug("product.controller.js: deleteProduct - Producto eliminado con exito.");
        res.sendSuccess(productEliminated);
    } catch (error) {
        reqLogger.error("product.controller.js: deleteProduct - Error al eliminar producto:", error);
        res.sendServerError(error.message);
    }
};

