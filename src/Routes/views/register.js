import express from 'express';
import { showRegister } from '../../controllers/session.controller.js';

export const registerRouter = express.Router();

registerRouter.get('/', showRegister);

