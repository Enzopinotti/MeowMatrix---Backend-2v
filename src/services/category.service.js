import { CategoryDao } from "../daos/factory.js";

<<<<<<< HEAD
export const getCategories = async (reqLogger) => {
  try {
    const categories = await CategoryDao.get();
    reqLogger.debug("En category.service.js: getCategories - Categorías obtenidas:", categories);
    return categories;
  } catch (error) {
    reqLogger.error("En category.service.js: getCategories - Error al obtener categorías:", error);
=======


export const getCategories = async () => {
  try {
    return await CategoryDao.get();
  } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    throw error;
  }
};

<<<<<<< HEAD
export const getCategory = async (categoryId, reqLogger) => {
  try {
    const category = await CategoryDao.getById(categoryId);
    reqLogger.debug("En category.service.js: getCategory - Categoría obtenida por ID:", category);
    return category;
  } catch (error) {
    reqLogger.error("En category.service.js: getCategory - Error al obtener categoría por ID:", error);
=======
export const getCategory = async (categoryId) => {
  try {
    return await CategoryDao.getById(categoryId);
  }catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    throw error;
  }
}

<<<<<<< HEAD
export const postCategory = async (categoryData, reqLogger) => {
  try {
    const newCategory = await CategoryDao.add(categoryData);
    reqLogger.debug("En category.service.js: postCategory - Nueva categoría creada:", newCategory);
    return newCategory;
  } catch (error) {
    reqLogger.error("En category.service.js: postCategory - Error al crear nueva categoría:", error);
=======
export const postCategory = async (categoryData) => {
  try {
    return await CategoryDao.add(categoryData);
  } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    throw error;
  }
};

<<<<<<< HEAD
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
=======
export const putCategory = async (categoryId, categoryData) => {
  try {
    return await CategoryDao.update(
      categoryId,
      categoryData
    );
  } catch (error) {
    throw error;
  }
};
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
