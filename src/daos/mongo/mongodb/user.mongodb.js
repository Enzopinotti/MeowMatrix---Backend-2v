import userModel from "../models/user.model.js";

export default class UserManager {
    constructor() {}

    get = async () => {
        try {
            const users = await userModel.find();
            return users;
        } catch (error) {
            throw error;
        }
    }

    getById = async (id) => {
        try {
            const user = await userModel.findById(id);
            return user;
        } catch (error) {
            throw error;
        }
    }

    add = async (user) => {
        try {
            const addedUser = await userModel.create(user);
            return addedUser;
        } catch (error) {
            throw error;
        }
    }

    update = async (id, user) => {
        try {
            const updatedUser = await userModel.findByIdAndUpdate(id, user, { new: true });
            return updatedUser;
        } catch (error) {
            throw error;
        }
    }

    delete = async (id) => {
        try {
            const deletedUser = await userModel.findByIdAndDelete(id);
            return deletedUser;
        } catch (error) {
            throw error;
        }
    }

    getByEmail = async (email) => {
        try {
            const user = await userModel.findOne({ email });
            return user;
        } catch (error) {
            throw error;
        }
    }

    getByUsername = async (username) => {
        try {
            const user = await userModel.findOne( { name: username })
            return user;
        } catch (error) {
            throw error;
        }
    }
    getByLastname = async (lastname) => {
        try {
            const user = await userModel.findOne({ lastName: lastname });
            return user;
        } catch (error) {
            throw error;
        }
    }

    getByResetToken = async (token) => {
        try {
            const user = await userModel.findOne({ resetPasswordToken: token });
            return user;
        } catch (error) {
            throw error;
        }
    }

    updateAvatar = async (userId, imagePath) => {
        try {
            const updatedUser = await userModel.findByIdAndUpdate(userId, { avatar: imagePath });
            return updatedUser;
        } catch (error) {
            throw error;
        }
    }

    addDocuments = async (userId, documents) => {
        try {
          // Actualiza el modelo de usuario con los documentos proporcionados
          const updatedUser = await userModel.findByIdAndUpdate(
            userId, 
            { $push: { documents: { $each: documents } } }, 
            { new: true }
          );
      
          return updatedUser;
      
        } catch (error) {
          throw error;
        }
      };

    updateLastConnection = async (userId) => {
        try {
            console.log('pasé ')
             return await userModel.findByIdAndUpdate(userId, { last_connection: new Date() });
        } catch (error) {
            throw error;
        }
    }
}