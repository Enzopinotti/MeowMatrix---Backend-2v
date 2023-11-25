import express from 'express';
import handlebars from 'express-handlebars';
import http from 'http';
import { Server }  from 'socket.io';
import { __dirname }  from './utils.js';
import { userRouter } from './routes/users.router.js';
import { productRouter } from './routes/products.router.js';
import { categoryRouter } from './routes/category.router.js';
import { cartRouter } from './routes/carts.router.js';
import { viewsRouter } from './routes/views.router.js';
import { ProductManager } from './config/filesystem/ProductManager.js';
import { messageRouter } from './routes/message.router.js';
import { db } from './config/database.js';
import mongoose from 'mongoose';
import productModel from './config/models/product.model.js';


const filePath = 'archivos/productos.json';
const manager = new ProductManager(filePath);

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


app.use('/', viewsRouter);
app.use('/api/users', userRouter);
app.use('/api/products', productRouter);
app.use('/api/carts', cartRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/messages', messageRouter);



io.on("connection", (socket) => {
  
  console.log("Un cliente se ha conectado");

  socket.on('toggle-visibility', async (productId) => {
    try {
      
      const product = await productModel.findById(productId);
      console.log(product);
      // Cambia el estado de la visibilidad del producto
      product.isVisible = false; // Cambia esto según tu campo de visibilidad

      // Guarda el producto actualizado
      await product.save();
      console.log(`Producto con ID ${productId} actualizado con éxito.`);
      // Emite un evento para actualizar la vista
      io.emit("visibility-toggled", productId);
    } catch (error) {
      // Maneja cualquier error que pueda ocurrir durante la eliminación
      console.error(`Error al eliminar el producto: ${error.message}`);
    }
  });
});


server.listen(port, ()=>{
    console.log(`El servidor esta escuchando en el puerto ${port}`)
   
});
