import messageModel from "../daos/models/message.model.js";


//! Vista de mensajes en tiempo real
export const getRealTimeMessages = async (req, res) => {
    try {
        const messages = await messageModel.find();
        res.sendSuccess({ messages });
    } catch (error) {
        res.sendServerError(error);
    }
};

export const postRealTimeMessages = async (req, res) => {
    try {
        const newMessage = new messageModel(req.body);
        await newMessage.save();
        io.emit('message-received', newMessage);
        res.sendSuccess(newMessage);
    } catch (error) {
        res.sendServerError(error);
    }
};
//! Router de mensajes en tiempo real

export const getMessages = async (req, res) => {
    try {
        const messages = await messageModel.find({});
        res.sendSuccess(messages);
    } catch (error) {
        res.sendServerError(error);
    }
};

export const postMessage = async (req, res) => {
    const message = new messageModel(req.body);
    try {
        const newMessage = await message.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.sendServerError(error);
    }
};