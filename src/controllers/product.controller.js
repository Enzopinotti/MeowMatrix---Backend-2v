import * as productServices from "../services/product.service.js";

export const getProducts = async (req, res) => {
    try {
        const reqLogger = req.logger;
        const products = await productServices.getAllProducts(reqLogger);
        req.logger.debug("product.controller.js: getProducts - productos obtenidos correctamente");
        res.sendSuccess(products);
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
        console.log('usuario: ', user)
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
    const productData = req.body;
    const reqLogger = req.logger;
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
        const productEliminated = await productServices.deleteProduct(productId, reqLogger);

        if (!productEliminated) {
            req.logger.warn("product.controller.js: deleteProduct - Producto no encontrado para eliminar con ID:", productId);
            return res.sendNotFound({ message: 'Producto no encontrado' });
        }

        req.logger.debug("product.controller.js: deleteProduct - Producto eliminado con exito.");
        res.sendSuccess(productEliminated);
    } catch (error) {
        req.logger.error("product.controller.js: deleteProduct - Error al eliminar producto:", error);
        res.sendServerError(error.message);
    }
};

