import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';
import { logout, checkSession } from '../features/auth/authSlice';
import { LogOut, User as UserIcon, Edit2, X } from 'lucide-react';
import api from '../api/axios';

const Dashboard = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();

    const [isEditing, setIsEditing] = useState(false);
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);

    const handleLogout = () => {
        dispatch(logout());
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        setUpdateError(null);

        try {
            await api.put('/users/profile', {
                firstName,
                lastName,
                avatar: avatar || undefined
            });

            // Refresh user data
            await dispatch(checkSession());
            setIsEditing(false);
        } catch (err: any) {
            setUpdateError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };

    const openEditModal = () => {
        setFirstName(user?.firstName || '');
        setLastName(user?.lastName || '');
        setAvatar(user?.avatar || '');
        setUpdateError(null);
        setIsEditing(true);
    };

    return (
        <div className="page-container" style={{ alignItems: 'flex-start' }}>
            <div style={{ width: '100%', maxWidth: '800px', marginTop: '4rem' }}>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Dashboard</h1>
                        <button onClick={handleLogout} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <LogOut size={18} /> Logout
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <UserIcon size={48} color="var(--text-secondary)" />
                            )}
                        </div>

                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                {user?.firstName} {user?.lastName}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{user?.email}</p>

                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                {user?.isVerified && (
                                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>Verified</span>
                                )}
                                {user?.roles?.map((r: any) => (
                                    <span key={r.role.id} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '999px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-secondary)' }}>
                                        {r.role.name}
                                    </span>
                                ))}
                            </div>

                            <button onClick={openEditModal} className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                                <Edit2 size={16} /> Edit Profile
                            </button>
                        </div>
                    </div>

                    <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Session Info</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            You are securely logged in. Your session is managed via HTTP-Only cookies (refresh token) and short-lived access tokens (in-memory).
                        </p>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditing && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }} onClick={() => setIsEditing(false)}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', margin: '1rem' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Edit Profile</h2>
                            <button onClick={() => setIsEditing(false)} className="btn-ghost" style={{ padding: '0.5rem' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {updateError && (
                            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--error)', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                                {updateError}
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>First Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Last Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Avatar URL (optional)</label>
                                <input
                                    type="url"
                                    className="input-field"
                                    placeholder="https://example.com/avatar.jpg"
                                    value={avatar}
                                    onChange={(e) => setAvatar(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn-primary" disabled={isUpdating} style={{ flex: 1 }}>
                                    {isUpdating ? 'Updating...' : 'Save Changes'}
                                </button>
                                <button type="button" onClick={() => setIsEditing(false)} className="btn-ghost" style={{ flex: 1 }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
