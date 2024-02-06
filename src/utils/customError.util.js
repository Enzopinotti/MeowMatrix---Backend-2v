class CustomError {
    static createError(name = 'Error', message , cause , code = 1) {
        const error = new Error(message)
        error.cause = cause
        error.name = name
        error.code = code
        
        throw error;
    }
}

export default CustomError;
