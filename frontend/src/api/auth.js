import { apiClient } from './client';

export const authApi = {
  login: async (email, password) => {
    const response = await apiClient.post('/api/auth/login/', { email, password });
    return response.data;
  },

  register: async (data) => {
    const response = await apiClient.post('/api/auth/register/', data);
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/api/auth/me/');
    return response.data;
  },

  getUsers: async () => {
    const response = await apiClient.get('/api/auth/users/');
    return response.data;
  }
};
