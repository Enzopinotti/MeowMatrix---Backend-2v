
document.addEventListener('DOMContentLoaded', () => {
    
    const favoriteButtons = document.querySelectorAll('.favorite-button');
    favoriteButtons.forEach(button => {
        button.addEventListener('click', handleLike);
    });
});






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

async function handleLike(event) {
    event.preventDefault();
    const productId = event.currentTarget.dataset.productId;

    console.log('entre con id: ', productId)
    try {
        const response = await fetch(`/api/users/like/${productId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();

        if (response.ok) {
            // Actualizar el botón de favorito según la respuesta del servidor
            updateFavoriteButton(productId, result.liked);
        } else {
            // Mostrar notificación en caso de error
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.error || 'Hubo un problema al procesar la solicitud.',
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

function updateFavoriteButton(productId, isLiked) {
    const favoriteButton = document.getElementById(`favoriteButton-${productId}`);

    // Verificar si se encontró el botón
    if (favoriteButton) {
        // Actualizar la imagen del botón de favorito
        if (isLiked) {
            favoriteButton.innerHTML = '<img src="./img/like_relleno.png" alt="like_relleno" class="like_img">';
        } else {
            favoriteButton.innerHTML = '<img src="./img/like_sin_relleno.png" alt="like_sin_relleno" class="like_img">';
        }
    } else {
        console.error('No se encontró el botón de favorito');
    }
}