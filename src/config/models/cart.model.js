import mongoose from 'mongoose';

const CartCollection = 'carts';

const CartSchema = new mongoose.Schema({
    // acá van las propiedades de los carritos en la base de datos
    products: {
        type: [
            {
                product: { 
                    type: mongoose.Schema.Types.ObjectId, 
                    ref: 'products'
                }, 
                quantity: Number
            }
        ]
    }
    
});

const cartModel = mongoose.model(CartCollection, CartSchema);

export default cartModel;