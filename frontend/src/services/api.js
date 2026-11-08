import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bytepro_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const sessionId = localStorage.getItem('bytepro_session');
  if (sessionId) config.headers['x-session-id'] = sessionId;
  return config;
});

api.interceptors.response.use(
  (response) => {
    const sessionId = response.headers['x-session-id'];
    if (sessionId) localStorage.setItem('bytepro_session', sessionId);
    return response;
  },
  (error) => Promise.reject(error)
);

export function apiErrorMessage(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.message ||
    'Ocurrió un error inesperado'
  );
}

export function apiErrorDetails(error) {
  return error?.response?.data?.error?.details || null;
}

export default api;
