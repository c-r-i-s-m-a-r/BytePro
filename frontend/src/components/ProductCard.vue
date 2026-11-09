<template>
  <article class="product-card">
    <RouterLink
      class="product-media"
      :to="{ name: 'product', params: { slug: product.slug } }"
      :aria-label="`Ver ${product.nombre}`"
    >
      <img v-if="product.imagenPrincipal" :src="product.imagenPrincipal" :alt="product.nombre" />
      <span v-else class="product-media-label">{{ product.categoria?.nombre || 'Hardware' }}</span>
    </RouterLink>

    <span class="product-brand">{{ product.marca }}</span>
    <RouterLink class="product-name" :to="{ name: 'product', params: { slug: product.slug } }">
      {{ product.nombre }}
    </RouterLink>

    <div class="rating-row">
      <RatingStars :value="product.puntajePromedio" />
      <span>({{ product.totalResenas }})</span>
    </div>

    <div class="product-meta">
      <span class="product-price">{{ formatPrice(product.precio) }}</span>
      <span class="badge" :class="stock.className">{{ stock.text }}</span>
    </div>

    <div class="product-actions">
      <button
        class="btn btn-primary btn-sm product-add-btn"
        type="button"
        :disabled="!varianteDisponible || adding"
        @click="agregarAlCarrito"
      >
        <AppIcon name="cart-add" :size="16" />
        {{ adding ? 'Agregando…' : varianteDisponible ? 'Agregar al carrito' : 'Agotado' }}
      </button>
      <RouterLink
        class="btn btn-secondary btn-sm"
        :to="{ name: 'product', params: { slug: product.slug } }"
      >
        Ver detalle
      </RouterLink>
      <button
        class="compare-toggle"
        :class="{ selected: compare.isSelected(product.id) }"
        type="button"
        @click="toggleCompare"
      >
        {{ compare.isSelected(product.id) ? 'Quitar' : 'Comparar' }}
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import AppIcon from './AppIcon.vue';
import RatingStars from './RatingStars.vue';
import { formatPrice, stockLabel } from '../utils/format';
import { useCartStore } from '../store/cart';
import { useCompareStore } from '../store/compare';
import { useUiStore } from '../store/ui';

const props = defineProps({
  product: { type: Object, required: true },
});

const cart = useCartStore();
const compare = useCompareStore();
const ui = useUiStore();

const adding = ref(false);

const stock = computed(() => stockLabel(props.product.stock));

const varianteDisponible = computed(() => {
  const variantes = props.product.variantes || [];
  return variantes.find((variante) => variante.disponible) || null;
});

async function agregarAlCarrito() {
  if (!varianteDisponible.value || adding.value) return;
  adding.value = true;
  try {
    await cart.add(varianteDisponible.value.id, 1);
  } catch (err) {
    // el store ya notifica el error
  } finally {
    adding.value = false;
  }
}

function toggleCompare() {
  const result = compare.toggle(props.product);
  if (!result.ok) ui.warning(result.message);
  else if (!result.removed) ui.success('Producto añadido al comparador');
}
</script>
