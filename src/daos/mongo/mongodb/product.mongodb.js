import productModel from "../models/product.model.js";

export default class ProductManager {
    constructor() {}

    get = async (reqLogger) => {
        try {
            const products = await productModel.find();
            reqLogger.debug("En product.mongodb.js: get - Productos obtenidos de la base de datos");
            return products;
        } catch (error) {
            reqLogger.error("En product.mongodb.js: get - Error al obtener todos los productos:", error);
            throw error;
        }
    }

    getView = async (page, limit, sort, query, reqLogger) => {
        try {
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: sort,
            };
            const result = await productModel.paginate(query, options);
            reqLogger.debug("En product.mongodb.js: getView - Vista de productos obtenida");
            return result;
        } catch (error) {
            reqLogger.error("En product.mongodb.js: getView - Error al obtener vista de productos:", error.message);
            throw error;
        }
    }

    getById = async (id, reqLogger) => {
        try {
            const product = await productModel.findById(id);
            reqLogger.debug("En product.mongodb.js: getById - Producto obtenido por ID de la base de datos");
            return product;
        } catch (error) {
            reqLogger.error("En product.mongodb.js: getById - Error al obtener producto por ID:", error.message);
            throw error;
        }
    }

    getMy = async (userEmail, reqLogger) => {
        try {
            const products = await productModel.find({ owner: userEmail }).populate('category', 'nameCategory');
            reqLogger.debug("En product.mongodb.js: getMy - Productos por email obtenidos de la base de datos");
            return products;
        } catch (error) {
            reqLogger.error("En product.mongodb.js: getMy - Error al obtener productos de un usuario:", error.message);
            throw error;
        }
    }

    add = async (product, reqLogger) => {
        try {
            const addedProduct = await productModel.create(product);
            reqLogger.debug("En product.mongodb.js: add - Producto creado en la base de datos");
            return addedProduct;
        } catch (error) {
            reqLogger.error("En product.mongodb.js: add - Error al crear producto:", error.message);
            throw error;
        }
    }

    update = async (id, product, reqLogger) => {
        try {
            const updatedProduct = await productModel.findByIdAndUpdate(id, product, { new: true });
            if (!updatedProduct) {
                reqLogger.error("En product.mongodb.js: update - Producto no encontrado al intentar actualizar");
                throw new Error("Producto no encontrado");
            }
            reqLogger.debug("En product.mongodb.js: update - Producto actualizado:", updatedProduct);
            return updatedProduct;
        } catch (error) {
            reqLogger.error("En product.mongodb.js: update - Error al actualizar producto:", error.message);
            throw error;
        }
    }

    delete = async (id, reqLogger) => {
        try {
            const existingProduct = await productModel.findById(id);
    
            if (!existingProduct) {
                reqLogger.error("En product.mongodb.js: delete - Producto no encontrado al intentar eliminar");
                return { status: "error", error: "Producto no encontrado" };
            }
    
            const deletedProduct = await productModel.findByIdAndDelete(id);
            reqLogger.debug("En product.mongodb.js: delete - Producto eliminado.");
            return deletedProduct;
        } catch (error) {
            reqLogger.error("En product.mongodb.js: delete - Error al eliminar producto:", error.message);
            throw error;
        }
    }

    getCount = async (query, reqLogger) => {
        try {
            const count = await productModel.countDocuments(query);
            reqLogger.debug("En product.mongodb.js: getCount - Pasa por count");
            return count;
        } catch (error) {
            reqLogger.error("En product.mongodb.js: getCount - Error al obtener cantidad total de productos:", error.message);
            throw error;
        }
    }

    checkProductStock = async (productId, quantity, reqLogger) => {
        try {
            const product = await productModel.findById(productId);
            if (!product) {
                reqLogger.error("En product.mongodb.js: checkProductStock - Producto no encontrado al verificar stock");
                return { status: "error", error: "Producto no encontrado" };
            }
            const availableStock = product.stock >= quantity;
            reqLogger.debug(`En product.mongodb.js: checkProductStock - Stock disponible para el producto con ID ${productId}: ${availableStock}`);
            return availableStock;
        } catch (error) {
            reqLogger.error(`En product.mongodb.js: checkProductStock - Error al verificar stock del producto con ID ${productId}: ${error.message}`);
            throw error;
        }
    }

    updateProductStock = async (productId, quantity, reqLogger) => {
        try {
            const product = await productModel.findById(productId);
            if (!product) {
                reqLogger.error("En product.mongodb.js: updateProductStock - Producto no encontrado al actualizar stock");
                return { status: "error", error: "Producto no encontrado" };
            }
            product.stock -= quantity;
            await product.save();
            reqLogger.debug(`En product.mongodb.js: updateProductStock - Stock del producto con ID ${productId} actualizado a ${product.stock}`);
            return product;
        } catch (error) {
            reqLogger.error(`En product.mongodb.js: updateProductStock - Error al actualizar stock del producto con ID ${productId}: ${error.message}`);
            throw error;
        }
    }
}
