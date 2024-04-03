import * as categoryServices from '../services/category.service.js';

export const getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const reqLogger = req.logger;
    const categories = await categoryServices.getCategoriesView(page, limit, reqLogger); // Pasar page y limit al servicio
    req.logger.debug("En category.controller.js: getCategories - Categorías obtenidas.");
    res.sendSuccess(categories);
  } catch (error) {
    req.logger.error("En category.controller.js: getCategories - Error al obtener categorías.");
    res.sendServerError(error);
  }
};

export const getCategory = async (req, res) => {
  const categoryId = req.params.id;
  try {
    const category = await categoryServices.getCategory(categoryId);
    req.logger.debug("En category.controller.js: getCategory - Categoría obtenida por ID:", category);
    res.sendSuccess(category);
  } catch (error) {
    req.logger.error("En category.controller.js: getCategory - Error al obtener categoría por ID:", error);
    res.sendServerError(error);
  }
}

export const getRealTimeCategories = async (req, res) => {
  const reqLogger = req.logger;
  try {
    const categories = await categoryServices.getCategories(reqLogger);
    req.logger.debug("En category.controller.js: getRealTimeCategories - Categorías obtenidas.");
    res.render('realTimeCategories', { 
      categories,
      title: 'Categorías en tiempo real',
      style: 'realTimeCategories.css' ,
    }); 
  } catch (error) {
    req.logger.error("En category.controller.js: getRealTimeCategories - Error al obtener categorías:", error);
    res.sendServerError(error);
  }
    
}

export const postCategory = async (req, res) => {
  const categoryData = req.body;
  const reqLogger = req.logger;
  console.log(req.body)
  try {
    const newCategory = await categoryServices.postCategory(categoryData, reqLogger);
    req.logger.debug("En category.controller.js: postCategory - Nueva categoría creada:", newCategory);
    res.sendSuccess(newCategory);
  } catch (error) {
    req.logger.error("En category.controller.js: postCategory - Error al crear nueva categoría:", error);
    res.sendServerError(error);
  }
};

export const putCategory = async (req, res) => {
  const categoryId = req.params.id;
  const categoryData = req.body;
  const reqLogger = req.logger;
  try {
    const updatedCategory = await categoryServices.putCategory(
      categoryId,
      categoryData,
      reqLogger
    );
    req.logger.debug("En category.controller.js: putCategory - Categoría actualizada:", updatedCategory);
    res.sendSuccess(updatedCategory);
  } catch (error) {
    req.logger.error("En category.controller.js: putCategory - Error al actualizar categoría:", error);
    res.sendServerError(error);
  }
};

export const deleteCategory = async (req, res) => {
  const categoryId = req.params.id;
  const reqLogger = req.logger;
  console.log('entre a delete con id: ', categoryId)
  try {
    const deletedCategory = await categoryServices.deleteCategory(categoryId, reqLogger);
    req.logger.debug("En category.controller.js: deleteCategory - Categoría eliminada:", deletedCategory);
    res.sendSuccess(deletedCategory);
  } catch (error) {
    req.logger.error("En category.controller.js: deleteCategory - Error al eliminar categoría:", error);
    res.sendServerError(error);
  }
}
