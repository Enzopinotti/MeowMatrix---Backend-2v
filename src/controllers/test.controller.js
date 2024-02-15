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

export const performanceTestEasy = async (req, res) => {

  let suma = 0

    for (let i = 0; i < 100000; i++) {

        suma += i

    }

  res.json({ suma })
}

export const performanceTestHard = async (req, res) => {
  try {
    let array = [];
    for (let i = 0; i <  5e10; i++) {
      array.push(i);
    }
    req.logger.degug("En test.controller.js: performanceTestHard - Test de performance finalizado");
    res.sendSuccess(array);  
  } catch (error) {
    req.logger.error("En test.controller.js: performanceTestHard - Error al realizar el test de performance", error);
    res.sendServerError(error.message);
  }
}
