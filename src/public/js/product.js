async function addToCart(event, ProductId) {
    event.preventDefault();

    try {
        const response = await fetch(`/api/carts/product/${ProductId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();

        if (response.ok) {
            // Operación exitosa, mostrar notificación con Swal2
            Swal.fire({
                icon: 'success',
                title: 'Operación exitosa',
                text: 'El producto se ha añadido al carrito correctamente.',
            });
        } else {
            // Operación no exitosa, mostrar notificación con el mensaje de error
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.error || 'Hubo un problema al agregar el producto al carrito.',
            });
        }
    } catch (error) {
        console.error('Error en la solicitud AJAX:', error);
        // Mostrar notificación en caso de error
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al procesar la solicitud.',
        });
    }
}

async function upgradeToPremium(event){
    event.preventDefault();
    try {
        const response = await fetch(`/api/users/premium`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();

        if (response.ok) {
            // Operación exitosa, mostrar notificación con Swal2
            Swal.fire({
                icon: 'success',
                title: 'Operación exitosa',
                text: 'El usuario ha sido actualizado a premium correctamente.',
            });
        } else {
            // Operación no exitosa, mostrar notificación con el mensaje de error
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.error || 'Hubo un problema al actualizar el usuario a premium.',
            });
        }
    } catch (error) {
        console.error('Error en la solicitud AJAX:', error);
        // Mostrar notificación en caso de error
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al procesar la solicitud.',
        })
    }
}