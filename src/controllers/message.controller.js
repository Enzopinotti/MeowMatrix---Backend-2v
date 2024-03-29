import * as messageServices from '../services/message.service.js';

//! Vista de mensajes en tiempo real
export const getRealTimeMessages = async (req, res) => {
    try {
        const reqLogger = req.logger;
        const messages = await messageServices.getRealTimeMessages(reqLogger);
        req.logger.debug("En message.controller.js:  getRealTimeMessages - Vista de mensajes obtenida con exito.");
        res.render("message", { 
            messages,
            style: 'chat.css',
            title: 'Mensajes en tiempo real',
        });
    } catch (error) {
        req.logger.error("En message.controller.js: getRealTimeMessages - Error al obtener la vista de mensajes: ", error);
        res.sendServerError(error);
    }
};

export const postRealTimeMessages = async (req, res) => {
    try {
        const reqLogger = req.logger;
        const newMessage = await messageServices.postRealTimeMessage(req.body, reqLogger);
        req.logger.debug("En message.controller.js:  postRealTimeMessages - Nuevo mensaje obtenido con exito: ", newMessage);
    } catch (error) {
        req.logger.error("En message.controller.js: postRealTimeMessages - Error al obtener la vista de mensajes: ", error);
        res.sendServerError(error);
    }
};
//! Router de mensajes en tiempo real

export const getMessages = async (req, res) => {
    try {
        const reqLogger = req.logger;
        const messages = await messageServices.getMessages(reqLogger);
        req.logger.debug("En message.controller.js:  getMessages - Mensajes obtenidos con exito.");
        res.sendSuccess(messages);
    } catch (error) {
        req.logger.error("En message.controller.js:  getMessages - Error al obtener los mensajes");
        res.sendServerError(error);
    }
};

export const postMessage = async (req, res) => {
    try {
        const newMessage = await messageServices.postMessage(messageData);
        req.logger.debug("En message.controller.js:  postMessage - Mensajes creado con exito: ", newMessage);
        res.sendSuccess(newMessage);
    } catch (error) {
        req.logger.error("En message.controller.js:  postMessage - Error al crear el mensaje: ", error);
        res.sendServerError(error);
    }
};