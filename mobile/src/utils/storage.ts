// AsyncStorage wrapper for secure token storage

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    ACCESS_TOKEN: '@auth_access_token',
    REFRESH_TOKEN: '@auth_refresh_token',
    USER: '@auth_user',
};

export const storage = {
    async getAccessToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
        } catch (error) {
            console.error('Error getting access token:', error);
            return null;
        }
    },

    async setAccessToken(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.ACCESS_TOKEN, token);
        } catch (error) {
            console.error('Error setting access token:', error);
        }
    },

    async getUser(): Promise<any | null> {
        try {
            const user = await AsyncStorage.getItem(KEYS.USER);
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    async setUser(user: any): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
        } catch (error) {
            console.error('Error setting user:', error);
        }
    },

    async clear(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([
                KEYS.ACCESS_TOKEN,
                KEYS.REFRESH_TOKEN,
                KEYS.USER,
            ]);
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    },
};
