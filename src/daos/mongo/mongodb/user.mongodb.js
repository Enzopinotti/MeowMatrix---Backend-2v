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

    getByIdWithLikes = async (id) => {
        try {
            console.log('id en mongodb:', id)
            const user = await userModel.findById(id).populate('likes');
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

    updateAvatar = async (userId, imagePath) => {
        try {
            const updatedUser = await userModel.findByIdAndUpdate(userId, { avatar: imagePath });
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

     deleteInactive = async (reqLogger) => {
        try {
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
            // Obtener usuarios inactivos
            const inactiveUsers = await userModel.find({ last_connection: { $lt: twoDaysAgo } });
    
            // Guardar los usuarios inactivos en una variable
            const usersToDelete = inactiveUsers.map(user => user._id);
    
            // Puedes imprimir los usuarios inactivos aquí para verificar antes de eliminarlos
            console.log('Usuarios inactivos:', inactiveUsers);
    
            // Eliminar usuarios inactivos
            // const result = await userModel.deleteMany({ _id: { $in: usersToDelete } });
            // return result;
    
            // Temporalmente devolvemos los usuarios inactivos para verificación
            return inactiveUsers;
        } catch (error) {
            reqLogger.error("En user.mongodb.js: deleteInactive - Error al eliminar usuarios inactivos:", error.message);
            throw error;
        }
    };
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

            return user;
        } catch (error) {
            throw error;
        }   
        
    };

    handleLike = async (userId, postId) => {
        try {
            const user = await userModel.findById(userId);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            if (!user.likes) {
                user.likes = [];
            }
    
            const index = user.likes.indexOf(postId); // Busca el índice del postId en los likes del usuario
    
            if (index === -1) {
                // Si el postId no está en los likes del usuario, lo agregamos
                user.likes.push(postId);
            } else {
                // Si el postId está en los likes del usuario, lo eliminamos
                user.likes.splice(index, 1);
            }
    
            await user.save();
            return user; // Devolvemos el usuario actualizado
        } catch (error) {
            throw error;  
        }
    }
    deleteLike = async (userId, productId) => {
        try {
            const user = await userModel.findById(userId);
            console.log('usuario: ', user)
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            if (!user.likes) {
                user.likes = [];
            }
            console.log('ProductId: ', productId)
            user.likes = user.likes.filter(id => id.toString() !== productId);
            console.log('likes: ', user.likes)
            await user.save();
        } catch (error) {
            throw error;
        }
    }
    updateLastConnection = async (userId) => {
        try {
             return await userModel.findByIdAndUpdate(userId, { last_connection: new Date() });
        } catch (error) {
            throw error;
        }
    }
}