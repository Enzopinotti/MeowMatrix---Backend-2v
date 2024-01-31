import mongoose from 'mongoose';

const userCollection = 'users';

const userSchema = new mongoose.Schema({
// acá van las propiedades de los usuarios en la base de datos
    name: {type: String, require:true},
    lastName: {type: String, require:true},
    email: {
        type: String,
        unique: true,
        require: true,
        index: true, // Agregar indexación al campo 'email'
    },
    password: {type: String , require:true}, //!sha512
    birthDate: {type: Date, require:true},
    phone: {type: String},
    avatar: {type: String},
    cart:{ type: mongoose.Schema.Types.ObjectId, ref: 'carts' },
    rol: {type: String, require:true, default:'usuario'},
});

const userModel = mongoose.model(userCollection, userSchema);

export default userModel;