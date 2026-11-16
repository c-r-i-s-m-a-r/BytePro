<template>
  <aside
    class="filters-panel"
    :class="{ 'filters-panel--abierto': filtrosVisiblesMovil }"
    aria-label="Filtros de catálogo"
  >
    <div class="filters-header">
      <h2 class="filters-title">Filtros</h2>

      <!-- REQ-CAT-MOB-02: acordeón de filtros visible solo en móviles -->
      <button
        class="filters-toggle"
        :class="{ 'filters-toggle--open': filtrosVisiblesMovil }"
        type="button"
        :aria-expanded="filtrosVisiblesMovil"
        aria-controls="filters-body"
        @click="filtrosVisiblesMovil = !filtrosVisiblesMovil"
      >
        <span>
          Filtros ({{ filtrosActivos }} {{ filtrosActivos === 1 ? 'activo' : 'activos' }})
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <button v-if="catalog.hayFiltrosActivos" class="btn-link" type="button" @click="clear">
        Limpiar
      </button>
    </div>

    <div
      id="filters-body"
      class="filters-body"
      :class="{ 'filters-body--collapsed': !filtrosVisiblesMovil }"
    >
      <div class="filter-group">
        <label for="filter-categoria">Categoría</label>
        <select
          id="filter-categoria"
          class="select"
          :value="catalog.filters.categoria"
          @change="catalog.setFilter('categoria', $event.target.value)"
        >
          <option value="">Todas las categorías</option>
          <option v-for="categoria in catalog.categorias" :key="categoria.id" :value="categoria.slug">
            {{ categoria.nombre }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-marca">Marca</label>
        <select
          id="filter-marca"
          class="select"
          :value="catalog.filters.marca"
          @change="catalog.setFilter('marca', $event.target.value)"
        >
          <option value="">Todas las marcas</option>
          <option v-for="marca in catalog.facetas.marcas" :key="marca" :value="marca">
            {{ marca }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <span class="filter-label">Precio (Bs.)</span>
        <div class="filter-price-row">
          <input
            class="input"
            type="number"
            min="0"
            placeholder="Mín"
            :value="catalog.filters.precioMin"
            aria-label="Precio mínimo"
            @change="catalog.setFilter('precioMin', $event.target.value)"
          />
          <input
            class="input"
            type="number"
            min="0"
            placeholder="Máx"
            :value="catalog.filters.precioMax"
            aria-label="Precio máximo"
            @change="catalog.setFilter('precioMax', $event.target.value)"
          />
        </div>
      </div>

      <div
        v-for="atributo in catalog.atributosDisponibles"
        :key="atributo.clave"
        class="filter-group"
      >
        <label :for="`attr-${atributo.clave}`">{{ atributo.etiqueta }}</label>
        <select
          v-if="atributo.opciones && atributo.opciones.length"
          :id="`attr-${atributo.clave}`"
          class="select"
          :value="catalog.filters.attr[atributo.clave] || ''"
          @change="catalog.setAttribute(atributo.clave, $event.target.value)"
        >
          <option value="">Todos</option>
          <option v-for="opcion in atributo.opciones" :key="opcion" :value="opcion">
            {{ opcion }}
          </option>
        </select>
        <input
          v-else
          :id="`attr-${atributo.clave}`"
          class="input"
          type="text"
          :value="catalog.filters.attr[atributo.clave] || ''"
          @change="catalog.setAttribute(atributo.clave, $event.target.value)"
        />
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useCatalogStore } from '../store/catalog';

const catalog = useCatalogStore();

// En móvil el panel arranca plegado para no empujar los productos hacia abajo.
const filtrosVisiblesMovil = ref(false);

const filtrosActivos = computed(() => {
  const f = catalog.filters;
  let total = 0;
  if (f.q) total += 1;
  if (f.categoria) total += 1;
  if (f.marca) total += 1;
  if (f.precioMin) total += 1;
  if (f.precioMax) total += 1;
  total += Object.values(f.attr || {}).filter(
    (valor) => valor !== '' && valor !== null && valor !== undefined
  ).length;
  return total;
});

function clear() {
  catalog.resetFilters();
}
</script>

<style scoped>
.filters-toggle {
  display: none;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  padding: 0;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
}

.filters-toggle svg {
  width: 16px;
  height: 16px;
  flex: none;
  transition: transform 0.18s ease;
}

.filters-toggle--open svg {
  transform: rotate(180deg);
}

@media (max-width: 767px) {
  .filters-toggle {
    display: inline-flex;
  }

  .filters-title {
    display: none;
  }

  .filters-body--collapsed {
    display: none;
  }

  .filters-header {
    margin-bottom: 0;
  }

  .filters-panel--abierto .filters-header {
    margin-bottom: var(--space-4);
  }
}
</style>
