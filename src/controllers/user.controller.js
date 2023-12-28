import userModel from "../daos/models/user.model.js";
import moment from 'moment';


export const showProfile = (req, res) => {
    const user = req.session.user;

    if (!user) {
        // Si el usuario no está definido
        return res.redirect('/login'); // Redirige a la página de login o muestra un mensaje adecuado
    }

    let birthDateFormated = moment(user.birthDate).add(1, 'day').format('DD/MM/YYYY');

    res.render('profile', { user: { ...user, birthDate: birthDateFormated }, style: 'profile.css' , title: 'Perfil del Usuario'});
};


export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No se ha seleccionado ningún archivo.');
        }
        // Obtener el ID del usuario desde la sesión
        const userId = req.session.user._id;


        // Guardar la ruta del archivo en la base de datos
        const imagePath = `/img/avatars/${req.file.filename}`;
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { avatar: imagePath },
            { new: true }
        );

         // Actualiza el campo 'avatar' en la base de datos del usuario con la ruta del archivo
         
        req.session.user.avatar = imagePath;

         // Guarda la sesión para que se actualice con la nueva ruta de la imagen
        req.session.save((err) => {
             if (err) {
                 console.error('Error al guardar la sesión:', err);
             }
             
        });

        return res.status(200).redirect('/profile');
    } catch (error) {
        console.error('Error al subir el avatar:', error);
        return res.status(500).send('Error al subir el avatar.');
    }
};

export const getUsers = async (req, res) => {
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
};

export const getUserById = async (req, res) => {
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
}

export const postUser = async (req, res) => {
    const user = new userModel(req.body);
    try {
      const addedUser = await user.save();
      //io.emit('usuario-agregado', { usuario: addedUser });
      res.status(201).json(addedUser);
    }
    catch (error) {
      res.status(500).json({ error: error.message });
    };
};

export const deleteUser = async (req, res) => {
    const userId = req.params.pid;
    try {
        const result = await userModel.findById(userId);
        const userEliminated = await userModel.deleteOne(result);
        res.status(200).json(userEliminated);
    } 
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const updateUser = async (req, res) => {
    try {

        const updatedUser = await userModel.findByIdAndUpdate(req.params.userId, req.body, { new: true, });
        if(!updatedUser){
          return res.status(404).json({message: 'User not found'});
        }
        res.status(200).json(updatedUser);

    }catch (error) {
        res.status(500).json({ error: error.message });
    }
}