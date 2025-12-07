import axios from 'axios';

// SmartEats API Client - connects to backend API Gateway
const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:4000';

const apiClient = axios.create({
    baseURL: API_GATEWAY_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Entity helper - creates CRUD operations for each entity
const createEntityAPI = (entityName) => ({
    filter: async (filters = {}, sort = '-created_date', limit = 100) => {
        try {
            const response = await apiClient.get(`/api/entities/${entityName}`, {
                params: { ...filters, _sort: sort, _limit: limit }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching ${entityName}:`, error);
            return []; // Return empty array instead of throwing
        }
    },

    get: async (id) => {
        try {
            const response = await apiClient.get(`/api/entities/${entityName}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching ${entityName} by ID:`, error);
            throw error;
        }
    },

    create: async (data) => {
        try {
            const response = await apiClient.post(`/api/entities/${entityName}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error creating ${entityName}:`, error);
            throw error;
        }
    },

    update: async (id, data) => {
        try {
            const response = await apiClient.put(`/api/entities/${entityName}/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating ${entityName}:`, error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const response = await apiClient.delete(`/api/entities/${entityName}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting ${entityName}:`, error);
            throw error;
        }
    },
});

// Authentication helper
const auth = {
    login: async (email, password) => {
        try {
            const response = await apiClient.post('/api/auth/login', { email, password });
            if (response.data.token) {
                localStorage.setItem('auth_token', response.data.token);
            }
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    register: async (userData) => {
        try {
            const response = await apiClient.post('/api/auth/register', userData);
            if (response.data.token) {
                localStorage.setItem('auth_token', response.data.token);
            }
            return response.data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    logout: async () => {
        try {
            localStorage.removeItem('auth_token');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    me: async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('Not authenticated');

            const response = await apiClient.get('/api/auth/me');
            return response.data;
        } catch (error) {
            console.error('Get current user error:', error);
            throw error;
        }
    },

    isAuthenticated: async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return false;

            await auth.me();
            return true;
        } catch {
            return false;
        }
    },

    redirectToLogin: () => {
        window.location.href = '/';
    },
};

// File upload helper
const files = {
    upload: async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiClient.post('/api/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data.url;
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        }
    },
};

// Main API client with all entities
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
        Reward: createEntityAPI('Reward'),
        PointsTransaction: createEntityAPI('PointsTransaction'),
        Notification: createEntityAPI('Notification'),
        ChatMessage: createEntityAPI('ChatMessage'),
    },
};

// Export base44 as alias for backward compatibility during migration
export const base44 = api;
