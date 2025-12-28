// Background Service Worker for Chrome Extension

import { storage } from '../utils/storage';
import { api } from '../utils/api';

// Message types
type MessageType = 'LOGIN' | 'LOGOUT' | 'GET_USER' | 'REFRESH_TOKEN' | 'REGISTER';

interface Message {
    type: MessageType;
    payload?: any;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
    handleMessage(message).then(sendResponse);
    return true; // Keep channel open for async response
});

async function handleMessage(message: Message) {
    try {
        switch (message.type) {
            case 'LOGIN':
                return await handleLogin(message.payload);

            case 'REGISTER':
                return await handleRegister(message.payload);

            case 'LOGOUT':
                return await handleLogout();

            case 'GET_USER':
                return await handleGetUser();

            case 'REFRESH_TOKEN':
                return await handleRefreshToken();

            default:
                throw new Error('Unknown message type');
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

async function handleLogin(credentials: any) {
    const response = await api.login(credentials);

    // Store tokens and user
    await storage.set('accessToken', response.accessToken);
    await storage.set('user', response.user);

    return { success: true, user: response.user };
}

async function handleRegister(data: any) {
    const response = await api.register(data);
    return { success: true, data: response };
}

async function handleLogout() {
    try {
        await api.logout();
    } catch (err) {
        // Continue with local logout even if API fails
    }

    await storage.clear();
    return { success: true };
}

async function handleGetUser() {
    const user = await storage.get('user');
    const accessToken = await storage.get('accessToken');

    if (!user || !accessToken) {
        return { success: false, error: 'Not authenticated' };
    }

    return { success: true, user, accessToken };
}

async function handleRefreshToken() {
    try {
        const response = await api.refreshToken();
        await storage.set('accessToken', response.accessToken);
        return { success: true, accessToken: response.accessToken };
    } catch (error: any) {
        await storage.clear();
        return { success: false, error: error.message };
    }
}

// Auto-refresh token before expiry (every 14 minutes for 15min tokens)
setInterval(async () => {
    const accessToken = await storage.get('accessToken');
    if (accessToken) {
        try {
            await handleRefreshToken();
            console.log('Token refreshed automatically');
        } catch (err) {
            console.error('Auto-refresh failed:', err);
        }
    }
}, 14 * 60 * 1000); // 14 minutes

console.log('Background service worker initialized');
