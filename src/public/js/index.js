const socket = io.connect("http://localhost:8080", {forceNew: true})
console.log("conectado");



//! Productos en tiempo real

const addProductForm = document.getElementById("addProductForm");
const productName = document.getElementById("productName");
const productDescription = document.getElementById("productDescription");
const productPrice = document.getElementById("productPrice");
const productCode = document.getElementById("productCode");
const productCategory = document.getElementById("productCategory");
const productStock = document.getElementById("productStock");
const addProductButton = document.getElementById("addProductButton");


socket.on("product-added", (product) => {
    // Actualiza la vista con el producto recién agregado
  
    // Selecciona el contenedor de productos
    const productList = document.getElementById("productList");
  
    // Crea un nuevo elemento de lista (li) para el producto
    const productItem = document.createElement("li");
    productItem.setAttribute("data-product-id", product.dataProductId); 
    productItem.innerHTML = `
    <h2>${product.name}</h2>
    <p>${product.description}</p>
    <p><strong>Precio:</strong> $${product.price}</p>
    <p><strong>Stock:</strong> ${product.stock} unidades</p>
    <p><strong>Categoría:</strong> ${product.category.nameCategory}</p>
    <img src="img/${product.thumbnails}" alt="${product.name}" class="imgProduct">
    <button class="botonDelete" data-product-id="${product.dataProductId}">Eliminar</button>
    `;
  
    // Agrega el nuevo elemento de producto a la lista de productos
    productList.appendChild(productItem);

    
});


//Evento Para eliminar productos



document.addEventListener("DOMContentLoaded", () => {
    // Obtén todos los botones de clase "botonDelete"
    const deleteButtons = document.querySelectorAll(".botonDelete");

    // Itera sobre los botones y agrega un escuchador de eventos a cada uno
    deleteButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            // Obtiene el ID del producto
            const productId = event.target.getAttribute("data-product-id");
            console.log(productId);
            
            socket.emit("toggle-visibility", productId);
        });
    });
});

socket.on('visibility-toggled', (productId) => {
    console.log('Producto invisibilizado:', productId);
    console.log(productId);
    // Encuentra el elemento li con el atributo data-product-id que coincide con el ID eliminado
    const productElement = document.querySelector(`li[data-product-id="${deletedProductId}"]`);
    console.log(productElement);
    if (productElement) {
        // Si se encuentra el elemento, oculta este elemento en la interfaz de usuario cambiando su estilo a 'display: none;'
        productElement.style.display = 'none';
    } else {
        console.log(`Elemento con ID ${updatedProduct._id} no encontrado en la vista.`);
    }
});







//! Mensajes en tiempo


/*

chatInput.addEventListener('keyup', (event)=>{
    if(event.key === 'Enter'){
        if(chatInput.value.trim().length > 0){
            socket.emit('message', {
                user: user, 
                message: chatInput.value
            });
            chatInput.value = '';
        }else{

            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'No se puede enviar un mensaje vacio'
            });
        
        };
    };
});
*/
// Escucha la llegada de nuevos mensajes y agrega al DOM
socket.on("message-received", (message) => {
    const chatMessages = document.getElementById("chat-messages");
    const messageElement = document.createElement("p");
    messageElement.classList.add("message");
    const hr = document.createElement("hr");
    messageElement.innerHTML = `<strong>${message.user}:</strong> ${message.message}`;
    chatMessages.appendChild(hr);
    chatMessages.appendChild(messageElement);
});


/*

socket.on('userConnected', (userName) =>{
    Swal.fire({
        title: `${userName} se ha unido al chat`,
        toast: true,
        position: 'top-right'

    });
})


/*
//?Notificación para logearse
Swal.fire({

    title: 'Identificate',
    input: 'text',
    text: 'Ingresa tu nombre de usuario',
    inputValidator: (value) => {
        if (!value) {
            return 'Necesitas ingresar un nombre de usuario para continuar'
        }
    },
    allowOutsideClick: false, //Para que la alerta no se cierre cuando apriete afuera del alerta
}).then((result)=>{
    user = result.value;
    socket.emit('auth', user);
});

*/