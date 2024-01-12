import * as sessionPersistence from '../persistence/session.persistence.js';


export const registerUser = async (userData) => {
  try {
    const user = await sessionPersistence.registerUserToDatabase(userData);
    return user;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    return await sessionPersistence.loginUserFromDatabase(email, password);
  } catch (error) {
    throw error;
  }
};

export const updatePassword = async (email, newPassword) => {
  try {
    return await sessionPersistence.updatePasswordInDatabase(email, newPassword);
  } catch (error) {
    throw error;
  }
};