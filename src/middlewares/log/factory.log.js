import config from '../../config/server.config.js'

<<<<<<< HEAD
=======

>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
export async function getLogger() {
    let response;
    switch(config.mode){
        case 'development':
<<<<<<< HEAD
            response = await import ('./devLogger.log.js') 
            break;
=======
            console.log('entre en development')
            response = await import ('./devLogger.log.js') 
            break;
        
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
        case 'production':
            response = await import ('./prodLogger.log.js') 
            break;
        default:
            break;
<<<<<<< HEAD
=======
        
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
    }
    return response;
}
