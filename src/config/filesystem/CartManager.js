import fs from 'fs';
import { ProductManager } from './ProductManager.js';

const filePath = 'archivos/productos.json';
const manager = new ProductManager(filePath);
export class CartManager {

    constructor(filePath) {
        this.filePath = filePath;
        this.carts = [];
    }

    async init() {
        try {
            const cartsData = await this.loadCarts();
            this.carts = cartsData || [];
        } catch (error) {
            throw new Error('El archivo de carritos no existe o no se pueden realizar operaciones de lectura/escritura en él.');
        }
    }

    static Validations = {
        validateDataType(data, dataType, fieldName) {
            if (data === null || data === undefined || typeof data !== dataType) {
                throw new Error(`El campo ${fieldName} debe ser de tipo ${dataType}.`);
            }
        },
    };

    async loadCarts() {
        try {
            const data = await fs.promises.readFile(this.filePath, 'utf-8');
            const carts = JSON.parse(data);
            return carts;
        } catch (error) {
            return [];
        }
    }

    async saveCarts() {
        try {
            const jsonCarts = JSON.stringify(this.carts, null, 2);
            await fs.promises.writeFile(this.filePath, jsonCarts);
        } catch (error) {
            throw new Error(`Error al guardar el carrito. Error: ${error}`);
        }
    }

    async addCart(cart) {

        await this.init();

        let maxId = 0;
    
        // Obtener el ID más alto del último producto
        if (this.carts.length > 0) {
            maxId = this.carts[this.carts.length - 1].id;
        }
    
        // Asignar el nuevo ID al producto
        const newId = ++maxId;

        const newCart = {
            id: newId,
            products: cart.products || [],
        };

        this.carts.push(newCart);
        await this.saveCarts();

        return newCart;
    }

    async getCartById(cartId) {
        await this.init();

        const cart = this.carts.find((c) => c.id === cartId);

        if (!cart) {
            throw new Error('No se encontró un carrito con el ID proporcionado.');
        }

        return cart;
    }

    async deleteCartById(cartId) {
        await this.init();

        const index = this.carts.findIndex((c) => c.id === cartId);

        if (index === -1) {
            throw new Error('No se encontró un carrito con el ID proporcionado.');
        }

        this.carts.splice(index, 1);
        await this.saveCarts();
        return { message: 'Carrito eliminado correctamente.' };
    }

    async addProductToCart(cartId, productId) {

        await this.init();
        
        // Obtener el carrito correspondiente al cartId
        const cart = this.carts.find((c) => c.id === cartId);

        if (!cart) {
            throw new Error('El carrito no existe.');
        }

        // Verificar si el producto ya está en el carrito
        const existingProduct = cart.products.find((product) => product.product === productId);

        if (existingProduct) {
            // Si el producto ya está en el carrito, aumentar la cantidad
            existingProduct.quantity++;
        } else {
            // Si no está en el carrito, agregarlo
            const product = await manager.getProductById(productId); // Utiliza la función del ProductManager

            if (!product) {
                throw new Error('El producto no existe.');
            }

            cart.products.push({
                product: productId,
                quantity: 1, // Agregamos uno por defecto
            });
        }

        // Guardar el carrito modificado
        await this.saveCarts();

        return cart;
    }
}

