import express from 'express';

import { userRouter } from './Routes/users.router.js';
import { productRouter } from './Routes/products.router.js';
import { cartRouter } from './Routes/carts.router.js';



const app = express();

const port = 8080;

app.use(express.urlencoded({extended:true}))
app.use(express.json());
app.use(express.static('./src/public'));


app.use('/api/users', userRouter);
app.use('/api/products', productRouter);
app.use('/api/carts', cartRouter);



app.listen(port, ()=>{
    console.log(`El servidor esta escuchando en el puerto ${port}`)
});
