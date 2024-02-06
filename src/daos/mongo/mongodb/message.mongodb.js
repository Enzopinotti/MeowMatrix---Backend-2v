import messageModel from "../models/message.model.js";

export default class MessageManager {
    constructor() {}
<<<<<<< HEAD
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
=======
    get = async () => {
        try {
            return await messageModel.find();
        } catch (error) {
            return { status: "error", error: error.message }
        }
    }
    add = async (message) => {
        try {
            return await messageModel.create(message);
        } catch (error) {
            return { status: "error", error: error.message }
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        }
    }
}