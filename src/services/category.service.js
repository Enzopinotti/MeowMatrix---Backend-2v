import { CategoryDao } from "../daos/factory.js";

export const getCategories = async (reqLogger) => {
  try {
    const categories = await CategoryDao.get(reqLogger);
    reqLogger.debug("En category.service.js: getCategories - Categorías obtenidas.");
    return categories;
  } catch (error) {
    reqLogger.error("En category.service.js: getCategories - Error al obtener categorías:", error);
    throw error;
  }
};

export const getCategoriesView = async (page, limit, reqLogger) => {
  try {
    const categoriesResult = await CategoryDao.getView(page, limit, reqLogger); // Pasar page y limit a la capa de datos
    reqLogger.debug("En category.service.js: getCategories - Categorías obtenidas.");
    return categoriesResult;
  } catch (error) {
    reqLogger.error("En category.service.js: getCategories - Error al obtener categorías:", error);
    throw error;
  }
};

export const getCategory = async (categoryId, reqLogger) => {
  try {
    const category = await CategoryDao.getById(categoryId);
    reqLogger.debug("En category.service.js: getCategory - Categoría obtenida por ID:", category);
    return category;
  } catch (error) {
    reqLogger.error("En category.service.js: getCategory - Error al obtener categoría por ID:", error);
    throw error;
  }
}

export const postCategory = async (categoryData, reqLogger) => {
  try {
    const newCategory = await CategoryDao.add(categoryData, reqLogger);
    reqLogger.debug("En category.service.js: postCategory - Nueva categoría creada:", newCategory);
    return newCategory;
  } catch (error) {
    reqLogger.error("En category.service.js: postCategory - Error al crear nueva categoría:", error);
    throw error;
  }
};

export const putCategory = async (categoryId, categoryData, reqLogger) => {
  try {
    const updatedCategory = await CategoryDao.update(categoryId, categoryData);
    reqLogger.debug("En category.service.js: putCategory - Categoría actualizada:", updatedCategory);
    return updatedCategory;
  } catch (error) {
    reqLogger.error("En category.service.js: putCategory - Error al actualizar categoría:", error);
    throw error;
  }
};

export const deleteCategory = async (categoryId, reqLogger) => {
  try {
    const deletedCategory = await CategoryDao.delete(categoryId, reqLogger);
    reqLogger.debug("En category.service.js: deleteCategory - Categoría eliminada:", deletedCategory);
    return deletedCategory;
  } catch (error) {
    reqLogger.error("En category.service.js: deleteCategory - Error al eliminar categoría:", error);
    throw error;
  }
}
