import userModel from "../models/user.model.js";

export default class UserManager {
    constructor() {}

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
    
}