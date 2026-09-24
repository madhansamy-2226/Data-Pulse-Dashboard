import { apiClient } from './client';

export const analyticsApi = {
  // CSV Upload & Async Jobs
  uploadCSV: async (formData) => {
    const response = await apiClient.post('/api/analytics/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getJobStatus: async (jobId) => {
    const response = await apiClient.get(`/api/analytics/jobs/${jobId}/`);
    return response.data;
  },

  getJobHistory: async () => {
    const response = await apiClient.get('/api/analytics/jobs/');
    return response.data;
  },

  // Datasets
  getDatasets: async () => {
    const response = await apiClient.get('/api/analytics/datasets/');
    return response.data;
  },

  deleteDataset: async (id) => {
    const response = await apiClient.delete(`/api/analytics/datasets/${id}/`);
    return response.data;
  },

  // Aggregation Endpoints (Redis Cached)
  getSummary: async (params = {}) => {
    const response = await apiClient.get('/api/analytics/summary/', { params });
    return response.data;
  },

  getTrends: async (params = {}) => {
    const response = await apiClient.get('/api/analytics/trends/', { params });
    return response.data;
  },

  getCategories: async (params = {}) => {
    const response = await apiClient.get('/api/analytics/categories/', { params });
    return response.data;
  },

  getTopProducts: async (params = {}) => {
    const response = await apiClient.get('/api/analytics/top-products/', { params });
    return response.data;
  },

  getFilters: async () => {
    const response = await apiClient.get('/api/analytics/filters/');
    return response.data;
  },

  clearCache: async () => {
    const response = await apiClient.post('/api/analytics/clear-cache/');
    return response.data;
  },

  // PDF Export
  exportPDF: async (data = {}) => {
    const response = await apiClient.post('/api/analytics/export-pdf/', data);
    return response.data;
  },

  getReportStatus: async (reportId) => {
    const response = await apiClient.get(`/api/analytics/reports/${reportId}/status/`);
    return response.data;
  },

  downloadPDF: async (reportId, fileName = 'salespulse_report.pdf') => {
    const response = await apiClient.get(`/api/analytics/reports/${reportId}/download/`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
