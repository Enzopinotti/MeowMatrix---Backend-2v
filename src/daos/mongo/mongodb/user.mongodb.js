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

    
    getUsersView = async (page, limit, reqLogger) => {
        try {
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
            }
            const result = await userModel.paginate({}, options);
            if (!result) {
                console.log('entré')
                throw new Error('No se encontraron usuarios');
            }
            const users = result;
            const totalDocs = result.totalDocs;
            reqLogger.debug('En user.mongodb.js: getUsersView - Usuarios obtenidos con limit y page.');
            return { users, totalDocs };
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

    addDocuments = async (user, documents, reqLogger) => {
        try {

            // Verificar si ya existe un documento con la misma razón
            documents.forEach(newDoc => {
                const existingDocIndex = user.documents.findIndex(doc => doc.reason === newDoc.reason);
                if (existingDocIndex !== -1) {
                    // Actualizar el documento existente
                    reqLogger.debug(`En user.mongodb.js: uploadDocuments - Documento existe, actualizando.`);
                    user.documents[existingDocIndex] = newDoc;
                } else {
                    // Agregar el nuevo documento
                    reqLogger.debug(`En user.mongodb.js: uploadDocuments - Documento no existe, agregando.`);
                    user.documents.push(newDoc);
                }
            });
            // Guardar el usuario actualizado en la base de datos
            await user.save();
      
            reqLogger.debug(`En user.mongodb.js: uploadDocuments - Documentos cargados para el usuario con ID ${user._id}.`);
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