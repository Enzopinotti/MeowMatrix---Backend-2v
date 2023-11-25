import mongoose from "mongoose";


const { Schema, model } = mongoose;

const messageCollection = "messages";
const messageSchema = new Schema({
    user: {type: String, required: true},
    message: {type: String, required: true}

});
const messageModel = model(messageCollection, messageSchema);

export default messageModel;