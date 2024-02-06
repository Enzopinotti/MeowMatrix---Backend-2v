import productModel from "../models/product.model.js";

export default class ProductManager {
    constructor() {}

<<<<<<< HEAD
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
=======
    get = async () => {
        try {
            return await productModel.find();
        } catch (error) {
            return { status: "error", error: error.message }
        }
    }
    getView = async (page, limit, sort, query) => {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        try {
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: sort,
            };
            const result = await productModel.paginate(query, options);
<<<<<<< HEAD
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
=======
            return result;
        } catch (error) {
            console.log(error);
            return { status: "error", error: error.message }
        }
    }
    getById = async (id) => {
        try {
            return await productModel.findById(id);
        } catch (error) {
            return { status: "error", error: error.message }
        }
    }
    add = async (product) => {
        try {
            return await productModel.create(product);
        } catch (error) {
            return { status: "error", error: error.message }
        }
    }
    update = async (id, product) => {
        try {
            const updatedProduct = await productModel.findByIdAndUpdate(id, product, { new: true });
            if (!updatedProduct) {
                return { status: "error", error: "Producto no encontrado" };
            }
            return updatedProduct;
        } catch (error) {
            return { status: "error", error: `Error al actualizar el producto: ${error.message}` };
        }
    }
    delete = async (id) => {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        try {
            const existingProduct = await productModel.findById(id);
    
            if (!existingProduct) {
<<<<<<< HEAD
                reqLogger.error("En product.mongodb.js: delete - Producto no encontrado al intentar eliminar");
                return { status: "error", error: "Producto no encontrado" };
            }
    
            const deletedProduct = await productModel.findByIdAndDelete(id);
            reqLogger.debug("En product.mongodb.js: delete - Producto eliminado:", deletedProduct);
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
=======
                return { status: "error", error: "Producto no encontrado" };
            }
    
            return await productModel.findByIdAndDelete(id);
        } catch (error) {
            return { status: "error", error: `Error al eliminar el producto: ${error.message}` };
        }
    }

    getCount = async (query) => {
        try {
            return await productModel.countDocuments(query);
        } catch (error) {
            return { status: "error", error: error.message };
        }
    }

    checkProductStock = async (productId, quantity) => {
        try {
            const product = await productModel.findById(productId);
            if (!product) {
                return { status: "error", error: "Producto no encontrado" };
            }
            if (product.stock < quantity) {
                return false;
            }
            return true;
        } catch (error) {
            return { status: "error", error: `Error al verificar el stock del producto: ${error.message}` };
        }

    }

    updateProductStock = async (productId, quantity) => {
        try {
            const product = await productModel.findById(productId);
            if (!product) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
                return { status: "error", error: "Producto no encontrado" };
            }
            product.stock -= quantity;
            await product.save();
<<<<<<< HEAD
            reqLogger.debug(`En product.mongodb.js: updateProductStock - Stock del producto con ID ${productId} actualizado a ${product.stock}`);
            return product;
        } catch (error) {
            reqLogger.error(`En product.mongodb.js: updateProductStock - Error al actualizar stock del producto con ID ${productId}: ${error.message}`);
            throw error;
        }
    }
}
=======
            return product;
        } catch (error) {
            return { status: "error", error: `Error al actualizar el stock del producto: ${error.message}` };
        }
    

    }
    
}
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
