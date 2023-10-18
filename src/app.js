import express from 'express';
import fs from 'fs'
const app = express();

const port = 8080;

app.use(express.urlencoded({extended:true}));



app.get('/saludo', (req, res)=>{

    res.send(`Hola, estoy trabajando con express en node.js`);

});

app.get('/bienvenida', (req, res)=>{
    const htmlResponse = `
    <html>
    <body style="color: blue;">
    <h1>Bienvenidos a mi aplicación Express con módulos ES6!</h1>
    </body>
    </html>`;
    res.send(htmlResponse);

});

app.get('', (req, res)=>{

    fs.readFile('archivos/usuarios_genero.json', 'utf-8',(error, data)=>{

        if(error){
            console.log(error);
            res.status(500).send('Error al leer el archivo');
            return;
        }
        const usuarios = JSON.parse(data);
        const generoQuery = req.query.genero;

        if(generoQuery){
            const usuariosFiltrados = usuarios.filter(user =>{user.genero === generoQuery});
            res.json(usuariosFiltrados);
        }else{
            res.json(usuarios)
        }
    })

});

app.get('/usuarios/:userId', (req, res)=>{
    const userId = parseInt(req.params.userId, 10);

    fs.readFile('archivos/usuarios.json', 'utf-8',(error, data)=>{

        if(error){
            console.log(error);
            res.status(500).send('Error al leer el archivo');
            return;
        }
        const usuarios = JSON.parse(data);
        console.log(usuarios);
        const usuario = usuarios.find(user =>{return user.id === userId});
        console.log(userId);
        if(usuario){
            res.json(usuario);
        }else{
            res.status(400).send('Usuario No Encontrado')
        }
        
    })

});

app.listen(port, ()=>{
    console.log(`El servidor esta escuchando en el puerto ${port}`)
});
