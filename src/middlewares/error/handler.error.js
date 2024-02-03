import CustomError from '../../utils/customError.util.js';
import EnumError from '../../utils/enumError.util.js';
import { generateInvalidValuesErrorInfo, generateRoutingErrorInfo, generateInvalidTypesErrorInfo , generateDatabaseErrorInfo, generateDuplicateEmailErrorInfo, generateWeakPasswordErrorInfo } from '../../utils/infoError.util.js';

const errorHandlerMiddleware = (err, req, res, next) => {
    let statusCode = 500;
    let errorMessage = 'Internal Server Error';

    if (err instanceof CustomError) {
        switch (err.code) {
            case EnumError.ROUTING_ERROR:
                statusCode = 404;
                errorMessage = generateRoutingErrorInfo();
                break;
            case EnumError.INVALID_TYPES_ERROR:
                statusCode = 400;
                errorMessage = generateInvalidTypesErrorInfo();
                break;
            case EnumError.INVALID_VALUES_ERROR:
                statusCode = 400;
                errorMessage = generateInvalidValuesErrorInfo(
                    err.first_name,
                    err.last_name,
                    err.email,
                    err.password,
                    err.birthDate
                );
                break;
            case EnumError.DATABASE_ERROR:
                statusCode = 500;
                errorMessage = generateDatabaseErrorInfo();
                break;
            case EnumError.DUPLICATE_EMAIL_ERROR:
                statusCode = 400;
                errorMessage = generateDuplicateEmailErrorInfo(err.email);
                break;
            case EnumError.WEAK_PASSWORD_ERROR:
                statusCode = 400;
                errorMessage = generateWeakPasswordErrorInfo();
                break;
            default:
                break;
        }
    }

    res.status(statusCode).json({ error: errorMessage });
};

export default errorHandlerMiddleware;