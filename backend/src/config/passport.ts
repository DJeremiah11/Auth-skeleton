import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { authService } from '../services/auth.service';

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
            callbackURL: '/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const user = await authService.upsertSocialUser(
                    'google',
                    profile.id,
                    profile.emails?.[0].value || '',
                    profile
                );
                done(null, user);
            } catch (error) {
                done(error, undefined);
            }
        }
    )
);

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID || 'mock_client_id',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock_client_secret',
            callbackURL: '/auth/github/callback',
            scope: ['user:email'],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
            try {
                // Github emails might be private, handle if needed, but for now assuming public or scope grants access
                const email = profile.emails?.[0].value || `${profile.username}@github.example.com`;
                const user = await authService.upsertSocialUser(
                    'github',
                    profile.id,
                    email,
                    profile
                );
                done(null, user);
            } catch (error) {
                done(error, undefined);
            }
        }
    )
);

export default passport;
