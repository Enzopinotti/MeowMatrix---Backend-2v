import transport from "../utils/email.util.js"
import emailConfig from "../config/email.config.js"
import { __dirname } from "../utils.js"
import { generatePdf } from "../utils/pdf.util.js"; // Asegúrate de tener esta función en tu proyecto

export const sendMail = async (body) => {
    try {
        const { to, subject, message, ticketHTML } = body;

        // Generar el PDF del ticket
        const pdfBuffer = await generatePdf(ticketHTML);

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

        const result = await transport.sendMail(mailOptions);
        return result;
    } catch (error) {
        console.log(error);
        return error;
    }
};
