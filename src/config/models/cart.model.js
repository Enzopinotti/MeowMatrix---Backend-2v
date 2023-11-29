import mongoose from 'mongoose';

const CartCollection = 'carts';

const CartSchema = new mongoose.Schema({
    // acá van las propiedades de los carritos en la base de datos
    products: {
        type: [
            {
                product: { 
                    type: mongoose.Schema.Types.ObjectId, 
                    ref: 'products',
                    index: true
                }, 
                quantity: Number,
                //ahora agrego un campo donde veo cuando se actualizó
                updatedAt: {
                    type: Date,
                    default: Date.now // Esto establecerá la fecha actual automáticamente al crear o actualizar un carrito
                }
            }
            
        ],
        default: [] // Esto establecerá un array vacío por defecto al crear un carrito
    }
});

// Modificamos la consulta al buscar un carrito para obtener los detalles completos de los productos
CartSchema.pre('findOne', function(next) {
    this.populate('products.product', '-createdAt -updatedAt -__v'); // Poblamos los productos con sus detalles excepto algunos campos
    next();
});

const cartModel = mongoose.model(CartCollection, CartSchema);

export default cartModel;