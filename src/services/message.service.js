import { MessageDao } from "../daos/factory.js";




<<<<<<< HEAD
export const getRealTimeMessages = async (reqLogger) => {
  try {
    const messageView = await MessageDao.get(reqLogger);
    reqLogger.debug("En message.service.js: getRealTimeMessages - Obteniendo vista de mensajes");
    return messageView;
  } catch (error) {
    reqLogger.error("En message.service.js: getRealTimeMessages - Error obteniendo vista de mensajes: ", error);
=======
export const getRealTimeMessages = async () => {
  try {
    return await MessageDao.get();
  } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    throw error;
  }
};

<<<<<<< HEAD
export const postRealTimeMessage = async (messageData, reqLogger) => {
  try {
    const newMessage = await MessageDao.add(messageData, reqLogger);
    reqLogger.debug("En message.service.js: postRealTimeMessage - Nuevo mensaje creado");
    return newMessage;
  } catch (error) {
    reqLogger.error("En message.service.js: postRealTimeMessage - Error al crear el mensaje: ", error);
=======
export const postRealTimeMessage = async (messageData) => {
  try {
    return await MessageDao.add(messageData);
  } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    throw error;
  }
};

<<<<<<< HEAD
export const getMessages = async (reqLogger) => {
  try {
    const messages = await MessageDao.get(reqLogger);
    reqLogger.debug("En message.service.js: getMessages - Obteniendo mensajes");
    return await messages;
  } catch (error) {
    reqLogger.error("En message.service.js: getMessages - Error al obtener los mensajes: ", error);
=======
export const getMessages = async () => {
  try {
    return await MessageDao.get();
  } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    throw error;
  }
};

<<<<<<< HEAD
export const postMessage = async (messageData, reqLogger) => {
  try {
    const newMessage = await MessageDao.add(messageData, reqLogger);
    reqLogger.debug("En message.service.js: postMessage - Nuevo mensaje creado");
    return newMessage;
  }catch (error) {
    reqLogger.error("En message.service.js: postMessage - Error al crear el mensaje: ", error);
=======
export const postMessage = async (messageData) => {
  try {
    return await MessageDao.add(messageData);
  } catch (error) {
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    throw error;
  }
};