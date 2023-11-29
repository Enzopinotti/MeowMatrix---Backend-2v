import mongoose from "mongoose";


const { Schema, model } = mongoose;

const categoryCollection = "categories";
const categorySchema = new Schema({
    nameCategory: {type: String, required: true, index: true},
    isVisible: {type: Boolean, required: true, default: false},
    description: {type: String, required: true},

});
const categoryModel = model(categoryCollection, categorySchema);

export default categoryModel;