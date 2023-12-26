import { Router } from "express";

export default class BaseRouter {
    constructor() {
     this.router = Router();
     this.init();   
    }

    getRouter() {
        return this.router;
    }
    
    init() {}

    //!Función que devuelve los callbacks que se invoquen
    applyCallbaks(callbacks) {
        return callbacks.map(callback => async(req, res, next)=>{
            try {
                await callback(req, res, next);
            } catch (error) {
                console.log(error);
                res.status(500).send(error.message || error.toString() || "internal server error")
            } 
        });
    }
    //!Función para generar respuestas genericas 
    generateCustomResponses(req, res, next) {

        res.sendSuccess = payload => res.status(200).send({ status: "success", payload });
        res.sendServerError = error => res.status(500).send({ status: "error", error });
        res.sendUserError = error => res.status(400).send({ status: "error", error });
        res.sendNotFound = error => res.status(404).send({ status: "error", error });
        res.sendUnauthorized = error => res.status(401).send({ status: "error", error });
        res.sendForbidden = error => res.status(403).send({ status: "error", error });
        res.sendConflict = error => res.status(409).send({ status: "error", error });

        next();
    }


    get(path, ...callbacks) {
        this.router.get(path, this.generateCustomResponses ,this.applyCallbaks(callbacks));
    }
    post(path, ...callbacks) {
        this.router.post(path, this.generateCustomResponses ,this.applyCallbaks(callbacks));
    }
    put(path, ...callbacks) {
        this.router.put(path, this.generateCustomResponses ,this.applyCallbaks(callbacks));
    }
    delete(path, ...callbacks) {
        this.router.delete(path, this.generateCustomResponses ,this.applyCallbaks(callbacks));
    }

}