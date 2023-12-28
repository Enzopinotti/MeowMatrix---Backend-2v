import express from 'express';
import { showRecovery } from '../../controllers/session.controller.js';

export const recoveryRouter = express.Router();

recoveryRouter.get('/', showRecovery);
