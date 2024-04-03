# Ecommerce

Asegúrate de tener instalado Node.js en tu sistema. Si no lo tienes instalado, puedes descargarlo desde el sitio web oficial: [Node.js](https://nodejs.org/).
MongoDB Atlas o una base de datos local configurada.

## Instalación

1. Clona este repositorio: git clone 'URL_DEL_REPOSITORIO'.

2. Ingresa al directorio del proyecto: cd 'NOMBRE_DEL_DIRECTORIO'.

3. Ejecuta el siguiente comando para instalar las dependencias:

   ```bash
   npm install

4. Crea un archivo .env en la raíz del proyecto y agrega las siguientes variables:

   ```bash
   mongo=URL_DE_CONEXION_A_MONGODB
   hash=SECRETO_PARA_SESIONES
   tokenkey=SECRETO_PARA_JWT
   jwtsecret=SECRETO_PARA_JWT
   gitclientid=ID_DEL_CLIENTE_GITHUB
   gitclientsecret=SECRETO_DEL_CLIENTE_GITHUB
   gitcallbackurl=URL_DE_RETORNO_DE_GITHUB_AUTH

## Uso

1. Inicia la aplicación: npm start
2. Accede a [LocalHost](https://meowmatrix-backend-2v-production.up.railway.app) en tu navegador.

### Funcionalidades Principales

Autenticación: Incluye la autenticación local y con GitHub. Las rutas de autenticación se encuentran en el directorio /Routes/views.

Persistencia de Datos: Utiliza MongoDB para almacenar datos. La configuración y la conexión a la base de datos están en el archivo database.js.

Manejo de Sesiones: Se implementa el manejo de sesiones con Express y se utiliza express-session en conjunto con connect-mongo para almacenar las sesiones en MongoDB.

Rutas API: La aplicación cuenta con diversas rutas API para usuarios, productos, categorías, carritos, sesiones y mensajes. Estas rutas se encuentran en el directorio /Routes/api.

### Contribución

Si quieres contribuir a este proyecto, por favor, sigue estos pasos:

1. Haz un fork del proyecto.
2. Crea una nueva rama (git checkout -b feature/nueva-funcionalidad).
3. Realiza cambios y commitea tus mejoras (git commit -am 'Agrega nueva funcionalidad').
4. Sube tus cambios al repositorio (git push origin feature/nueva-funcionalidad).
5. Crea un pull request.

### Autor

Enzo Daniel Pinotti.
