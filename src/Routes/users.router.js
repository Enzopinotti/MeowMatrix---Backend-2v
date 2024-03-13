import { registerUser } from '../controllers/session.controller.js';
import { 
  UploadDocuments,
  deleteUser, getUserById, getUsers, postUser, updateUser, upgradeToPremium, uploadAvatar 
} from '../controllers/user.controller.js';
import { authorization, uploader } from '../utils.js';
import BaseRouter from './router.js';
import passport from 'passport';

export default class UserRouter extends BaseRouter {
  init() {
    this.router.get('/', getUsers);
    this.router.post('/', postUser);
    this.router.get('/:userId', getUserById);
    this.router.delete('/:userId', deleteUser);
    this.router.put('/premium', upgradeToPremium);
    this.router.put('/:userId', updateUser);
    this.router.post('/upload-avatar', authorization(['usuario', 'premium']), uploader.single('avatar'), uploadAvatar);
    this.router.post('/:uid/documents', uploader.any(), UploadDocuments);
  };
};
