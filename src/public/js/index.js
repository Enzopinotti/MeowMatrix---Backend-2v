

//Evento Para eliminar productos



document.addEventListener("DOMContentLoaded", () => {

    

});




async function updateCartSummary(cartId) {
    try {
        const response = await fetch(`/api/carts/${cartId}/summary`);
        if (response.ok) {
            const cartSummary = await response.json();
            // Actualizar elementos del DOM con los nuevos datos
            const totalItemsElement = document.querySelector('.total-items');
            const totalPriceElement = document.querySelector('.total-price');
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
