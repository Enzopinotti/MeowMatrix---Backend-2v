import express from 'express';
import { UserManager } from '../daos/filesystem/UserManager.js';
import  userModel  from '../daos/models/user.model.js';



const userRouter = express.Router();

const filePath = 'archivos/usuarios.json';
const manager = new UserManager(filePath);

userRouter.get('/', async (req, res)=>{

    const limit = req.query.limit; // Obtén el límite de usuarios desde los parámetros de consulta

    try {
        const users = await userModel.find();  
      if (limit) {
        const limitedUsers = users.slice(0, limit);
        res.status(200).json(limitedUsers);
      } else {
        res.status(200).json(users);
      }
    } catch (error) {
      res.status(500).json({message: error.message});
    }
});

userRouter.get('/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.status(200).json(user);

    } catch (error) {

      res.status(500).json({ error: error.message });
      
    }
});

userRouter.post('/', async (req, res)=>{
    
  const user = new userModel(req.body);
  try {
    const addedUser = await user.save();
    //io.emit('usuario-agregado', { usuario: addedUser });
    res.status(201).json(addedUser);
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }  
})

userRouter.delete('/:userId', async (req, res) => {
  const userId = req.params.pid;
  try {
    const result = await userModel.findById(userId);
    const userEliminated = await userModel.deleteOne(result);
    res.status(200).json(userEliminated);
  } 
  catch (error) {
    res.status(500).json({ error: error.message });
  }

});

userRouter.put('/:userId', async (req, res) => {

  try {
    const updatedUser = await userModel.findByIdAndUpdate(
      req.params.userId, req.body, { new: true, }  
    );
    if(!updatedUser){
      return res.status(404).json({message: 'User not found'});
    }
      res.status(200).json(updatedUser);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


export { userRouter };