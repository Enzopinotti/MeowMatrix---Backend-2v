class SessionDTO {
    constructor(email, password) {
        this.email = email;
        this.password = password;
    }

    validate() {
        // Realiza validaciones aquí, por ejemplo:
        if (!this.email || !this.password) {
            throw new Error('Los campos de correo electrónico y contraseña son obligatorios.');
        }

        // Puedes agregar más validaciones según tus requisitos.
    }

    toObject() {
        // Puedes formatear o transformar los datos según sea necesario
        return {
        email: this.email,
        password: this.password,
        };
    }
}
  
  export default SessionDTO;