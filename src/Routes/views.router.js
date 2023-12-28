import { 
    uploader 
} from '../utils.js';
import BaseRouter from './router.js';
import {
  uploadAvatar
} from '../controllers/user.controller.js';
import {
  getProductById,
  getProducts
} from '../controllers/product.controller.js';
import {
  getCart
} from '../controllers/cart.controller.js';
import {
  getRealTimeProducts,
  postRealTimeProducts
} from '../controllers/realTimeProducts.controller.js';
import {
  getRealTimeMessages,
  postRealTimeMessages
} from '../controllers/message.controller.js';
import { 
    showLogin 
} from '../controllers/session.controller.js';

export default class ViewsRouter extends BaseRouter {
  init() {
    this.router.get('/', showLogin);

    this.router.post('/realTimeProducts', uploader.array('productImage', 1), postRealTimeProducts);

    this.router.get('/realTimeProducts', getRealTimeProducts);

    this.router.get('/message', getRealTimeMessages);

    this.router.post('/message', postRealTimeMessages);

    this.router.get('/products', getProducts);

    this.router.get('/products/:productId', getProductById);

    this.router.get('/carts/:cid', getCart);

    this.router.post('/upload-avatar', uploader.single('avatar'), uploadAvatar);
  }
}
