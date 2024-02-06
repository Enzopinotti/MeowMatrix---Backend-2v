export const loggerTest = async (req, res) => {
    try {

    req.logger.debug('Este es un mensaje de depuración.');
    req.logger.info('Este es un mensaje de información.');
    req.logger.warn('Este es un mensaje de advertencia.');
    req.logger.error('Este es un mensaje de error.');
    req.logger.fatal('Este es un mensaje de fatal.');

    res.sendSuccess('Logs de prueba finalizados')
  } catch (error) {
    req.logger.error("En test.controller.js: loggerTest - Error al mostrar los loggers", error);
    res.sendServerError(error.message);
  }
}