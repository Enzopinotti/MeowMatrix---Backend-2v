import * as productServices from "../services/product.service.js";


export const getProducts = async (req, res) => {
    try {
        const products = await productServices.getAllProducts();
        res.json(products);
      } catch (error) {
        console.log(error);
        res.sendServerError(error);
    }
}

export const getProductsView = async (req, res) => {

    const { page = 1, limit = 4, sort, query } = req.query;
    try {
      const { products, totalDocs } = await productServices.getProductsView(page, limit, sort, query);
  
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
      res.sendServerError(error);
    }
};

export const getProductByIdView  = async (req, res) => {
    const productId = req.params.productId;
    try {
        const product = await productServices.getProductsByIds(productId);
        
        if (!product) {
            return res.sendNotFound({ error: 'Producto no encontrado' });
        }

        // Renderizar la vista de detalles del producto y pasar la información
        res.render('details', {
            product: product,
            style: 'details.css',
            title: 'Detalles del producto',
            // Otros datos que quieras enviar a la vista
        });
    } catch (error) {
        res.sendServerError(error);
    }
};

export const getProductById  = async (req, res) => {
    const productId = req.params.productId;
    try {
        const product = await productServices.getProductsByIds(productId);
        if (!product) {
            return res.sendNotFound({ error: 'Producto no encontrado' });
        }
        res.sendSuccess(product);
        
    } catch (error) {
        res.sendServerError(error);
    }
}

export const updateProduct = async (req, res) => {
    const productId = req.params.pid;
    const newData = req.body;

    try {
        const updatedProduct = await productServices.updateProduct(productId, newData);

        if (!updatedProduct) {
            return res.sendNotFound({ message: 'Producto no encontrado' });
        }

        res.sendSuccess(updatedProduct);
    } catch (error) {
        res.sendServerError(error);
    }
};

export const deleteProduct = async (req, res) => {
    const productId = req.params.pid;
    try {
        const productEliminated = await productServices.deleteProduct(productId);

        if (!productEliminated) {
            return res.sendNotFound({ message: 'Producto no encontrado' });
        }

        res.sendSuccess(productEliminated);
    } catch (error) {
        res.sendServerError(error);
    }
};

export const createProduct = async (req, res) => {
    const productData = req.body;
    try {
        const addedProduct = await productServices.createProduct(productData);
        res.sendSuccess(addedProduct);
    } catch (error) {
        res.sendServerError(error);
    }
};