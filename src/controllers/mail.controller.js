import transport from "../utils/email.util.js"
import emailConfig from "../config/email.config.js"
import { __dirname } from "../utils.js"
import { generatePdf } from "../utils/pdf.util.js"; // Asegúrate de tener esta función en tu proyecto

export const sendMailWithPdf = async (body) => {
    try {
        const { to, subject, message, ticket, user, products } = body;

        // Generar el PDF del ticket
        const pdfBuffer = await generatePdf(ticket, user, products);

        const mailOptions = {
            from: emailConfig.emailUser,
            to,
            subject,
            html: `<div>${message}</div>`,
            attachments: [
                {
                    filename: 'ticket.pdf',
                    content: pdfBuffer,
                    encoding: 'base64',
                },
            ],
        };

        const result =  transport.sendMail(mailOptions);
        return result;
    } catch (error) {
        console.log(error);
        return error;
    }
};
export const sendMail = async (body) => {
    try {
        const { to, subject, message } = body;
        const mailOptions = {
            from: emailConfig.emailUser,
            to,
            subject,
            html: `<div>${message}</div>`,
        };
        const result = await transport.sendMail(mailOptions);
        return result;
    } catch (error) {
        console.log(error);
        return error;
    }
}

export const sendRecoveryEmail = async (email, token) => {
    try {
      
      transport.sendMail({
        from: emailConfig.emailUser,
        to: email,
        subject: 'Recuperar Contraseña',
        html: `<p>Haga clic  <a href="http://localhost:3000/resetPassword/${token}">aquí</a> para restablecer la contraseña. Este enlace caducará en 1 hora.</p>`
      });
    } catch (error) {
      console.error('Error sending recovery email:', error);
    }
  };


  export const sendInactiveAccountEmail = async (to, userName) => {
    try {
        const mailOptions = {
            from: emailConfig.emailUser,
            to,
            subject: 'Notificación de eliminación de cuenta debido a inactividad',
            html: `
                <p>Hola ${userName},</p>
                <p>Queríamos informarte que tu cuenta ha sido eliminada debido a la inactividad.</p>
                <p>Entendemos que a veces la vida puede ser ocupada y es posible que no hayas tenido la oportunidad de acceder a tu cuenta recientemente. Sin embargo, para mantener nuestra plataforma segura y eficiente, eliminamos las cuentas inactivas después de un período de tiempo determinado.</p>
                <p>Si deseas volver a utilizar nuestros servicios, no dudes en volver a registrarte y comenzar de nuevo. Estamos aquí para ayudarte en cualquier momento.</p>
                <p>Si tienes alguna pregunta o necesitas asistencia, no dudes en ponerte en contacto con nuestro equipo de soporte.</p>
                <p>¡Gracias por tu comprensión y esperamos volver a verte pronto!</p>
                <p>Atentamente,<br>El equipo de Meow Matrix</p>
            `,
        };
        const result = await transport.sendMail(mailOptions);
        return result;
    } catch (error) {
        console.log(error);
        return error;
    }
};

export const sendPremiumAcceptanceEmail = async (to, userName) => {
    try {
        const mailOptions = {
            from: emailConfig.emailUser,
            to,
            subject: '¡Tu solicitud de Premium ha sido aceptada!',
            html: `
                <p>Hola ${userName},</p>
                <p>¡Felicitaciones! Tu solicitud de Premium ha sido aceptada.</p>
                <p>A partir de ahora, disfrutarás de todos los beneficios y características premium que ofrecemos. ¡Gracias por tu confianza en nosotros!</p>
                <p>Si tienes alguna pregunta o necesitas asistencia, no dudes en ponerte en contacto con nuestro equipo de soporte.</p>
                <p>¡Esperamos que disfrutes de tu experiencia premium!</p>
                <p>Atentamente,<br>El equipo de Meow Matrix</p>
            `,
        };
        const result = await transport.sendMail(mailOptions);
        return result;
    } catch (error) {
        console.error('Error al enviar el correo electrónico de aceptación de premium:', error);
        throw error;
    }
};

export const sendPremiumRejectionEmail = async (to, userName) => {
    try {
        const mailOptions = {
            from: emailConfig.emailUser,
            to,
            subject: 'Tu solicitud de Premium ha sido rechazada',
            html: `
                <p>Hola ${userName},</p>
                <p>Lamentablemente, tu solicitud de Premium ha sido rechazada.</p>
                <p>Si tienes alguna pregunta o necesitas más información sobre por qué se rechazó tu solicitud, no dudes en ponerte en contacto con nuestro equipo de soporte. Estamos aquí para ayudarte.</p>
                <p>Gracias por tu interés en nuestros servicios.</p>
                <p>Atentamente,<br>El equipo de Meow Matrix</p>
            `,
        };
        const result = await transport.sendMail(mailOptions);
        return result;
    } catch (error) {
        console.error('Error al enviar el correo electrónico de rechazo de premium:', error);
        throw error;
    }
};

export const sendUserDeletionEmail = async (to, userName) => {
    try {
        const mailOptions = {
            from: emailConfig.emailUser,
            to,
            subject: 'Tu cuenta ha sido eliminada',
            html: `
                <p>Hola ${userName},</p>
                <p>Queríamos informarte que tu cuenta ha sido eliminada.</p>
                <p>Si tienes alguna pregunta o necesitas más información sobre esta acción, no dudes en ponerte en contacto con nuestro equipo de soporte. Estamos aquí para ayudarte.</p>
                <p>Gracias por tu comprensión.</p>
                <p>Atentamente,<br>El equipo de Meow Matrix</p>
            `,
        };
        const result = await transport.sendMail(mailOptions);
        return result;
    } catch (error) {
        console.error('Error al enviar el correo electrónico de eliminación de usuario:', error);
        throw error;
    }
};

export const sendProductDeletionEmail = async (to, productName) => {
    try {
        const mailOptions = {
            from: emailConfig.emailUser,
            to,
            subject: 'Tu producto ha sido eliminado',
            html: `
                <p>Hola,</p>
                <p>Queríamos informarte que tu producto "${productName}" ha sido eliminado.</p>
                <p>Si tienes alguna pregunta o necesitas más información sobre esta acción, no dudes en ponerte en contacto con nuestro equipo de soporte. Estamos aquí para ayudarte.</p>
                <p>Gracias por tu comprensión.</p>
                <p>Atentamente,<br>El equipo de Meow Matrix</p>
            `,
        };
        const result = await transport.sendMail(mailOptions);
        return result;
    } catch (error) {
        console.error('Error al enviar el correo electrónico de eliminación de producto:', error);
        throw error;
    }
};
