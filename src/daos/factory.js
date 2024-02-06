import config from "../config/server.config.js"
import { connectDB } from "./mongo.database.js";



export let CartDao;

export let ProductDao;

export let MessageDao;

export let UserDao;

export let CategoryDao;

export let RealTimeProductsDao;

export let sessionDao;

export let TicketDao;

export let MockDao;

switch (config.persistence) {
    case "MONGO":
        
        await connectDB();
      
        
        const { default: CartManagerMongo } = await import("./mongo/mongodb/cart.mongodb.js");
        const { default: ProductManagerMongo } = await import("./mongo/mongodb/product.mongodb.js");
        const { default: MessageManagerMongo } = await import("./mongo/mongodb/message.mongodb.js");
        const { default: UserManagerMongo } = await import("./mongo/mongodb/user.mongodb.js");
        const { default: CategoryManagerMongo } = await import("./mongo/mongodb/category.mongodb.js");
        const { default: realTimeProductsManagerMongo } = await import("./mongo/mongodb/realTimeProducts.mongodb.js");
        const { default: SessionManagerMongo } = await import("./mongo/mongodb/session.mongodb.js");
        const { default: TicketManagerMongo } = await import("./mongo/mongodb/ticket.mongodb.js");
        const { default: MockProductManagerMongo } = await import("./mongo/mongodb/mock.mongodb.js");

        CartDao = new CartManagerMongo();
        ProductDao = new ProductManagerMongo();
        MessageDao = new MessageManagerMongo();
        UserDao = new UserManagerMongo();
        CategoryDao = new CategoryManagerMongo();
        RealTimeProductsDao = new realTimeProductsManagerMongo();
        sessionDao = new SessionManagerMongo();
        TicketDao = new TicketManagerMongo();
        MockDao = new MockProductManagerMongo();
        
        break;
    
    case "MEMORY":
        break;
    
    case "FILE":
        break;
}

