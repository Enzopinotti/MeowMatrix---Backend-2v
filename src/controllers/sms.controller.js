import twilio from 'twilio';
import configTwilio from '../config/sms.config.js'

const client = twilio(configTwilio.TwilioAccountSID, configTwilio.TwilioAuthToken);


export const sendSms = async (req, res) => {
    try {
        const { to, name, product } = req.body;
        const body = `Hola ${name}, gracias por tu compra de ${product}`;
        const result = await client.messages.create({
            from: configTwilio.TwilioSmsNumber,
            to,
            body
        });
        res.sendSuccess(result);
    } catch (error) {
        console.log(error)
        res.sendServerError(error);
    }
};