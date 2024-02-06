export const generateRoutingErrorInfo = () => {
    return `Error in routing.`;
};

export const generateInvalidTypesErrorInfo = () => {
    return `Invalid data types.`;
};

export const generateInvalidValuesErrorInfo = (first_name, last_name, email, password, birthDate) => {
    return `
        One or More Properties were incomplete or not valid.
        List of required properties:
        first_name: needs to be a String, received ${first_name}
        last_name: needs to be a String, received ${last_name}
        email: needs to be a String, received ${email}
        password: needs to be a String, received ${password}
        birthDate: needs to be a Date, received ${birthDate}
    `;
};

export const generateDatabaseErrorInfo = () => {
    return `Error in the database.`;
};

export const generateDuplicateEmailErrorInfo = (email) => {
    return `The email '${email}' is already registered.`;
};

export const generateWeakPasswordErrorInfo = () => {
    return `The password does not meet security criteria.`;
};
