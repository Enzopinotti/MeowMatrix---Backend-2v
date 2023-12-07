import express from 'express';

export const loginRouter = express.Router();

loginRouter.get('/', (req, res) => {
    let data = {
        layout: 'main',
    }
    res.render('index', data);
});

