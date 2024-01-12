import { 
    uploader 
} from '../utils.js';
import BaseRouter from './router.js';
import {
  uploadAvatar
} from '../controllers/user.controller.js';
import {
  getProductByIdView,
  getProductsView
} from '../controllers/product.controller.js';
import {
  getCart
} from '../controllers/cart.controller.js';
import {
  getRealTimeProducts,
  postRealTimeProduct
} from '../controllers/realTimeProducts.controller.js';
import {
  getRealTimeMessages,
  postRealTimeMessages
} from '../controllers/message.controller.js';
import { 
    showLogin 
} from '../controllers/session.controller.js';
import {
  authorization
} from '../utils.js'

export default class ViewsRouter extends BaseRouter {
  init() {
    this.router.get('/', showLogin);

    this.router.post('/realTimeProducts', /*authorization('admin') ,*/ uploader.array('productImage', 1), postRealTimeProduct);

    this.router.get('/realTimeProducts',/*authorization('admin') ,*/ getRealTimeProducts);

    this.router.get('/message', /*authorization('usuario'),*/ getRealTimeMessages);

    this.router.post('/message', /*authorization('usuario'),*/ postRealTimeMessages);

    this.router.get('/products', authorization('usuario') ,getProductsView);

    this.router.get('/products/:productId', authorization('usuario') ,getProductByIdView);

    this.router.get('/carts/:cid', authorization('usuario') ,getCart);

    this.router.post('/upload-avatar', authorization('usuario') ,uploader.single('avatar'), uploadAvatar);
  }
}
