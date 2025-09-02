import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cra-backend.vercel.app/v1/api';

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - cookies are sent automatically with withCredentials: true
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh using cookies
        const response = await axios.post(`${API_BASE_URL}/user/refresh-token`, {}, { 
          withCredentials: true 
        });

        if (response.data.success) {
          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Don't redirect automatically - let the auth context handle it
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
