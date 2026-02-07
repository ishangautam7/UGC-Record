"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';

interface User {
    id: string;
    name: string;
    email: string;
    department: string;
    roles: string[];
    college_id?: string;
    college_name?: string;
    created_at: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, department?: string) => Promise<void>;
    logout: () => void;
    hasRole: (role: string) => boolean;
    hasAnyRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
        } catch (err) {
            console.error('Failed to fetch user:', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        const { user, token } = res.data;
        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const register = async (name: string, email: string, password: string, department?: string) => {
        const res = await api.post('/auth/register', { name, email, password, department });
        const { user, token } = res.data;
        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
    };

    const hasRole = (role: string) => {
        return user?.roles?.includes(role) || false;
    };

    const hasAnyRole = (...roles: string[]) => {
        return roles.some(role => hasRole(role));
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, hasRole, hasAnyRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
