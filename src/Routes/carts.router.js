import { 
    addProductToCart, changeQuantity, deleteAllProducts, deleteProductFromCart, getCartById, getCarts, postCart, updateCart, deleteCart, addToCurrentCart, purchaseCart 
} from '../controllers/cart.controller.js';
import BaseRouter from './router.js';

export default class CartRouter extends BaseRouter{
    init(){
        this.router.get('/', getCarts);
        this.router.get('/:cid', getCartById);
        this.router.post('/', postCart);
        this.router.delete('/:cid/product/:pid', deleteProductFromCart);
        this.router.put('/:cid', updateCart);
        this.router.put('/:cid/products/:pid', changeQuantity);
        this.router.delete('/:cid', deleteCart);
        this.router.delete('/:cid/products', deleteAllProducts);
        this.router.post('/current/product/:pid', addToCurrentCart);
        this.router.get('/:cid/purchase', purchaseCart)
    }
};
