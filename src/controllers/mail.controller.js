import transport from "../utils/email.util.js"
import emailConfig from "../config/email.config.js"
import { __dirname } from "../utils.js"
import { generatePdf } from "../utils/pdf.util.js"; // Asegúrate de tener esta función en tu proyecto

export const sendMail = async (req, res) => {
    try {
        console.log('El reqbody es: ', req.body)
        const { to, subject, message, ticketHTML } = req.body;

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
        res.sendSuccess(result);
    } catch (error) {
        console.log(error);
        res.sendServerError(error);
    }
};
