import { UserDao } from "../daos/factory.js";
import UserDTO from "../daos/DTOs/user.dto.js";

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


  