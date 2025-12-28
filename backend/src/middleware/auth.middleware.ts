import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

// Extend Express Request to include user
// declare global {
//     namespace Express {
//         interface Request {
//             user?: any;
//         }
//     }
// }

import { authService } from '../services/auth.service';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string, iat: number };

        // Check if session is revoked (Global Logout / Password Reset)
        const isRevoked = await authService.isSessionRevoked(decoded.userId, decoded.iat);
        if (isRevoked) {
            return res.status(401).json({ error: 'Unauthorized: Session revoked' });
        }

        // Attach user to request
        (req as any).user = { id: decoded.userId };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

export const authorize = (requiredRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            // Fetch user roles
            const userRoles = await prisma.userRole.findMany({
                where: { userId: user.id },
                include: { role: true },
            });

            const roleNames = userRoles.map((ur) => ur.role.name);

            const hasRole = requiredRoles.some((role) => roleNames.includes(role));

            if (!hasRole) {
                return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Server Error' });
        }
    };
};
