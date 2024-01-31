//? Importaciones de clases de routers 
import UserRouter from './users.router.js';
import CartRouter from './carts.router.js';
import CategoryRouter from './category.router.js';
import MessageRouter from './message.router.js';
import ProductRouter from './products.router.js';
import ViewsRouter from './views.router.js';
import SessionRouter from './api/session.js';
import MailRouter from './mail.router.js';
import SmsRouter from './sms.router.js';
import MockRouter from './mock.router.js';
import BaseRouter from './router.js';


//?Instancias de las clases de los routers
const baseRouterInstance = new BaseRouter();
const userRouterInstance = new UserRouter();
const cartRouterInstance = new CartRouter();
const messageRouterInstance = new MessageRouter();
const productRouterInstance = new ProductRouter();
const categoryRouterInstance = new CategoryRouter();
const sessionRouterInstance = new SessionRouter();
const viewsRouterInstance = new ViewsRouter();
const mailRouterInstance = new MailRouter();
const smsRouterInstance = new SmsRouter();
const mockRouterInstance = new MockRouter();

//? Routers extraidos
const userRouter = userRouterInstance.getRouter();
const cartRouter = cartRouterInstance.getRouter();
const messageRouter = messageRouterInstance.getRouter();
const productRouter = productRouterInstance.getRouter();
const categoryRouter = categoryRouterInstance.getRouter();
const sessionRouter = sessionRouterInstance.getRouter();
const viewsRouter = viewsRouterInstance.getRouter();
const mailRouter = mailRouterInstance.getRouter();
const smsRouter = smsRouterInstance.getRouter();
const mockRouter = mockRouterInstance.getRouter();


export const routerGeneral = (app)=> {
    app.use('/api/users', userRouter);
    app.use('/api/carts', cartRouter);
    app.use('/api/messages', messageRouter);
    app.use('/api/products', productRouter);
    app.use('/api/categories', categoryRouter);
    app.use('/api/sessions', sessionRouter);
    app.use('/', viewsRouter);
    app.use('/api/mail', mailRouter);
    app.use('/api/sms', smsRouter);
    app.use('/api/mock', mockRouter);
}

