// Auth Context for managing authentication state

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authAPI, LoginCredentials, RegisterData } from '../services/api';
import { storage } from '../utils/storage';

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const storedUser = await storage.getUser();
            const token = await storage.getAccessToken();

            if (storedUser && token) {
                setUser(storedUser);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials: LoginCredentials) => {
        const response = await authAPI.login(credentials);
        await storage.setAccessToken(response.accessToken);
        await storage.setUser(response.user);
        setUser(response.user);
    };

    const register = async (data: RegisterData) => {
        await authAPI.register(data);
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout API failed:', error);
        } finally {
            await storage.clear();
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
