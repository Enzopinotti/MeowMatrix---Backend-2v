import fs from 'fs'
import crypto from 'crypto'


class ValidationHelper {

    static isNameValid(name) {
      return name.length <= 20;
    }
  
    static isDateValid(birthDate) {
      const birthDateDate = new Date(birthDate);
      return !isNaN(birthDateDate) && birthDateDate < new Date();
    }
  
    static isEmailValid(email) {
      const emailRegex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
      return emailRegex.test(email);
    }
  
    static isEmailRepeated(email, users) {
      return users.some((user) => user.email === email);
    }
  
    static isPasswordRepeated(password, users) {
      const hashedPassword = crypto.createHash('sha512').update(password).digest('hex');
      return users.some((user) => user.password === hashedPassword);
    }
}




export class UserManager{

    constructor(filePath) {
        this.filePath = filePath;
        this.users = [];
    }

    async init() {
        try {
          const usersData = await this.loadUsers();
          this.users = usersData || [];
        } catch (error) {
          throw new Error('El archivo de usuarios no existe o no se pueden realizar operaciones de lectura/escritura en él.');
        }
    }

    async loadUsers() {
        try {
          const data = await fs.promises.readFile(this.filePath, 'utf-8');
          const users = JSON.parse(data);
          return users;
        } catch (error) {
          return [];
        }
    }

    async saveUsers() {

        try {
          const jsonUsers = JSON.stringify(this.users, null, 2);
          await fs.promises.writeFile(this.filePath, jsonUsers);
        } catch (error) {
          throw new Error(`Error al guardar el usuario. Error: ${error}`);
        }

    }


    hashPassword(password){
        const hash = crypto.createHash('sha512').update(password).digest('hex');
        return hash;
    }

    async validateUser(username, password) {

        const users = await this.loadUsers();

        console.log("usuarios para validar: ", users);

        const user = users.find(user=> user.username === username);

        console.log("usuario encontrado: ", user);

        if(!user){
            console.log( "Error, el usuario no existe");
        };

        if(this.verifyPassword(password, user.password)){

            return 'logeado';
        }else{
            return 'Error, contraseña incorrecta'
        }

    }

    verifyPassword(enteredPassword, storedPassword){

        const enteredHash = this.hashPassword(enteredPassword); //hashea la contraseña ingresada para poder compararla con la stored que ya esta hasheada

        return enteredHash === storedPassword;
    }



    async addUser(user) {
        await this.init();

        const { id, name, lastName, birthDate, email, password, image } = user;
    
        if (!name || !lastName || !birthDate || !email || !password) {
            throw new Error('Falta un campo obligatorio, revisar.');
        }
        
        if (!ValidationHelper.isNameValid(name) || !ValidationHelper.isNameValid(lastName)) {
            throw new Error('Nombre y apellido no pueden ser más largos que 20 caracteres.');
        }
        
        if (!ValidationHelper.isDateValid(birthDate)) {
            throw new Error('La fecha de nacimiento debe tener un formato de fecha válido y no debe ser mayor a la fecha actual.');
        }
    
        if (!ValidationHelper.isEmailValid(email)) {
            throw new Error('El correo no tiene un formato de correo válido.');
        }
    
        if (ValidationHelper.isEmailRepeated(email, this.users)) {
            throw new Error('El correo ya está en uso.');
        }
    
        if (ValidationHelper.isPasswordRepeated(password, this.users)) {
            throw new Error('La contraseña ya está en uso.');
        }
      
        const hashedPassword = this.hashPassword(password);
    
        let maxId = 0;
    
        // Obtener el ID más alto del último producto
        if (this.users.length > 0) {
            maxId = this.users[this.users.length - 1].id;
        }
    
        // Asignar el nuevo ID al producto
        const newId = ++maxId;
    
        const newUser = {
            id: newId,
            ...user,
            password: hashedPassword,
        }
        
        this.users.push(newUser);
        await this.saveUsers();

        return newUser;
    }
    
    async updateUser(id, updatedUser) {

        await this.init();
    
        //Validaciones

        if (updatedUser.name && !ValidationHelper.isNameValid(updatedUser.name)) {
            throw new Error('Nombre no puede ser más largo que 20 caracteres.');
        }
    
        if (updatedUser.lastName && !ValidationHelper.isNameValid(updatedUser.lastName)) {
            throw new Error('Apellido no puede ser más largo que 20 caracteres.');
        }
    
        if (updatedUser.birthDate && !ValidationHelper.isDateValid(updatedUser.birthDate)) {
            throw new Error('La fecha de nacimiento debe tener un formato de fecha válido y no debe ser mayor a la fecha actual.');
        }
    
        if (updatedUser.email) {
            if (!ValidationHelper.isEmailValid(updatedUser.email)) {
                throw new Error('El correo no tiene un formato de correo válido.');
            }
    
            if (ValidationHelper.isEmailRepeated(updatedUser.email, this.users)) {
                throw new Error('El correo ya está en uso.');
            }
        }
    
        if (updatedUser.password && ValidationHelper.isPasswordRepeated(updatedUser.password, this.users)) {
            throw new Error('La contraseña ya está en uso.');
        }
    
        const userIndex = this.users.findIndex((user) => user.id === id);
    
        if (userIndex === -1) {
            throw new Error('No se encontró un usuario con el ID proporcionado.');
        }
    
        this.users[userIndex] = {
            ...this.users[userIndex],
            ...updatedUser,
        };
    
        await this.saveUsers();
        return this.users[userIndex];

    }

    async deleteUser(id) {
        await this.init();

        const index = this.users.findIndex((user) => user.id === id);

        if (index === -1) {
        throw new Error('No se encontró un usuario con el ID proporcionado.');
        }

        this.users.splice(index, 1);
        await this.saveUsers();
        return { message: 'Usuario eliminado correctamente.' };
    }
    
    async getUsers() {

        try {
            const usersData = await this.loadUsers();
            return usersData || [];
        } catch (error) {
            throw new Error('Error al cargar los productos: ' + error.message);
        }
        
    }

 
    
    async getUserById(searchedId) {

        await this.init();
        if (!Number.isInteger(searchedId) || searchedId <= 0) {

            throw new Error('El ID buscado debe ser un número entero mayor a cero.');
        }
        if (this.users.length === 0) {
            throw new Error('No hay productos disponibles.');
        }

        const foundUser = this.users.find(user => user.id === searchedId)

        if(!foundUser){
            throw new Error('No se encontró un producto con el ID proporcionado.');
        }else{
            return foundUser;
        };
    }
    
    
    
}

