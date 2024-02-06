import express from 'express';
import { showLogin } from '../../controllers/session.controller.js';

export const loginRouter = express.Router();

loginRouter.get('/', showLogin);

