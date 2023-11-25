import { Router } from "express";
import messageModel from "../config/models/message.model.js"
const messageRouter = Router();

messageRouter.get('/', async (req, res) => {
    try {
        const messages = await messageModel.find( { } );
        res.status(200).json(messages);

    }catch (error) {
        res.status(500).json({message: error.message});
    };

});

messageRouter.post('/', async (req, res) => {
    const message = new messageModel(req.body)
    try {
        const newMessage = await message.save();
        res.status(201).json(newMessage);
    }catch (error) {
        res.status(500).json({message: error.message});
    };

});

export { messageRouter };