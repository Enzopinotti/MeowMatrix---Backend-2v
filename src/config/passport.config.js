import passport from "passport";
import local from "passport-local";
import { hashPassword, isValidPassword } from "../utils.js";
import userModel from "../daos/models/user.model.js";
import GitHubStrategy from "passport-github2";
import "dotenv/config.js";


const LocalStrategy = local.Strategy;

const initializePassport = () => {
  passport.use( "register",
    new LocalStrategy(
      { passReqToCallback: true, usernameField: "email" },
      async (req, username, password, done) => {
        const { name, lastName, email, birthDate, phone } = req.body;
        try {
          const user = await userModel.findOne({ email: username });
          if (user) {
            console.log("El usuario ya existe");
            return done(null, false);
          }
          const newUser = {
            name,
            lastName,
            email,
            password: hashPassword(password),
            birthDate,
            phone,
          };
          console.log(newUser);
          const result = await userModel.create(newUser);
          return done(null, result);
        } catch (error) {
          return done("Error al registrar el usuario", error);
        }
      }
    )
  );
  passport.use( 'login', 
    new LocalStrategy({usernameField: 'email'}, async (username, password, done) => {
        try {
    
            let user = await userModel.findOne({email: username});
            if(!user){
              console.log('User not found');
              return done(null, false);
            }
            if (!isValidPassword(password, user)) {
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
      clientID: process.env.gitclientid,
      clientSecret: process.env.gitclientsecret,
      callbackURL: process.env.gitcallbackurl
    },
    async ( accessToken, refreshToken, profile, done ) => {
      try {
        console.log(profile);
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

  passport.serializeUser((user, done) => {

    done(null, user._id);

  });

  passport.deserializeUser(async (id, done) => {
      let user = await userModel.findById(id);
      done(null, user);
  });

};



export default initializePassport;