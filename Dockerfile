#La imagen base proviene de "node"
FROM node

#Carpeta donde se va a guardar el proyecto
WORKDIR /app

#Primero copio el package.json que contiene mis librerías y la información del proyecto a la carpeta /app del proyecto
COPY package*.json ./

#Luego ejecuto el comando npm install dentro de la carpeta del proyecto
RUN npm install

#Copio todo el codigo restante de la app a la carpeta del proyecto
COPY . .

#Elejo en que puerto de la computadora debe escuchar
EXPOSE 8080

#Inicio la app
CMD ["npm", "start"]

