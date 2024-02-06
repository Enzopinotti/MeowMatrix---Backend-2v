import { getMessages, postMessage } from "../controllers/message.controller.js";
import BaseRouter from "./router.js";


export default class MessageRouter extends BaseRouter{
    init(){
        this.router.get('/', getMessages);
        this.router.post('/', postMessage);
    }
};
