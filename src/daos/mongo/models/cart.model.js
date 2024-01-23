import mongoose from 'mongoose';

const CartCollection = 'carts';

const CartSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'users', // Asumiendo que tu modelo de usuario se llama 'users'
        index: true
    },
    products: {
        type: [
            {
                product: { 
                    type: mongoose.Schema.Types.ObjectId, 
                    ref: 'products',
                    index: true
                }, 
                quantity: Number,
                updatedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        default: []
    }
});

CartSchema.pre('findOne', function(next) {
    this.populate('products.product', '-createdAt -updatedAt -__v');
    next();
});

const cartModel = mongoose.model(CartCollection, CartSchema);

export default cartModel;