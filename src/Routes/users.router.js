import { registerUser } from '../controllers/session.controller.js';
import { 
  deleteUser, getUserById, getUsers, postUser, updateUser, upgradeToPremium 
} from '../controllers/user.controller.js';
import BaseRouter from './router.js';
import passport from 'passport';

export default class UserRouter extends BaseRouter {
  init() {
    this.router.get('/', getUsers);
    this.router.post('/', postUser);
    this.router.get('/:userId', getUserById);
    this.router.post('/register', passport.authenticate('register'), registerUser);
    this.router.delete('/:userId', deleteUser);
    this.router.put('/premium', upgradeToPremium);
    this.router.put('/:userId', updateUser);
    
  };
};
