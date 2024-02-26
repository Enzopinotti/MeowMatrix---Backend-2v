//? Importaciones de clases de routers 
import UserRouter from './users.router.js';
import CartRouter from './carts.router.js';
import CategoryRouter from './category.router.js';
import MessageRouter from './message.router.js';
import ProductRouter from './products.router.js';
import ViewsRouter from './views.router.js';
import SessionRouter from './api/session.js';
import MailRouter from './mail.router.js';
import MockRouter from './mock.router.js';
import BaseRouter from './router.js';
import TestRouter from '../routes/test.router.js';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { __dirname } from '../utils.js';



//?Instancias de las clases de los routers
export const baseRouterInstance = new BaseRouter();
const userRouterInstance = new UserRouter();
const cartRouterInstance = new CartRouter();
const messageRouterInstance = new MessageRouter();
const productRouterInstance = new ProductRouter();
const categoryRouterInstance = new CategoryRouter();
const sessionRouterInstance = new SessionRouter();
const viewsRouterInstance = new ViewsRouter();
const mailRouterInstance = new MailRouter();
const mockRouterInstance = new MockRouter();
const testRouterInstance = new TestRouter();

//? Routers extraidos
const userRouter = userRouterInstance.getRouter();
const cartRouter = cartRouterInstance.getRouter();
const messageRouter = messageRouterInstance.getRouter();
const productRouter = productRouterInstance.getRouter();
const categoryRouter = categoryRouterInstance.getRouter();
const sessionRouter = sessionRouterInstance.getRouter();
const viewsRouter = viewsRouterInstance.getRouter();
const mailRouter = mailRouterInstance.getRouter();
const mockRouter = mockRouterInstance.getRouter();
const testRouter = testRouterInstance.getRouter();


const swaggerOptions = {
    definition: {
      openapi: '3.0.1',
      info: {
          title: 'Documentación de app E-commerce',
          version: '1.0.0',
          description: 'Muestra todo lo que se puede hacer en la aplicación.',
          contact: {
              name: 'Enzo Pinotti',
              email: 'enzopinottii@gmail.com',
              github: 'https://github.com/Enzopinotti',
              linkedin: 'https://www.linkedin.com/in/enzo-daniel-pinotti-667270179/',
          }
      },
    },
    apis: [__dirname + '/docs/**/*.yaml'],
  }
  
const swaggerDocs = swaggerJSDoc(swaggerOptions);


export const routerGeneral = (app)=> {
    app.use('/api/users', userRouter);
    app.use('/api/carts', cartRouter);
    app.use('/api/messages', messageRouter);
    app.use('/api/products', productRouter);
    app.use('/api/categories', categoryRouter);
    app.use('/api/sessions', sessionRouter);
    app.use('/', viewsRouter);
    app.use('/api/mail', mailRouter);
    app.use('/api/mock', mockRouter);
    app.use('/api/tests', testRouter);
    app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

