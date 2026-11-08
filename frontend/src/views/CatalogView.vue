<template>
  <div class="container">
    <div class="breadcrumbs">
      <RouterLink to="/">Inicio</RouterLink>
      <span>/</span>
      <span>Catálogo</span>
    </div>

    <div class="catalog-header">
      <div>
        <h1 class="page-title">Catálogo de hardware</h1>
        <p class="page-subtitle">
          Componentes de alto rendimiento para tu próxima build.
        </p>
      </div>
    </div>

    <div class="catalog-layout">
      <FilterSidebar />

      <section>
        <div class="catalog-toolbar">
          <span class="result-count">
            {{ catalog.pagination.total }}
            {{ catalog.pagination.total === 1 ? 'producto' : 'productos' }}
          </span>
          <div class="toolbar-controls">
            <label class="muted" for="sort-select">Ordenar</label>
            <select
              id="sort-select"
              class="select-inline"
              :value="catalog.filters.orden"
              @change="catalog.setFilter('orden', $event.target.value)"
            >
              <option value="recientes">Más recientes</option>
              <option value="precio_asc">Menor precio</option>
              <option value="precio_desc">Mayor precio</option>
              <option value="mejor_valorados">Mejor valorados</option>
            </select>
            <label class="muted" for="limit-select">Mostrar</label>
            <select
              id="limit-select"
              class="select-inline"
              :value="catalog.filters.limit"
              @change="catalog.setLimit(Number($event.target.value))"
            >
              <option :value="12">12</option>
              <option :value="24">24</option>
            </select>
          </div>
        </div>

        <div v-if="catalog.loading" class="loading-grid">
          <div v-for="n in 6" :key="n" class="skeleton-card"></div>
        </div>

        <div v-else-if="catalog.error" class="state-message">
          <h3>No pudimos cargar el catálogo</h3>
          <p>{{ catalog.error }}</p>
          <button class="btn btn-primary" type="button" @click="catalog.fetchProductos()">
            Reintentar
          </button>
        </div>

        <div v-else-if="!catalog.items.length" class="state-message">
          <h3>No se encontraron productos</h3>
          <p>Prueba con otros filtros o términos de búsqueda.</p>
          <button class="btn btn-primary" type="button" @click="catalog.resetFilters()">
            Limpiar filtros
          </button>
        </div>

        <template v-else>
          <div class="product-grid">
            <ProductCard
              v-for="producto in catalog.items"
              :key="producto.id"
              :product="producto"
            />
          </div>

          <PaginationBar
            :pagination="catalog.pagination"
            @change="catalog.setPage"
          />
        </template>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import FilterSidebar from '../components/FilterSidebar.vue';
import PaginationBar from '../components/PaginationBar.vue';
import ProductCard from '../components/ProductCard.vue';
import { useCatalogStore } from '../store/catalog';

const catalog = useCatalogStore();
const route = useRoute();

function syncCategoryFromRoute() {
  const categoria = route.query.categoria || '';
  if (categoria !== catalog.filters.categoria) {
    catalog.setFilter('categoria', categoria);
  }
}

onMounted(async () => {
  await catalog.init();
  syncCategoryFromRoute();
});

watch(() => route.query.categoria, syncCategoryFromRoute);
</script>
