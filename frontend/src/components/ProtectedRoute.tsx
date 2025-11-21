import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

interface ProtectedRouteProps {
    children: ReactNode;
    requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requireAdmin = false,
}) => {
    const { isSignedIn, isLoaded, user } = useUser();
    const location = useLocation();

    if (!isLoaded) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh'
            }}>
                <div style={{
                    fontSize: '20px',
                    color: '#1976d2'
                }}>
                    Loading...
                </div>
            </div>
        );
    }

    if (!isSignedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user has admin role in public metadata
    const isAdmin = user?.publicMetadata?.role === 'admin';
    
    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;