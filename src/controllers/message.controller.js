import * as messageServices from '../services/message.service.js';
import { io } from '../app.js';

//! Vista de mensajes en tiempo real
export const getRealTimeMessages = async (req, res) => {
    try {
<<<<<<< HEAD
        const reqLogger = req.logger;
        const messages = await messageServices.getRealTimeMessages(reqLogger);
        req.logger.debug("En message.controller.js:  getRealTimeMessages - Vista de mensajes obtenida con exito.");
=======
        const messages = await messageServices.getRealTimeMessages();
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        res.render("message", { 
            messages,
            style: 'chat.css',
            title: 'Mensajes en tiempo real',
        });
    } catch (error) {
<<<<<<< HEAD
        req.logger.error("En message.controller.js: getRealTimeMessages - Error al obtener la vista de mensajes: ", error);
=======
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        res.sendServerError(error);
    }
};

export const postRealTimeMessages = async (req, res) => {
    try {
<<<<<<< HEAD
        const reqLogger = req.logger;
        const newMessage = await messageServices.postRealTimeMessage(req.body, reqLogger);
        req.logger.debug("En message.controller.js:  postRealTimeMessages - Nuevo mensaje obtenido con exito: ", newMessage);
        io.emit('message-received', newMessage);
    } catch (error) {
        req.logger.error("En message.controller.js: postRealTimeMessages - Error al obtener la vista de mensajes: ", error);
=======
        const newMessage = await messageServices.postRealTimeMessage(req.body);
        io.emit('message-received', newMessage);
    } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        res.sendServerError(error);
    }
};
//! Router de mensajes en tiempo real

export const getMessages = async (req, res) => {
    try {
<<<<<<< HEAD
        const reqLogger = req.logger;
        const messages = await messageServices.getMessages(reqLogger);
        req.logger.debug("En message.controller.js:  getMessages - Mensajes obtenidos con exito.");
        res.sendSuccess(messages);
    } catch (error) {
        req.logger.error("En message.controller.js:  getMessages - Error al obtener los mensajes");
=======
        const messages = await messageServices.getMessages();
        res.sendSuccess(messages);
    } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        res.sendServerError(error);
    }
};

export const postMessage = async (req, res) => {
    try {
        const newMessage = await messageServices.postMessage(messageData);
<<<<<<< HEAD
        req.logger.debug("En message.controller.js:  postMessage - Mensajes creado con exito: ", newMessage);
        res.sendSuccess(newMessage);
    } catch (error) {
        req.logger.error("En message.controller.js:  postMessage - Error al crear el mensaje: ", error);
=======
        res.sendSuccess(newMessage);
    } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        res.sendServerError(error);
    }
};