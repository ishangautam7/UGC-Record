"use client";

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
    const { user, loading, hasAnyRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(...requiredRoles)) {
                router.push('/dashboard?error=unauthorized');
            }
        }
    }, [user, loading, requiredRoles, hasAnyRole, router]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            }}>
                <div style={{
                    color: '#fff',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{
                        width: '24px',
                        height: '24px',
                        border: '3px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#4f46e5',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    Loading...
                </div>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(...requiredRoles)) {
        return null;
    }

    return <>{children}</>;
}
