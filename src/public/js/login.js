console.log("Conectado al js del login")

// Agrega un evento de escucha para el envío del formulario
document.getElementById('loginForm').addEventListener('submit', function(event) {
    // Evita que el formulario se envíe automáticamente
    event.preventDefault();
    const data = new FormData(this);
    const obj = {};
    data.forEach((value, key) => (obj[key] = value));
    fetch('/api/sessions/login',{
        method: 'POST',
        body: JSON.stringify(obj),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(result => result.json())
    .then(json => {
        console.log(json);
        // Redirigir a la página de productos si el inicio de sesión es exitoso
        if (json.payload.message === 'Login successful') {
            window.location.href = '/products';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

