import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../api/base44Client';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Check if user is logged in on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const isAuth = await api.auth.isAuthenticated();
            if (isAuth) {
                const userData = await api.auth.me();
                setUser(userData);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.auth.register(userData);
            setUser(response.user);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.auth.login(email, password);
            setUser(response.user);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const loginWithGoogle = async (credential, role = 'customer') => {
        try {
            const response = await api.auth.loginWithGoogle(credential, role);
            setUser(response.user);
            return response;
        } catch (error) {
            throw error;
        }
    };

    // DEMO BYPASS LOGIN
    const loginAsDemo = async (role) => {
        const demoUser = {
            _id: 'demo-user-id',
            email: `${role}@demo.com`,
            role: role,
            profile: {
                firstName: 'Demo',
                lastName: role.charAt(0).toUpperCase() + role.slice(1),
                phone: '1234567890'
            },
            isActive: true,
            isEmailVerified: true
        };
        setUser(demoUser);
        return { user: demoUser };
    };

    const logout = async () => {
        try {
            await api.auth.logout();
            setUser(null);
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
            // Clear user state even if logout fails
            setUser(null);
            navigate('/');
        }
    };

    const value = {
        user,
        loading,
        register,
        login,
        loginWithGoogle,
        loginAsDemo,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
