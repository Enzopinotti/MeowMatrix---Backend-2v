import express from 'express';
import { UserManager } from '../UserManager.js'

const userRouter = express.Router();

const filePath = 'archivos/usuarios.json';
const manager = new UserManager(filePath);

userRouter.get('/', async (req, res)=>{

    const limit = req.query.limit; // Obtén el límite de usuarios desde los parámetros de consulta

    try {
        
        const users = await manager.getUsers();
  
      if (limit) {

        const limitedUsers = users.slice(0, parseInt(limit));

        res.json(limitedUsers);

      } else {

        res.status(200).json(users);

      }

    } catch (error) {

      res.status(500).json({ error: error.message });

    }
});

userRouter.get('/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {

      const user = await manager.getUserById(parseInt(userId));
      console.log(user);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.status(200).json(user);

    } catch (error) {

      res.status(500).json({ error: error.message });
      
    }
});

userRouter.post('/', async (req, res)=>{
    const newUser = req.body;
    console.log(newUser);
    try {
        const addedUser = await manager.addUser(newUser);
        res.status(201).json(addedUser);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
})

userRouter.delete('/:userId', async (req, res) => {

    const userId = req.params.userId;
    const numericUserId = parseInt(userId);
    try {
        const result = await manager.deleteUser(numericUserId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

userRouter.put('/:userId', async (req, res) => {
    const userId = req.params.userId;
    const numericuUserId = parseInt(userId);
    const updatedFields = req.body;
    try {
        const updatedUser  = await manager.updateUser(numericuUserId, updatedFields);
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


export { userRouter };