import messageModel from "../daos/models/message.model.js";


//! Vista de mensajes en tiempo real
export const getRealTimeMessages = async (req, res) => {
    try {
        const messages = await messageModel.find();
        res.render("message", { 
            messages,
            style: 'chat.css',
            title: 'Mensajes en tiempo real',
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const postRealTimeMessages = async (req, res) => {
    try {
        const newMessage = new messageModel(req.body)
        await newMessage.save();
        io.emit('message-received', newMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//! Router de mensajes en tiempo real

export const getMessages = async (req, res) => {
    try {
        const messages = await messageModel.find( { } );
        res.status(200).json(messages);

    }catch (error) {
        res.status(500).json({message: error.message});
    };
};

export const postMessage = async (req, res) => {
    const message = new messageModel(req.body)
    try {
        const newMessage = await message.save();
        res.status(201).json(newMessage);
    }catch (error) {
        res.status(500).json({message: error.message});
    };
}