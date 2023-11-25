import mongoose from 'mongoose';

const userCollection = 'users';

const userSchema = new mongoose.Schema({
// acá van las propiedades de los usuarios en la base de datos
    name: String,//! Si solo se ponen dos puntos se define solo con dos puntos
    lastName: String,
    birthDate: Date,
    email:{
        type: String,
        unique: true,
        required: true

    },
    password: String,
    phone: String,
    avatar: String,

});

const userModel = mongoose.model(userCollection, userSchema);

export default userModel;