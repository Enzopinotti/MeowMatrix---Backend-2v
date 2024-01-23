import dotenv from 'dotenv';

dotenv.config();

export default {
    TwilioAccountSID : process.env.TWILIO_ACCOUNT_SID,
    TwilioAuthToken : process.env.TWILIO_AUTH_TOKEN,
    TwilioSmsNumber : process.env.TWilIO_SMS_NUMBER,
};