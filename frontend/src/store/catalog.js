import { defineStore } from 'pinia';
import api, { apiErrorMessage } from '../services/api';

const defaultFilters = () => ({
  q: '',
  categoria: '',
  marca: '',
  precioMin: '',
  precioMax: '',
  orden: 'recientes',
  attr: {},
  page: 1,
  limit: 12,
});

export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    items: [],
    pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    facetas: { marcas: [] },
    categorias: [],
    filters: defaultFilters(),
    loading: false,
    error: null,
    initialized: false,
  }),
  getters: {
    categoriaSeleccionada: (state) =>
      state.categorias.find((c) => c.slug === state.filters.categoria) || null,
    atributosDisponibles() {
      return this.categoriaSeleccionada?.atributos || [];
    },
    hayFiltrosActivos: (state) =>
      Boolean(
        state.filters.q ||
          state.filters.categoria ||
          state.filters.marca ||
          state.filters.precioMin ||
          state.filters.precioMax ||
          Object.values(state.filters.attr).some((v) => v !== '')
      ),
  },
  actions: {
    buildParams() {
      const f = this.filters;
      const params = { page: f.page, limit: f.limit, orden: f.orden };
      if (f.q) params.q = f.q;
      if (f.categoria) params.categoria = f.categoria;
      if (f.marca) params.marca = f.marca;
      if (f.precioMin) params.precioMin = f.precioMin;
      if (f.precioMax) params.precioMax = f.precioMax;
      Object.entries(f.attr).forEach(([clave, valor]) => {
        if (valor !== '' && valor !== null && valor !== undefined) {
          params[`attr_${clave}`] = valor;
        }
      });
      return params;
    },
    async fetchCategorias() {
      try {
        const { data } = await api.get('/categorias');
        this.categorias = data.items;
      } catch (err) {
        this.error = apiErrorMessage(err);
      }
    },
    async fetchProductos() {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.get('/productos', { params: this.buildParams() });
        this.items = data.items;
        this.pagination = data.pagination;
        if (data.facetas) this.facetas = data.facetas;
      } catch (err) {
        this.error = apiErrorMessage(err);
        this.items = [];
      } finally {
        this.loading = false;
      }
    },
    async init() {
      if (this.initialized) return;
      this.initialized = true;
      await Promise.all([this.fetchCategorias(), this.fetchProductos()]);
    },
    setFilter(key, value) {
      this.filters[key] = value;
      if (key === 'categoria') {
        this.filters.attr = {};
      }
      this.filters.page = 1;
      this.fetchProductos();
    },
    setAttribute(clave, valor) {
      this.filters.attr = { ...this.filters.attr, [clave]: valor };
      this.filters.page = 1;
      this.fetchProductos();
    },
    setPage(page) {
      this.filters.page = page;
      this.fetchProductos();
    },
    setLimit(limit) {
      this.filters.limit = limit;
      this.filters.page = 1;
      this.fetchProductos();
    },
    resetFilters() {
      const limit = this.filters.limit;
      this.filters = { ...defaultFilters(), limit };
      this.fetchProductos();
    },
  },
});
