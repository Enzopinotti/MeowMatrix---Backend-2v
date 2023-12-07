import userModel from "../daos/models/user.model.js";
import moment from 'moment';



export const showProfile = (req, res) => {
    const user = req.session.user;

    if (!user) {
        // Si el usuario no está definido
        return res.redirect('/login'); // Redirige a la página de login o muestra un mensaje adecuado
    }

    let birthDateFormated = moment(user.birthDate).add(1, 'day').format('DD/MM/YYYY');

    res.render('profile', { user: { ...user, birthDate: birthDateFormated }, style: 'profile.css' , title: 'Perfil del Usuario'});
};


export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No se ha seleccionado ningún archivo.');
        }

        // Obtener el ID del usuario desde la sesión
        const userId = req.session.user.id;


        // Guardar la ruta del archivo en la base de datos
        const imagePath = `/img/avatars/${req.file.filename}`;
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { avatar: imagePath },
            { new: true }
        );

         // Actualiza el campo 'avatar' en la base de datos del usuario con la ruta del archivo
         
        req.session.user.avatar = imagePath;

         // Guarda la sesión para que se actualice con la nueva ruta de la imagen
        req.session.save((err) => {
             if (err) {
                 console.error('Error al guardar la sesión:', err);
             }
             
        });

        return res.status(200).redirect('/profile');
    } catch (error) {
        console.error('Error al subir el avatar:', error);
        return res.status(500).send('Error al subir el avatar.');
    }
};

