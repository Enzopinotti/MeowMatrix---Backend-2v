import categoryModel from "../models/category.model.js";


export default class CategoryManager {
    constructor() {}

    get = async () => {
        try {
            const categories = await categoryModel.find();
            return { status: "success", payload: categories }
        } catch (error) {
            return { status: "error", error: error.message }
        }
    }
    getById = async (id) => {
        try {
            const category = await categoryModel.findById(id);
            if (!category) {
                return { status: "error", error: "Category not found" }
            }
            return { status: "success", payload: category }
        } catch (error) {
            return { status: "error", error: error.message }
        }
    }
    add = async (category) => {
        try {
            const newCategory = await categoryModel.create(category);
            return { status: "success", payload: newCategory }
        } catch (error) {
            return { status: "error", error: error.message }
        }
    }
    update = async (id, category) => {
        try {
            const updatedCategory = await categoryModel.findByIdAndUpdate(id, category, { new: true });
            if (!updatedCategory) {
                return { status: "error", error: "Category not found" }
            }
            return { status: "success", payload: updatedCategory }
        } catch (error) {
            return { status: "error", error: error.message }
        }
    }
}