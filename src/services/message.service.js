import * as messagePersistence from '../persistence/message.persistence.js';

export const getRealTimeMessages = async () => {
  try {
    return await messagePersistence.getRealTimeMessagesFromDatabase();
  } catch (error) {
    throw error;
  }
};

export const postRealTimeMessage = async (messageData) => {
  try {
    return await messagePersistence.postRealTimeMessageToDatabase(messageData);
  } catch (error) {
    throw error;
  }
};

export const getMessages = async () => {
  try {
    return await messagePersistence.getMessagesFromDatabase();
  } catch (error) {
    throw error;
  }
};

export const postMessage = async (messageData) => {
  try {
    return await messagePersistence.postMessageToDatabase(messageData);
  } catch (error) {
    throw error;
  }
};