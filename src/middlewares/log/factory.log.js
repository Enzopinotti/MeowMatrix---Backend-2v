import config from '../../config/server.config.js'

export async function getLogger() {
    let response;
    switch(config.mode){
        case 'development':
            response = await import ('./devLogger.log.js') 
            break;
        case 'production':
            response = await import ('./prodLogger.log.js') 
            break;
        default:
            break;
    }
    return response;
}
