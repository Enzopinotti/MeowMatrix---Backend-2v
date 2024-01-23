

class TicketDTO {
    constructor(ticketData) {
        this.code = ticketData.code;
        this.purchase_datetime = ticketData.purchase_datetime;
        this.amount = ticketData.amount;
        this.purchaser = ticketData.purchaser;
    }
    validate(){
        if(!this.code || !this.purchase_datetime || !this.amount || !this.purchaser) throw new Error("Faltan datos para el ticket")
        if(typeof this.code !== "string" || typeof this.amount !== "number") throw new Error("Invalid data")
    }
    toObject() {
        return {
            code: this.code,
            purchase_datetime: this.purchase_datetime,
            amount: this.amount,
            purchaser: this.purchaser
        };
    }

}

export default TicketDTO;