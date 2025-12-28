import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Types
interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    isVerified: boolean;
    roles: any[];
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    user: null,
    accessToken: null,
    isLoading: true, // Start true to check session first
    error: null,
    isAuthenticated: false,
};

// Async Thunks
export const login = createAsyncThunk(
    'auth/login',
    async (credentials: any, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/login', credentials);
            // Set default header for future requests
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.error || 'Login failed');
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (data: any, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/register', data);
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.error || 'Registration failed');
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async () => {
        try {
            await api.post('/auth/logout');
            delete api.defaults.headers.common['Authorization'];
        } catch (err: any) {
            // Continue to logout client side anyway
        }
    }
);

export const checkSession = createAsyncThunk(
    'auth/checkSession',
    async (_, { rejectWithValue }) => {
        try {
            // Try to get profile using stored token or refresh token flow
            // Actually, we need to refresh first if we don't have a token in memory
            // But interceptor handles refresh. So we just call a protected route.
            // If we don't have a token, the interceptor will try to get one.
            const response = await api.get('/users/profile');
            return response.data;
        } catch (err) {
            return rejectWithValue('Session invalid');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAccessToken: (state, action: PayloadAction<string>) => {
            state.accessToken = action.payload;
            api.defaults.headers.common['Authorization'] = `Bearer ${action.payload}`;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken;
                state.isAuthenticated = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.accessToken = null;
                state.isAuthenticated = false;
            })
            // Check Session
            .addCase(checkSession.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(checkSession.rejected, (state) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.accessToken = null;
            });
    },
});

export const { setAccessToken, clearError } = authSlice.actions;
export default authSlice.reducer;
