import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export class UserController {
    async getProfile(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const userId = (req.user as any).id || (req.user as any).userId;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    isVerified: true,
                    twoFactorEnabled: true,
                    roles: { include: { role: true } },
                    providers: { select: { provider: true } }
                }
            });
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }

    async updateProfile(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const userId = (req.user as any).id || (req.user as any).userId;
            const { firstName, lastName, avatar } = req.body;

            const user = await prisma.user.update({
                where: { id: userId },
                data: { firstName, lastName, avatar },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatar: true
                }
            });

            res.json(user);
        } catch (error) {
            res.status(400).json({ error: 'Failed to update profile' });
        }
    }
}

export const userController = new UserController();
