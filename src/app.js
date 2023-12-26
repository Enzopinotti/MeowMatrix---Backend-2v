//Importaciones generales
import express from 'express';
import handlebars from 'express-handlebars';
import http from 'http';
import { db } from './daos/database.js';
import dotenv from 'dotenv';
import { Server }  from 'socket.io';
import { __dirname, authToken, generateToken }  from './utils.js';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import  initializePassport  from './config/passport.config.js';

//Importaciones de routers 
import { userRouter } from './routes/users.router.js';
import { productRouter } from './routes/products.router.js';
import { categoryRouter } from './routes/category.router.js';
import { cartRouter } from './routes/carts.router.js';
import { viewsRouter } from './routes/views.router.js';
import { messageRouter } from './routes/message.router.js';
import { sessionRouter } from './routes/api/session.js';


import productModel from './daos/models/product.model.js';
import { loginRouter } from './routes/views/login.js';
import { registerRouter } from './routes/views/register.js';
import { profileRouter } from './routes/views/profile.js';
import { recoveryRouter } from './routes/views/recoveryPass.js';



dotenv.config();

const filePath = 'archivos/productos.json';

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

const port = 8080;

app.use(express.urlencoded({extended:true}))
app.use(express.json());


//middleware para utilizar cookies 
app.use(
  cookieParser( "1ad1f78ab931039683574d95dce673abae20e29f4e6cac1ab02dea191695082948c82f6e890cca8636a9fde1e4a1e1baa21710353a9f278fb62db53e922961c6"
));

//middleware para utilizar sesiones
app.use(
  session({
      secret: process.env.hash
      ,resave: false
      ,saveUninitialized: true
      ,cookie: {
        maxAge: 60000
      }
      ,store: MongoStore.create({
        mongoUrl: process.env.mongo,
        ttl: 2 * 60, //Cambio el el primer numero por la cantidad de minutos
        

      })
    }
  )
);

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






//middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
  next();// El next() es opcional, pero se recomienda utilizarlo para que el middleware siga ejecutándose sin problemas.
  //res.render('error', { error: err }); // Renderiza la vista de error con el error proporcionado

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


server.listen(port, ()=>{
    console.log(`El servidor esta escuchando en el puerto ${port}`)
   
});


