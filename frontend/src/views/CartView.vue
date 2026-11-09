<template>
  <div class="container">
    <div class="breadcrumbs">
      <RouterLink to="/">Inicio</RouterLink>
      <span>/</span>
      <span>Carrito</span>
    </div>

    <h1 class="page-title mb-6">Carrito de compras</h1>

    <div v-if="cart.loading && !cart.cart" class="state-message">
      <h3>Cargando carrito…</h3>
    </div>

    <template v-else-if="!cart.items.length">
      <div v-if="!auth.isAuthenticated" class="state-message">
        <h3>No has iniciado sesión.</h3>
        <p>Inicia sesión para ver tu carrito guardado o explora nuestro catálogo de componentes.</p>
        <div class="state-actions">
          <RouterLink
            class="btn btn-primary"
            :to="{ name: 'login', query: { redirect: '/carrito' } }"
          >
            Iniciar sesión
          </RouterLink>
          <RouterLink class="btn btn-secondary" :to="{ name: 'catalog' }">
            Ir al catálogo
          </RouterLink>
        </div>
      </div>
      <div v-else class="state-message">
        <h3>Tu carrito está vacío.</h3>
        <p>Descubre las últimas ofertas en procesadores, tarjetas gráficas y componentes.</p>
        <RouterLink class="btn btn-primary" :to="{ name: 'catalog' }">
          Explorar catálogo
        </RouterLink>
      </div>
    </template>

    <div v-else>
      <div v-if="!auth.isAuthenticated" class="cart-session-banner">
        <p>
          Inicia sesión para sincronizar tu carrito, guardar tus artículos y finalizar tu
          compra.
        </p>
        <div class="cart-session-actions">
          <RouterLink
            class="btn btn-primary btn-sm"
            :to="{ name: 'login', query: { redirect: '/carrito' } }"
          >
            Iniciar sesión
          </RouterLink>
          <RouterLink
            class="btn btn-secondary btn-sm"
            :to="{ name: 'register', query: { redirect: '/carrito' } }"
          >
            Registrarme
          </RouterLink>
        </div>
      </div>

      <div class="cart-layout">
      <div class="cart-items">
        <article v-for="item in cart.items" :key="item.id" class="cart-item">
          <div class="cart-thumb">
            <img v-if="item.imagen" :src="item.imagen" :alt="item.nombreProducto" />
            <span v-else>Hardware</span>
          </div>

          <div>
            <div class="cart-item-title">{{ item.nombreProducto }}</div>
            <div class="cart-item-meta">
              {{ item.nombreVariante || 'Estándar' }} · SKU {{ item.sku }}
            </div>
            <div class="cart-item-meta">
              Precio unitario: {{ formatPrice(item.precioUnitario) }}
            </div>
            <div v-if="!item.disponible" class="field-error mt-2">Producto sin stock</div>
          </div>

          <div class="cart-item-right">
            <QuantitySelector
              :model-value="item.cantidad"
              :min="1"
              :max="Math.max(item.stock, 1)"
              @update:model-value="(value) => cart.update(item.id, value)"
            />
            <strong>{{ formatPrice(item.subtotal) }}</strong>
            <button class="btn btn-danger btn-sm" type="button" @click="confirmRemoveItem(item)">
              Eliminar
            </button>
          </div>
        </article>
      </div>

      <aside class="summary-card">
        <h2 class="section-title">Resumen del pedido</h2>
        <div class="summary-row">
          <span>Subtotal ({{ cart.count }} {{ cart.count === 1 ? 'unidad' : 'unidades' }})</span>
          <span>{{ formatPrice(cart.total) }}</span>
        </div>
        <div class="summary-row">
          <span>Envío</span>
          <span>Calculado en checkout</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span>{{ formatPrice(cart.total) }}</span>
        </div>
        <button class="btn btn-primary btn-block mt-4" type="button" @click="goCheckout">
          Continuar al checkout
        </button>
        <p class="field-hint mt-2">
          {{
            auth.isAuthenticated
              ? 'Serás redirigido al checkout seguro con reserva temporal de stock.'
              : 'Inicia sesión para continuar con el pago.'
          }}
        </p>
        <button class="btn btn-danger btn-block mt-4" type="button" @click="confirmClearCart">
          Vaciar carrito
        </button>
      </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import QuantitySelector from '../components/QuantitySelector.vue';
import { useAuthStore } from '../store/auth';
import { useCartStore } from '../store/cart';
import { useUiStore } from '../store/ui';
import { formatPrice } from '../utils/format';

const cart = useCartStore();
const auth = useAuthStore();
const ui = useUiStore();
const router = useRouter();

async function confirmRemoveItem(item) {
  const confirmed = await ui.confirm({
    title: 'Eliminar producto del carrito',
    message: `¿Estás seguro de que deseas eliminar "${item.nombreProducto}" de tu carrito de compras?`,
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar / Volver',
    variant: 'danger',
  });
  if (!confirmed) return;
  await cart.remove(item.id);
}

async function confirmClearCart() {
  const confirmed = await ui.confirm({
    title: 'Vaciar carrito de compras',
    message: '¿Estás seguro de que deseas vaciar todos los productos de tu carrito? Esta acción no se puede deshacer.',
    confirmText: 'Sí, vaciar carrito',
    cancelText: 'Cancelar / Volver',
    variant: 'danger',
  });
  if (!confirmed) return;
  await cart.clear();
}

function goCheckout() {
  if (!auth.isAuthenticated) {
    ui.info('Debes iniciar sesión para continuar con el proceso de pago');
    router.push({ name: 'login', query: { redirect: '/checkout' } });
    return;
  }
  router.push({ name: 'checkout' });
}

onMounted(() => cart.fetch());
</script>

<style scoped>
.cart-thumb {
  overflow: hidden;
}

.cart-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
