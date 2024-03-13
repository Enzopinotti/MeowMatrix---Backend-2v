import moment from 'moment';
import * as userService from "../services/user.service.js";

export const showProfile = (req, res) => {
  
  const user = req.user;
  if (!user) {
    req.logger.error("En user.controller.js: showProfile - Usuario no encontrado al mostrar el perfil");
    return res.sendUserError({ status: 'error', error: 'User not found' });   
  }

  let birthDateFormated = moment(user.birthDate).add(1, 'day').format('DD/MM/YYYY');
  
  res.render('profile', { user, birthDateFormated , style: 'profile.css' , title: 'Perfil del Usuario'});
};

export const showAdminView = async (req, res) => {
  const reqLogger = req.logger;
  const user = req.user;
  const { page = 1, limit = 16 } = req.query;
  console.log(user)
  try {
    const { users, totalDocs } = await userService.getUsersView(page, limit, reqLogger);
    res.render('adminView', 
      {
        user, 
        users: users.docs,
        totalPages: users.totalPages,
        currentPage: users.page,
        hasNextPage: users.hasNextPage,
        hasPrevPage: users.hasPrevPage,
        totalDocs,
        style: 'adminView.css', 
        title: 'Administrador'
      }
    );
  } catch (error) {
    req.logger.error("En user.controller.js: showAdminView - Error al obtener usuarios:", error.message);
    res.sendServerError(error.message);
  
  }

}



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
    res.sendServerError(error.message);
  }
};

export const getUserById = async (req, res) => {
  const userId = req.params.userId;
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
    const { name, lastName, email, password, birthDate } = req.body;
    
    const addedUser = await userService.addUser(req.body, reqLogger);
    req.logger.debug("En user.controller.js: postUser - Usuario agregado con éxito.");
    res.sendCreated(addedUser);
  } catch (error) {
    req.logger.error("En user.controller.js: postUser - Error al agregar usuario:", error);
    if(error.message === "User already exists") {
      res.sendUserError(error.message);
    }else{
      res.sendServerError(error.message);
    }
    
    
  }
};

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
  }
};

export const updateUser = async (req, res) => {
  try {
    const reqLogger = req.logger;
    const updatedUser = await userService.updateUser(req.params.userId, req.body, reqLogger);
    if (!updatedUser) {
      req.logger.error("En user.controller.js: updateUser - Usuario no encontrado al actualizar");
      return res.sendNotFound('User not found');
    }
    req.logger.debug("En user.controller.js: updateUser - Usuario actualizado con éxito:");
    res.sendSuccess(updatedUser);
  } catch (error) {
    req.logger.error("En user.controller.js: updateUser - Error al actualizar usuario:", error.message);
    res.sendServerError(error.message);
  }
};

export const UploadDocuments = async (req, res) => {
  const userId = req.params.uid;
  const reqLogger = req.logger;
  try {
    if (!req.files || req.files.length === 0) {
      req.logger.error("En user.controller.js: UploadDocuments - No se han seleccionado archivos al subir documentos");
      return res.sendUserError({ error: 'No se han seleccionado archivos.' });
    }
    const files = req.files;
    console.log('Archivos: ',files)

    //Acá siempre llegan las 3 razones
    await userService.uploadDocuments(userId, files ,reqLogger);
    req.logger.debug("En user.controller.js: UploadDocuments - Documentos subidos correctamente.");
    res.sendSuccess('Documentos subidos correctamente.');

  } catch (error) {
    req.logger.error("En user.controller.js: UploadDocuments - Error al subir documentos:", error.message);
    res.sendServerError(error.message);
  }
}




export const upgradeToPremium = async (req, res) => {
  try {
    const userId = req.user._id;
    const reqLogger = req.logger;
    req.logger.debug("En user.controller.js: upgradeToPremium - Entró");
    const user = await userService.getUserById(userId, reqLogger);
    // Verificar si el usuario existe y su rol actual es "usuario"
    if (!user || user.rol !== 'usuario') {
        return res.sendNotFound('Usuario no encontrado o no es elegible para actualización.');
    }
    // Actualizar el rol del usuario a "premium"
    user.rol = 'premium';
    await user.save();
    req.logger.error("En user.controller.js: upgradeToPremium - Rol Actualizado Correctamente.");
    res.sendSuccess('Usuario actualizado a premium correctamente.');
  } catch (error) {
    req.logger.error("En user.controller.js: upgradeToPremium - Error al actualizar el rol del usuario:", error);
    res.sendServerError('Error al actualizar el rol del usuario.');
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
    const imagePath = `/img/profiles/${req.file.filename}`;

    await userService.updateAvatar(userId, imagePath, reqLogger);

    req.user.avatar = imagePath;

    
  } catch (error) {
    req.logger.error("En user.controller.js: uploadAvatar - Error al subir el avatar:", error);
    return res.status(500).json({ error: 'Error al subir el avatar.' });
  }
};