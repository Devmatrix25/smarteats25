import axios from 'axios';
import { mockRestaurants, mockMenuItems } from '../data/mockData';

// ==============================================
// SMARTEATS API CLIENT - REAL BACKEND MODE
// ==============================================
// This client connects to real MongoDB backend for:
// - Authentication (register, login, OAuth)
// - Orders, Restaurants, Menu items
// - Admin approval workflow
// 
// SIMULATIONS ONLY:
// - Payment (COD/UPI toggle - no real payment)
// - Driver GPS tracking (mock coordinates)
// ==============================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const AUTH_URL = `${API_URL}/auth`;
const CURRENT_USER_KEY = 'smarteats_current_user';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Try to refresh token
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken && !error.config._retry) {
                error.config._retry = true;
                try {
                    const res = await axios.post(`${AUTH_URL}/refresh`, { refreshToken });
                    localStorage.setItem('accessToken', res.data.accessToken);
                    localStorage.setItem('refreshToken', res.data.refreshToken);
                    error.config.headers.Authorization = `Bearer ${res.data.accessToken}`;
                    return apiClient(error.config);
                } catch {
                    // Refresh failed, clear tokens
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem(CURRENT_USER_KEY);
                }
            }
        }
        return Promise.reject(error);
    }
);

// ==============================================
// AUTHENTICATION - REAL BACKEND
// ==============================================
const auth = {
    // Register new user
    register: async (userData) => {
        try {
            const response = await apiClient.post('/auth/register', userData);
            const { user, accessToken, refreshToken } = response.data;

            if (accessToken) {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            }

            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    },

    // Login
    login: async (email, password) => {
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            const { user, accessToken, refreshToken } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Invalid email or password');
        }
    },

    // Google OAuth
    loginWithGoogle: async (credential, role = 'customer') => {
        try {
            const response = await apiClient.post('/auth/oauth/google', { credential, role });
            const { user, accessToken, refreshToken } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Google login failed');
        }
    },

    // Logout
    logout: async () => {
        try {
            await apiClient.post('/auth/logout');
        } catch {
            // Ignore errors on logout
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem('authToken');
        localStorage.removeItem('demoRole');
        return { success: true };
    },

    // Get current user
    me: async () => {
        // Check for demo token first
        const demoToken = localStorage.getItem('authToken');
        if (demoToken === 'demo-token') {
            const role = localStorage.getItem('demoRole') || 'customer';
            return {
                _id: `demo-${role}-id`,
                email: `${role}@demo.com`,
                role: role,
                full_name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
                profile: { firstName: 'Demo', lastName: role },
                isActive: true,
                isEmailVerified: true,
                approvalStatus: 'approved',
                isDemoUser: true
            };
        }

        // Check cached user
        const cached = localStorage.getItem(CURRENT_USER_KEY);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch { }
        }

        // Fetch from backend
        try {
            const response = await apiClient.get('/auth/me');
            const user = response.data.user || response.data;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            return user;
        } catch {
            throw new Error('Not authenticated');
        }
    },

    // Check if authenticated
    isAuthenticated: async () => {
        const demoToken = localStorage.getItem('authToken');
        if (demoToken === 'demo-token') return true;

        const token = localStorage.getItem('accessToken');
        if (!token) return false;

        try {
            await auth.me();
            return true;
        } catch {
            return false;
        }
    },

    // Admin functions
    admin: {
        getPendingUsers: async (role) => {
            const response = await apiClient.get('/auth/admin/users', {
                params: { approvalStatus: 'pending', role }
            });
            return response.data.users || [];
        },

        getAllUsers: async (role, approvalStatus) => {
            const response = await apiClient.get('/auth/admin/users', {
                params: { role, approvalStatus }
            });
            return response.data;
        },

        approveUser: async (userId) => {
            const response = await apiClient.patch(`/auth/admin/users/${userId}/approve`);
            return response.data;
        },

        rejectUser: async (userId, reason) => {
            const response = await apiClient.patch(`/auth/admin/users/${userId}/reject`, { reason });
            return response.data;
        }
    }
};

// ==============================================
// ENTITY CRUD - USES REAL BACKEND WITH MOCK FALLBACK
// ==============================================
const createEntityAPI = (entityName) => {
    const endpoint = `/${entityName.toLowerCase()}s`;

    return {
        filter: async (filters = {}, sort = '-created_date', limit = 100) => {
            try {
                const response = await apiClient.get(endpoint, {
                    params: { ...filters, _sort: sort, _limit: limit }
                });
                return response.data.data || response.data || [];
            } catch (error) {
                console.log(`Backend unavailable for ${entityName}, using mock data`);
                // Fallback to mock data
                if (entityName === 'Restaurant') return mockRestaurants;
                if (entityName === 'MenuItem') return mockMenuItems;
                return [];
            }
        },

        get: async (id) => {
            try {
                const response = await apiClient.get(`${endpoint}/${id}`);
                return response.data.data || response.data;
            } catch {
                // Fallback
                if (entityName === 'Restaurant') {
                    return mockRestaurants.find(r => r.id === id);
                }
                return null;
            }
        },

        create: async (data) => {
            const response = await apiClient.post(endpoint, data);
            return response.data.data || response.data;
        },

        update: async (id, data) => {
            const response = await apiClient.patch(`${endpoint}/${id}`, data);
            return response.data.data || response.data;
        },

        delete: async (id) => {
            await apiClient.delete(`${endpoint}/${id}`);
            return { success: true };
        },

        list: async (sort, limit) => {
            return createEntityAPI(entityName).filter({}, sort, limit);
        }
    };
};

// ==============================================
// FILE UPLOAD
// ==============================================
const files = {
    upload: async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await apiClient.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data.url;
        } catch {
            // Return placeholder for demo
            return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
        }
    }
};

// ==============================================
// AI INTEGRATION (MISTRAL for Chat, Gemini for FlavorLens only)
// ==============================================
const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || "dEUygL0Regq13V1p2md6SlUTznrdcUHc";
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

const integrations = {
    Core: {
        InvokeLLM: async ({ prompt, response_json_schema }) => {
            try {
                const response = await fetch(MISTRAL_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${MISTRAL_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'mistral-small-latest',
                        messages: [
                            { role: 'system', content: 'You are a helpful food assistant for SmartEats. Be concise and use emojis.' },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.7,
                        max_tokens: 2048
                    })
                });

                const data = await response.json();
                const text = data.choices?.[0]?.message?.content;

                if (response_json_schema && text) {
                    try {
                        let jsonStr = text;
                        if (text.includes('```json')) {
                            jsonStr = text.split('```json')[1].split('```')[0].trim();
                        }
                        return JSON.parse(jsonStr);
                    } catch {
                        return { response: text, recommended_restaurants: [] };
                    }
                }
                return { response: text };
            } catch {
                return { response: "I'm having trouble. Please try again!", recommended_restaurants: [] };
            }
        },

        UploadFile: async (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
    }
};

// ==============================================
// MAIN EXPORT
// ==============================================
export const api = {
    auth,
    files,
    entities: {
        Restaurant: createEntityAPI('Restaurant'),
        MenuItem: createEntityAPI('MenuItem'),
        Order: createEntityAPI('Order'),
        Cart: createEntityAPI('Cart'),
        Driver: createEntityAPI('Driver'),
        Address: createEntityAPI('Address'),
        Review: createEntityAPI('Review'),
        LoyaltyPoints: createEntityAPI('LoyaltyPoints'),
        PointsTransaction: createEntityAPI('PointsTransaction'),
        Notification: createEntityAPI('Notification')
    },
    integrations
};

// Alias for backward compatibility
export const base44 = api;
export default api;
