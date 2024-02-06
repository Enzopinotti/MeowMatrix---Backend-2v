import nodemailer from 'nodemailer';
import emailConfig from '../config/email.config.js';

const transport = nodemailer.createTransport({
    service: emailConfig.serviceMail,
    port: emailConfig.serviceMailPort,
    auth: {
        user: emailConfig.emailUser,
        pass: emailConfig.emailPassword
    },
});

export default transport;
