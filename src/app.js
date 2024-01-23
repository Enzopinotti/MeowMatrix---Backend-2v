//?Importaciones generales
import express from 'express';
import handlebars from 'express-handlebars';
import http from 'http';
import dotenv from 'dotenv';
import { Server }  from 'socket.io';
import { __dirname }  from './utils.js';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import  initializePassport  from './config/passport.config.js';
import config from './config/server.config.js';
import cors from 'cors';
import "./daos/factory.js"


//? Importaciones de clases de routers 
  import BaseRouter from './routes/router.js';
  import UserRouter from './routes/users.router.js';
  import CartRouter from './routes/carts.router.js';
  import CategoryRouter from './routes/category.router.js';
  import MessageRouter from './routes/message.router.js';
  import ProductRouter from './routes/products.router.js';
  import ViewsRouter from './routes/views.router.js';
  import SessionRouter from './routes/api/session.js';
  import MailRouter from './routes/mail.router.js';
  import SmsRouter from './routes/sms.router.js';


import productModel from './daos/mongo/models/product.model.js';
import { loginRouter } from './routes/views/login.js';
import { registerRouter } from './routes/views/register.js';
import { profileRouter } from './routes/views/profile.js';
import { recoveryRouter } from './routes/views/recoveryPass.js';


const port = config.port;
const mode = config.mode;


//? Escucha de eventos de proceso (process.on)
process.on('exit', code => {
  console.log('Este código se ejecutará justo antes de salir del proceso');
  //* Acciones finales aquí antes de que el proceso termine
});

process.on('uncaughtException', exception => {
  console.log('Este código atrapa todas las excepciones no controladas, como llamar a una función no declarada');
  console.error(exception);
  // Puedes realizar acciones, registrar el error o realizar una limpieza antes de finalizar el proceso
});

process.on('message', message => {
  console.log('Este código se ejecutará cuando reciba un mensaje de otro proceso', m);
  // Puedes manejar la lógica según el mensaje recibido desde otro proceso
});


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


//? Routers extraidos
const baseRouter = baseRouterInstance.getRouter();
const userRouter = userRouterInstance.getRouter();
const cartRouter = cartRouterInstance.getRouter();
const messageRouter = messageRouterInstance.getRouter();
const productRouter = productRouterInstance.getRouter();
const categoryRouter = categoryRouterInstance.getRouter();
const sessionRouter = sessionRouterInstance.getRouter();
const viewsRouter = viewsRouterInstance.getRouter();
const mailRouter = mailRouterInstance.getRouter();
const smsRouter = smsRouterInstance.getRouter();

dotenv.config();


const app = express();
const server = http.Server(app);
export const io = new Server(server);    
const hbs = handlebars.create({
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  }
});

//Inicializo el motor de plantillas handlebars 
app.engine('handlebars', hbs.engine);

//Luego, con app.set('Views', __dirname+'/Views'), indico en que parte estarán las vistas
app.set('views', __dirname + '/views');

//luego de indicar donde estarán las vistas, se indica el motor de plantillas a utilizar
app.set('view engine', 'handlebars');

//Además seteo donde será mi carpeta public
app.use(express.static(__dirname+'/public'));

app.use(express.urlencoded({extended:true}))
app.use(cors());
app.use(express.json());


//middleware para utilizar cookies 
app.use(
  cookieParser( "1ad1f78ab931039683574d95dce673abae20e29f4e6cac1ab02dea191695082948c82f6e890cca8636a9fde1e4a1e1baa21710353a9f278fb62db53e922961c6"
));

//middleware para utilizar sesiones
app.use(
  session({
      secret: config.hashKey
      ,resave: false
      ,saveUninitialized: true
      ,cookie: {
        maxAge: 60000
      }
      ,store: MongoStore.create({
        mongoUrl: config.mongoUrl,
        ttl: 2 * 60, //Cambio el el primer numero por la cantidad de minutos
        

      })
    }
  )
);

//? Utilizar la función generateCustomResponses
app.use(baseRouterInstance.generateCustomResponses);

initializePassport();

app.use(passport.initialize());

app.use(passport.session());


app.use('/', viewsRouter);
app.use('/api/users', userRouter);
app.use('/api/products', productRouter);
app.use('/api/carts', cartRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/messages', messageRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/profile', profileRouter);
app.use('/recovery', recoveryRouter);
app.use('/mail', mailRouter);
app.use('/sms', smsRouter);




//middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
  next();
});


//el io.on es para escuchar eventos de conexión y desconexión de clientes.
io.on("connection", (socket) => {
  
  console.log("Un cliente se ha conectado");

  //Socket para ocultar un producto en tiempo real /realTimeProducts
  socket.on('toggle-visibility', async (productId) => {
    try {
      
      const product = await productModel.findById(productId);
      
      // Cambia el estado de la visibilidad del producto
      product.isVisible = false; // Cambia esto según tu campo de visibilidad

      // Guarda el producto actualizado
      await product.save();
      
      // Emite un evento para actualizar la vista
      io.emit("visibility-toggled", productId);
    } catch (error) {
      // Maneja cualquier error que pueda ocurrir durante la eliminación
      console.error(`Error al ocultar el producto: ${error.message}`);
    }
  });


});


if(port){
  server.listen(port, ()=>{
    console.log(`El servidor esta escuchando en el puerto ${port} en modo ${mode}`)
  });
}else{
  console.log("No hay variables de entorno configuradas")
}



