import express from 'express';

const userRouter = express.Router();

const users = [];

userRouter.get('/', (req, res)=>{
    res.status(200).json(users);
});

userRouter.post('/', (req, res)=>{
    const newUser = req.body;
    users.push(newUser);

})


export { userRouter };