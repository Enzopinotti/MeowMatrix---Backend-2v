import { loggerTest } from '../controllers/test.controller.js'
import BaseRouter from './router.js'

export default class TestsRouter extends BaseRouter{
    init(){
        this.get('/loggerTest', loggerTest)
    }
};