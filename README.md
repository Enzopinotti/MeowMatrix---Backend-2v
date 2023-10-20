# Requisitos

Asegúrate de tener instalado Node.js en tu sistema. Si no lo tienes instalado, puedes descargarlo desde el sitio web oficial: [Node.js](https://nodejs.org/).

## Instalación

1. Clona este repositorio o descarga los archivos del proyecto en tu máquina.

2. Abre una terminal y navega hasta el directorio del proyecto.

3. Ejecuta el siguiente comando para instalar las dependencias:

   ```bash
   npm install

## Uso

### Clase ProductManager

La clase ProductManager se utiliza para gestionar productos en la tienda. Proporciona los siguientes métodos:

1. addProduct(producto): Agrega un nuevo producto al catálogo.

2. getProducts(): Obtiene una lista de todos los productos disponibles.

3. getProductById(id): Obtiene un producto específico por su ID.

4. updateProduct(id, updatedFields): Actualiza la información de un producto existente.

5. deleteProductById(id): Elimina un producto del catálogo.

## Iniciar el Servidor

Una vez que hayas instalado las dependencias, puedes iniciar el servidor con el siguiente comando:

npm start

El servidor se ejecutará en el puerto 8080.

## Endpoints

La aplicación Express define los siguientes endpoints:

GET /products: Obtiene una lista de productos. Puedes usar el parámetro de consulta limit para limitar la cantidad de productos devueltos.

Ejemplo de solicitud con límite 5:

GET <http://localhost:8080/products?limit=5>

GET /products/:pid: Obtiene un producto específico por su ID.

Ejemplo de solicitud:

GET <http://localhost:8080/products/1>
