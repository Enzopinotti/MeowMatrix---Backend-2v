import categoryModel from "../daos/models/category.model.js"
export const getCategories = async (req, res) => {
    try {
        const categories = await categoryModel.find({ isVisible: true });
        res.sendSuccess(categories);
    } catch (error) {
        res.sendServerError(error);
    }
};

export const postCategory = async (req, res) => {
    const category = new categoryModel(req.body);
    try {
        const newCategory = await category.save();
        res.sendSuccess(newCategory);
    } catch (error) {
        res.sendServerError(error);
    }
};

export const putCategory = async (req, res) => {
    try {
        const category = await categoryModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!category) {
            return res.sendNotFound('Category not found');
        }

        res.sendSuccess(category);
    } catch (error) {
        res.sendServerError(error);
    }
};