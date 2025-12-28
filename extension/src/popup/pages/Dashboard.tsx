import React from 'react';

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
}

interface DashboardProps {
    user: User;
    onLogout: () => void;
}

function Dashboard({ user, onLogout }: DashboardProps) {
    const getInitials = () => {
        if (user.firstName && user.lastName) {
            return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        }
        return user.email[0].toUpperCase();
    };

    return (
        <div className="glass-card">
            <h2>Dashboard</h2>

            <div className="user-info">
                <div className="avatar">
                    {user.avatar ? (
                        <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                        <span>{getInitials()}</span>
                    )}
                </div>

                <div className="user-details">
                    <h3>{user.firstName} {user.lastName}</h3>
                    <p>{user.email}</p>
                </div>
            </div>

            <button onClick={onLogout} className="btn-primary">
                Logout
            </button>
        </div>
    );
}

export default Dashboard;
