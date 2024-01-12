import messageModel from "../daos/models/message.model.js";
import * as messageServices from '../services/message.service.js';
import { io } from '../app.js';

//! Vista de mensajes en tiempo real
export const getRealTimeMessages = async (req, res) => {
    try {
        const messages = await messageServices.getRealTimeMessages();
        res.render("message", { 
            messages,
            style: 'chat.css',
            title: 'Mensajes en tiempo real',
        });
    } catch (error) {
        res.sendServerError(error);
    }
};

export const postRealTimeMessages = async (req, res) => {
    try {
        const newMessage = await messageServices.postRealTimeMessage(req.body);
        io.emit('message-received', newMessage);
    } catch (error) {
        res.sendServerError(error);
    }
};
//! Router de mensajes en tiempo real

export const getMessages = async (req, res) => {
    try {
        const messages = await messageServices.getMessages();
        res.sendSuccess(messages);
    } catch (error) {
        res.sendServerError(error);
    }
};

export const postMessage = async (req, res) => {
    try {
        const newMessage = await messageServices.postMessage(messageData);
        res.sendSuccess(newMessage);
    } catch (error) {
        res.sendServerError(error);
    }
};