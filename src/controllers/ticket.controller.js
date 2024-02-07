import * as productService from '../services/product.service.js';
import * as ticketService from '../services/ticket.service.js';
import * as userService from '../services/user.service.js';
import moment from 'moment';


export const getTicketView = async (req, res) => {
    try {
        const reqLogger = req.logger;
        req.logger.debug('ticket.controller.js: getTicketView - Se inició')
        const latestTicket = await ticketService.getLatestTicket(reqLogger);
        const formattedAmount = latestTicket.amount.toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS'
        });
        const purchaser = await userService.getUserById(latestTicket.purchaser, reqLogger);
        const products = await productService.getProductsByIds(latestTicket.products, reqLogger);
        const purchaseDate = moment(latestTicket.purchase_datetime).format('DD/MM/YYYY HH:mm:ss');
        res.render('ticket', {
            ticket: latestTicket,
            purchaser,
            products,
            purchaseDate,
            formattedAmount,
            title: 'Ticket de Compra',
            style: 'ticket.css'
        });
        return; 
    } catch (error) {
        
    }
}

export const getTickets = async (req, res) => {
    try {
        const tickets = await ticketService.getTickets();
        res.sendSuccess(tickets);
    } catch (error) {
        res.sendServerError(error);
    }
}

export const getTicketByCode = async (req, res) => {
    try {
        const { ticketCode } = req.params;
        const ticket = await ticketService.getTicketByCode(ticketCode);
        res.sendSuccess(ticket);
    } catch (error) {
        res.sendServerError(error);
        throw error;
    }
}

export async function createTicket(purchaseResult, userId, reqLogger) {
    reqLogger.debug("TicketController: createTicket - pasó con: ", );
    try {
        const { purchasedProducts } = purchaseResult;
        const user = await userService.getUserById(userId, reqLogger);
        reqLogger.debug("TicketController: createTicket - Usuario encontrado por id para crear el ticket");
        const ticketData = {
            code: await ticketService.generateUniqueTicketCode(),
            purchase_datetime: new Date(),
            amount: await ticketService.calculateTotalAmount(purchasedProducts, reqLogger),
            purchaser: user._id, 
        };
        reqLogger.debug("TicketController: createTicket - ticket Creado");
        const ticket = await ticketService.createTicket(ticketData);
    
        return ticket;
    } catch (error) {
        reqLogger.error("TicketController: createTicket - Error Creando el Ticket: ", error);
        throw error;
    }
};
