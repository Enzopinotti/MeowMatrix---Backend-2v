import  categoryModel  from '../daos/models/category.model.js';

export const getCategoriesFromDatabase = async () => {
  try {
    return await categoryModel.find({ isVisible: true });
  } catch (error) {
    throw error;
  }
};

export const postCategoryToDatabase = async (categoryData) => {
  try {
    const category = new categoryModel(categoryData);
    return await category.save();
  } catch (error) {
    throw error;
  }
};

export const putCategoryToDatabase = async (categoryId, categoryData) => {
  try {
    const category = await categoryModel.findByIdAndUpdate(
      categoryId,
      categoryData,
      { new: true }
    );
    console.log(category)
    if (!category) {
      throw { message: 'Category not found' };
    }

    return category;
  } catch (error) {
    throw error;
  }
};