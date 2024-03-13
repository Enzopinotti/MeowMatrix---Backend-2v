import * as categoryServices from '../services/category.service.js';

export const getCategories = async (req, res) => {
  try {
    const reqLogger = req.logger;
    const categories = await categoryServices.getCategories(reqLogger);
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
  try {
    const newCategory = await categoryServices.postCategory(categoryData);
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
  try {
    const updatedCategory = await categoryServices.putCategory(
      categoryId,
      categoryData
    );
    req.logger.debug("En category.controller.js: putCategory - Categoría actualizada:", updatedCategory);
    res.sendSuccess(updatedCategory);
  } catch (error) {
    req.logger.error("En category.controller.js: putCategory - Error al actualizar categoría:", error);
    res.sendServerError(error);
  }
};
