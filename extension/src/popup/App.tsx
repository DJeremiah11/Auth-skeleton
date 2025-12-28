import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './styles.css';

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
}

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'GET_USER' });
            if (response.success) {
                setUser(response.user);
            }
        } catch (err) {
            console.error('Auth check failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (email: string, password: string) => {
        const response = await chrome.runtime.sendMessage({
            type: 'LOGIN',
            payload: { email, password }
        });

        if (response.success) {
            setUser(response.user);
        } else {
            throw new Error(response.error);
        }
    };

    const handleLogout = async () => {
        await chrome.runtime.sendMessage({ type: 'LOGOUT' });
        setUser(null);
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="container">
            {user ? (
                <Dashboard user={user} onLogout={handleLogout} />
            ) : (
                <Login onLogin={handleLogin} />
            )}
        </div>
    );
}

export default App;
