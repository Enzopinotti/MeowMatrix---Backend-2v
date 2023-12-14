import express from 'express';
import { showRegister } from '../../controllers/auth.controller.js';

export const registerRouter = express.Router();

registerRouter.get('/', showRegister);

