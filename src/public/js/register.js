console.log("Conectado al js de registro")
// Agrega un evento de escucha para el envío del formulario
document.getElementById('registerForm').addEventListener('submit', function(event) {
    // Evita que el formulario se envíe automáticamente
    event.preventDefault();
    const data = new FormData(this);
    //console.log(data)
    const obj = {};
    data.forEach((value, key) => (obj[key] = value));
    fetch('/api/sessions/register',{
        method: 'POST',
        body: JSON.stringify(obj),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(result => {
        return result.json();
    }).then(json => {
        console.log(json);
        // Redirigir a la página de inicio de sesión si el registro es exitoso
        if (json.status === 'success') {
            window.location.href = '/login';
        }
    }).catch(error => {
        console.error('Error:', error);
    });
});
