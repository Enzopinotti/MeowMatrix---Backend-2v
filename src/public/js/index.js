const socket = io.connect("http://localhost:8080", {forceNew: true})
console.log("conectado");

const addProductForm = document.getElementById("addProductForm");
const productName = document.getElementById("productName");
const productDescription = document.getElementById("productDescription");
const productPrice = document.getElementById("productPrice");
const productCode = document.getElementById("productCode");
const productCategory = document.getElementById("productCategory");
const productStock = document.getElementById("productStock");
const addProductButton = document.getElementById("addProductButton");

console.log(addProductButton);
addProductButton.addEventListener("click", () => {
    const product = {
        name: productName.value,
        description: productDescription.value,
        price: parseFloat(productPrice.value),
        code: productCode.value,
        stock: parseInt(productStock.value),
        category: productCategory.value,
        thumbnails: "default.jpg", // Reemplaza con el nombre de la imagen
    };
    console.log(product);
    socket.emit("new-product", product);
});

socket.on("product-added", (product) => {
    // Actualiza la vista con el producto recién agregado
    console.log("Producto agregado en tiempo real:", product);
  
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
    <p><strong>Categoría:</strong> ${product.category}</p>
    <img src="img/${product.thumbnails}" alt="${product.name}">
    <button class="botonDelete" data-product-id="${product.dataProductId}">Eliminar</button>
    `;
  
    // Agrega el nuevo elemento de producto a la lista de productos
    productList.appendChild(productItem);

    const deleteButton = productItem.querySelector(".botonDelete");
    deleteButton.addEventListener("click", () => {
        // Obtiene el ID del producto del atributo data-product-id
        const productId = deleteButton.getAttribute("data-product-id");
        // Luego, puedes emitir el evento "delete-product" con el ID
        socket.emit("delete-product", parseInt(productId));
    });
  });


//Evento Para eliminar



document.addEventListener("DOMContentLoaded", () => {
    // Obtén todos los botones de clase "botonDelete"
    const deleteButtons = document.querySelectorAll(".botonDelete");

    // Itera sobre los botones y agrega un escuchador de eventos a cada uno
    deleteButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            // Obtiene el ID del producto del atributo data-product-id
            const productId = event.target.getAttribute("data-product-id");
            
            
            // Luego, puedes emitir el evento "delete-product" con el ID
            socket.emit("delete-product", parseInt(productId));
        });
    });
});

socket.on('product-deleted', (deletedProductId) => {
    console.log('producto eiminado con id:', deletedProductId)
    // Encuentra el elemento li con el atributo data-product-id que coincide con el ID eliminado
    const productElement = document.querySelector(`li[data-product-id="${deletedProductId}"]`);
    console.log(productElement);
    if (productElement) {
        productElement.remove(); // Elimina el elemento li de la vista
    }
});