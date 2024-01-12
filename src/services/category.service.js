import * as categoryPersistence from '../persistence/category.persistence.js';

export const getCategories = async () => {
  try {
    return await categoryPersistence.getCategoriesFromDatabase();
  } catch (error) {
    throw error;
  }
};

export const postCategory = async (categoryData) => {
  try {
    return await categoryPersistence.postCategoryToDatabase(categoryData);
  } catch (error) {
    throw error;
  }
};

export const putCategory = async (categoryId, categoryData) => {
  try {
    return await categoryPersistence.putCategoryToDatabase(
      categoryId,
      categoryData
    );
  } catch (error) {
    throw error;
  }
};