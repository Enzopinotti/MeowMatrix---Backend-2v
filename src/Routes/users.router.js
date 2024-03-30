import { registerUser } from '../controllers/session.controller.js';
import { 
  UploadDocuments,
  deleteLike,
  deleteUser, getUserByEmail, getUserById, getUsers, handleLike, obtenerFavoritos, postUser, updateUser, requestPremium, uploadAvatar, handlePremium, handleDeleteInactiveUsers 
} from '../controllers/user.controller.js';
import { authorization, uploader } from '../utils.js';
import BaseRouter from './router.js';
import passport from 'passport';

export default class UserRouter extends BaseRouter {
  init() {
    this.router.get('/', getUsers);
    this.router.post('/', postUser);
    this.router.get('/likes', obtenerFavoritos )
    this.router.get('/email/:userEmail', getUserByEmail);
    this.router.get('/:userId', getUserById);
    this.router.delete('/inactive', handleDeleteInactiveUsers);
    this.router.delete('/:userId', deleteUser);
    this.router.put('/premium', requestPremium);
    this.router.post('/premium/:userId', handlePremium)
    this.router.put('/:userId', updateUser);
    this.router.post('/upload-avatar', authorization(['usuario', 'premium']), uploader.single('avatar'), uploadAvatar);
    this.router.post('/:uid/documents', uploader.any(), UploadDocuments);
    this.router.post('/like/:productId', handleLike);
    this.router.delete('/like/remove/:productId', deleteLike);
  };
};
