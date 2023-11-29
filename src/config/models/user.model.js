import mongoose from 'mongoose';

const userCollection = 'users';

const userSchema = new mongoose.Schema({
// acá van las propiedades de los usuarios en la base de datos
    name: {type: String, require:true},
    lastName: {type: String, require:true},
    birthDate: {type: Date, require:true},
    email: {
        type: String,
        unique: true,
        required: true,
        index: true, // Agregar indexación al campo 'email'
    },
    password: {type: String},
    phone: {type: String},
    avatar: {type: String},
    rol: {type: String},

});

const userModel = mongoose.model(userCollection, userSchema);

export default userModel;