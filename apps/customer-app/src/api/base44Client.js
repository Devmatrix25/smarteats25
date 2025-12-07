import axios from 'axios';

// Backend API Client
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Authentication helper
const auth = {
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
      }
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  loginWithGoogle: async (credential, role = 'customer') => {
    try {
      const response = await apiClient.post('/auth/oauth/google', { credential, role });
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
      }
      return response.data;
    } catch (error) {
      console.error('Google OAuth error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete apiClient.defaults.headers.common['Authorization'];
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete apiClient.defaults.headers.common['Authorization'];
      throw error;
    }
  },

  me: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const response = await apiClient.get('/auth/me');
      return response.data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  isAuthenticated: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return false;

      await auth.me();
      return true;
    } catch {
      return false;
    }
  },

  refreshAccessToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await apiClient.post('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },
};

// File upload helper
const files = {
  upload: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/files/upload', formData, {
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

// Entity helper - creates CRUD operations for each entity
const createEntityAPI = (entityName) => ({
  // Get all items (with optional filter and sort)
  filter: async (filters = {}, sort = '-created_date', limit = 100) => {
    try {
      const response = await apiClient.get(`/${entityName.toLowerCase()}s`, {
        params: { ...filters, _sort: sort, _limit: limit }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${entityName}:`, error);
      throw error;
    }
  },

  // Get single item by ID
  get: async (id) => {
    try {
      const response = await apiClient.get(`/${entityName.toLowerCase()}s/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${entityName} by ID:`, error);
      throw error;
    }
  },

  // Create new item
  create: async (data) => {
    try {
      const response = await apiClient.post(`/${entityName.toLowerCase()}s`, data);
      return response.data;
    } catch (error) {
      console.error(`Error creating ${entityName}:`, error);
      throw error;
    }
  },

  // Update item
  update: async (id, data) => {
    try {
      const response = await apiClient.put(`/${entityName.toLowerCase()}s/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating ${entityName}:`, error);
      throw error;
    }
  },

  // Delete item
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/${entityName.toLowerCase()}s/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting ${entityName}:`, error);
      throw error;
    }
  },
});

// Initialize auth token if exists
const token = localStorage.getItem('accessToken');
if (token) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

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

// Export base44 alias for backward compatibility during transition
export const base44 = api;
