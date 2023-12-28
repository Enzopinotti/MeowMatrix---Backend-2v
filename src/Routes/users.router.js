import { 
  deleteUser, getUserById, getUsers, postUser, updateUser 
} from '../controllers/user.controller.js';
import BaseRouter from './router.js';

export default class UserRouter extends BaseRouter {
  init() {
    this.router.get('/', getUsers);
    this.router.get('/:userId', getUserById);
    this.router.post('/', postUser);
    this.router.delete('/:userId', deleteUser);
    this.router.put('/:userId', updateUser);
  };
};
