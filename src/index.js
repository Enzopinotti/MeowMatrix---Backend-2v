import express from 'express';
import handlebars from 'express-handlebars';
import  initializePassport  from './config/passport.config.js';
import cors from 'cors';
import "./daos/factory.js"
import { __dirname } from './utils.js';
import passport from 'passport';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import config from './config/server.config.js';
import  { routerGeneral, baseRouterInstance } from '../src/routes/'; 
import { routerGeneral } from './routes/index.js';
import { baseRouterInstance } from './routes/index.js';
import compression from 'express-compression'
import ErrorHandler from './middlewares/error/handler.error.js';
import { addLogger } from './middlewares/log/handler.log.js';
import { capitalize, checkStock, formatDate, formatPrice, formatTime, isAdmin, isLiked, isNotPremium, isPremium } from './utils/handlebarsHelpers.util.js'


const app = express();
const hbs = handlebars.create({
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
  helpers: {
    isAdmin: isAdmin,
    isNotPremium: isNotPremium,
    isPremium: isPremium,
    capitalize: capitalize,
    formatDate: formatDate,
    formatTime: formatTime,
    checkStock: checkStock,
    formatPrice: formatPrice,
    isLiked: isLiked
  }
});




//Inicializo el motor de plantillas handlebars 
app.engine('handlebars', hbs.engine);
app.set('views', __dirname + '/views');
//luego de indicar donde estarán las vistas, se indica el motor de plantillas a utilizar
app.set('view engine', 'handlebars');

app.use(compression({
    brotli: {
        enabled: true,
        zlib:{  }   
    },
}));
app.use(express.json())
app.use(express.static(__dirname +'/public'));
app.use(express.urlencoded( { extended:true } ))

const corsOptions = {
  origin: 'http://localhost:3000', // Cambia esto al dominio de tu aplicación React
  credentials: true, // Permite el envío de cookies de origen cruzado
};


app.use(cors(corsOptions));
app.use(addLogger);

//middleware para utilizar sesiones
app.use(
    session({
        secret: config.hashKey
        ,resave: true
        ,saveUninitialized: true
        ,cookie: {
          maxAge: 600000
        }
        ,store: MongoStore.create({
          mongoUrl: config.mongoUrl,
          ttl: 6 * 60, //Cambio el el primer numero por la cantidad de minutos
            
  
        })
      }
    )
  );


initializePassport();
app.use(passport.initialize());

app.use(passport.session());

//middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
    next();
});

//middleware para utilizar cookies 
app.use(
  cookieParser(
    "1ad1f78ab931039683574d95dce673abae20e29f4e6cac1ab02dea191695082948c82f6e890cca8636a9fde1e4a1e1baa21710353a9f278fb62db53e922961c6"
  )
);





  

app.use(baseRouterInstance.generateCustomResponses);
routerGeneral(app);

app.use(ErrorHandler)

export default app;
