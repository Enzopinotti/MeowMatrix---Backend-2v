import { Router } from "express";
import { 
    getCategories, postCategory, putCategory 
} from "../controllers/category.controller.js";
import BaseRouter from "./router.js";
const categoryRouter = Router();

export default class CategoryRouter extends BaseRouter{
    init(){
        this.router.get('/', getCategories);
        this.router.post('/', postCategory);
        //!Uso un put en vez de un delete porque no quiero borrar la categoria, sino que quiero hacerla no visible
        this.router.put('/:id', putCategory);
    }
}
