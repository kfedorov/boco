import nodemailer from 'nodemailer';
import { dev } from '$app/environment';

// Config for mailpit (https://github.com/axllent/mailpit) to debug emails locally.
const mailpitTransport = nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    secure: false
});

export async function sendMail(to: string, subject: string, text: string, html: string) {
    try {
        return await mailpitTransport.sendMail({
            to,
            from: 'admin@boco.com',
            subject,
            text,
            html
        });
    } catch (e) {
        if (dev) {
            console.group(
                'Mail send error: Do you have mailpit running to intercept emails? (https://github.com/axllent/mailpit)'
            );
            console.error(e);
            console.log('to: ', to);
            console.log('subject: ', subject);
            console.log('text: ', text);
            console.log('html: ', html);
            console.groupEnd();
        }
        // TODO: log email send failures in production.
    }
}
