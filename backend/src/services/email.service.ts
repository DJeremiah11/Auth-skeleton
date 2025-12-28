import nodemailer from 'nodemailer';

export class EmailService {
    private transporter;

    constructor() {
        // For Development: Use Ethereal or just console log if credentials missing
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: false, // true for 465
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        } else {
            console.log('Use Mock Mailer');
        }
    }

    async sendEmail(to: string, subject: string, html: string) {
        if (this.transporter) {
            await this.transporter.sendMail({
                from: process.env.FROM_EMAIL || 'no-reply@example.com',
                to,
                subject,
                html,
            });
            console.log(`Email sent to ${to}`);
        } else {
            console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | HTML: ${html}`);
        }
    }

    async sendVerificationEmail(email: string, token: string) {
        const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${email}`;
        await this.sendEmail(email, 'Verify Your Email', `<p>Click <a href="${url}">here</a> to verify your email.</p>`);
    }

    async sendMagicLink(email: string, token: string) {
        const url = `${process.env.FRONTEND_URL}/magic-login?token=${token}&email=${email}`;
        await this.sendEmail(email, 'Your Magic Login Link', `<p>Click <a href="${url}">here</a> to login.</p>`);
    }

    async sendPasswordResetEmail(email: string, token: string) {
        const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
        await this.sendEmail(email, 'Reset Your Password', `<p>Click <a href="${url}">here</a> to reset your password.</p>`);
    }
}

export const emailService = new EmailService();
