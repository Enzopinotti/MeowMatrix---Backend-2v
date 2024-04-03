import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

const { Schema, model } = mongoose;

const categoryCollection = "categories";
const categorySchema = new Schema({
    nameCategory: {type: String, required: true, index: true},
    isVisible: {type: Boolean, required: true, default: true},
    createdAt: {type: Date, required: true, default: Date.now},
    description: {type: String, required: true},

});
categorySchema.plugin(mongoosePaginate);
const categoryModel = model(categoryCollection, categorySchema);

export default categoryModel;