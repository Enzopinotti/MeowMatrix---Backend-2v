import userModel from "../models/user.model.js";

export default class UserManager {
    constructor() {}

<<<<<<< HEAD
    get = async (reqLogger) => {
        try {
            const users = await userModel.find();
            reqLogger.debug("En user.mongodb.js: get - Usuarios obtenidos.");
            return users;
        } catch (error) {
            reqLogger.error("En user.mongodb.js: get - Error al obtener usuarios:", error);
            return { status: "error", error: error.message }
        }
    }

    getById = async (id, reqLogger) => {
        try {
            const user = await userModel.findById(id);
            reqLogger.debug("En user.mongodb.js: getById - Usuario obtenido por ID:", user);
            return user;
        } catch (error) {
            reqLogger.error("En user.mongodb.js: getById - Error al obtener usuario por ID:", error);
            return { status: "error", error: error.message }
        }
    }

    add = async (user, reqLogger) => {
        try {
            const addedUser = await userModel.create(user);
            reqLogger.debug("En user.mongodb.js: add - Usuario creado:", addedUser);
            return addedUser;
        } catch (error) {
            reqLogger.error("En user.mongodb.js: add - Error al crear usuario:", error);
            return { status: "error", error: error.message }
        }
    }

    update = async (id, user, reqLogger) => {
        try {
            const updatedUser = await userModel.findByIdAndUpdate(id, user);
            reqLogger.debug("En user.mongodb.js: update - Usuario actualizado:", updatedUser);
            return updatedUser;
        } catch (error) {
            reqLogger.error("En user.mongodb.js: update - Error al actualizar usuario:", error);
            return { status: "error", error: error.message }
        }
    }

    delete = async (id, reqLogger) => {
        try {
            const deletedUser = await userModel.findByIdAndDelete(id);
            reqLogger.debug("En user.mongodb.js: delete - Usuario eliminado:", deletedUser);
            throw error;
        } catch (error) {
            reqLogger.error("En user.mongodb.js: delete - Error al eliminar usuario:", error);
            throw error;
        }
    }

    getByEmail = async (email, reqLogger) => {
        try {
            const user = await userModel.findOne({ email });
            reqLogger.debug("En user.mongodb.js: getByEmail - Usuario obtenido por email:", user);
            return user;
        } catch (error) {
            reqLogger.error("En user.mongodb.js: getByEmail - Error al obtener usuario por email:", error);
            throw error;
        }
    }

    getByUsername = async (username, reqLogger) => {
        try {
            const user = await userModel.findOne({ username });
            reqLogger.debug("En user.mongodb.js: getByUsername - Usuario obtenido por username:", user);
            return user;
        } catch (error) {
            reqLogger.error("En user.mongodb.js: getByUsername - Error al obtener usuario por username:", error);
            throw error;
        }
    }

    updateAvatar = async (userId, imagePath, reqLogger) => {
        try {
            const updatedUser = await userModel.findByIdAndUpdate(userId, { avatar: imagePath });
            reqLogger.debug(`En user.mongodb.js: updateAvatar - Avatar del usuario con ID ${userId} actualizado a ${imagePath}`);
            return updatedUser;
        } catch (error) {
            reqLogger.error(`En user.mongodb.js: updateAvatar - Error al actualizar avatar del usuario con ID ${userId}: ${error.message}`);
            throw error;
        }
    }
=======
    get = async () => {
        try {
            return await userModel.find();
        } catch (error) {
            return { status: "error", error: error.message }
        }
        
    }

    getById = async (id) => {
        try {
            return await userModel.findById(id);
        } catch (error) {
            return { status: "error", error: error.message }
        }
        
    }

    add = async (user) => {
        try {
            return await userModel.create(user);
        } catch (error) {
            return { status: "error", error: error.message }
        }
        
    }

    update = async (id, user) => {
        try {
            return await userModel.findByIdAndUpdate(id, user);
        } catch (error) {
            return { status: "error", error: error.message }
        }
       
    }

    delete = async (id) => {
        try {
            return await userModel.findByIdAndDelete(id);
        } catch (error) {
            return { status: "error", error: error.message }
        }
        
    }

    getByEmail = async (email) => {
        try {
            return await userModel.findOne({email});
        } catch (error) {
            return { status: "error", error: error.message }
        }
        
    }

    getByUsername = async (username) => {
        try {
            return await userModel.findOne({username});
        } catch (error) {
            return { status: "error", error: error.message }
        }
        
    }
    

    updateAvatar = async (userId, imagePath) => {
        try {
            return await userModel.findByIdAndUpdate(userId, { avatar: imagePath });
        } catch (error) {
            
        }
        
    }
    
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
}