import * as categoryServices from '../services/category.service.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await categoryServices.getCategories();
    res.sendSuccess(categories);
  } catch (error) {
    res.sendServerError(error);
  }
};

export const getCategory = async (req, res) => {
  const categoryId = req.params.id;
  try {
    const category = await categoryServices.getCategory(categoryId);
    res.sendSuccess(category);
  } catch (error) {
    res.sendServerError(error);
  }
}

export const postCategory = async (req, res) => {
  const categoryData = req.body;
  try {
    const newCategory = await categoryServices.postCategory(categoryData);
    res.sendSuccess(newCategory);
  } catch (error) {
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
    res.sendSuccess(updatedCategory);
  } catch (error) {
    res.sendServerError(error);
  }
};