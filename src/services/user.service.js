import * as userPersistence from "../persistence/user.persistence.js";

export const getUsers = async () => {
    try {
      return await userPersistence.getUsersFromDatabase();
    } catch (error) {
      throw error;
    }
};
  
export const getUserById = async (userId) => {
    try {
      return await userPersistence.getUserByIdFromDatabase(userId);
    } catch (error) {
      throw error;
    }
};

export const updateUser = async (userId, userData) => {
    try {
      return await userPersistence.updateUserInDatabase(userId, userData);
    } catch (error) {
      throw error;
    }
};
  
export const deleteUser = async (userId) => {
    try {
      return await userPersistence.deleteUserFromDatabase(userId);
    } catch (error) {
      throw error;
    }
};


export const updateAvatar = async (userId, imagePath) => {
  try {
    await userPersistence.updateAvatarInDatabase(userId, imagePath);
  } catch (error) {
    throw error;
  }
};
  