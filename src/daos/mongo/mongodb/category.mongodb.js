import categoryModel from "../models/category.model.js";

export default class CategoryManager {
    constructor() {}

    get = async (reqLogger) => {
        try {
            const categories = await categoryModel.find();
            reqLogger.debug("En category.mongodb.js: get - Categorías obtenidas");
            return categories;
        } catch (error) {
            reqLogger.error("En category.mongodb.js: get - Error al obtener categorías:", error);
            throw error;
        }
    }
    getView = async (page, limit, reqLogger) => {
        try {
          const options = {
            page: parseInt(page),
            limit: parseInt(limit),
          };
          const result = await categoryModel.paginate({}, options); 
          reqLogger.debug("En category.mongodb.js: getView - Vista de categorías obtenida.");
          return result;
        } catch (error) {
          reqLogger.error("En category.mongodb.js: getView - Error al obtener vista de categorías:", error.message);
          throw error;
        }
      };

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
            throw error;
        }
    }

    add = async (category, reqLogger) => {
        try {
            console.log('categoría antes de create: ', category)
            const newCategory = await categoryModel.create(category);
            reqLogger.debug("En category.mongodb.js: add - Nueva categoría creada:", newCategory);
            return { status: "success", payload: newCategory };
        } catch (error) {
            reqLogger.error("En category.mongodb.js: add - Error al crear nueva categoría:", error);
            throw error;
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
            throw error;
        }
    }
    delete = async (id, reqLogger) => {
        try {
            const deletedCategory = await categoryModel.findByIdAndDelete(id);
            if (!deletedCategory) {
                reqLogger.error("En category.mongodb.js: delete - Categoría no encontrada al intentar eliminar:", id);
                return { status: "error", error: "Category not found" };
            }
            reqLogger.debug("En category.mongodb.js: delete - Categoría eliminada:", deletedCategory);
            return { status: "success", payload: deletedCategory };
        } catch (error) {
            reqLogger.error("En category.mongodb.js: delete - Error al eliminar categoría:", error);
            throw error;
        }
    }
}
