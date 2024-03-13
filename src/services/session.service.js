import { sessionDao } from '../daos/factory.js';
import SessionDTO from '../daos/DTOs/session.dto.js'; // Asegúrate de ajustar la ruta según la estructura de tu proyecto


export const updatePassword = async (email, newPassword) => {
  try {
    const sessionData = new SessionDTO(email, newPassword);
    sessionData.validate();
    return await sessionDao.updatePassword(email, newPassword);
  } catch (error) {
    throw error;
  }
};



