import { Router } from "express";
import { 
    deleteCategory,
    getCategories, getCategory, postCategory, putCategory 
} from "../controllers/category.controller.js";
import BaseRouter from "./router.js";


export default class CategoryRouter extends BaseRouter{
    init(){
        this.router.get('/', getCategories);
        this.router.post('/', postCategory);
        this.router.get('/:id', getCategory);

        this.router.delete('/:id', deleteCategory);
        
        //!Uso un put en vez de un delete porque no quiero borrar la categoria, sino que quiero hacerla no visible
        this.router.put('/:id', putCategory);
    }
}
