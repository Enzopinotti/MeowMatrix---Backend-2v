import moment from 'moment';
import * as userService from "../services/user.service.js";

export const showProfile = (req, res) => {
<<<<<<< HEAD
  
  const user = req.user;
  if (!user) {
    req.logger.error("En user.controller.js: showProfile - Usuario no encontrado al mostrar el perfil");
=======
  const user = req.user;
  if (!user) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    return res.sendUserError({ status: 'error', error: 'User not found' });   
  }

  let birthDateFormated = moment(user.birthDate).add(1, 'day').format('DD/MM/YYYY');
  
  res.render('profile', { user, birthDateFormated , style: 'profile.css' , title: 'Perfil del Usuario'});
};


<<<<<<< HEAD
export const getUsers = async (req, res) => {
  
  const limit = req.query.limit;
  const reqLogger = req.logger;
  try {
    const users = await userService.getUsers(reqLogger);  
    if (limit) {
      const limitedUsers = users.slice(0, limit);
      req.logger.debug("En user.controller.js: getUsers - Usuarios obtenidos:", limitedUsers);
      res.sendSuccess(limitedUsers);
    } else {
      req.logger.debug("En user.controller.js: getUsers - Todos los usuarios obtenidos:", users);
      res.sendSuccess(users);
    }
  } catch (error) {
    req.logger.error("En user.controller.js: getUsers -  Error al obtener usuarios:", error.message);
=======
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
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    res.sendServerError(error.message);
  }
};

export const getUserById = async (req, res) => {
  const userId = req.params.userId;
<<<<<<< HEAD
  const reqLogger = req.logger;
  try {
    const user = await userService.getUserById(userId, reqLogger);
    if (!user) {
      req.logger.error("En user.controller.js: getUserById - Usuario no encontrado al obtener por ID");
      return res.sendUserError({ error: 'Usuario no encontrado' });
    }

    req.logger.debug("En user.controller.js: getUserById - Usuario obtenido por ID con exito.");
    res.sendSuccess(user);

  } catch (error) {
    req.logger.error("En user.controller.js: getUserById - Error al obtener usuario por ID:", error.message);
    res.sendServerError({ error: error.message });
  }
};

export const postUser = async (req, res) => {
  try {
    const reqLogger = req.logger;
=======
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
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    const { name, lastName, email, password, birthDate } = req.body;

    if (!name || !lastName || !email || !password || !birthDate) {
      // Lanza un error personalizado si faltan propiedades o son inválidas
      throw CustomError.createError(
        EnumError.INVALID_VALUES_ERROR,
        'Invalid user properties',
        req.body
      );
    }

<<<<<<< HEAD
    const addedUser = await userService.addUser(req.body, reqLogger);
    req.logger.debug("En user.controller.js: postUser - Usuario agregado con éxito:", addedUser);
=======
    const addedUser = await userService.addUser(req.body);
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    res.sendSuccess(addedUser);
  } catch (error) {
    // Manejo de errores
    if (error instanceof CustomError) {
      // Puedes personalizar la respuesta según el tipo de error
      switch (error.code) {
        case EnumError.INVALID_VALUES_ERROR:
<<<<<<< HEAD
          req.logger.error("En user.controller.js:  postUser - Propiedades de usuario inválidas al agregar usuario");
          return res.sendUserError({ status: 'error', error: error.message });
        default:
          req.logger.error("En user.controller.js: postUser - Error al agregar usuario:", error.message);
=======
          return res.sendUserError({ status: 'error', error: error.message });
        default:
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
          return res.sendServerError(error.message);
      }
    } else {
      // Otros errores no personalizados
<<<<<<< HEAD
      req.logger.error("En user.controller.js: postUser - Error al agregar usuario:", error.message);
=======
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
      res.sendServerError(error.message);
    }
  }
};
<<<<<<< HEAD

export const deleteUser = async (req, res) => {
  const userId = req.params.userId;
  const reqLogger = req.logger;
  try {
    const result = await userService.deleteUser(userId, reqLogger);
    req.logger.debug("En user.controller.js: deleteUser -  Usuario eliminado con éxito:", result);
    res.sendSuccess(result);
  } catch (error) {
    req.logger.error("En user.controller.js: deleteUser - Error al eliminar usuario:", error.message);
    res.sendServerError(error.message);
=======
export const deleteUser = async (req, res) => {
  const userId = req.params.userId;
  try {
      const result = await userService.deleteUser(userId);
      res.sendSuccess(result);
  } catch (error) {
      res.sendServerError(error.message);
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
  }
};

export const updateUser = async (req, res) => {
  try {
<<<<<<< HEAD
    const reqLogger = req.logger;
    const updatedUser = await userService.updateUser(req.params.userId, req.body, reqLogger);
    if (!updatedUser) {
      req.logger.error("En user.controller.js: updateUser - Usuario no encontrado al actualizar");
      return res.sendNotFound('User not found');
    }
    req.logger.debug("En user.controller.js: updateUser - Usuario actualizado con éxito:", updatedUser);
    res.sendSuccess(updatedUser);
  } catch (error) {
    req.logger.error("En user.controller.js: updateUser - Error al actualizar usuario:", error.message);
    res.sendServerError(error.message);
  }
};


export const uploadAvatar = async (req, res) => {
  const reqLogger = req.logger;
  try {
    if (!req.file) {
      req.logger.error("En user.controller.js: uploadAvatar - No se ha seleccionado ningún archivo al subir el avatar");
      return res.sendUserError({ error: 'No se ha seleccionado ningún archivo.' });
    }

    const userId = req.user._id;
    const imagePath = `/img/avatars/${req.file.filename}`;

    await userService.updateAvatar(userId, imagePath, reqLogger);

    req.user.avatar = imagePath;

    req.session.save((err) => {
      if (err) {
        req.logger.error("En user.controller.js: uploadAvatar - Error al guardar la sesión al subir el avatar:", err);
        return res.status(500).json({ error: 'Error al guardar la sesión.' });
      }

      req.logger.debug("En user.controller.js: uploadAvatar - Avatar subido con éxito");
      return res.redirect('/profile');
    });
  } catch (error) {
    req.logger.error("En user.controller.js: uploadAvatar - Error al subir el avatar:", error);
    return res.status(500).json({ error: 'Error al subir el avatar.' });
=======
    const updatedUser = await userService.updateUser(req.params.userId, req.body);
      if (!updatedUser) {
          return res.sendNotFound('User not found');
      }
      res.sendSuccess(updatedUser);
  } catch (error) {
      res.sendServerError(error.message);
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
  }
};