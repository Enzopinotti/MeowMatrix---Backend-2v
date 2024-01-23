import productModel from "../models/product.model.js";

export default class ProductManager {
    constructor() {}

    get = async () => {
        try {
            return await productModel.find();
        } catch (error) {
            return { status: "error", error: error.message }
        }
    }
    getView = async (page, limit, sort, query) => {
        try {
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: sort,
            };
            const result = await productModel.paginate(query, options);
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
        try {
            const existingProduct = await productModel.findById(id);
    
            if (!existingProduct) {
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
                return { status: "error", error: "Producto no encontrado" };
            }
            product.stock -= quantity;
            await product.save();
            return product;
        } catch (error) {
            return { status: "error", error: `Error al actualizar el stock del producto: ${error.message}` };
        }
    

    }
    
}