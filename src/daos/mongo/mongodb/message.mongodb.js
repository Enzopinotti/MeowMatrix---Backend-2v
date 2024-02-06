import messageModel from "../models/message.model.js";

export default class MessageManager {
    constructor() {}
    get = async (reqLogger) => {
        try {
            reqLogger.debug("En message.mongodb.js: get - Mensajes obtenidos.")
            return await messageModel.find();
        } catch (error) {
            reqLogger.error("En user.mongodb.js: Error al obtener usuario por ID:", error);
            throw error;
        }
    }
    add = async (message, reqLogger) => {
        try {
            reqLogger.debug("En message.mongodb.js: add - Mensaje creado:", message.author.username, message.text, message.date.toLocaleString())
            return await messageModel.create(message);
        } catch (error) {
            throw error;
        }
    }
}