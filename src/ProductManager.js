import fs from 'fs'



export class ProductManager{

    constructor(filePath){
        this.filePath = filePath;
        this.productos = []; // Inicializar Vacío
        this.init(); // Inicializar la carga de productos
    }

    async init() {
        try {
            const productosData = await this.CargarProductos();
            //console.log("Producto asignado: ", productosData);
            this.productos = productosData || [];
        } catch (error) {
            //console.error('Error al cargar los productos:', error);
        }
    }
    //Clase estatica que contiene metodos para validar los datos cuando se agrega un producto
    static Validations = {

        //Este metodo se usará en addProduct para validar que los campos proporcionados sean del tipo de  dato correcto.
        validarTipoDeDato (dato, tipoDato, nombreCampo) { 

            if (dato === null || dato === undefined || typeof dato !== tipoDato) {

                throw new Error(`El campo ${nombreCampo} debe ser de tipo ${tipoDato}.`);

            }
        },

        // Validación de longitud de campos
        validarLongitudCampo (dato, maxTamanio, nombreCampo) {

            if (dato.length > maxTamanio) {

                throw new Error(`La longitud del campo ${nombreCampo} no debe exceder ${maxTamanio} caracteres.`);

            }

        },

        // Validación de formato de foto
        validarFormatoImagen(urlImagen) {

            if (!/\.(jpg|jpeg|png)$/i.test(urlImagen)) {

                throw new Error('El formato de la imagen no es válido. Debe ser JPG o PNG.');

            }
        },


        // Validación de precio y stock no negativos
        validarNoNegativo(dato, nombreCampo) {

            if (dato < 0) {

                throw new Error(`El campo ${nombreCampo} no puede ser negativo.`);

            }

        },

        

        
    };

    

    async CargarProductos() {

        try {

            const data = await fs.promises.readFile(this.filePath, 'utf-8');

            const productos = JSON.parse(data);// Asignar a this.productos
            //console.log("producto al momento de cargar: ", productos)
            return  productos;  // Retornar los productos cargados

        } catch (error) {

            
            return [];

        }
    }
    
    

    async guardarProductos() {

        try {

            const jsonProductos = JSON.stringify(this.productos, null, 2);
            //console.log('Productos antes de sobreescribir', jsonProductos)
            await fs.promises.writeFile(this.filePath, jsonProductos);
            //console.log('Producto guardado correctamente.');
        } 
        catch (error) {

            throw new Error(`Error al guardar el producto. Error: ${error}`);

        }

    }


    async addProduct(producto) {
        await this.init();
    
        // Validar que todos los campos sean obligatorios
        const { nombre, descripcion, precio, foto, codigo, stock } = producto;
        
        if (!nombre || !descripcion || !precio || !foto || !codigo || !stock) {
            throw new Error('Todos los campos son obligatorios.');
        } else {
            // Validar tipos de datos
            ProductManager.Validations.validarTipoDeDato(nombre, 'string', 'nombre');
            ProductManager.Validations.validarTipoDeDato(descripcion, 'string', 'descripcion');
            ProductManager.Validations.validarTipoDeDato(precio, 'number', 'precio');
            ProductManager.Validations.validarTipoDeDato(foto, 'string', 'foto');
            ProductManager.Validations.validarTipoDeDato(codigo, 'string', 'codigo');
            ProductManager.Validations.validarTipoDeDato(stock, 'number', 'stock');
    
            // Validar longitud de campos
            ProductManager.Validations.validarLongitudCampo(nombre, 50, 'nombre');
            ProductManager.Validations.validarLongitudCampo(descripcion, 200, 'descripcion');
    
            // Validar números NO Negativos
            ProductManager.Validations.validarNoNegativo(precio, 'precio');
            ProductManager.Validations.validarNoNegativo(stock, 'stock');
    
            // Validar Formato de la imagen
            ProductManager.Validations.validarFormatoImagen(foto);
        }
    
        // Validar que el código (code) no se repita
        const codeExists = this.productos.some((p) => p.codigo === codigo);
        if (codeExists) {
            throw new Error('El código del producto ya existe.');
        }
    
        let maxId = 0;
    
        // Obtener el ID más alto del último producto
        if (this.productos.length > 0) {
            maxId = this.productos[this.productos.length - 1].id;
        }
    
        // Asignar el nuevo ID al producto
        const nuevoId = ++maxId;
    
        // Crear el producto
        const nuevoProducto = {
            id: nuevoId,
            ...producto,
        };
    
        // Agregar el producto al arreglo de productos
        this.productos.push(nuevoProducto);
    
        //console.log('Productos Después de pushear:', this.productos);
    
        // Guardar los productos en el archivo
        await this.guardarProductos();
    
        return nuevoProducto; // Devolver el producto agregado
    }


    async getProducts(){

        await this.init(); // Asegurar que los productos estén cargados antes de obtenerlos
        return this.productos;

    }

    async getCantidadProductos(){
        
        await this.init(); // Asegurar que los productos estén cargados antes de obtenerlos
        return this.productos.length;
    }

    async getProductById(idBuscado){
        await this.init();
         // Validar que idBuscado sea un número entero mayor a cero
        if (!Number.isInteger(idBuscado) || idBuscado <= 0) {

            throw new Error('El ID buscado debe ser un número entero mayor a cero.');

        }
  
        // Verificar que la lista de productos no esté vacía
        if (this.productos.length === 0) {

            throw new Error('No hay productos disponibles.');

        }

        const productoEncontrado = this.productos.find(producto => producto.id === idBuscado)

        if(!productoEncontrado){

            throw new Error('No se encontró un producto con el ID proporcionado.');

        }else{

            return productoEncontrado;

        };

    }


    async deleteProductById(id) {
        
        await this.init();
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error('El ID debe ser un número entero mayor a cero.');
        }

        const index = this.productos.findIndex(producto => producto.id === id);

        if (index === -1) {
            throw new Error('No se encontró un producto con el ID proporcionado.');
        }

        this.productos.splice(index, 1);
        //console.log('productos despues de eliminar: ', this.productos)
        await this.guardarProductos();
        return { message: 'Producto eliminado correctamente.' };
        
    }

    async updateProduct(id, updatedFields) {
        await this.init();
        // Validar que id sea un número entero mayor a cero
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error('El ID del producto a actualizar debe ser un número entero mayor a cero.');
        }
    
        // Validar que se hayan proporcionado campos para actualizar
        if (!updatedFields || Object.keys(updatedFields).length === 0) {
            throw new Error('No se proporcionaron campos para actualizar.');
        }
    
        // Validar tipos de datos y longitud de campos
        const { precio, stock, nombre, descripcion, foto, codigo } = updatedFields;
        ProductManager.Validations.validarTipoDeDato(precio, 'number', 'precio');
        ProductManager.Validations.validarTipoDeDato(stock, 'number', 'stock');
        ProductManager.Validations.validarTipoDeDato(nombre, 'string', 'nombre');
        ProductManager.Validations.validarTipoDeDato(descripcion, 'string', 'descripcion');
        ProductManager.Validations.validarTipoDeDato(foto, 'string', 'foto');
        ProductManager.Validations.validarTipoDeDato(codigo, 'string', 'codigo');
        ProductManager.Validations.validarLongitudCampo(nombre, 50, 'nombre');
        ProductManager.Validations.validarLongitudCampo(descripcion, 200, 'descripcion');
        ProductManager.Validations.validarNoNegativo(precio, 'precio');
        ProductManager.Validations.validarNoNegativo(stock, 'stock');
        ProductManager.Validations.validarFormatoImagen(foto);
    
        const productoIndex = this.productos.findIndex(producto => producto.id === id);
    
        // Verificar que se encontró un producto con el ID proporcionado
        if (productoIndex === -1) {
            throw new Error('No se encontró un producto con el ID proporcionado.');
        }
    
        // Aplicar las actualizaciones al producto
        this.productos[productoIndex] = {
            ...this.productos[productoIndex],
            ...updatedFields
        };
    
        // Guardar los productos actualizados en el archivo
        await this.guardarProductos();
    
        return this.productos[productoIndex];
    }

}



//Prueba de la clase//

 //Obtengo la ruta


/*
(async () => {
    const manejador = new ProductManager(filePath);

    try {

        const producto = {
            nombre: 'Television',
            descripcion: 'Sirve para ocio',
            precio: 220000,
            foto: 'Television.jpg',
            codigo: 'ABC125',
            stock: 50,
        }
        
        
        const producto1 = await manejador.addProduct(producto);
        console.log('Producto agregado:', producto1);

        
        
     
        
    } catch (error) {
        console.error('Error:', error.message);
    }
})();*/
