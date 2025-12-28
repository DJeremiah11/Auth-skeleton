import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

const app = express();

import passport from './config/passport';

// Middlewares
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.get('/', (req, res) => {
    res.json({ message: 'Auth Service Running' });
});

export default app;
