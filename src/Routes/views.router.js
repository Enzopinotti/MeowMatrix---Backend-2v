import { 
    uploader 
} from '../utils.js';
import BaseRouter from './router.js';
import {
  showProfile,
  uploadAvatar
} from '../controllers/user.controller.js';
import {
  getEditProductView,
  getMyProductsView,
  getProductByIdView,
  getProductCreateView,
  getProductsView
} from '../controllers/product.controller.js';
import {
   getCartView
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
    showLogin, showRecovery, showRegister, showReset 
} from '../controllers/session.controller.js';
import {
  authorization
} from '../utils.js'
import { getTicketView } from '../controllers/ticket.controller.js';
import { getMockProductsView } from '../controllers/mock.controller.js';


export default class ViewsRouter extends BaseRouter {
  init() {
    this.router.get('/', showLogin);

    this.router.get('/register', showRegister);

    this.router.get('/profile', authorization(['usuario', 'premium']) ,showProfile);

    this.router.get('/login', showLogin)

    this.router.post('/realTimeProducts', authorization('admin') , uploader.array('productImage', 1), postRealTimeProduct);

    this.router.get('/realTimeProducts',authorization('admin') , getRealTimeProducts);

    this.router.get('/message', authorization(['usuario', 'premium']), getRealTimeMessages);

    this.router.post('/message', authorization(['usuario', 'premium']), postRealTimeMessages);

    this.router.get('/products', authorization(['usuario', 'premium']) ,getProductsView);

    this.router.get('/products/:productId', authorization(['usuario', 'premium']),getProductByIdView);

    this.router.get('/carts', authorization(['usuario', 'premium']) ,getCartView);

    this.router.get('/ticket', getTicketView);

    this.router.get('/mockingproducts', getMockProductsView);

    this.router.get('/recoveryPass', showRecovery);

    this.router.get('/resetPassword/:tokenId',  showReset);

    this.router.get('/myProducts',authorization(['premium']), getMyProductsView)

    this.router.get('/products/:productId/edit',authorization(['premium']), getEditProductView )

    this.router.get('/createProduct', authorization(['premium']), getProductCreateView)
    
  }
}
