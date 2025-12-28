import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { emailService } from '../services/email.service';

export class MagicLinkController {
    async sendLink(req: Request, res: Response) {
        try {
            const { email } = req.body;
            const token = await authService.generateMagicLinkToken(email);
            await emailService.sendMagicLink(email, token);
            res.json({ message: 'Magic link sent' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to send magic link' });
        }
    }

    async verifyLink(req: Request, res: Response) {
        try {
            const { token } = req.query;
            if (!token) throw new Error('No token');

            const { user, accessToken, refreshToken } = await authService.verifyMagicLink(token as string);

            // Set Refresh Token in Cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.json({ user, accessToken });
        } catch (error) {
            res.status(401).json({ error: 'Invalid link' });
        }
    }
}

export const magicLinkController = new MagicLinkController();
