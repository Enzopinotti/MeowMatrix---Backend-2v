import { CategoryDao } from "../daos/factory.js";



export const getCategories = async () => {
  try {
    return await CategoryDao.get();
  } catch (error) {
    throw error;
  }
};

export const getCategory = async (categoryId) => {
  try {
    return await CategoryDao.getById(categoryId);
  }catch (error) {
    throw error;
  }
}

export const postCategory = async (categoryData) => {
  try {
    return await CategoryDao.add(categoryData);
  } catch (error) {
    throw error;
  }
};

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