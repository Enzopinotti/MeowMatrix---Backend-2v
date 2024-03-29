// UserDTO.js
import { hashPassword, validatePassword } from "../../utils.js";
import { UserDao } from "../factory.js";
class UserDTO {
    constructor(name, lastName, email, password, birthDate, phone, reason) {
      this.name = name;
      this.lastName = lastName;
      this.email = email;
      this.password = password;
      this.birthDate = birthDate;
      this.phone = phone;
      this.reason = reason;
    }
    

    validate() {
      
    }
  
    toObject() {
      // Puedes formatear o transformar los datos según sea necesario
      if(this.password !== undefined){
        if (validatePassword(this.password) === false) {
          throw new Error('La contraseña no cumple con los requisitos (Debe Tener una Mayuscula, Una Minuscula');
        }
        this.password = hashPassword(this.password);
      }
      return {
        name: this.name,
        lastName: this.lastName,
        email: this.email,
        password: this.password,
        birthDate: this.birthDate,
        phone: this.phone,
        rol: 'usuario', // Asignamos el rol por defecto
      };
    }
  }
  
  export default UserDTO;