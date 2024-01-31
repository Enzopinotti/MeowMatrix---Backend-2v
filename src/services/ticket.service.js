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

export const calculateTotalAmount = async (purchasedProducts) => {
    try {
      // Recorre los productos comprados y calcula el monto total
      let totalAmount = 0;
      for (const purchasedProduct of purchasedProducts) {
        // Obtén el producto desde la base de datos
        const product = await ProductDao.getById(purchasedProduct._id);
        if (product) {
          // Calcula el monto para este producto
          const productAmount = product.price * purchasedProduct.quantity;
          // Agrega el monto al sumador
          totalAmount += productAmount;
        }
      }
      return totalAmount;
    } catch (error) {
      console.error(`Error calculating total amount: ${error.message}`);
      throw new Error('Error calculating total amount');
    }
};



export const createTicket = async (ticketData) => {
    try {
      // Llamamos a la función create en TicketDao
      console.log('ticket antes de dto: ', ticketData);
      const Ticketdto = new TicketDto(ticketData);
      console.log('ticket antes de validate: ', Ticketdto);
      Ticketdto.validate();
      const ticketObject = Ticketdto.toObject();
      console.log('ticket despues de dto: ', ticketObject);
      const ticket = await TicketDao.create(ticketObject);
  
      return ticket;
    } catch (error) {
      // Maneja los errores según sea necesario
      console.error(`Error creating ticket: ${error.message}`);
      throw new Error('Error creating ticket');
    }
};

export const getLatestTicket = async () => {
  try {
      const lastTicket = await TicketDao.getLast();
      return lastTicket;
  } catch (error) {
      console.error(`Error al obtener el último ticket: ${error.message}`);
      throw new Error('Error al obtener el último ticket');
  }
};


 