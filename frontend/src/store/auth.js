import { defineStore } from 'pinia';
import api, { apiErrorMessage } from '../services/api';

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('bytepro_user') || 'null');
  } catch (e) {
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('bytepro_token') || null,
    user: readUser(),
    loading: false,
    error: null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user),
    isStaff: (state) =>
      Boolean(state.user && ['admin', 'empleado', 'vendedor', 'soporte', 'operaciones'].includes(state.user.rol)),
    isAdmin: (state) => Boolean(state.user && state.user.rol === 'admin'),
    funcionActiva: (state) => state.user?.funcionActiva || state.user?.rol || null,
    rolesDisponibles: (state) => {
      if (!state.user) return [];
      if (Array.isArray(state.user.roles) && state.user.roles.length > 0) {
        return state.user.roles;
      }
      return [state.user.rol];
    },
    tieneMultiplesFunciones: (state) => {
      if (!state.user) return false;
      const roles = Array.isArray(state.user.roles) && state.user.roles.length > 0 ? state.user.roles : [state.user.rol];
      return roles.length > 1 || state.user.rol === 'admin';
    },
  },
  actions: {
    setSession({ token, user }) {
      this.token = token;
      this.user = user;
      localStorage.setItem('bytepro_token', token);
      localStorage.setItem('bytepro_user', JSON.stringify(user));
    },
    clearSession() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('bytepro_token');
      localStorage.removeItem('bytepro_user');
    },
    async cambiarFuncion(nuevaFuncion) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.post('/auth/cambiar-funcion', { funcion: nuevaFuncion });
        if (data.token) this.token = data.token;
        if (data.user) this.user = data.user;
        localStorage.setItem('bytepro_token', this.token);
        localStorage.setItem('bytepro_user', JSON.stringify(this.user));
        return data;
      } catch (err) {
        this.error = apiErrorMessage(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async register(payload) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.post('/auth/register', payload);
        this.setSession(data);
        return data;
      } catch (err) {
        this.error = apiErrorMessage(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async login(payload) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.post('/auth/login', payload);
        this.setSession(data);
        return data;
      } catch (err) {
        this.error = apiErrorMessage(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async loginEmpresa(payload) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.post('/auth/login-empresa', payload);
        this.setSession(data);
        return data;
      } catch (err) {
        this.error = apiErrorMessage(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async fetchMe() {
      if (!this.token) return null;
      try {
        const { data } = await api.get('/auth/me');
        this.user = data.user;
        localStorage.setItem('bytepro_user', JSON.stringify(data.user));
        return data.user;
      } catch (err) {
        if (err?.response?.status === 401) this.clearSession();
        return null;
      }
    },
    logout() {
      this.clearSession();
      try {
        localStorage.removeItem('bytepro_session');
      } catch (e) {
        // sin acción
      }
    },
  },
});
