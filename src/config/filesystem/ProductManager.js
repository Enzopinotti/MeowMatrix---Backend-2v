import fs from 'fs'

class ValidationHelper {
    static validateDataType(data, dataType, fieldName) {
      if (data === null || data === undefined || typeof data !== dataType) {
        throw new Error(`El campo ${fieldName} debe ser de tipo ${dataType}.`);
      }
    }
  
    static validateFieldLength(data, maxLength, fieldName) {
      if (typeof data !== 'string' || data.length > maxLength) {
        throw new Error(`La longitud del campo ${fieldName} no debe exceder ${maxLength} caracteres.`);
      }
    }
  
    static validateNonNegative(data, fieldName) {
      if (typeof data !== 'number' || data < 0) {
        throw new Error(`El campo ${fieldName} no puede ser negativo.`);
      }
    }
  }

export class ProductManager{

    constructor(filePath){
        this.filePath = filePath;
        this.products = [];
    }

    async init() {

        try {
            const productosData = await this.loadProducts();
            //console.log("Producto asignado: ", productosData);
            this.products = productosData || [];
        } catch (error) {
            throw new Error('El archivo de productos no existe o no se pueden realizar operaciones de lectura/escritura en él.');
        }
    }
    //Clase estatica que contiene metodos para validar los datos cuando se agrega un producto


    async loadProducts() {
        try {
            const data = await fs.promises.readFile(this.filePath, 'utf-8');
            const products = JSON.parse(data);
            return  products;  
        } catch (error) {
            return [];
        }
    }
    
    

    async saveProducts() {
        try {
            const jsonProducts  = JSON.stringify(this.products, null, 2);
            await fs.promises.writeFile(this.filePath, jsonProducts);
        } 
        catch (error) {
            throw new Error(`Error al guardar el producto. Error: ${error}`);
        }

    }


    async addProduct(product) {
        await this.init();
    
        // Validar que todos los campos sean obligatorios
        const { name, description, price, code, stock, category, thumbnails } = product;
        
        if (!name || !description || !price  || !code || !stock || !category) {
            throw new Error('falta un campo obligatorio, revisar.');
        } else {
            ValidationHelper.validateFieldLength(name, 50, 'nombre');
            ValidationHelper.validateFieldLength(description, 400, 'descripcion');
            ValidationHelper.validateFieldLength(category, 100, 'category');
            ValidationHelper.validateDataType(price, 'number', 'precio');
            ValidationHelper.validateDataType(stock, 'number', 'stock');
            ValidationHelper.validateDataType(name, 'string', 'nombre');
            ValidationHelper.validateDataType(description, 'string', 'descripcion');
            ValidationHelper.validateDataType(code, 'string', 'codigo');
            ValidationHelper.validateDataType(category, 'string', 'category');
            ValidationHelper.validateNonNegative(price, 'precio');
            ValidationHelper.validateNonNegative(stock, 'stock');
    
        }
    
        // Validar que el código (code) no se repita
        const codeExists = this.products.some((p) => p.code === code);
        if (codeExists) {
            throw new Error('El código del producto ya existe.');
        }
    
        let maxId = 0;
    
        // Obtener el ID más alto del último producto
        if (this.products.length > 0) {
            maxId = this.products[this.products.length - 1].id;
        }
    
        // Asignar el nuevo ID al producto
        const newId = ++maxId;
    
        // Crear el producto
        const newProduct = {
            id: newId,
            ...product,
            status: true,
        };
    
        // Agregar el producto al arreglo de productos
        this.products.push(newProduct);
    
        //console.log('Productos Después de pushear:', this.productos);
    
        // Guardar los productos en el archivo
        await this.saveProducts();
    
        return newProduct; // Devolver el producto agregado
    }


    async getProducts(){

        await this.init();
        try {
            const productsData = await this.loadProducts();
            return productsData || [];
        } catch (error) {
            throw new Error('Error al cargar los productos: ' + error.message);
        }

    }

    async getNumberOfProducts(){
        
        await this.init(); // Asegurar que los productos estén cargados antes de obtenerlos
        return this.products.length;
    }

    async getProductById(searchedId){
        await this.init();
        if (!Number.isInteger(searchedId) || searchedId <= 0) {

            throw new Error('El ID buscado debe ser un número entero mayor a cero.');
        }
        if (this.products.length === 0) {
            throw new Error('No hay productos disponibles.');
        }

        const foundProduct = this.products.find(product => product.id === searchedId)

        if(!foundProduct){
            throw new Error('No se encontró un producto con el ID proporcionado.');
        }else{
            return foundProduct;
        };

    }


    async deleteProductById(id) {
        
        await this.init();
        
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error('El ID debe ser un número entero mayor a cero.');
        }

        const index = this.products.findIndex(product => product.id === id);

        if (index === -1) {
            throw new Error('No se encontró un producto con el ID proporcionado.');
        }

        this.products.splice(index, 1);
        //console.log('productos despues de eliminar: ', this.productos)
        await this.saveProducts();
        return { message: 'Producto eliminado correctamente.' };
        
    }

    async updateProduct(id, updatedFields) {
        await this.init();
        // Validar que id sea un número entero mayor a cero

        ValidationHelper.validateDataType(id, 'number', 'ID');

        if (!updatedFields || Object.keys(updatedFields).length === 0) {
            throw new Error('No se proporcionaron campos para actualizar.');
        }
    
        
        // Aplicar validaciones a los campos actualizados
        if (updatedFields.name) {
            ValidationHelper.validateFieldLength(updatedFields.name, 50, 'nombre');
            ValidationHelper.validateDataType(updatedFields.name, 'string', 'nombre');
        }
    
        if (updatedFields.description) {
            ValidationHelper.validateFieldLength(updatedFields.description, 400, 'descripcion');
            ValidationHelper.validateDataType(updatedFields.description, 'string', 'descripcion');
        }
    
        if (updatedFields.price) {
            ValidationHelper.validateDataType(updatedFields.price, 'number', 'precio');
            ValidationHelper.validateNonNegative(updatedFields.price, 'precio');
        }
    
        if (updatedFields.stock) {
            ValidationHelper.validateDataType(updatedFields.stock, 'number', 'stock');
            ValidationHelper.validateNonNegative(updatedFields.stock, 'stock');
        }
    
        if (updatedFields.code) {
            const codeExists = this.products.some((p) => p.code === updatedFields.code);
            if (codeExists) {
            throw new Error('El código del producto ya existe.');
            }
        }
    
        const productIndex = this.products.findIndex(product => product.id === id);

        if (productIndex === -1) {
            throw new Error('No product with the provided ID was found.');
        }

        this.products[productIndex] = {
            ...this.products[productIndex],
            ...updatedFields,
        };

        await this.saveProducts();
        return this.products[productIndex];
    }

}



//Prueba de la clase//

 //Obtengo la ruta

/*

(async () => {

    const filePath = 'archivos/productos.json'; //Obtengo la ruta
    const manejador = new ProductManager(filePath);

    try {
        
        const producto = {
            name: 'Computadora',
            description: 'Sirve para ocio',
            price: 320000,
            code: 'ABC011',
            stock: 40,
            category: 'Electronica',
        }
        
        
        const producto1 = await manejador.addProduct(producto);
        console.log('Producto agregado:', producto1);
        

        
        
        
     
        
    } catch (error) {

        console.error('Error:', error.message);

    }
})();*/
