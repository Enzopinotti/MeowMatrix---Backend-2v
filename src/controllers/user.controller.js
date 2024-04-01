import moment from 'moment';
import * as userService from "../services/user.service.js";
import { generateToken, obtenerTokenDeCookie } from '../utils.js';
import config from '../config/server.config.js'
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { __dirname } from '../utils.js';
import { sendInactiveAccountEmail, sendPremiumAcceptanceEmail, sendPremiumRejectionEmail, sendUserDeletionEmail } from './mail.controller.js';

const PRIVATE_KEY = config.tokenKey;

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
  const { page = 1, limit = 7 } = req.query;
  const reqLogger = req.logger;
  
  try {
    const { users, totalDocs } = await userService.getUsersView(page, limit, reqLogger);

    // Crear una nueva lista de usuarios sin incluir la contraseña
    const simplifiedUsers = users.docs.map(doc => {
      const user = doc.toObject(); // Convertir el documento a un objeto plano
      const { password, ...simplifiedUser } = user;
      return simplifiedUser;
    });

    // Envía la respuesta sin incluir la contraseña
    res.sendSuccess({ users: { docs: simplifiedUsers }, totalDocs });
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

export const getUserByEmail = async (req, res) => {
  const userEmail = req.params.userEmail;
  const reqLogger = req.logger;
  try {
    const user = await userService.getUserByEmail(userEmail, reqLogger);
    if (!user) {
      req.logger.error("En user.controller.js: getUserByEmail - Usuario no encontrado al obtener por email");
      return res.sendUserError({ error: 'Usuario no encontrado' });
    }

    req.logger.debug("En user.controller.js: getUserByEmail - Usuario obtenido por email con exito.");
    res.sendSuccess(user);

  } catch (error) {
    req.logger.error("En user.controller.js: getUserByEmail - Error al obtener usuario por email:", error.message);
    res.sendServerError({ error: error.message });
  }
}

export const obtenerFavoritos  = async (req, res) => {
  const token = obtenerTokenDeCookie(req.headers.cookie);
  const decoded = jwt.verify(token, PRIVATE_KEY);
  const user = decoded.user
  const reqLogger = req.logger;
  
  try {
    if (!user) {
      req.logger.error("En user.controller.js: obtenerFavoritos - Usuario no encontrado al obtener favoritos");
      return res.sendUserError({ error: 'Usuario no encontrado' });
    }else{
      const userId = user._id;
      const userWhitLikes = await userService.getUserByIdWithLikes(userId, reqLogger);
      if (!userWhitLikes) {
        req.logger.error("En user.controller.js: obtenerFavoritos - Error al obtener usuario con likes");
        return res.sendUserError({ error: 'Usuario no encontrado' });
      }
      const favoritos = userWhitLikes.likes;
      req.logger.debug("En user.controller.js: obtenerFavoritos - Usuario obtenido por ID con exito.");
      res.sendSuccess(favoritos);
    }
    

  } catch (error) {
    req.logger.error("En user.controller.js: obtenerFavoritos - Error al obtener usuario por ID:", error.message);
    res.sendServerError({ error: error.message });
  }
}


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
      const user = await userService.deleteUser(userId, reqLogger);

      // Envía un correo electrónico de notificación de eliminación de usuario
      await sendUserDeletionEmail(user.email, user.name);

      reqLogger.debug("En user.controller.js: deleteUser -  Usuario eliminado con éxito:", user);
      res.sendSuccess(user);
  } catch (error) {
      reqLogger.error("En user.controller.js: deleteUser - Error al eliminar usuario:", error.message);
      res.sendServerError(error.message);
  }
};

export const handleDeleteInactiveUsers = async (req, res) => {
  const reqLogger = req.logger;
  try {
      const deletedUsers = await userService.deleteInactiveUsers(reqLogger);
      reqLogger.debug("En user.controller.js: handleDeleteInactiveUsers - Usuarios inactivos eliminados con éxito:", deletedUsers);

      // Envía un correo electrónico a cada usuario eliminado
      for (const user of deletedUsers) {
        await sendInactiveAccountEmail(user.email, user.name);
      }

      res.sendSuccess(deletedUsers);
  } catch (error) {
      reqLogger.error("En user.controller.js: handleDeleteInactiveUsers - Error al eliminar usuarios inactivos:", error.message);
      res.sendServerError(error.message);
  }
};


export const updateUser = async (req, res) => {
  try {
    const reqLogger = req.logger;
    const updatedFields = req.body;
    const updatedUser = await userService.updateUser(req.params.userId, updatedFields, reqLogger);
    if (!updatedUser) {
      req.logger.error("En user.controller.js: updateUser - Usuario no encontrado al actualizar");
      return res.sendNotFound('User not found');
    }
    req.logger.debug("En user.controller.js: updateUser - Usuario actualizado con éxito:");
    const newToken = generateToken(updatedUser);
    console.log('newUser: ', updatedUser)
    res.cookie('access_token', newToken, { maxAge: 3600000, httpOnly: true });
    res.sendSuccess({ user:updatedUser , token: newToken });
  } catch (error) {
    req.logger.error("En user.controller.js: updateUser - Error al actualizar usuario:", error.message);
    res.sendServerError(error.message);
  }
};

export const uploadAvatar = async (req, res) => {
  const reqLogger = req.logger;
  const token = obtenerTokenDeCookie(req.headers.cookie);
  const decoded = jwt.verify(token, PRIVATE_KEY);
  const user = decoded.user
  try {
    if (!req.file) {
      req.logger.error("En user.controller.js: uploadAvatar - No se ha seleccionado ningún archivo al subir el avatar");
      return res.sendUserError('No se ha seleccionado ningún archivo.');
    }
    const userId = user._id;
    const imagePath = `/img/profiles/${req.file.filename}`;
    const userPrevious = await userService.getUserById(userId, reqLogger);
    const previousAvatarPath = userPrevious.avatar;
    // Elimina el avatar anterior del servidor si existe
    if (previousAvatarPath) {
        const avatarFilePath = path.join(__dirname, '..', '..', 'Proyecto_Backend-main', 'src','public', previousAvatarPath);
        console.log('avatarFilePath:', avatarFilePath)
        if (fs.existsSync(avatarFilePath)) {
            fs.unlinkSync(avatarFilePath);
        }
    }
    await userService.updateAvatar(userId, imagePath, reqLogger);

    user.avatar = imagePath;
    const newToken = generateToken(user);
    res.cookie('access_token', newToken, { maxAge: 3600000, httpOnly: true }); // Actualiza la cookie con el nuevo token
    res.sendSuccess({ user, token: newToken });// Enviar el usuario actualizado con el avatar actualizado

  } catch (error) {
    req.logger.error("En user.controller.js: uploadAvatar - Error al subir el avatar:", error);
    return res.status(500).json('Error al subir el avatar.');
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
    const user = await userService.uploadDocuments(userId, files ,reqLogger);
    req.logger.debug("En user.controller.js: UploadDocuments - Documentos subidos correctamente.");
    res.sendSuccess(user);

  } catch (error) {
    req.logger.error("En user.controller.js: UploadDocuments - Error al subir documentos:", error.message);
    res.sendServerError(error.message);
  }
}

export const handleLike = async (req, res) => {
  try {
    console.log('entre a controller')
    const reqLogger = req.logger;
    const token = obtenerTokenDeCookie(req.headers.cookie);
    const decoded = jwt.verify(token, PRIVATE_KEY);
    const user = decoded.user
    const userId = user._id;
    const productId = req.params.productId;
    const newUser = await userService.handleLike(userId, productId, reqLogger);
    req.logger.debug("En user.controller.js: handleLike - Like/Dislike realizado con éxito");
    res.sendSuccess({ newUser }); // Aquí enviamos un objeto con la propiedad 'liked' al cliente
  } catch (error) {
    req.logger.error("En user.controller.js: handleLike - Error al realizar like/dislike:", error.message);
    res.sendServerError(error.message);
  }
}

export const deleteLike = async (req, res) => {
  try {
    const reqLogger = req.logger;
    const token = obtenerTokenDeCookie(req.headers.cookie);
    const decoded = jwt.verify(token, PRIVATE_KEY);
    const user = decoded.user;
    const userId = user._id;
    const productId = req.params.productId;

    // Lógica para eliminar el like/dislike asociado al producto
     await userService.deleteLike(userId, productId, reqLogger);

    req.logger.debug("En user.controller.js: deleteLike - Like/Dislike eliminado con éxito");
    res.sendSuccess(); // Aquí enviamos un objeto con la propiedad 'removed' al cliente
  } catch (error) {
    req.logger.error("En user.controller.js: deleteLike - Error al eliminar like/dislike:", error.message);
    res.sendServerError(error.message);
  }
}

export const requestPremium = async (req, res) => {
  try {
    const reqLogger = req.logger;
    const token = obtenerTokenDeCookie(req.headers.cookie);
    const decoded = jwt.verify(token, PRIVATE_KEY);
    const userId = decoded.user._id;
    const user = await userService.getUserById(userId, reqLogger);
    // Verificar si el usuario existe y su rol actual es "usuario"
    if (!user || user.rol !== 'usuario') {
        return res.sendNotFound('Usuario no es elegible para actualización.');
    }
    
    // Verificar si el usuario tiene los tres documentos
    const requiredReasons = ['identification', 'address', 'bankStatement']; // Los nombres de los tres documentos requeridos
    const userDocuments = user.documents.map(doc => doc.reason);
    const hasAllDocuments = requiredReasons.every(reason => userDocuments.includes(reason));

    // Si el usuario tiene los tres documentos, actualiza el atributo wantPremium a true
    if (hasAllDocuments) {
        user.wantPremium = true;
        await user.save();
        return res.sendSuccess('Solicitud para ser Premium Enviada.');
    } else {
      
        return res.sendUserError('El usuario no tiene todos los documentos requeridos.');
    }
  } catch (error) {
    console.error('Error al actualizar el rol del usuario:', error);
    return res.sendServerError('Error al actualizar el rol del usuario.');
  }
};

export const handlePremium = async (req, res) => {
  const reqLogger = req.logger;
  const { userId }= req.params;
  const { action } = req.body;
  
  try {
      const user = await userService.getUserById(userId, reqLogger);
      if (!user) {
          return res.sendNotFound('Usuario no encontrado');
      }
      if (action === 'accept') {
          user.rol = 'premium';
          user.wantPremium = false;
          await user.save();

          // Envía un correo electrónico de aceptación de premium
          await sendPremiumAcceptanceEmail(user.email, user.name);

          return res.sendSuccess(user);
      } else if (action === 'reject') {
          user.rol = 'usuario';
          user.wantPremium = false;
          await user.save();
          await sendPremiumRejectionEmail(user.email, user.name);
          return res.sendSuccess(user);
      } else {
          return res.sendServerError('Acción no válida');
      }
  } catch (error) {
      console.error('Error al actualizar el rol del usuario:', error);
      return res.sendServerError('Error al actualizar el rol del usuario.');
  }
};

