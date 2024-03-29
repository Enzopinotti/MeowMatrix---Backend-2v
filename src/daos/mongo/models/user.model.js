import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

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
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    cart:{ type: mongoose.Schema.Types.ObjectId, ref: 'carts'},
    rol: {type: String, require:true, default:'usuario'},
    documents: [{
        name: { type: String },
        reference: { type: String },
        reason: { type: String },
    }],
    last_connection: {type: Date, require:true},
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'products', default:[]}],
    wantPremium: {type: Boolean, require:true, default:false},
});

userSchema.plugin(mongoosePaginate)

const userModel = mongoose.model(userCollection, userSchema);

export default userModel;