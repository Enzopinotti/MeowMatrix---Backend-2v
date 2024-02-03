import BaseRouter from '../../routes/router.js';
import { loginUser, logoutUser, recoveryPassword, registerUser } from '../../controllers/session.controller.js';
import { showProfile } from '../../controllers/user.controller.js';
import passport from 'passport';

export default class SessionRouter extends BaseRouter {
  init() {

    // Envía la solicitud a GitHub para iniciar sesión
    this.router.get(
      '/github',
      passport.authenticate('github', { scope: ['user:email'] }),
      async (req, res) => {}
    );

    // Recibe la respuesta de GitHub
    this.router.get(
      '/githubcallback',
      passport.authenticate('github', { failureRedirect: '/login' }),
      async (req, res) => {
        req.session.user = req.user;
        res.redirect('/products');
      }
    );

    this.router.post('/register',
      (req, res, next) => {
          passport.authenticate('register', (err, user, info) => {
            if (err) {
              req.logger.error(`Error durante la autenticación del registro: ${err}`);
              return next(err);
            }
            if (!user) {
              // Manejar errores específicos de registro aquí
              const errorMessage = info && info.error ? info.error : 'Error en el registro';
              req.logger.error(errorMessage);
              return res.sendUserError(errorMessage); // Puedes enviar el mensaje de error en la respuesta JSON
            }

            // Si todo está bien, pasa al siguiente middleware (registerUser)
            req.login(user, (err) => {
              if (err) {
                req.logger.error(`Error durante el login del usuario registrado: ${err}`);
                return next(err);
              }
              return next();
            });
          })(req, res, next);
      },
      registerUser
    );

    this.router.post(
      '/login',
      passport.authenticate('login' ),
      loginUser
    );

    this.router.get('/logout', logoutUser);

    this.router.post('/profile', showProfile);

    this.router.post('/recovery', recoveryPassword);

  }
}
