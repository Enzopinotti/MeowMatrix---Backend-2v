import moment from 'moment';
import * as userService from "../services/user.service.js";

export const showProfile = (req, res) => {
  const user = req.user;
  if (!user) {
    return res.sendUserError({ status: 'error', error: 'User not found' });   
  }

  let birthDateFormated = moment(user.birthDate).add(1, 'day').format('DD/MM/YYYY');
  
  res.render('profile', { user, birthDateFormated , style: 'profile.css' , title: 'Perfil del Usuario'});
};


export const uploadAvatar = async (req, res) => {
  try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se ha seleccionado ningún archivo.' });
      }

      const userId = req.user._id;
      const imagePath = `/img/avatars/${req.file.filename}`;

      await userService.updateAvatar(userId, imagePath);

      req.user.avatar = imagePath;

      req.session.save((err) => {
        if (err) {
            console.error('Error al guardar la sesión:', err);
            return res.status(500).json({ error: 'Error al guardar la sesión.' });
        }

        return res.redirect('/profile');
      });
  } catch (error) {
    console.error('Error al subir el avatar:', error);
    return res.status(500).json({ error: 'Error al subir el avatar.' });
  }
};

export const getUsers = async (req, res) => {
  const limit = req.query.limit; // Obtén el límite de usuarios desde los parámetros de consulta
  try {
    const users = await userService.getUsers();  
    if (limit) {
      const limitedUsers = users.slice(0, limit);
      res.sendSuccess(limitedUsers);
    } else {
      res.sendSuccess(users);
    }
  } catch (error) {
    res.sendServerError(error.message);
  }
};

export const getUserById = async (req, res) => {
  const userId = req.params.userId;
  try {

    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json(user);

  } catch (error) {

    res.status(500).json({ error: error.message });
    
  }
}

export const postUser = async (req, res) => {
  try {
    // Validar propiedades del usuario antes de agregarlo
    const { name, lastName, email, password, birthDate } = req.body;

    if (!name || !lastName || !email || !password || !birthDate) {
      // Lanza un error personalizado si faltan propiedades o son inválidas
      throw CustomError.createError(
        EnumError.INVALID_VALUES_ERROR,
        'Invalid user properties',
        req.body
      );
    }

    const addedUser = await userService.addUser(req.body);
    res.sendSuccess(addedUser);
  } catch (error) {
    // Manejo de errores
    if (error instanceof CustomError) {
      // Puedes personalizar la respuesta según el tipo de error
      switch (error.code) {
        case EnumError.INVALID_VALUES_ERROR:
          return res.sendUserError({ status: 'error', error: error.message });
        default:
          return res.sendServerError(error.message);
      }
    } else {
      // Otros errores no personalizados
      res.sendServerError(error.message);
    }
  }
};
export const deleteUser = async (req, res) => {
  const userId = req.params.userId;
  try {
      const result = await userService.deleteUser(userId);
      res.sendSuccess(result);
  } catch (error) {
      res.sendServerError(error.message);
  }
};

export const updateUser = async (req, res) => {
  try {
    const updatedUser = await userService.updateUser(req.params.userId, req.body);
      if (!updatedUser) {
          return res.sendNotFound('User not found');
      }
      res.sendSuccess(updatedUser);
  } catch (error) {
      res.sendServerError(error.message);
  }
};