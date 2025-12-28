import { Request, Response } from 'express';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { prisma } from '../utils/prisma';
import { authService } from '../services/auth.service';

export class TwoFactorController {
    async generate(req: Request, res: Response) {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;

        const secret = speakeasy.generateSecret({ name: `AuthMyApp (${(req.user as any).email})` });

        // Save secret directly (Encrypt in real app!)
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret.base32 }
        });

        qrcode.toDataURL(secret.otpauth_url!, (err, data_url) => {
            if (err) return res.status(500).json({ error: 'Values Could not be generated' });
            res.json({ secret: secret.base32, qrCode: data_url });
        });
    }

    async verify(req: Request, res: Response) {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { token } = req.body;
        const userId = (req.user as any).id;

        const verified = await authService.validateTwoFactor(userId, token);

        if (verified) {
            await prisma.user.update({
                where: { id: userId },
                data: { twoFactorEnabled: true }
            });
            res.json({ message: '2FA Enabled' });
        } else {
            res.status(400).json({ error: 'Invalid Token' });
        }
    }

    async login2FA(req: Request, res: Response) {
        const { userId, token } = req.body;

        const verified = await authService.validateTwoFactor(userId, token);
        if (!verified) return res.status(400).json({ error: 'Invalid 2FA Token' });

        // Generate tokens
        const accessToken = authService.generateAccessToken(userId);
        const refreshToken = await authService.generateRefreshToken(userId);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ accessToken, refreshToken });
    }
}

export const twoFactorController = new TwoFactorController();
