import  messageModel  from '../daos/models/message.model.js';

export const getRealTimeMessagesFromDatabase = async () => {
    try {
        return await messageModel.find();
    } catch (error) {
        throw error;
    }
};

export const postRealTimeMessageToDatabase = async (messageData) => {
    try {
        const newMessage = new messageModel(messageData);
        await newMessage.save();
        return newMessage;
    } catch (error) {
        throw error;
    }
};

export const getMessagesFromDatabase = async () => {
    try {
        return await messageModel.find({});
    } catch (error) {
        throw error;
    }
};

export const postMessageToDatabase = async (messageData) => {
    try {
        const message = new messageModel(messageData);
        return await message.save();
    } catch (error) {
        throw error;
    }
};