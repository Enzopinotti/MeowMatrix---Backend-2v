import express from 'express';
import initializePassport from './config/passport.config.js';
import cors from 'cors';
import "./daos/factory.js";
import { __dirname } from './utils.js';
import passport from 'passport';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import config from './config/server.config.js';
import { routerGeneral } from './Routes/index.js';
import { baseRouterInstance } from './Routes/index.js';
import compression from 'express-compression';
import ErrorHandler from './middlewares/error/handler.error.js';
import { addLogger } from './middlewares/log/handler.log.js';

const app = express();
const isProduction = config.mode === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(compression({
  brotli: {
    enabled: true,
    zlib: {},
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: config.frontendOrigin,
  credentials: true,
}));
app.use(addLogger);

app.use(
  session({
    secret: config.hashKey,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: 10 * 60 * 1000,
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    },
    store: MongoStore.create({
      mongoUrl: config.mongoUrl,
      ttl: 10 * 60,
    }),
  })
);

initializePassport();
app.use(passport.initialize());
app.use(express.static(__dirname + '/public'));
app.use(passport.session());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
  next();
});

// Cookies are parsed but no signing secret is hardcoded in source.
app.use(cookieParser());

app.use(baseRouterInstance.generateCustomResponses);
routerGeneral(app);

app.use(ErrorHandler);

export default app;
