import express from 'express';
import { showProfile } from '../../controllers/user.controller.js';

export const profileRouter = express.Router();

profileRouter.get('/', showProfile);