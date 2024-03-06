import * as chai from 'chai';
import supertest from 'supertest';
import { connectDB } from '../src/daos/mongo.database.js'

await connectDB()

const expect = chai.expect;

const requester = supertest('http://localhost:8080');

describe('Testing de la API Ecommerce', ()=>{
    
    
    describe('Test of sessions', ()=>{
        let cookie;
        it('Debe registrar correctamente al usuario.', async function(){
            const mockUser = {
                name: 'Juan',
                lastName: 'Perez',
                email: `jperez@gmail.com`,
                password: 'Juan123',
                birthDate: '1990-01-01',
                phone: '1234567890',
                avatar: 'avatar.jpg',
            };
            const { body } = await requester.post('/api/sessions/register').send(mockUser);
            expect(body).to.be.ok;
            expect(body).to.have.property('payload');
            expect(body).to.have.property('status');
            expect(body.status).to.equal('success');
        })
        it('Debe logear correctamente al usuario y DEVOLVER UNA COOKIE', async function (){
            const mockUser = {
                email: `jperez@gmail.com`,
                password: 'Juan123'
            };
            const result = await requester.post('/api/sessions/login').send(mockUser);
            const cookieResult = result.headers['set-cookie'];
            expect(cookieResult).to.be.ok;
            cookie = {
                name: cookieResult[0].split('=')[0],
                value: cookieResult[0].split('=')[1]
            };
            expect(cookie.name).to.be.ok.and.eql('access_token');
            expect(cookie.value).to.be.ok;
        })
    })
    
    let createdProductId;

    describe('Test of products', ()=>{
        it('Debe devolver un array de productos', async function(){
            const result = await requester.get('/api/products');
            expect(result.body).to.be.ok;
            expect(result.body).to.have.property('payload');
            expect(result.body.payload).to.be.an('array');
        })
        it('Debe crear un producto correctamente', async function(){
            const mockProduct = {
                name: 'producto prueba',
                description: 'descripcion prueba',
                price: 100,
                code: 'prueba',
                stock: 10,
                category: '655c45f69dd5c1c11f0a6279',
                thumbnail: 'thumbnail.jpg',
            }; 
            const result = await requester.post('/api/products').send(mockProduct);
            expect(result.body).to.be.ok;
            expect(result.body).to.have.property('payload');
            expect(result.body.payload).to.be.an('object');
            createdProductId = result.body.payload._id;
        })
        it('Debe devolver un producto por su id', async function(){
            expect(createdProductId).to.be.ok;
            const result = await requester.get(`/api/products/${createdProductId}`);
            expect(result.body).to.be.ok;
            expect(result.body).to.have.property('payload');
            expect(result.body.payload).to.be.an('object');
        })
        it('Debe devolver un error si el id no existe', async function(){
            const result = await requester.get('/api/products/656d3a176f0093e6379a72adf');
            expect(result.body).to.be.ok;
            expect(result.body).to.have.property('error');
            expect(result.body.status).to.equal('serverError');
        });
        it('Debe eliminar un producto por su id correctamente (Elimina el creado en el test anterior)', async function(){
            expect(createdProductId).to.be.ok;
            const result = await requester.delete(`/api/products/${createdProductId}`);
            expect(result.body).to.be.ok;
            expect(result.body).to.have.property('payload');
        })

    })

    let createdCartId;
    describe('Test of carts', ()=>{
        it('Debe devolver un array de carritos', async function(){
            const result = await requester.get('/api/carts');
            expect(result.body).to.be.ok;
            expect(result.body).to.have.property('payload');
            expect(result.body.payload).to.be.an('array');
        })
        it('Debe crear un carrito vacío correctamente', async function(){
            const result = await requester.post('/api/carts');
            expect(result.body).to.be.ok;
            expect(result.body).to.have.property('payload');
            expect(result.body.payload).to.be.an('object');
            createdCartId = result.body.payload.payload._id;
            expect(createdCartId).to.be.ok;
            expect(result.body.payload.payload.products).to.be.an('array');
            expect(result.body.payload.payload.products.length).to.equal(0);
        });
        it('Debe devolver un carrito por su id', async function(){
            const result = await requester.get(`/api/carts/${createdCartId}`);
            expect(result.body).to.be.ok;
            expect(result.body).to.have.property('payload');
            expect(result.body.payload).to.be.an('object');
        })
        it('Debe devolver un error si el id no existe', async function(){
            const result = await requester.get('/api/carts/65ab5883964c68593088ea02');
            expect(result.body).to.be.ok;
            expect(result.body.payload).to.have.property('error');
            expect(result.body.payload.status).to.equal('error');
        })
        it('Debe agregar un producto a un carrito por su id correctamente', async function(){
            const mockProduct = {
                name: 'producto prueba',
                description: 'descripcion prueba',
                price: 100,
                code: 'prueba',
                stock: 10,
                category: '655c45f69dd5c1c11f0a6279',
                thumbnail: 'thumbnail.jpg',
            };
            const result = await requester.post('/api/products').send(mockProduct);
            expect(result.body).to.be.ok;
            expect(result.body).to.have.property('payload');
            expect(result.body.payload).to.be.an('object');
            createdProductId = result.body.payload._id;
            const result2 = await requester.post(`/api/carts/${createdCartId}/product/${createdProductId}`);
            expect(result2.body).to.be.ok;
            expect(result2.body).to.have.property('payload');
            expect(result2.body.payload).to.be.an('object');
            expect(result2.body.payload.products).to.be.an('array');
            expect(result2.body.payload.products.length).to.equal(1);
            //Elimino el producto creado en el test para no afectar a los demas tests
            await requester.delete(`/api/products/${createdProductId}`);
        })
        it('Debe modificar un carrito por su id correctamente', async function(){
            const mockProduct = {
                name: 'producto prueba',
                description: 'descripcion prueba',
                price: 100,
                code: 'prueba',
                stock: 10,
                category: '655c45f69dd5c1c11f0a6279',
                thumbnail: 'thumbnail.jpg',
            }
            const result = await requester.put(`/api/carts/${createdCartId}`).send(mockProduct);
            expect(result.body).to.be.ok;
            expect(result.body).to.have.property('payload');
            expect(result.body.payload).to.be.an('object');
            expect(result.body.payload.payload.products).to.be.an('array');
        })
        it('Debe eliminar un producto de un carrito por su id correctamente', async function(){
            const result = await requester.delete(`/api/carts/${createdCartId}/product/${createdProductId}`);
            expect(result.body).to.be.ok;
            expect(result.body).to.have.property('payload');
            expect(result.body.payload.payload).to.be.an('object');
            expect(result.body.payload.payload.products).to.be.an('array');
            expect(result.body.payload.payload.products.length).to.equal(0);
            createdProductId = null;
        })
        it('Debe eliminar todos los productos de un carrito por su id correctamente', async function(){
            const result = await requester.delete(`/api/carts/${createdCartId}/products`);
            expect(result.body).to.be.ok;
            expect(result.body).to.have.property('payload');
            expect(result.body.payload).to.be.an('object');
        })
        it('Debe eliminar un carrito por su id correctamente', async function(){
            const result = await requester.delete(`/api/carts/${createdCartId}`);
            expect(result.body).to.be.ok;
        })

    });
    
})