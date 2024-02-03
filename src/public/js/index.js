const socket = io.connect("http://localhost:8080", {forceNew: true});
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
            socket.emit("toggle-visibility", productId);
        });
    });
});

socket.on('visibility-toggled', (productId) => {
   
    // Encuentra el elemento li con el atributo data-product-id que coincide con el ID eliminado
    const productElement = document.querySelector(`li[data-product-id="${productId}"]`);
    
    if (productElement) {
        // Si se encuentra el elemento, oculta este elemento en la interfaz de usuario cambiando su estilo a 'display: none;'
        productElement.style.display = 'none';
    } 
});


// Escucha la llegada de nuevos mensajes y agrega al DOM
socket.on("message-received", (message) => {
    console.log(message);
    const chatMessages = document.getElementById("chat-messages");
    const messageElement = document.createElement("p");
    messageElement.classList.add("message");
    const hr = document.createElement("hr");
    messageElement.innerHTML = `<strong>${message.user}:</strong> ${message.message}`;
    chatMessages.appendChild(hr);
    chatMessages.appendChild(messageElement);
});

socket.on('updateCart', ({ cartId, productId }) => {
    // Encuentra el elemento del carrito en el DOM y elimínalo
    const cartItem = document.querySelector(`.cart-item[data-cart-id="${cartId}"][data-product-id="${productId}"]`);
    console.log('cart item en socket',cartItem);
    if (cartItem) {
        cartItem.remove();
        // Actualiza el resumen del carrito (puedes llamar a una función que calcule el nuevo total)
        updateCartSummary(cartId);
    }
});

async function updateCartSummary(cartId) {
    try {
        const response = await fetch('/api/carts/${cartId}/summary');
        console.log('response', response);  
        if (response.ok) {
            const cartSummary = await response.json();
            console.log( 'cartSummary: ', cartSummary)
            // Actualizar elementos del DOM con los nuevos datos
            const totalItemsElement = document.querySelector('.total-items');
            const totalPriceElement = document.querySelector('.total-price');
            console.log('totalItemsElement', totalItemsElement);
            console.log('totalPriceElement', totalPriceElement);
            if (totalItemsElement && totalPriceElement) {
                // Actualizar el total de productos
                totalItemsElement.textContent = `Total de productos: ${cartSummary.payload.totalItems}`;

                // Actualizar el total a pagar
                totalPriceElement.textContent = `Total a pagar: $${cartSummary.payload.totalPrice}`;
            }
        } else {
            // Manejar errores si la petición no fue exitosa
            console.error('Error al obtener el resumen del carrito:', response.statusText);
        }
    } catch (error) {
        // Manejar errores de red u otros errores durante la solicitud
        console.error('Error al procesar la solicitud:', error);
    }
}


socket.on('updateAllCart', ({ cartId }) => {
    // Encuentra el elemento del carrito en el DOM y elimínalo
    const cartItem = document.querySelector(`.cart-list`);
    console.log('cart item en socket',cartItem);
    if (cartItem) {
        cartItem.remove();
        // Actualiza el resumen del carrito (puedes llamar a una función que calcule el nuevo total)
        updateCartSummary(cartId);
    }
});