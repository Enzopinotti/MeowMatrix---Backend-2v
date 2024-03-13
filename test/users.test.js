import UserManager from '../src/daos/mongo/mongodb/user.mongodb.js';
import Assert from 'node:assert';
import { connectDB } from '../src/daos/mongo.database.js'
import mongoose from 'mongoose';



const assert = Assert.strict;

await connectDB();

describe('Testing Users Dao', () => {
    before(async function () {
        
        this.Users = new UserManager();
        
    });
    beforeEach(async function () {
        this.timeout(5000);
        await mongoose.connection.collections.users.deleteMany({})
    });

    const mockUser = {
        name: 'Juan',
        lastName: 'Perez',
        email: `juanperez@gmail.com`,
        password: 'Juan123',
        birthDate: '1990-01-01',
        phone: '1234567890',
        avatar: 'avatar.jpg',
    };
    it('El DAO debe poder obtener los usuario en formato de arreglo',async function () {

        const result = await this.Users.get();
       
        assert.strictEqual(Array.isArray(result), true);
    });
    it('El DAO debe poder agregar un usuario correctamente a la base de datos ', async function () {
        
        const result = await this.Users.add(mockUser);
        assert.ok(result._id);
    
    })
    it('El DAO debe poder obtener un usuario por su ID', async function () {
        const result = await this.Users.add(mockUser);
        const user = await this.Users.getById(result._id);
        assert.strictEqual(user.name, mockUser.name);
    });
    it('El DAO debe poder eliminar un usuario por su ID', async function () {
        const result = await this.Users.add(mockUser);
        const user = await this.Users.delete(result._id);
        assert.strictEqual(user.name, mockUser.name);
    });
    it('El DAO debe poder obtener un usuario por su email', async function () {
        const result = await this.Users.add(mockUser);
        const user = await this.Users.getByEmail(result.email);
        assert.strictEqual(user.name, mockUser.name);
    });
    it('El DAO debe poder actualizar un usuario por su ID', async function () {
        const result = await this.Users.add(mockUser);
        const user = await this.Users.update(result._id, { name: 'Pedro' });
        assert.strictEqual(user.name, 'Pedro');
    });
    it('El DAO debe poder obtener un usuario por su nombre', async function () {
        const result = await this.Users.add(mockUser);
        const user = await this.Users.getByUsername(result.name);
        assert.strictEqual(user.name, mockUser.name);
    });
    it('El DAO debe poder obtener un usuario por su apellido', async function () {
        const result = await this.Users.add(mockUser);
        const user = await this.Users.getByLastname(result.lastName);
        assert.strictEqual(user.name, mockUser.name);
    });

});