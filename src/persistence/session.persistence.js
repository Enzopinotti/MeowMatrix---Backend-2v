import userModel from '../daos/models/user.model.js';

export const registerUserToDatabase = async (userData) => {
  try {
    const newUser = new userModel(userData);
    return await newUser.save();
  } catch (error) {
    throw error;
  }
};

export const loginUserFromDatabase = async (email, password) => {
  try {
    return await userModel.findOne({ email, password }).lean();
  } catch (error) {
    throw error;
  }
};

export const updatePasswordInDatabase = async (email, newPassword) => {
  try {
    return await userModel.updateOne({ email }, { $set: { password: newPassword } });
  } catch (error) {
    throw error;
  }
};