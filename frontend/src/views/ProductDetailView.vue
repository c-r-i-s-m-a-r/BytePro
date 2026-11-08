<template>
  <div class="container">
    <div v-if="loading" class="state-message">
      <h3>Cargando producto…</h3>
    </div>

    <div v-else-if="error" class="state-message">
      <h3>Producto no encontrado</h3>
      <p>{{ error }}</p>
      <RouterLink class="btn btn-primary" :to="{ name: 'catalog' }">
        Volver al catálogo
      </RouterLink>
    </div>

    <template v-else-if="product">
      <div class="breadcrumbs">
        <RouterLink to="/">Inicio</RouterLink>
        <span>/</span>
        <RouterLink :to="{ name: 'catalog', query: { categoria: product.categoria?.slug } }">
          {{ product.categoria?.nombre || 'Catálogo' }}
        </RouterLink>
        <span>/</span>
        <span>{{ product.nombre }}</span>
      </div>

      <div class="detail-layout">
        <div class="detail-gallery">
          <div class="detail-main-image">
            <img v-if="currentImage" :src="currentImage" :alt="product.nombre" />
            <span v-else>{{ selectedVariante?.nombre || product.categoria?.nombre }}</span>
          </div>
          <div class="detail-thumbs">
            <button
              v-for="(imagen, index) in galleryImages"
              :key="index"
              class="thumb"
              :class="{ active: index === activeImage }"
              type="button"
              :aria-label="`Ver imagen ${index + 1}`"
              @click="activeImage = index"
            >
              <img v-if="imagen" :src="imagen" :alt="`${product.nombre} ${index + 1}`" />
              <span v-else>Vista {{ index + 1 }}</span>
            </button>
          </div>
        </div>

        <div class="detail-info">
          <span class="detail-brand">{{ product.marca }} · {{ product.categoria?.nombre }}</span>
          <h1 class="detail-title">{{ product.nombre }}</h1>

          <div class="rating-row">
            <RatingStars :value="product.puntajePromedio" />
            <span>{{ product.puntajePromedio }} de 5 · {{ product.totalResenas }} reseñas</span>
          </div>

          <div class="detail-price">{{ formatPrice(currentPrice) }}</div>
          <span class="detail-price-note">Precio con impuestos incluidos</span>

          <div class="detail-facts">
            <div class="fact">
              <div class="fact-label">Garantía</div>
              <div class="fact-value">{{ product.garantiaMeses }} meses</div>
            </div>
            <div class="fact">
              <div class="fact-label">Disponibilidad</div>
              <div class="fact-value">
                <span class="badge" :class="stock.className">{{ stock.text }}</span>
              </div>
            </div>
            <div class="fact">
              <div class="fact-label">SKU</div>
              <div class="fact-value">{{ selectedVariante?.sku || '—' }}</div>
            </div>
            <div class="fact">
              <div class="fact-label">Marca</div>
              <div class="fact-value">{{ product.marca }}</div>
            </div>
          </div>

          <div v-if="product.variantes.length" class="variant-block">
            <span class="filter-label">Variante</span>
            <div class="variant-options">
              <button
                v-for="variante in product.variantes"
                :key="variante.id"
                class="variant-btn"
                :class="{ active: variante.id === selectedVarianteId }"
                type="button"
                :disabled="!variante.disponible"
                @click="selectVariante(variante)"
              >
                <div>{{ variante.nombre || 'Estándar' }}</div>
                <div class="muted" style="font-size: 12px">{{ formatPrice(variante.precio) }}</div>
              </button>
            </div>
            <p class="variant-sku">
              SKU: {{ selectedVariante?.sku || '—' }} · EAN: {{ selectedVariante?.ean || '—' }}
            </p>
          </div>

          <div class="variant-block">
            <div class="qty-row">
              <span class="filter-label">Cantidad</span>
              <QuantitySelector v-model="cantidad" :min="1" :max="Math.max(stockUnits, 1)" />
              <span class="field-hint" v-if="stockUnits > 0">{{ stockUnits }} disponibles</span>
            </div>
          </div>

          <div class="buy-actions">
            <button
              class="btn btn-primary"
              type="button"
              :disabled="!disponible || adding"
              @click="addToCart"
            >
              {{ disponible ? (adding ? 'Agregando…' : 'Añadir al carrito') : 'Agotado' }}
            </button>
            <button
              class="btn btn-secondary"
              type="button"
              :disabled="!disponible || adding"
              @click="buyNow"
            >
              Comprar ahora
            </button>
            <button
              class="compare-toggle"
              :class="{ selected: compare.isSelected(product.id) }"
              type="button"
              @click="toggleCompare"
            >
              {{ compare.isSelected(product.id) ? 'Quitar del comparador' : 'Comparar' }}
            </button>
          </div>

          <div class="alert alert-info">
            Verificamos la disponibilidad en tiempo real con el módulo de almacén.
          </div>
        </div>
      </div>

      <section class="mt-8">
        <h2 class="section-title">Ficha técnica</h2>
        <div class="card" style="padding: 0; overflow: hidden">
          <table class="spec-table">
            <tbody>
              <tr v-for="fila in specRows" :key="fila.clave">
                <th>{{ fila.etiqueta }}</th>
                <td>{{ fila.valor }}</td>
              </tr>
              <tr>
                <th>Garantía</th>
                <td>{{ product.garantiaMeses }} meses</td>
              </tr>
              <tr>
                <th>Descripción</th>
                <td>{{ product.descripcion }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="mt-8" id="resenas">
        <div class="flex-between mb-4">
          <h2 class="section-title" style="margin: 0">
            Reseñas ({{ product.totalResenas }})
          </h2>
          <div class="rating-row">
            <RatingStars :value="product.puntajePromedio" />
            <span>{{ product.puntajePromedio }} de 5</span>
          </div>
        </div>

        <div class="detail-layout" style="grid-template-columns: 1.6fr 1fr">
          <div>
            <div v-if="!product.resenas.length" class="state-message">
              <h3>Aún no hay reseñas</h3>
              <p>Sé el primero en compartir tu experiencia.</p>
            </div>
            <div v-else class="reviews-list">
              <article v-for="resena in product.resenas" :key="resena.id" class="review">
                <div class="review-head">
                  <div>
                    <span class="review-author">{{ resena.autor }}</span>
                    <span v-if="resena.compraVerificada" class="badge badge-stock" style="margin-left: 8px">
                      Compra verificada
                    </span>
                  </div>
                  <span class="review-date">{{ formatDate(resena.fecha) }}</span>
                </div>
                <RatingStars :value="resena.calificacion" />
                <p class="review-body mt-2">{{ resena.comentario }}</p>
              </article>
            </div>
          </div>

          <div>
            <div v-if="auth.isAuthenticated">
              <p class="alert alert-info mb-4">
                Solo los clientes con compra verificada pueden publicar reseñas.
              </p>
              <ReviewForm
                :submitting="reviewSubmitting"
                :server-error="reviewError"
                :reset-signal="reviewResetSignal"
                @submit="submitReview"
              />
            </div>
            <div v-else class="card">
              <p class="text-secondary">Inicia sesión para escribir una reseña.</p>
              <RouterLink
                class="btn btn-secondary mt-4"
                :to="{ name: 'login', query: { redirect: route.fullPath } }"
              >
                Iniciar sesión
              </RouterLink>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import QuantitySelector from '../components/QuantitySelector.vue';
import RatingStars from '../components/RatingStars.vue';
import ReviewForm from '../components/ReviewForm.vue';
import api, { apiErrorMessage, apiErrorDetails } from '../services/api';
import { useAuthStore } from '../store/auth';
import { useCartStore } from '../store/cart';
import { useCompareStore } from '../store/compare';
import { useUiStore } from '../store/ui';
import { formatDate, formatPrice, stockLabel } from '../utils/format';

const props = defineProps({
  slug: { type: String, required: true },
});

const auth = useAuthStore();
const cart = useCartStore();
const compare = useCompareStore();
const ui = useUiStore();
const route = useRoute();
const router = useRouter();

const product = ref(null);
const loading = ref(true);
const error = ref('');
const selectedVarianteId = ref(null);
const cantidad = ref(1);
const activeImage = ref(0);
const adding = ref(false);
const reviewSubmitting = ref(false);
const reviewError = ref('');
const reviewResetSignal = ref(0);

const selectedVariante = computed(() => {
  if (!product.value) return null;
  return (
    product.value.variantes.find((v) => v.id === selectedVarianteId.value) ||
    product.value.variantes[0] ||
    null
  );
});

const stockUnits = computed(() => {
  if (!product.value) return 0;
  return selectedVariante.value ? selectedVariante.value.stock : product.value.stock;
});

const disponible = computed(
  () => stockUnits.value > 0 && selectedVariante.value?.activo !== false
);

const currentPrice = computed(() =>
  selectedVariante.value ? selectedVariante.value.precio : product.value?.precio || 0
);

const stock = computed(() => stockLabel(stockUnits.value));

const galleryImages = computed(() => {
  const variante = selectedVariante.value;
  if (variante?.imagenes?.length) return variante.imagenes;
  if (product.value?.imagenes?.length) return product.value.imagenes;
  return [null];
});

const currentImage = computed(() => galleryImages.value[activeImage.value] || null);

const specRows = computed(() => {
  if (!product.value) return [];
  const specs = product.value.especificaciones || {};
  const definiciones = product.value.categoria?.atributos || [];
  return Object.entries(specs).map(([clave, valor]) => {
    const definicion = definiciones.find((a) => a.clave === clave);
    return {
      clave,
      etiqueta: definicion ? definicion.etiqueta : clave,
      valor: Array.isArray(valor) ? valor.join(', ') : valor,
    };
  });
});

async function loadProduct() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get(`/productos/${props.slug}`);
    product.value = data;
    const primeraDisponible = data.variantes.find((v) => v.disponible) || data.variantes[0];
    selectedVarianteId.value = primeraDisponible ? primeraDisponible.id : null;
    activeImage.value = 0;
    cantidad.value = 1;
  } catch (err) {
    error.value = apiErrorMessage(err);
    product.value = null;
  } finally {
    loading.value = false;
  }
}

function selectVariante(variante) {
  if (!variante.disponible) return;
  selectedVarianteId.value = variante.id;
  activeImage.value = 0;
  cantidad.value = Math.min(cantidad.value, Math.max(variante.stock, 1));
}

async function addToCart() {
  if (!disponible.value || !selectedVariante.value) return;
  adding.value = true;
  try {
    await cart.add(selectedVariante.value.id, cantidad.value);
  } catch (err) {
    // el store ya notifica
  } finally {
    adding.value = false;
  }
}

async function buyNow() {
  await addToCart();
  if (disponible.value) router.push({ name: 'cart' });
}

function toggleCompare() {
  const result = compare.toggle(product.value);
  if (!result.ok) ui.warning(result.message);
  else if (!result.removed) ui.success('Producto añadido al comparador');
}

async function submitReview(payload) {
  reviewSubmitting.value = true;
  reviewError.value = '';
  try {
    await api.post(`/productos/${product.value.id}/resenas`, payload);
    ui.success('Reseña publicada');
    reviewResetSignal.value += 1;
    await loadProduct();
  } catch (err) {
    const details = apiErrorDetails(err);
    reviewError.value = details?.length
      ? details.map((d) => d.message).join('. ')
      : apiErrorMessage(err);
  } finally {
    reviewSubmitting.value = false;
  }
}

watch(
  () => props.slug,
  () => loadProduct()
);

onMounted(loadProduct);
</script>
