import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cra-backend.vercel.app/v1/api';
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cra-backend-iota.vercel.app/v1/api';

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1/api';

export const setTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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

    // Only attempt token refresh for authenticated requests (not login attempts)
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.headers?.Authorization) {
      originalRequest._retry = true;

      try {
        // Try to refresh using refreshToken from localStorage
        const storedRefresh = localStorage.getItem('refreshToken');
        if (!storedRefresh) {
          clearTokens();
          // Only redirect if this was an authenticated request (not a login attempt)
          if (originalRequest.headers?.Authorization) {
            try { window.location.href = '/'; } catch (_) {}
          }
          throw new Error('Aucun jeton de rafraîchissement');
        }
        const response = await axios.post(`${API_BASE_URL}/user/refresh-token`, { refreshToken: storedRefresh });

        if (response.data.success) {
          const newAccess = response.data.data?.accessToken;
          const newRefresh = response.data.data?.refreshToken;
          if (newAccess) localStorage.setItem('accessToken', newAccess);
          if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Clear tokens and force redirect to login only for authenticated requests
        clearTokens();
        if (originalRequest.headers?.Authorization) {
          try { window.location.href = '/'; } catch (_) {}
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
