import userModel from '../models/user.model.js';

export default class SessionManager {
    constructor() {}
    updatePassword = async (email, newPassword) => {
        try {
            return await userModel.updateOne({ email }, { $set: { password: newPassword } });
        } catch (error) {
            throw error;
        }
    }
}