import { MessageDao } from "../daos/factory.js";




export const getRealTimeMessages = async () => {
  try {
    return await MessageDao.get();
  } catch (error) {
    throw error;
  }
};

export const postRealTimeMessage = async (messageData) => {
  try {
    return await MessageDao.add(messageData);
  } catch (error) {
    throw error;
  }
};

export const getMessages = async () => {
  try {
    return await MessageDao.get();
  } catch (error) {
    throw error;
  }
};

export const postMessage = async (messageData) => {
  try {
    return await MessageDao.add(messageData);
  } catch (error) {
    throw error;
  }
};