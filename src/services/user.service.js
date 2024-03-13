import { UserDao } from "../daos/factory.js";
import UserDTO from "../daos/DTOs/user.dto.js";

export const getUsers = async (reqLogger) => {
  try {
    const users = await UserDao.get(reqLogger);
    reqLogger.debug("En user.service.js: getUsers - Usuarios obtenidos.");
    return users;
  } catch (error) {
    reqLogger.error("En user.service.js: getUsers - Error al obtener usuarios.");
    throw error;
  }
};

export const getUserById = async (userId, reqLogger) => {
  try {
    const user = await UserDao.getById(userId, reqLogger);
    reqLogger.debug("En user.service.js: getUserById - Usuario obtenido por ID de la base de datos.");
    return user;
  } catch (error) {
    reqLogger.error("En user.service.js: getUserById - Error al obtener usuario por ID:", error);
    throw error;
  }
};

export const getUserByEmail = async (email, reqLogger) => {
  try {
    const user = await UserDao.getByEmail(email, reqLogger);
    reqLogger.debug(`En user.service.js: getUserByEmail - Usuario encontrado con email ${email}.`);
    return user;
  } catch (error) {
    reqLogger.error(`En user.service.js: getUserByEmail - Error al obtener usuario con email ${email}: ${error.message}`);
    throw error;
  }
}

export const getUserByResetToken = async (token, reqLogger) => {
  try {
    const user = await UserDao.getByResetToken(token, reqLogger);
    reqLogger.debug(`En user.service.js: getUserByResetToken - Usuario encontrado con token ${token}.`);
    return user;
  } catch (error) {
    reqLogger.error(`En user.service.js: getUserByResetToken - Error al obtener usuario con token ${token}: ${error.message}`);
    throw error;
  }
}



export const addUser = async (userData, reqLogger) => {
  try {
    const userDTO = new UserDTO(
        userData.name,
        userData.email,
        userData.password,
        userData.birthDate,
        userData.phone,
        userData.reason = 'register',
    );
      
    userDTO.validate(); // Realiza las validaciones definidas en UserDTO
  
    const userObject = userDTO.toObject(); // Obtiene el objeto formateado

    const addedUser = await UserDao.add(userObject, reqLogger);
    reqLogger.debug("En user.service.js: addUser - Usuario creado.");
    return addedUser;
  }catch (error) {
    reqLogger.error("En user.service.js: addUser - Error al crear usuario:", error);
    throw error;
  }
};



export const deleteUser = async (userId, reqLogger) => {
  try {
    const deletedUser = await UserDao.delete(userId, reqLogger);
    reqLogger.debug("En user.service.js: deleteUser - Usuario eliminado.");
    return deletedUser;
  } catch (error) {
    reqLogger.error("En user.service.js: deleteUser - Error al eliminar usuario:", error);
    throw error;
  }
};

export const updateUser = async (userId, userData, reqLogger) => {
  try {
      const userDTO = new UserDTO(
          userData.name,
          userData.email,
          userData.password,
          userData.birthDate,
          userData.phone,
          userData.reason = 'update',
      );

      userDTO.validate(); // Realiza las validaciones definidas en UserDTO
      const userObject = userDTO.toObject(); // Obtiene el objeto formateado

      const updatedUser = await UserDao.update(userId, userObject, reqLogger);
      reqLogger.debug("En user.service.js: updatedUser - Usuario actualizado.");
      return updatedUser;
  } catch (error) {
      reqLogger.error("En user.service.js: updatedUser - Error al actualizar usuario:", error);
      throw error;
  }
};

export const uploadDocuments = async (userId, files , reqLogger) => {
  try {
    // Obtener el usuario
    const user = await UserDao.getById(userId);

    // Mapear los nuevos documentos
    const documentReferences = files.map((file) => ({
      name: file.originalname,
      reference: `/documents/${file.filename}`,
      reason: file.fieldname // La razón asociada al archivo
    }));
    console.log(documentReferences);

    await UserDao.addDocuments(user, documentReferences, reqLogger);

    reqLogger.debug(`En user.service.js: uploadDocuments - Documentos cargados para el usuario con ID ${userId}.`);

  } catch (error) {
    reqLogger.error(`En user.service.js: uploadDocuments - Error al cargar documentos para el usuario con ID ${userId}: ${error.message}`);
    throw error;
  }
};

export const updateAvatar = async (userId, imagePath, reqLogger) => {
  try {
    await UserDao.updateAvatar(userId, imagePath, reqLogger);
    reqLogger.debug(`En user.service.js: updateAvatar - Avatar del usuario con ID ${userId} actualizado.`);
  } catch (error) {
    reqLogger.error(`En user.service.js: updateAvatar - Error al actualizar avatar del usuario con ID ${userId}: ${error.message}`);
      throw error;
  }
};

export const updateLastConnection = async (userId) => {
  try {
    await UserDao.updateLastConnection(userId);
  } catch (error) {
    console.error(`Error al actualizar la fecha de última conexión del usuario con ID ${userId}: ${error.message}`);
  }
}


