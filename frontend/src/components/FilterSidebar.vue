<template>
  <aside class="filters-panel" aria-label="Filtros de catálogo">
    <div class="filters-header">
      <h2 class="filters-title">Filtros</h2>
      <button v-if="catalog.hayFiltrosActivos" class="btn-link" type="button" @click="clear">
        Limpiar
      </button>
    </div>

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
      <span class="filter-label">Precio (USD)</span>
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
  </aside>
</template>

<script setup>
import { useCatalogStore } from '../store/catalog';

const catalog = useCatalogStore();

function clear() {
  catalog.resetFilters();
}
</script>
