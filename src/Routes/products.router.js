import { uploader } from '../utils.js';
import { 
  createProduct, deleteProduct, getMyProducts, getProductById, getProducts, updateProduct 
} from '../controllers/product.controller.js';
import BaseRouter from './router.js';

export default class ProductRouter extends BaseRouter{
  init(){
    this.router.get('/', getProducts);
    this.router.get('/myProducts', getMyProducts);
    this.router.get('/:productId', getProductById);
    this.router.put('/:pid', updateProduct);
    this.router.delete('/:pid', deleteProduct);
    this.router.post('/', uploader.single('productImage') , createProduct);
  }
};
