import messageModel from "../models/message.model.js";

export default class MessageManager {
    constructor() {}
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
        }
    }
}