console.log("Conectado al js de registro")
// Agrega un evento de escucha para el envío del formulario
document.getElementById('registerForm').addEventListener('submit', function(event) {
    // Evita que el formulario se envíe automáticamente
    event.preventDefault();
    
    const data = new FormData(this);
    const obj = {};
    
    data.forEach((value, key) => (obj[key] = value));
    
    fetch('/api/sessions/register', {
        method: 'POST',
        body: JSON.stringify(obj),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(result => {
      console.log(result);
      if (result.status === 200) {
          // Redirigir a la página de inicio de sesión si el registro es exitoso
          window.location.href = '/login';
      } else if (result.status === 400) {
          // Error de usuario (por ejemplo, validación fallida)
          Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error del usuario. Verifica tus datos.',
              allowOutsideClick: false,
          });
      } else if (result.status === 401) {
          // No autorizado
          Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No estás autorizado para realizar esta acción.',
              allowOutsideClick: false,
          });
      } else if (result.status === 409) {
          // Conflicto (por ejemplo, recurso ya existente)
          Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Conflicto. El recurso ya existe.',
              allowOutsideClick: false,
          });
      } else {
          // Otro tipo de error del servidor
          Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error en el servidor. Por favor, verifica tus datos.',
              allowOutsideClick: false,
          });
      }
  })
  .catch(error => {
      console.error('Error:', error);
      // Mostrar mensaje Swal2 de error en caso de error en la petición
      Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Error inesperado',
          allowOutsideClick: false,
      });
  });
});