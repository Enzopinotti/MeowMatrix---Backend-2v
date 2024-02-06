import mongoose from 'mongoose';

const TicketCollection = 'tickets';

const TicketSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: true,
        default: () => {
            // Generar código único para cada ticket (puedes ajustar la lógica según sea necesario)
            return `TICKET_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        },
    },
    purchase_datetime: {
        type: Date,
        default: Date.now,
    },
    amount: {
        type: Number,
        required: true,
    },
    purchaser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
});

const ticketModel = mongoose.model(TicketCollection, TicketSchema);

export default ticketModel;