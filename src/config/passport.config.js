import passport from "passport";
import local from "passport-local";
import { hashPassword, isValidPassword, validatePassword } from "../utils.js";
import userModel from "../daos/mongo/models/user.model.js";
import GitHubStrategy from "passport-github2";
import config from '../config/server.config.js'
import jwt from "passport-jwt";

const JWTStrategy = jwt.Strategy;
const ExtractJWT = jwt.ExtractJwt;
const LocalStrategy = local.Strategy;

const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies["access_token"];
  }
  return token;
}

const initializePassport = () => {
  passport.use("register", new LocalStrategy(
    { passReqToCallback: true, usernameField: "email" },
    async (req, username, password, done) => {
      const { name, lastName, email, birthDate, phone } = req.body;
      // Verificar si algún campo obligatorio está ausente
      if (!name || !lastName || !email || !password || !birthDate || !phone) {
        req.logger.error("En passport.config.js: register - Todos los campos son obligatorios.");
        return done(null, false, { error: 'Todos los campos son obligatorios' });
      }
      const hashedPassword = hashPassword(password);
      try {
        const user = await userModel.findOne({ email: username });
        if (user) {
          req.logger.error("En passport.config.js: register - El email ya está registrado.");
          return done(null, false, { error: 'El email ya está registrado' });
        }
        if (!validatePassword(password)) {
          req.logger.error("En passport.config.js: register - La contraseña no cumple con los criterios de seguridad.");
          return done(null, false, { error: 'La contraseña no cumple con los criterios de seguridad' });
        }
        const newUser = {
          name,
          lastName,
          email,
          password: hashedPassword,
          birthDate,
          phone,
        };
        const result = await userModel.create(newUser);
        req.logger.debug("En passport.config.js: register - Usuario registrado exitosamente.");
        return done(null, result);
      } catch (error) {
        req.logger.error("En passport.config.js: register - Error al registrar el usuario:", error.message);
        return done(null, false, { error: 'Error al registrar el usuario' });
      }
    }
  ));

  passport.use( 'login', 
    new LocalStrategy({usernameField: 'email'}, async (username, password, done) => {
        try {
          let user = await userModel.findOne({email: username});
          if(!user){
            return done(null, false);
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        };
      }
    )
  );
  
  passport.use(
    "github",
    new GitHubStrategy(
    {
      clientID: config.gitClientId,
      clientSecret: config.gitClientSecret,
      callbackURL: config.gitCallbackUrl
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userModel.findOne({ email: profile._json.email });
        if (!user) {
          let newUser = {
            name: profile._json.name,
            lastName: "",
            email: profile._json.email,
            password: "",
            birthDate: "",
            phone: "",
            avatar: profile._json.avatar_url,
          };
          let result = await userModel.create(newUser);
          return done(null, result);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.use( 'jwt', new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
    secretOrKey: config.jwtSecret,
  }, async (jwt_payload, done)=>{
    try {
      reqLogger.debug("En passport.config.js: jwt - Autenticación JWT exitosa.");
      return done(null, jwt_payload);
    } catch (error) {
      reqLogger.error("En passport.config.js: jwt - Error en la autenticación JWT:", error);
      return done(error);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
      let user = await userModel.findById(id);
      done(null, user);
  });

};

export default initializePassport;
