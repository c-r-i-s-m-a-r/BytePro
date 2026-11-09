<template>
  <div class="container">
    <div class="breadcrumbs">
      <RouterLink to="/">Inicio</RouterLink>
      <span>/</span>
      <span>Comparador</span>
    </div>

    <div class="flex-between mb-6">
      <div>
        <h1 class="page-title">Comparador de hardware</h1>
        <p class="page-subtitle">Compara hasta 4 productos de la misma categoría.</p>
      </div>
      <button v-if="compare.count" class="btn btn-danger btn-sm" type="button" @click="clear">
        Vaciar comparador
      </button>
    </div>

    <div v-if="compare.count < 2" class="state-message">
      <h3>Selecciona al menos 2 productos</h3>
      <p>Agrega productos desde el catálogo con el botón “Comparar”.</p>
      <RouterLink class="btn btn-primary" :to="{ name: 'catalog' }">
        Ir al catálogo
      </RouterLink>
    </div>

    <div v-else-if="compare.loading" class="state-message">
      <h3>Cargando comparación…</h3>
    </div>

    <div v-else-if="compare.error" class="state-message">
      <h3>No se pudo generar la comparación</h3>
      <p>{{ compare.error }}</p>
      <RouterLink class="btn btn-primary" :to="{ name: 'catalog' }">
        Volver al catálogo
      </RouterLink>
    </div>

    <div v-else-if="compare.result" class="compare-scroll">
      <table class="compare-table">
        <thead>
          <tr>
            <th>Atributo</th>
            <th v-for="producto in compare.result.productos" :key="producto.id">
              <div class="compare-product-name">{{ producto.nombre }}</div>
              <div class="muted">{{ producto.marca }}</div>
              <div class="compare-actions">
                <button
                  class="btn btn-primary btn-sm"
                  type="button"
                  :disabled="!varianteDisponible(producto) || agregandoId === producto.id"
                  @click="agregarAlCarrito(producto)"
                >
                  <AppIcon name="cart-add" :size="15" />
                  {{ agregandoId === producto.id ? 'Agregando…' : 'Añadir al carrito' }}
                </button>
                <button
                  class="btn btn-danger btn-sm"
                  type="button"
                  @click="remove(producto.id)"
                >
                  Quitar
                </button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fila in compare.result.filas" :key="fila.atributo">
            <td>{{ fila.atributo }}</td>
            <td v-for="(valor, index) in fila.valores" :key="index">
              {{ displayValue(fila.tipo, valor) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import { useCartStore } from '../store/cart';
import { useCompareStore } from '../store/compare';
import { useUiStore } from '../store/ui';
import { formatPrice } from '../utils/format';

const compare = useCompareStore();
const cart = useCartStore();
const ui = useUiStore();
const agregandoId = ref(null);

function varianteDisponible(producto) {
  const variantes = producto.variantes || [];
  return variantes.find((variante) => variante.disponible) || null;
}

async function agregarAlCarrito(producto) {
  const variante = varianteDisponible(producto);
  if (!variante) {
    ui.warning('Este producto no tiene stock disponible.');
    return;
  }
  agregandoId.value = producto.id;
  try {
    await cart.add(variante.id, 1);
    ui.openCartDrawer();
  } catch (err) {
    // El store ya notifica el error.
  } finally {
    agregandoId.value = null;
  }
}

function displayValue(tipo, valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (tipo === 'precio') return formatPrice(valor);
  if (tipo === 'stock') return Number(valor) > 0 ? `${valor} unidades` : 'Agotado';
  if (Array.isArray(valor)) return valor.join(', ');
  return valor;
}

function remove(id) {
  compare.remove(id);
  if (compare.count >= 2) compare.fetchComparison();
  else compare.result = null;
}

async function clear() {
  const confirmed = await ui.confirm({
    title: 'Vaciar comparador',
    message: '¿Deseas quitar todos los productos de la tabla de comparación?',
    confirmText: 'Sí, vaciar',
    cancelText: 'Cancelar / Volver',
    variant: 'danger',
  });
  if (!confirmed) return;
  compare.clear();
}

onMounted(() => {
  if (compare.count >= 2) compare.fetchComparison();
});
</script>

<style scoped>
.compare-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.compare-actions .btn {
  width: 100%;
  height: 38px;
  font-size: 0.82rem;
  white-space: nowrap;
}
</style>
