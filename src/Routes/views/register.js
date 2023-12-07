import express from 'express';

export const registerRouter = express.Router();

registerRouter.get('/', (req, res) => {
    let data = {
        layout: 'register',
    }
    res.render('index', data);
});

