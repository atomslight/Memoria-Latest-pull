import apiClient from './api';
import type {
  CircleListItem,
  CircleDetail,
  CirclePhotosResponse,
  UserSearchResult,
} from '../types/circle';

export const circlesApi = {
  create: async (data: { name: string; description?: string; emoji?: string }) => {
    const res = await apiClient.post('/api/v1/circles', data);
    return res.data.circle;
  },

  list: async (): Promise<{ circles: CircleListItem[] }> => {
    const res = await apiClient.get('/api/v1/circles');
    return res.data;
  },

  get: async (id: string): Promise<CircleDetail> => {
    const res = await apiClient.get(`/api/v1/circles/${id}`);
    return res.data.circle;
  },

  getPhotos: async (
    id: string,
    params?: { page?: number; limit?: number }
  ): Promise<CirclePhotosResponse> => {
    const res = await apiClient.get(`/api/v1/circles/${id}/photos`, { params });
    return res.data;
  },

  addPhoto: async (circleId: string, photoId: string): Promise<void> => {
    await apiClient.post(`/api/v1/circles/${circleId}/photos`, { photoId });
  },

  addMember: async (circleId: string, userId: string): Promise<void> => {
    await apiClient.post(`/api/v1/circles/${circleId}/members`, { userId });
  },

  removeMember: async (circleId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/circles/${circleId}/members/${userId}`);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/circles/${id}`);
  },

  searchUsers: async (query: string): Promise<{ users: UserSearchResult[] }> => {
    const res = await apiClient.get('/api/v1/users/search', { params: { q: query } });
    return res.data;
  },
};
