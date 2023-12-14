import express from 'express';
import { showLogin } from '../../controllers/auth.controller.js';

export const loginRouter = express.Router();

loginRouter.get('/', showLogin);

