//?Importaciones generales
import http from 'http';
import dotenv from 'dotenv';
import { Server }  from 'socket.io';
import { __dirname }  from './utils.js';
import config from './config/server.config.js';
import productModel from './daos/mongo/models/product.model.js';
import app from './index.js';





const port = config.port;
const mode = config.mode;


//? Escucha de eventos de proceso (process.on)
process.on('exit', code => {
  console.log('Este código se ejecutará justo antes de salir del proceso');
  console.error('Código de salida:', code);
  //* Acciones finales aquí antes de que el proceso termine
});

process.on('uncaughtException', exception => {
  console.log('Este código atrapa todas las excepciones no controladas, como llamar a una función no declarada');
  console.error('excepción: ',exception);
  // Puedes realizar acciones, registrar el error o realizar una limpieza antes de finalizar el proceso
});

process.on('message', message => {
  console.log('Este código se ejecutará cuando reciba un mensaje de otro proceso, mensaje: ', message);
  // Puedes manejar la lógica según el mensaje recibido desde otro proceso
});



dotenv.config();




const server = http.Server(app);
export const io = new Server(server);    






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



