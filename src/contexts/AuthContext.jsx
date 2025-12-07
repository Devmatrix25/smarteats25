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
            // Only auto-login for customers, not for restaurant/driver (they need approval)
            if (userData.role === 'customer' || !userData.role) {
                setUser(response.user);
            }
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

    // DEMO BYPASS LOGIN - ALWAYS WORKS, NO BACKEND REQUIRED
    const loginAsDemo = async (role) => {
        const demoUser = {
            _id: `demo-${role}-id`,
            email: `${role}@demo.com`,
            role: role,
            full_name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
            profile: {
                firstName: 'Demo',
                lastName: role.charAt(0).toUpperCase() + role.slice(1),
                phone: '1234567890'
            },
            isActive: true,
            isEmailVerified: true,
            approvalStatus: 'approved',
            isDemoUser: true
        };

        // Save to localStorage for persistence
        const token = `demo-token-${Date.now()}`;
        localStorage.setItem('accessToken', token);
        localStorage.setItem('authToken', 'demo-token');
        localStorage.setItem('demoRole', role);
        localStorage.setItem('smarteats_current_user', JSON.stringify(demoUser));

        // For demo driver/restaurant, auto-create their profile entity
        if (role === 'driver') {
            try {
                const existingDrivers = await api.entities.Driver.filter({ email: demoUser.email });
                if (existingDrivers.length === 0) {
                    await api.entities.Driver.create({
                        name: 'Demo Driver',
                        email: demoUser.email,
                        phone: '9876543210',
                        vehicle_type: 'bike',
                        vehicle_number: 'KA-01-AB-1234',
                        city: 'Bangalore',
                        status: 'approved',
                        is_online: true,
                        is_busy: false,
                        rating: 4.8,
                        total_deliveries: 0
                    });
                }
            } catch (e) {
                console.log('Demo driver creation skipped:', e);
            }
        }

        if (role === 'restaurant') {
            try {
                const existingRestaurants = await api.entities.Restaurant.filter({ owner_email: demoUser.email });
                if (existingRestaurants.length === 0) {
                    await api.entities.Restaurant.create({
                        name: 'Demo Restaurant',
                        owner_email: demoUser.email,
                        cuisine_types: ['Indian', 'Chinese'],
                        phone: '9876543210',
                        address: { city: 'Bangalore', street: 'MG Road' },
                        status: 'approved',
                        rating: 4.5,
                        is_open: true
                    });
                }
            } catch (e) {
                console.log('Demo restaurant creation skipped:', e);
            }
        }

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
