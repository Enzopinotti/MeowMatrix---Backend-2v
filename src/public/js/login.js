    document.getElementById('loginForm').addEventListener('submit', function (event) {
    // Evita que el formulario se envíe automáticamente
    event.preventDefault();
    const data = new FormData(this);
    const obj = {};
    data.forEach((value, key) => (obj[key] = value));
    if (obj.email === '' && obj.password === '') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor, completa todos los campos',
            allowOutsideClick: false,
        });
        return;
    }else if (obj.email === '') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor, completa el campo email',
            allowOutsideClick: false,
        });
        return;
    }
    else if (obj.password === '') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor, completa el campo password',
            allowOutsideClick: false,
        });
        return;
    }
    fetch('/api/sessions/login', {
        method: 'POST',
        body: JSON.stringify(obj),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(result => {
        if (result.status === 401) {
            throw new Error('Credenciales incorrectas');
        }
        return result.json();
    })
    .then(json => {
        if (json.status === 'success') {
            window.location.href = '/products';
        }
    })
    .catch(error => {

        // Mostrar SweetAlert si el inicio de sesión falla
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error inesperado',
            allowOutsideClick: false,
        });
    });
});