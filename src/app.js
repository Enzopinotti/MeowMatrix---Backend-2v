import express from 'express';
import handlebars from 'express-handlebars';
import http from 'http';
import { Server }  from 'socket.io';
import { __dirname }  from './utils.js';
import { userRouter } from './routes/users.router.js';
import { productRouter } from './routes/products.router.js';
import { cartRouter } from './routes/carts.router.js';
import { viewsRouter } from './routes/views.router.js';
import { ProductManager } from './ProductManager.js';
const filePath = 'archivos/productos.json';
const manager = new ProductManager(filePath);

const app = express();
const server = http.Server(app);
export const io = new Server(server);    


//Inicializo el motor de plantillas handlebars 
app.engine('handlebars', handlebars.engine()); 

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


io.on("connection", (socket) => {
    console.log("Un cliente se ha conectado");
    socket.on("new-product", async (newProduct) => {
        try {
            
            console.log("Nuevo producto recibido:", newProduct);
            const addedProduct = await manager.addProduct(newProduct);
            // Agrega el atributo data-product-id al nuevo producto
            addedProduct.dataProductId = addedProduct.id;

            io.emit("product-added", addedProduct);

        } catch (error) {
          console.error("Error al agregar producto:", error);
        }
    });

      socket.on('delete-product', async (productId) => {

        console.log(`Se recibió el ID del producto a eliminar: ${productId}`);
    
        try {

            await manager.deleteProductById(productId);
    
            // Imprime un mensaje de éxito en la consola
            console.log(`Producto con ID ${productId} eliminado correctamente.`);
                
            // Emite un evento o realiza cualquier otra acción necesaria
            io.emit('product-deleted', productId);
        } catch (error) {
          // Maneja cualquier error que pueda ocurrir durante la eliminación
          console.error(`Error al eliminar el producto: ${error.message}`);
        }
      });
});


server.listen(port, ()=>{
    console.log(`El servidor esta escuchando en el puerto ${port}`)
   
});
