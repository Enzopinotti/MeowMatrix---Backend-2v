import mongoose from "mongoose";



const URL = "mongodb+srv://enzopinottii:wZXavXvgSpGRoHGO@cluster0.unxoxuh.mongodb.net/Ecommerce?retryWrites=true&w=majority";

mongoose.connect(URL)

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Connected to MongoDB');
    

});


export { mongoose, db };