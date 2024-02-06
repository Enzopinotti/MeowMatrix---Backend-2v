import mongoose from "mongoose";


const { Schema, model } = mongoose;

const messageCollection = "messages";
const messageSchema = new Schema({
    user: {type: String, required: true, index: true},
    message: {type: String, required: true},
    createdAt: {type: Date, default: Date.now}

});
const messageModel = model(messageCollection, messageSchema);

export default messageModel;