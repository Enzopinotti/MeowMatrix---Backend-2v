import { getMockProducts } from "../controllers/mock.controller.js";
import BaseRouter from './router.js';


export default class MockRouter extends BaseRouter{
    init(){
      this.router.get('/mockingProducts', getMockProducts);
    }
};
  