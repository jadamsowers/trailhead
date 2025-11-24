import React, { useState, useEffect } from 'react';
import { User } from '../../types';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

    // Helper function to get auth headers
    const getAuthHeaders = async (): Promise<HeadersInit> => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        
        // Try to get Clerk session token first
        try {
            // @ts-ignore - Clerk is loaded globally
            if (window.Clerk && window.Clerk.session) {
                const token = await window.Clerk.session.getToken();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                    return headers;
                }
            }
        } catch (error) {
            console.warn('Failed to get Clerk token:', error);
        }
        
        // Fall back to localStorage token for legacy admin accounts
        const token = localStorage.getItem('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE_URL}/auth/users`, {
                headers: await getAuthHeaders(),
            });
            
            if (!response.ok) {
                throw new Error('Failed to load users');
            }
            
            const data = await response.json();
            setUsers(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load users');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (userId: string, newRole: string) => {
        try {
            setUpdatingUserId(userId);
            setError(null);
            const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/role`, {
                method: 'PATCH',
                headers: await getAuthHeaders(),
                body: JSON.stringify({ role: newRole }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to update user role');
            }
            
            const updatedUser = await response.json();
            
            // Update the user in the list
            setUsers(users.map(user =>
                user.id === userId ? updatedUser : user
            ));
        } catch (err: any) {
            setError(err.message || 'Failed to update user role');
            console.error('Error updating user role:', err);
        } finally {
            setUpdatingUserId(null);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'adult':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem 0' }}>
                <div style={{
                    animation: 'spin 1s linear infinite',
                    borderRadius: '50%',
                    height: '3rem',
                    width: '3rem',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: 'var(--sa-dark-blue) transparent transparent transparent'
                }}></div>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: 'var(--card-bg)',
            boxShadow: 'var(--card-shadow)',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid var(--card-border)'
        }}>
            <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid var(--card-border)'
            }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>User Management</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Manage user roles and permissions
                </p>
            </div>

            {error && (
                <div style={{
                    margin: '1rem 1.5rem 0',
                    padding: '1rem',
                    backgroundColor: 'var(--alert-error-bg)',
                    border: '1px solid var(--alert-error-border)',
                    borderRadius: '4px'
                }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--alert-error-text)' }}>{error}</p>
                </div>
            )}

            <div style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <tr>
                            <th style={{
                                padding: '0.75rem 1.5rem',
                                textAlign: 'left',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                borderBottom: '1px solid var(--card-border)'
                            }}>
                                User
                            </th>
                            <th style={{
                                padding: '0.75rem 1.5rem',
                                textAlign: 'left',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                borderBottom: '1px solid var(--card-border)'
                            }}>
                                Email
                            </th>
                            <th style={{
                                padding: '0.75rem 1.5rem',
                                textAlign: 'left',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                borderBottom: '1px solid var(--card-border)'
                            }}>
                                Current Role
                            </th>
                            <th style={{
                                padding: '0.75rem 1.5rem',
                                textAlign: 'left',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                borderBottom: '1px solid var(--card-border)'
                            }}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody style={{ backgroundColor: 'var(--card-bg)' }}>
                        {users.map((user, index) => (
                            <tr key={user.id} style={{
                                borderBottom: index < users.length - 1 ? '1px solid var(--card-border)' : 'none'
                            }}>
                                <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                                                {user.full_name}
                                            </div>
                                            {user.is_initial_admin && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    Initial Admin
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{user.email}</div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        display: 'inline-flex',
                                        fontSize: '0.75rem',
                                        lineHeight: '1.25rem',
                                        fontWeight: '600',
                                        borderRadius: '9999px',
                                        backgroundColor: user.role === 'admin' ? 'var(--alert-error-bg)' : user.role === 'adult' ? 'var(--badge-info-bg)' : 'var(--bg-tertiary)',
                                        color: user.role === 'admin' ? 'var(--alert-error-text)' : user.role === 'adult' ? 'var(--badge-info-text)' : 'var(--text-secondary)'
                                    }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                                    {user.is_initial_admin ? (
                                        <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                                            Cannot modify initial admin
                                        </span>
                                    ) : (
                                        <select
                                            value={user.role}
                                            onChange={e => updateUserRole(user.id, e.target.value)}
                                            disabled={updatingUserId === user.id}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.875rem',
                                                borderRadius: '4px',
                                                border: '1px solid var(--card-border)',
                                                background: 'var(--input-bg)',
                                                color: 'var(--text-primary)',
                                                minWidth: 100,
                                                cursor: updatingUserId === user.id ? 'not-allowed' : 'pointer',
                                                opacity: updatingUserId === user.id ? 0.5 : 1
                                            }}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="adult">Adult</option>
                                            <option value="user">User</option>
                                        </select>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {users.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No users found</p>
                </div>
            )}
        </div>
    );
};

export default UserManagement;