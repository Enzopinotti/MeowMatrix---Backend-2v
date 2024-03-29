import ticketModel from "../models/ticket.model.js";

export default class ProductManager {
    constructor() {}

    get = async () => {
        try {
            const tickets = await ticketModel.find();
            return tickets;
        } catch (error) {
            return { status: "error", error: error.message }
        }
    }
    getByUserId = async (userId) => {
        try {
            const tickets = await ticketModel.find({ purchaser:userId });
            return tickets;
        } catch (error) {
            return { status: "error", error: error.message }
        }
    }
    getByCode = async (code) => {
        try {
            const ticket = await ticketModel.findOne({ code });
            return ticket;
        } catch (error) {
            return { status: "error", error: error.message }
        }
    }
    create = async (ticketData) => {
        try {
            const ticket = await ticketModel.create(ticketData);
            return ticket;   
        } catch (error) {
            return { status: "error", error: error.message }
        }
    }
    getByCode = async (code) => {
        try {
            const ticket = await ticketModel.findOne({ code });
            return ticket;
        } catch (error) {
            return { status: "error", error: error.message }
        }
    }
    getLast = async (reqLogger) => {
        try {
            // Busca el último ticket en la base de datos
            const lastTicket = await ticketModel.findOne().sort({ _id: -1 }).limit(1);
            reqLogger.debug("ticket.mongodb.js: getLast - Ticket obtenido.");
            return lastTicket;
        } catch (error) {
            throw error;
        }
    };
}