document.getElementById('ResetPasswordForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const data = new FormData(this);
    const obj = {};
    data.forEach((value, key) => (obj[key] = value));
    console.log(obj);
    if (obj.password !== obj.confirmPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Las contraseñas deben ser iguales',
            allowOutsideClick: false,
        });
        return;
    }
    if (obj.password === '') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor, completa el campo contraseña para avanzar',
            allowOutsideClick: false,
        });
        return;
    }
    fetch('/api/sessions/resetPassword', {
        method: 'POST',
        body: JSON.stringify(obj),  
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(result => {
        console.log('result: ', result)
        if (result.status === 401) {
            throw new Error('Credenciales incorrectas');
        }
        return result.json();
    })
    .then(json => {
        console.log('json: ', json)
        if (json.status === 'userError'){
            console.log('entro a user error')
            if(json.error ==='La contraseña no cumple con los criterios de seguridad'){
                console.log('entro a no cumple criterios')
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'La contraseña no cumple con los criterios de seguridad',
                    allowOutsideClick: false,
                });
            }
            if(json.error === 'La contraseña no puede ser igual a la anterior'){
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'La contraseña no puede ser igual a la anterior',
                    allowOutsideClick: false,
                });
            }
        }
        if (json.status === 'success') {
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Contraseña actualizada correctamente',
                allowOutsideClick: false,
            });
            window.location.href = '/login';
        }
    })
    .catch(error => {
       
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error inesperado',
            allowOutsideClick: false,
        });
    });
});