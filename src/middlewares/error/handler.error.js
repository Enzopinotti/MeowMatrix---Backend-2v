import EnumError from "../../utils/enumError.util.js";
export default (error, req, res, next) => {
    console.log(error.cause);
    switch (error.code) {
        case EnumError.INVALID_TYPES_ERROR:
            res.json ( { error: error.name } )
            break;
        case EnumError.ROUTING_ERROR:
            res.json ( { error: error.name } )
            break;
        case EnumError.INVALID_VALUES_ERROR:
            res.json ( { error: error.name } )
            break;
        case EnumError.DATABASE_ERROR:
            res.json ( { error: error.name } )
            break;
        default:
            res.json ( { error: 'unabled error' } )
            break;
    }
}