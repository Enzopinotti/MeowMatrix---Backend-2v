import express from 'express';
import { registerUser, loginUser, logoutUser } from '../../controllers/auth.controller.js' 
import { showProfile } from '../../controllers/user.controller.js';

export const sessionRouter = express.Router();

sessionRouter.post('/register', registerUser);

sessionRouter.post('/login', loginUser);   

sessionRouter.get('/logout', logoutUser);

sessionRouter.post('/profile', showProfile)
