import fs from 'fs'
import crypto from 'crypto'


class UserManager{

    constructor(filePath){

        this.filePath = filePath;
        this.usuarios = []; // Inicializar Vacío
        this.init(); // Inicializar la carga de usuarios

    }

    async init() {

        
        try {
            const usuariosData = await this.cargarUsuarios();
            console.log("usuario asignado: ", usuariosData);
            this.usuarios = usuariosData || [];

        } catch (error) {

            console.error('Error al cargar los usuarios:', error);
        }


    }

    async cargarUsuarios() {

        try {

            const data = await fs.promises.readFile(this.filePath, 'utf-8');

            const usuarios = JSON.parse(data);// Asignar a this.usuarios
            console.log("usuarios al momento de cargar: ", usuarios)
            return  usuarios;  // Retornar los usuarios cargados

        } catch (error) {

            
            return [];

        }
    }

    async validarUsuario(username, password) {

        const users = await this.cargarUsuarios();

        console.log("usuarios para validar: ", users);

        const user = users.find(user=> user.username === username);

        console.log("usuario encontrado: ", user);

        if(!user){
            console.log( "Error, el usuario no existe");
        };

        if(this.verificarPassword(password, user.password)){

            return 'logeado';
        }else{
            return 'Error, contraseña incorrecta'
        }

    }

    verificarPassword(enteredPassword, storedPassword){

        const enteredHash = this.hashPassword(enteredPassword); //hashea la contraseña ingresada para poder compararla con la stored que ya esta hasheada

        return enteredHash === storedPassword;
    }

    async guardarUsuarios() {

        try {

            const jsonUsuarios = JSON.stringify(this.usuarios, null, 2);

            console.log('usuarios antes de sobreescribir', jsonUsuarios)

            await fs.promises.writeFile(this.filePath, jsonUsuarios);

            console.log('Usuario guardado correctamente.');
        } 
        catch (error) {

            throw new Error(`Error al guardar el usuario. Error: ${error}`);

        }

    }

    hashPassword(password){
        const hash = crypto.createHash('sha512').update(password).digest('hex');
        return hash;
    }

    async addUser(user) {
        await this.init();

        const { password } = user;

        const hashedPassword = this.hashPassword(password);
        const newUser = {
            ...user,
            password: hashedPassword,
        }

        // Agregar el usuario al arreglo de usuarios
        this.usuarios.push(newUser);

        console.log('Usuarios Despues de pushear:', this.usuarios);

        // Guardar los usuarios en el archivo

        await this.guardarUsuarios();

        return newUser; // Devolver el usuario agregado

    }

    
}

const filePath = 'archivos/usuarios.json'; //Obtengo la ruta


const manejador = new UserManager(filePath);



console.log(manejador.validarUsuario('enzopino21', '123456contraseña'));