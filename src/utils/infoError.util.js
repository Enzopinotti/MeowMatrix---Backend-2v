
export const generateUserErrorInfo = ( first_name, last_name, email, password, birthDate ) =>{
    return `
    One or More Properties where incomplete or not valid
    list of required properties:
    firt_name: needs to be a String, recived ${first_name}
    last_name: needs to be a String, recived ${last_name}
    email: needs to be a String, recived ${email}
    password: needs to be a String, recived ${password}
    birthDate: needs to be a Date, recived ${birthDate}
    `
}
