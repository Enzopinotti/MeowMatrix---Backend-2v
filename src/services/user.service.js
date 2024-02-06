import { UserDao } from "../daos/factory.js";
import UserDTO from "../daos/DTOs/user.dto.js";

<<<<<<< HEAD
export const getUsers = async (reqLogger) => {
  try {
    const users = await UserDao.get(reqLogger);
    reqLogger.debug("En user.service.js: getUsers - Usuarios obtenidos:", users);
    return users;
  } catch (error) {
    reqLogger.error("En user.service.js: getUsers - Error al obtener usuarios:", error);
    throw error;
  }
};

export const getUserById = async (userId, reqLogger) => {
  try {
    const user = await UserDao.getById(userId, reqLogger);
    reqLogger.debug("En user.service.js: getUserById - Usuario obtenido por ID:", user);
    return user;
  } catch (error) {
    reqLogger.error("En user.service.js: getUserById - Error al obtener usuario por ID:", error);
    throw error;
  }
};

export const addUser = async (userData, reqLogger) => {
  try {
    const userDTO = new UserDTO(
        userData.name,
        userData.email,
        userData.password,
        userData.birthDate,
        userData.phone
    );

        userDTO.validate(); // Realiza las validaciones definidas en UserDTO
        const userObject = userDTO.toObject(); // Obtiene el objeto formateado

        const addedUser = await UserDao.add(userObject, reqLogger);
        reqLogger.debug("En user.service.js: addUser - Usuario creado:", addedUser);
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
            userData.phone
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

export const updateAvatar = async (userId, imagePath, reqLogger) => {
  try {
    await UserDao.updateAvatar(userId, imagePath, reqLogger);
    reqLogger.debug(`En user.service.js: updateAvatar - Avatar del usuario con ID ${userId} actualizado.`);
  } catch (error) {
    reqLogger.error(`En user.service.js: updateAvatar - Error al actualizar avatar del usuario con ID ${userId}: ${error.message}`);
      throw error;
  }
};
=======
export const getUsers = async () => {
    try {
      return await UserDao.get();
    } catch (error) {
      throw error;
    }
};
  
export const getUserById = async (userId) => {
    try {
      return await UserDao.getById(userId);
    } catch (error) {
      throw error;
    }
};

export const addUser = async (userData) => {
  try {
    const userDTO = new UserDTO(
      userData.name,
      userData.email,
      userData.password,
      userData.birthDate,
      userData.phone
    );
    userDTO.validate(); // Realiza las validaciones definidas en UserDTO
    const userObject = userDTO.toObject(); // Obtiene el objeto formateado

    return await UserDao.add(userObject);
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const userDTO = new UserDTO(
      userData.name,
      userData.email,
      userData.password,
      userData.birthDate,
      userData.phone
    );

    userDTO.validate(); // Realiza las validaciones definidas en UserDTO

    const userObject = userDTO.toObject(); // Obtiene el objeto formateado

    return await UserDao.update(userId, userObject);
  } catch (error) {
    throw error;
  }
};
export const deleteUser = async (userId) => {
    try {
      return await UserDao.delete(userId);
    } catch (error) {
      throw error;
    }
};


export const updateAvatar = async (userId, imagePath) => {
  try {
    await UserDao.updateAvatar(userId, imagePath);
  } catch (error) {
    throw error;
  }
};


  
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
