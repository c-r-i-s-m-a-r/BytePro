import { defineStore } from 'pinia';
import api, { apiErrorMessage } from '../services/api';

const STORAGE_KEY = 'bytepro_compare';
const MAX = 4;

function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export const useCompareStore = defineStore('compare', {
  state: () => ({
    items: loadItems(),
    result: null,
    loading: false,
    error: null,
  }),
  getters: {
    count: (state) => state.items.length,
    ids: (state) => state.items.map((p) => p.id),
    categoriaId: (state) => (state.items[0] ? state.items[0].categoria?.id ?? null : null),
    isSelected: (state) => (id) => state.items.some((p) => p.id === id),
  },
  actions: {
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    },
    toggle(product) {
      const exists = this.items.find((p) => p.id === product.id);
      if (exists) {
        this.items = this.items.filter((p) => p.id !== product.id);
        this.persist();
        return { ok: true, removed: true };
      }
      if (this.items.length >= MAX) {
        return { ok: false, message: 'Solo puedes comparar hasta 4 productos' };
      }
      const currentCategory = this.items[0]?.categoria?.id;
      if (currentCategory && product.categoria?.id !== currentCategory) {
        return {
          ok: false,
          message: 'Solo es posible comparar productos de la misma categoría de hardware',
        };
      }
      this.items.push(product);
      this.persist();
      return { ok: true };
    },
    remove(id) {
      this.items = this.items.filter((p) => p.id !== id);
      this.persist();
    },
    clear() {
      this.items = [];
      this.result = null;
      this.persist();
    },
    async fetchComparison() {
      if (this.items.length < 2) {
        this.result = null;
        return null;
      }
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.get('/productos/comparar', {
          params: { ids: this.ids.join(',') },
        });
        this.result = data;
        return data;
      } catch (err) {
        this.error = apiErrorMessage(err);
        this.result = null;
        return null;
      } finally {
        this.loading = false;
      }
    },
  },
});
