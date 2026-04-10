import axios, { AxiosError, AxiosInstance } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { alertCurlForAxiosNetworkError } from './networkDebug';
import { getApiBaseUrl } from '../config/appConfig';

// baseURL applied per request so it never stays stuck on an old `localhost` from first bundle eval.
const apiClient: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl().replace(/\/$/, '');
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    alertCurlForAxiosNetworkError(error);

    // Handle 401 Unauthorized - clear auth
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }

    // Format error message
    const message =
      (error.response?.data as any)?.message ||
      error.message ||
      'An error occurred';

    return Promise.reject(new Error(message));
  }
);

/**
 * API Response Interfaces for Timeline
 */
export interface MemoriesResponse {
  memories: any[]; // Will be Memory[] when type is available
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Fetch memories for timeline with pagination
 * 
 * @param page - Page number (1-indexed)
 * @param limit - Number of memories per page (default: 20)
 * @returns Promise with memories and pagination info
 * 
 * @example
 * const response = await fetchMemories(1, 20);
 * // Returns: { memories: [...], pagination: { page: 1, limit: 20, total: 100, hasMore: true } }
 */
export async function fetchMemories(page: number = 1, limit: number = 20): Promise<MemoriesResponse> {
  const response = await apiClient.get('/api/v1/memories', {
    params: { page, limit },
  });
  return response.data;
}

// API methods
export const api = {
  // Auth
  auth: {
    register: async (data: { email: string; password: string; name: string }) => {
      const response = await apiClient.post('/api/v1/auth/register', data);
      return response.data;
    },
    login: async (data: { email: string; password: string }) => {
      const response = await apiClient.post('/api/v1/auth/login', data);
      return response.data;
    },
    refresh: async (data: { refreshToken: string }) => {
      const response = await apiClient.post('/api/v1/auth/refresh', data);
      return response.data;
    },
    logout: async () => {
      const response = await apiClient.post('/api/v1/auth/logout');
      return response.data;
    },
    updateProfile: async (data: { name?: string; bio?: string; profilePicUrl?: string }) => {
      const response = await apiClient.patch('/api/v1/auth/profile', data);
      return response.data;
    },
    uploadAvatar: async (formData: FormData) => {
      const response = await apiClient.post('/api/v1/auth/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      return response.data;
    },
  },

  // Memories
  memories: {
    list: async (params?: { page?: number; limit?: number }) => {
      const response = await apiClient.get('/api/v1/memories', { params });
      return response.data;
    },
    get: async (id: string) => {
      const response = await apiClient.get(`/api/v1/memories/${id}`);
      return response.data;
    },
    upload: async (formData: FormData) => {
      const response = await apiClient.post('/api/v1/memories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for uploads
      });
      return response.data;
    },
    update: async (id: string, data: { mood?: string; cluster?: string; locationName?: string; caption?: string }) => {
      const response = await apiClient.patch(`/api/v1/memories/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await apiClient.delete(`/api/v1/memories/${id}`);
      return response.data;
    },
    trash: async (params?: { page?: number; limit?: number }) => {
      const response = await apiClient.get('/api/v1/memories/trash', { params });
      return response.data;
    },
    restore: async (id: string) => {
      const response = await apiClient.post(`/api/v1/memories/${id}/restore`);
      return response.data;
    },
    permanentDelete: async (id: string) => {
      const response = await apiClient.delete(`/api/v1/memories/${id}/permanent`);
      return response.data;
    },
    getActivity: async () => {
      const response = await apiClient.get('/api/v1/memories/activity');
      return response.data;
    },
  },

  // Circles
  circles: {
    list: async () => {
      const response = await apiClient.get('/api/v1/circles');
      return response.data;
    },
    get: async (id: string) => {
      const response = await apiClient.get(`/api/v1/circles/${id}`);
      return response.data;
    },
    create: async (data: { name: string; description?: string; emoji?: string }) => {
      const response = await apiClient.post('/api/v1/circles', data);
      return response.data;
    },
    update: async (id: string, data: { name?: string; description?: string; emoji?: string }) => {
      const response = await apiClient.patch(`/api/v1/circles/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await apiClient.delete(`/api/v1/circles/${id}`);
      return response.data;
    },
    bulkAddPhotos: async (circleId: string, photoIds: string[]) => {
      const response = await apiClient.post(`/api/v1/circles/${circleId}/photos/bulk`, { photoIds });
      return response.data;
    },
  },

  // Search
  search: {
    query: async (q: string, params?: { page?: number; limit?: number; dateFrom?: string; dateTo?: string }) => {
      const response = await apiClient.get('/api/v1/search', {
        params: { q, ...params },
      });
      return response.data;
    },
  },

  // Health check
  health: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export default apiClient;

