import express from 'express';
import { logoutUser, recoveryPassword } from '../../controllers/auth.controller.js' 
import { showProfile } from '../../controllers/user.controller.js';
import passport from 'passport';
import { generateToken } from '../../utils.js';

export const sessionRouter = express.Router();



//Envia la solicitud a github para hacer el login
sessionRouter.get(
    '/github', passport.authenticate('github', { scope: ['user:email'] }),
    async (req, res) => {}
);

//Aca se recibe la respuesta de github
sessionRouter.get(
    '/githubcallback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    async (req, res) => {
        req.session.user = req.user;
        res.redirect('/products');
    }
);

sessionRouter.post('/register', 
    passport.authenticate('register', { failureRedirect: '/failRegister' }),
    async (req, res) => {
        let user = req.user;
        console.log(user);
        delete user.password;
        req.session.user = user;
        res.json({ status: 'success', message: 'Registration successful' });
    }   
);

sessionRouter.post('/login', 
    passport.authenticate('login', { failureRedirect: '/failLogin' }),
    async (req, res) => {
        let user = req.user;
        console.log(user.phone)
        if (!user)
            return res.status(400).send({ status: 'error', error: 'User not found' });
        delete user.password;
        req.session.user = user;
        //console.log(req.session.user);
        const token = generateToken(user);
        res.cookie('access_token', token, { maxAge: 600000, httpOnly: true });
        res.send({ status: 'success', message: 'Login successful'});
    }
);    

sessionRouter.get('/logout', logoutUser);

sessionRouter.post('/profile',showProfile)

sessionRouter.post('/recovery', recoveryPassword);
