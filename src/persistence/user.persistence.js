import userModel from "../daos/models/user.model.js";

export const getUsersFromDatabase = async () => {
  try {
    return await userModel.find();
  } catch (error) {
    throw error;
  }
};

export const getUserByIdFromDatabase = async (userId) => {
  try {
    return await userModel.findById(userId);
  } catch (error) {
    throw error;
  }
};

export const updateUserInDatabase = async (userId, userData) => {
    try {
      return await userModel.findByIdAndUpdate(userId, userData, { new: true });
    } catch (error) {
      throw error;
    }
};
  
export const deleteUserFromDatabase = async (userId) => {
    try {
      const result = await userModel.findById(userId);
      return await userModel.deleteOne(result);
    } catch (error) {
      throw error;
    }
};

export const updateAvatarInDatabase = async (userId, imagePath) => {
    try {
      return await userModel.findByIdAndUpdate(userId, { avatar: imagePath });
    } catch (error) {
      throw error;
    }
};
  