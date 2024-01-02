import mongoose from "mongoose";
import config from "../config/server.config.js";


mongoose.connect(config.mongoUrl, {});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Connected to MongoDB');
});


export { mongoose, db };