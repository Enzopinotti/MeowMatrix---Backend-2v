import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import config from './config/server.config.js';
import productModel from './daos/mongo/models/product.model.js';
import app from './index.js';
import cluster from 'cluster';
import { cpus } from 'os'; 

dotenv.config();

const port = config.port;
const mode = config.mode;

const server = http.createServer(app);
export const io = new Server(server);

io.on("connection", (socket) => {
  console.log("Un cliente se ha conectado");

  socket.on('toggle-visibility', async (productId) => {
    try {
      const product = await productModel.findById(productId);
      product.isVisible = false; // Cambia esto según tu campo de visibilidad
      await product.save();
      io.emit("visibility-toggled", productId);
    } catch (error) {
      console.error(`Error al ocultar el producto: ${error.message}`);
    }
  });
});

if (cluster.isPrimary) {
  console.log('config: ', config)
  console.log(`Primary ${process.pid} is running`);
  const numCPUs = cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    console.log(`Forking process number ${i + 1}...`);
    cluster.fork();
  }
  cluster.on('message', (worker, message) => {
    console.log(`Mensaje recibido del worker ${worker.process.pid}: ${message}`);
  });
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });

} else {
  console.log(`Soy el worker ${process.pid} y te hablo desde el servidor`)
  if (port) {
    server.listen(port, () => {
      console.log(`El servidor está escuchando en el puerto ${port} en modo ${mode}`);
    });
  } else {
    console.log("No hay variables de entorno configuradas");
  }
  
}
