import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();



mongoose.connect(process.env.mongo, {});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Connected to MongoDB');
    

});


export { mongoose, db };