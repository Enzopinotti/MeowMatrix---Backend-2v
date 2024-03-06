import { hashPassword, isValidPassword } from '../src/utils.js';
import UserManager from '../src/daos/mongo/mongodb/user.mongodb.js';
import mongoose from 'mongoose';
import * as chai from 'chai';
import { connectDB } from '../src/daos/mongo.database.js'



const expect = chai.expect;

await connectDB()

describe('Testear la utilidad de Bcryp', ()=>{
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

    it('Verificar el hasheo efectivo con Bcryp, verificando que la nueva sea distinta', function (){
        const hashedPassword = hashPassword(mockUser.password);
        expect(hashedPassword).is.not.equal(mockUser.password);
    })
    it('Verificar que el hash sea igual al hash guardado en la base de datos', async function (){
        mockUser.password = hashPassword(mockUser.password);
        const result = await this.Users.add(mockUser);
        expect(result.password).is.equal(mockUser.password);
    })
})