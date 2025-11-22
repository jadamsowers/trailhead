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
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                <p className="text-sm text-gray-600 mt-1">
                    Manage user roles and permissions
                </p>
            </div>

            {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Current Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.full_name}
                                            </div>
                                            {user.is_initial_admin && (
                                                <div className="text-xs text-gray-500">
                                                    Initial Admin
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {user.is_initial_admin ? (
                                        <span className="text-gray-400 italic">
                                            Cannot modify initial admin
                                        </span>
                                    ) : (
                                        <div className="flex space-x-2">
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => updateUserRole(user.id, 'admin')}
                                                    disabled={updatingUserId === user.id}
                                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {updatingUserId === user.id ? 'Updating...' : 'Promote to Admin'}
                                                </button>
                                            )}
                                            {user.role === 'admin' && (
                                                <>
                                                    <button
                                                        onClick={() => updateUserRole(user.id, 'adult')}
                                                        disabled={updatingUserId === user.id}
                                                        className="text-orange-600 hover:text-orange-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {updatingUserId === user.id ? 'Updating...' : 'Demote to Adult'}
                                                    </button>
                                                    <span className="text-gray-300">|</span>
                                                    <button
                                                        onClick={() => updateUserRole(user.id, 'user')}
                                                        disabled={updatingUserId === user.id}
                                                        className="text-orange-600 hover:text-orange-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {updatingUserId === user.id ? 'Updating...' : 'Demote to User'}
                                                    </button>
                                                </>
                                            )}
                                            {user.role === 'adult' && (
                                                <button
                                                    onClick={() => updateUserRole(user.id, 'user')}
                                                    disabled={updatingUserId === user.id}
                                                    className="text-orange-600 hover:text-orange-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {updatingUserId === user.id ? 'Updating...' : 'Demote to User'}
                                                </button>
                                            )}
                                            {user.role === 'user' && (
                                                <button
                                                    onClick={() => updateUserRole(user.id, 'adult')}
                                                    disabled={updatingUserId === user.id}
                                                    className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {updatingUserId === user.id ? 'Updating...' : 'Promote to Adult'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {users.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-gray-500">No users found</p>
                </div>
            )}
        </div>
    );
};

export default UserManagement;