import * as productService from '../services/product.service.js';
import * as ticketService from '../services/ticket.service.js';
import * as userService from '../services/user.service.js';
import moment from 'moment';


export const getTicketView = async (req, res) => {
    try {
        const latestTicket = await ticketService.getLatestTicket();
        const formattedAmount = latestTicket.amount.toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS'
        });
        const purchaser = await userService.getUserById(latestTicket.purchaser);
        const products = await productService.getProductsByIds(latestTicket.products);
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
    }
}

export async function createTicket(purchaseResult, userId) {

    const { purchasedProducts } = purchaseResult;
    const user = await userService.getUserById(userId);
    const ticketData = {
        code: await ticketService.generateUniqueTicketCode(),
        purchase_datetime: new Date(),
        amount: await ticketService.calculateTotalAmount(purchasedProducts),
        purchaser: user._id, 
    };
    const ticket = await ticketService.createTicket(ticketData);
  
    return ticket;
};
