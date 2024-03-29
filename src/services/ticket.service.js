import { v4 as uuidv4 } from 'uuid';
import { TicketDao } from '../daos/factory.js';
import { ProductDao } from '../daos/factory.js';
import { CartDao } from '../daos/factory.js';
import  TicketDto  from '../daos/DTOs/ticket.dto.js';


export const getTickets = async () => {
    try {
        const tickets = await TicketDao.get();
        return tickets;
    } catch (error) {
        console.error(`Error getting tickets: ${error.message}`);
        throw new Error('Error getting tickets');
    }
}

export const getTicketByCode = async (ticketCode) => {
    try {
        const ticket = await TicketDao.getByCode(ticketCode);
        return ticket;
    } catch (error) {
        console.error(`Error getting ticket by code: ${error.message}`);
        throw new Error('Error getting ticket by code');
    }
}

export const generateUniqueTicketCode = async () => {
    try {
        
        const ticketCode = uuidv4();
        const ticket = await TicketDao.getByCode(ticketCode);
        if (ticket) {
            return generateUniqueTicketCode();
        }
        return ticketCode;   
    } catch (error) {
        
    }
};

export const calculateTotalAmount = async (purchasedProducts, reqLogger) => {
    try {
      // Recorre los productos comprados y calcula el monto total
      let totalAmount = 0;
      reqLogger.debug("Ticket.service.js: calculateTotalAmount - Pasó.");
      for (const purchasedProduct of purchasedProducts) {
        // Obtén el producto desde la base de datos
        const product = await ProductDao.getById(purchasedProduct._id, reqLogger);
        if (product) {
          // Calcula el monto para este producto
          const productAmount = product.price * purchasedProduct.quantity;
          // Agrega el monto al sumador
          totalAmount += productAmount;
        }
      }
      reqLogger.debug("Ticket.service.js: calculateTotalAmount - terminó.");
      return totalAmount;
    } catch (error) {
      throw new Error('Error calculating total amount');
    }
};



export const createTicket = async (ticketData) => {
    try {
      // Llamamos a la función create en TicketDao
      
      const Ticketdto = new TicketDto(ticketData);
     
      Ticketdto.validate();
      const ticketObject = Ticketdto.toObject();
      
      const ticket = await TicketDao.create(ticketObject);
  
      return ticket;
    } catch (error) {
      // Maneja los errores según sea necesario
      console.error(`Error creating ticket: ${error.message}`);
      throw new Error('Error creating ticket');
    }
};

export const getUserTicket = async (userId, reqLogger) => {
  try {
      const userTicket = await TicketDao.getByUserId(userId);
      reqLogger.debug("Ticket.service.js: getUserTicket - Pasó. ");
      return userTicket;
  } catch (error) {
      throw new Error('Error al obtener el ticket del usuario');
  }
}


export const getLatestTicket = async (reqLogger) => {
  try {
      const lastTicket = await TicketDao.getLast(reqLogger);
      reqLogger.debug("Ticket.service.js: getLatestTicket - Pasó con: ", lastTicket);
      return lastTicket;
  } catch (error) {
      throw new Error('Error al obtener el último ticket');
  }
};


 