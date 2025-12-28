import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { emailService } from './email.service';
import { redis } from '../utils/redis';
import { CreateUserDto, LoginDto } from '../types/auth.types'; // We'll define these types next

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export class AuthService {
    async register(data: CreateUserDto) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

        // Find default USER role
        const userRole = await prisma.role.findUnique({
            where: { name: 'USER' },
        });

        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                roles: userRole ? {
                    create: {
                        roleId: userRole.id
                    }
                } : undefined
            },
            include: {
                roles: { include: { role: true } }
            }
        });

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async login(data: LoginDto) {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user || !user.password) {
            throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.password);

        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        // Check 2FA
        if (user.twoFactorEnabled) {
            return { requires2FA: true, userId: user.id };
        }

        // Generate Tokens
        const accessToken = this.generateAccessToken(user.id);
        const refreshToken = await this.generateRefreshToken(user.id);

        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, accessToken, refreshToken };
    }

    generateAccessToken(userId: string) {
        return jwt.sign({ userId }, process.env.JWT_SECRET!, {
            expiresIn: ACCESS_TOKEN_EXPIRY,
        });
    }

    async generateRefreshToken(userId: string) {
        const token = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
            expiresIn: REFRESH_TOKEN_EXPIRY,
        });

        // Store refresh token in Redis (7 days)
        await redis.set(`refresh_token:${token}`, userId, 'EX', 7 * 24 * 60 * 60);

        return token;
    }

    async refresh(oldToken: string) {
        const userId = await redis.get(`refresh_token:${oldToken}`);

        if (!userId) {
            throw new Error('Invalid or expired refresh token');
        }

        // Verify signature just in case
        try {
            const decoded = jwt.verify(oldToken, process.env.JWT_REFRESH_SECRET!) as any;

            // Check global revocation
            if (await this.isSessionRevoked(userId, decoded.iat)) {
                await redis.del(`refresh_token:${oldToken}`);
                throw new Error('Session revoked');
            }

        } catch (err) {
            throw new Error('Invalid refresh token signature');
        }

        // Rotate Token
        await redis.del(`refresh_token:${oldToken}`);

        const newAccessToken = this.generateAccessToken(userId);
        const newRefreshToken = await this.generateRefreshToken(userId);

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    async logout(token: string) {
        await redis.del(`refresh_token:${token}`);
        return true;
    }

    async upsertSocialUser(provider: string, providerId: string, email: string, profile: any) {
        // 1. Check if account exists
        const account = await prisma.account.findUnique({
            where: {
                provider_providerAccountId: {
                    provider,
                    providerAccountId: providerId,
                },
            },
            include: { user: true },
        });

        if (account) {
            return account.user;
        }

        // 2. Check if user exists by email (link account)
        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // 3. Create new user
            // Find default USER role
            const userRole = await prisma.role.findUnique({
                where: { name: 'USER' },
            });

            console.log(`Creating user from ${provider} with email ${email}`);

            user = await prisma.user.create({
                data: {
                    email,
                    firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
                    lastName: profile.name?.familyName || profile.displayName?.split(' ')[1] || '',
                    avatar: profile.photos?.[0]?.value,
                    isVerified: true, // Social logins are usually verified
                    roles: userRole ? {
                        create: { roleId: userRole.id }
                    } : undefined
                },
            });
        }

        // 4. Create Account Link
        await prisma.account.create({
            data: {
                userId: user.id,
                type: 'oauth',
                provider,
                providerAccountId: providerId,
            },
        });

        return user;
    }

    // --- Email Verification ---
    async generateVerificationToken(email: string) {
        const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP or UUID
        const expires = new Date();
        expires.setHours(expires.getHours() + 1);

        // Upsert token
        await prisma.verificationToken.upsert({
            where: { identifier_token: { identifier: email, token } }, // Actually we want unique per email+type usually, keeping simple
            update: { token, expires }, // This logic is simplified for demo. Better to delete old tokens first.
            create: { identifier: email, token, expires }
        });
        return token;
    }

    // Use for Magic Link too (simplifying to re-use VerificationToken model for now, ideal to have separate type field)
    async generateMagicLinkToken(email: string) {
        const token = jwt.sign({ email, type: 'magic-link' }, process.env.JWT_SECRET!, { expiresIn: '15m' });
        return token;
    }

    async verifyMagicLink(token: string) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            if (decoded.type !== 'magic-link') throw new Error('Invalid token type');

            let user = await prisma.user.findUnique({ where: { email: decoded.email } });
            if (!user) {
                // Optionally create user if aggressive magic link register allowed
                // user = await this.register({ email: decoded.email, password: uuid() ... })
                throw new Error('User not found');
            }

            const accessToken = this.generateAccessToken(user.id);
            const refreshToken = await this.generateRefreshToken(user.id);
            return { user, accessToken, refreshToken };

        } catch (error) {
            throw new Error('Invalid or expired magic link');
        }
    }

    // --- 2FA ---

    async validateTwoFactor(userId: string, token: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret) return false;

        const speakeasy = require('speakeasy');
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token
        });
        return verified;
    }

    async forgotPassword(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Return true even if user not found to prevent enumeration
            return true;
        }

        // Generate Token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date();
        expires.setHours(expires.getHours() + 1);

        // Save to DB
        await prisma.passwordResetToken.create({
            data: {
                email,
                token,
                expires
            }
        });

        // Send Email
        await emailService.sendPasswordResetEmail(email, token);
        return true;
    }

    async resetPassword(token: string, newPassword: string) {
        // Find Token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token }
        });

        if (!resetToken || resetToken.expires < new Date()) {
            throw new Error('Invalid or expired token');
        }

        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update User Password
        await prisma.user.update({
            where: { email: resetToken.email },
            data: { password: hashedPassword }
        });

        // Delete used token 
        await prisma.passwordResetToken.delete({
            where: { id: resetToken.id }
        });

        // Revoke all sessions (Global Logout on password change)
        const user = await prisma.user.findUnique({ where: { email: resetToken.email } });
        if (user) {
            await this.revokeAllSessions(user.id);
        }

        return true;
    }

    async revokeAllSessions(userId: string) {
        // Set a revocation timestamp. Any token issued before this will be invalid.
        const now = Math.floor(Date.now() / 1000); // Seconds
        await redis.set(`revocation:${userId}`, now);
    }

    async isSessionRevoked(userId: string, tokenIat: number) {
        const revocationTime = await redis.get(`revocation:${userId}`);
        if (revocationTime) {
            return tokenIat < parseInt(revocationTime, 10);
        }
        return false;
    }
}

export const authService = new AuthService();
