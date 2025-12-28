import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
    async register(req: Request, res: Response) {
        try {
            const user = await authService.register(req.body);
            res.status(201).json(user);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const result = await authService.login(req.body);

            if ('requires2FA' in result) {
                return res.json({ requires2FA: true, userId: (result as any).userId });
            }

            const { user, accessToken, refreshToken } = result as any;

            // Set Refresh Token in Cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            res.json({ user, accessToken });
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }
    async socialCallback(req: Request, res: Response) {
        try {
            // Passport attaches user to req.user
            const user = req.user as any;
            if (!user) {
                res.redirect(`${process.env.FRONTEND_URL}/login?error=AuthenticationFailed`);
                return;
            }

            // Generate Tokens
            const accessToken = authService['generateAccessToken'](user.id);
            const refreshToken = await authService.generateRefreshToken(user.id);

            // Set Refresh Token in Cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax', // Lax for redirect
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            // Redirect to frontend
            res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}`);
        } catch (error) {
            console.error(error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=ServerErr`);
        }
    }

    async refresh(req: Request, res: Response) {
        try {
            const { refreshToken } = req.cookies;
            if (!refreshToken) {
                return res.status(401).json({ error: 'Refresh Token required' });
            }

            const tokens = await authService.refresh(refreshToken);

            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.json({ accessToken: tokens.accessToken });
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }

    async logout(req: Request, res: Response) {
        try {
            const { refreshToken } = req.cookies;
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
            res.clearCookie('refreshToken');
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Logout failed' });
        }
    }

    async forgotPassword(req: Request, res: Response) {
        try {
            await authService.forgotPassword(req.body.email);
            res.json({ message: 'If an account exists, a reset email has been sent.' });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to process request' });
        }
    }

    async resetPassword(req: Request, res: Response) {
        try {
            await authService.resetPassword(req.body.token, req.body.password);
            res.json({ message: 'Password reset successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}

export const authController = new AuthController();
