import { sendMail } from '../controllers/mail.controller.js'
import BaseRouter from './router.js'

export default class MailRouter extends BaseRouter{
    init(){
        this.post('/', sendMail)
    }
};