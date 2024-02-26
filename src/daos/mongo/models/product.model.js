import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const ProductCollection = 'products';

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: false },
    price: { type: Number, required: true },
    code: { type: String, required: true, unique: true, index: true  },
    stock: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "categories", index: true  },
    thumbnails: {
        type: [
            {
                type: String,
            }
        ]
    },
    status: { type: Boolean, required: true, default: true },
    isVisible: {type: Boolean, required: true, default: true},
    tags: [String], // Campo para palabras clave
    owner: { type: String, required: true, default: 'admin' },
    createdAt: {
        type: Date,
        default: Date.now // Esto establecerá la fecha actual automáticamente al crear un producto
    },
    updatedAt: {
        type: Date,
        default: Date.now // Esto establecerá la fecha actual automáticamente al actualizar un producto
    }
});

ProductSchema.pre('save', function(next) {
    this.updatedAt = Date.now(); // Actualiza el campo 'updatedAt' cada vez que se guarda el producto
    next();
});
// Middleware para poblar la categoría al buscar un producto por ID
ProductSchema.pre('findOne', function(next) {
    this.populate('category');
    next();
});

ProductSchema.plugin(mongoosePaginate);
const productModel = mongoose.model(ProductCollection, ProductSchema);

export default productModel;