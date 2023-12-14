import express from 'express';
import { logoutUser, recoveryPassword, showLogin, showRegister, showRecovery } from '../../controllers/auth.controller.js' 
import { showProfile } from '../../controllers/user.controller.js';
import passport from 'passport';

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
        delete user.password;
        req.session.user = user;
        //const accessToken = generateToken(user); Todavía no lo uso
        res.send({status: "success"}).redirect('/login');
    }   
);

sessionRouter.post('/login', 
    passport.authenticate('login', { failureRedirect: '/failLogin' }),
    async (req, res) => {
        let user = req.user;
        if (!user)
            return res.status(400).send({ status: 'error', error: 'User not found' });
        delete user.password;
        req.session.user = user;
        //console.log(req.session.user);
        //const accessToken = generateToken(user); Todavía no lo uso
        res.redirect('/products');
    }
);   

sessionRouter.get('/logout', logoutUser);

sessionRouter.post('/profile',showProfile)

sessionRouter.post('/recovery', recoveryPassword);
