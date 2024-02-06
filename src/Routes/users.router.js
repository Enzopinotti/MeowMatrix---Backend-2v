import { registerUser } from '../controllers/session.controller.js';
import { 
  deleteUser, getUserById, getUsers, updateUser 
} from '../controllers/user.controller.js';
import BaseRouter from './router.js';
import passport from 'passport';

export default class UserRouter extends BaseRouter {
  init() {
    this.router.get('/', getUsers);
    this.router.get('/:userId', getUserById);
<<<<<<< HEAD
    this.router.post('/register', passport.authenticate('register'), registerUser);
=======
    this.router.post('/register',
    passport.authenticate('register', {
      successRedirect: '/',
      failureRedirect: '/register',
      failureFlash: true, // Habilitar mensajes flash para errores de autenticación
    }),
    (req, res, next) => {
      console.log('entro aquí')
      console.log(req.flash('error')); // Imprime los mensajes flash
      next();
    },
    registerUser);
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    this.router.delete('/:userId', deleteUser);
    this.router.put('/:userId', updateUser);
  };
};
