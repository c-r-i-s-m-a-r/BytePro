import { defineStore } from 'pinia';
import api, { apiErrorMessage } from '../services/api';
import { useAuthStore } from './auth';
import { useUiStore } from './ui';

export const useCartStore = defineStore('cart', {
  state: () => ({
    cart: null,
    loading: false,
  }),
  getters: {
    count: (state) => (state.cart ? state.cart.unidades : 0),
    total: (state) => (state.cart ? state.cart.total : 0),
    items: (state) => (state.cart ? state.cart.items : []),
  },
  actions: {
    async fetch() {
      const auth = useAuthStore();
      const sessionId = localStorage.getItem('bytepro_session');

      if (!auth.isAuthenticated && !sessionId) {
        this.cart = null;
        return null;
      }

      this.loading = true;
      try {
        const { data } = await api.get('/carrito');
        this.cart = data;
        if (data.warning) useUiStore().warning(data.warning);
        return data;
      } catch (err) {
        if (err?.response?.status === 401) {
          useAuthStore().clearSession();
          this.cart = null;
        }
        return null;
      } finally {
        this.loading = false;
      }
    },
    async fetchCart() {
      return this.fetch();
    },
    async add(varianteId, cantidad = 1) {
      const ui = useUiStore();
      this.loading = true;
      try {
        const { data } = await api.post('/carrito/items', { varianteId, cantidad });
        this.cart = data;
        if (data.warning) ui.warning(data.warning);
        else ui.success('Producto agregado al carrito');
        return data;
      } catch (err) {
        ui.error(apiErrorMessage(err));
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async update(itemId, cantidad) {
      const ui = useUiStore();
      try {
        const { data } = await api.patch(`/carrito/items/${itemId}`, { cantidad });
        this.cart = data;
        if (data.warning) ui.warning(data.warning);
        return data;
      } catch (err) {
        ui.error(apiErrorMessage(err));
        throw err;
      }
    },
    async remove(itemId) {
      const ui = useUiStore();
      try {
        const { data } = await api.delete(`/carrito/items/${itemId}`);
        this.cart = data;
        ui.info('Producto eliminado del carrito');
        return data;
      } catch (err) {
        ui.error(apiErrorMessage(err));
        throw err;
      }
    },
    async clear() {
      try {
        const { data } = await api.delete('/carrito');
        this.cart = data;
      } catch (err) {
        useUiStore().error(apiErrorMessage(err));
      }
    },
    reset() {
      this.cart = null;
      this.loading = false;
    },
  },
});
