import categoryModel from "../models/category.model.js";

export default class CategoryManager {
    constructor() {}

    get = async (reqLogger) => {
        try {
            const categories = await categoryModel.find();
            reqLogger.debug("En category.mongodb.js: get - Categorías obtenidas");
            return { status: "success", payload: categories };
        } catch (error) {
            reqLogger.error("En category.mongodb.js: get - Error al obtener categorías:", error);
            return { status: "error", error: error.message };
        }
    }

    getById = async (id, reqLogger) => {
        try {
            const category = await categoryModel.findById(id);
            if (!category) {
                reqLogger.error("En category.mongodb.js: getById - Categoría no encontrada por ID:", id);
                return { status: "error", error: "Category not found" };
            }
            reqLogger.debug("En category.mongodb.js: getById - Categoría obtenida por ID:", category);
            return { status: "success", payload: category };
        } catch (error) {
            reqLogger.error("En category.mongodb.js: getById - Error al obtener categoría por ID:", error);
            return { status: "error", error: error.message };
        }
    }

    add = async (category, reqLogger) => {
        try {
            const newCategory = await categoryModel.create(category);
            reqLogger.debug("En category.mongodb.js: add - Nueva categoría creada:", newCategory);
            return { status: "success", payload: newCategory };
        } catch (error) {
            reqLogger.error("En category.mongodb.js: add - Error al crear nueva categoría:", error);
            return { status: "error", error: error.message };
        }
    }

    update = async (id, category, reqLogger) => {
        try {
            const updatedCategory = await categoryModel.findByIdAndUpdate(id, category, { new: true });
            if (!updatedCategory) {
                reqLogger.error("En category.mongodb.js: update - Categoría no encontrada al intentar actualizar:", id);
                return { status: "error", error: "Category not found" };
            }
            reqLogger.debug("En category.mongodb.js: update - Categoría actualizada:", updatedCategory);
            return { status: "success", payload: updatedCategory };
        } catch (error) {
            reqLogger.error("En category.mongodb.js: update - Error al actualizar categoría:", error);
            return { status: "error", error: error.message };
        }
    }
}
