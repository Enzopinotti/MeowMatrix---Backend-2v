import mongoose from 'mongoose';

const ProductCollection = 'products';

const ProductSchema = new mongoose.Schema({
    
// acá van las propiedades de los usuarios en la base de datos

    name: { type: String, required: true },
    description: { type: String, required: false },
    price: { type: Number, required: true },
    code: { type: String, required: true, unique: true  },
    stock: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "categories" },
    thumbnails: {
        type: [
            {
                type: String,
            }
        ]
    },
    status: { type: Boolean, required: true, default: true },
    isVisible: {type: Boolean, required: true, default: true},
   
});

const productModel = mongoose.model(ProductCollection, ProductSchema);

export default productModel;