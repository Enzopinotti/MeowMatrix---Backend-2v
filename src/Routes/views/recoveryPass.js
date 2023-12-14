import express from 'express';
import { showRecovery } from '../../controllers/auth.controller.js';

export const recoveryRouter = express.Router();

recoveryRouter.get('/', showRecovery);
