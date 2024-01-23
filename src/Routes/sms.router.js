import { sendSms } from '../controllers/sms.controller.js'
import BaseRouter from './router.js'

export default class SmsRouter extends BaseRouter{
    init(){
        this.post('/', sendSms)
    }
};