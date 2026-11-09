<template>
  <Teleport to="body">
    <Transition name="cart-drawer">
      <div v-if="open" class="cart-drawer-root">
        <div class="cart-drawer-backdrop" @click="cerrar"></div>

        <aside
          class="cart-drawer-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-drawer-title"
        >
          <header class="cart-drawer-header">
            <div class="cart-drawer-heading">
              <span class="cart-drawer-heading-icon">
                <AppIcon name="cart" :size="20" />
              </span>
              <h2 id="cart-drawer-title" class="cart-drawer-title">Tu carrito</h2>
              <span class="badge-count">{{ cart.count }}</span>
            </div>
            <button
              class="cart-drawer-close"
              type="button"
              aria-label="Cerrar carrito"
              @click="cerrar"
            >
              &times;
            </button>
          </header>

          <div v-if="cart.loading && !cart.items.length" class="cart-drawer-state">
            <p>Cargando carrito…</p>
          </div>

          <div v-else-if="!cart.items.length" class="cart-drawer-state">
            <span class="cart-drawer-empty-icon">
              <AppIcon name="cart" :size="42" />
            </span>
            <p>Tu carrito está vacío.</p>
            <span class="field-hint">Agrega productos desde el catálogo para verlos aquí.</span>
            <RouterLink class="btn btn-primary btn-sm" :to="{ name: 'catalog' }" @click="cerrar">
              Explorar catálogo
            </RouterLink>
          </div>

          <div v-else class="cart-drawer-body">
            <ul class="cart-drawer-items">
              <li v-for="item in cart.items" :key="item.id" class="cart-drawer-item">
                <div class="cart-drawer-thumb">
                  <img v-if="item.imagen" :src="item.imagen" :alt="item.nombreProducto" />
                  <span v-else>HW</span>
                </div>

                <div class="cart-drawer-item-info">
                  <div class="cart-drawer-item-title">{{ item.nombreProducto }}</div>
                  <div class="cart-drawer-item-meta">
                    {{ item.nombreVariante || 'Estándar' }}
                  </div>
                  <div class="cart-drawer-item-bottom">
                    <span>{{ item.cantidad }} × {{ formatPrice(item.precioUnitario) }}</span>
                    <strong>{{ formatPrice(item.subtotal) }}</strong>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <footer v-if="cart.items.length" class="cart-drawer-footer">
            <div class="cart-drawer-total">
              <span>Total</span>
              <strong>{{ formatPrice(cart.total) }}</strong>
            </div>
            <RouterLink class="btn btn-primary btn-block cart-drawer-cta" :to="{ name: 'cart' }" @click="cerrar">
              <AppIcon name="cart" :size="18" />
              Ver carrito completo
            </RouterLink>
            <p class="field-hint">Precios expresados en bolivianos (Bs.).</p>
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, watch } from 'vue';
import { RouterLink } from 'vue-router';
import AppIcon from './AppIcon.vue';
import { useCartStore } from '../store/cart';
import { formatPrice } from '../utils/format';

const props = defineProps({
  open: { type: Boolean, default: false },
});

const emit = defineEmits(['close']);

const cart = useCartStore();

function cerrar() {
  emit('close');
}

function onKeydown(event) {
  if (event.key === 'Escape') cerrar();
}

function bloquearScroll(bloquear) {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = bloquear ? 'hidden' : '';
}

watch(
  () => props.open,
  (abierto) => {
    bloquearScroll(abierto);
    if (abierto) {
      cart.fetch();
      window.addEventListener('keydown', onKeydown);
    } else {
      window.removeEventListener('keydown', onKeydown);
    }
  }
);

onBeforeUnmount(() => {
  bloquearScroll(false);
  window.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.cart-drawer-root {
  position: fixed;
  inset: 0;
  z-index: 9000;
}

.cart-drawer-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(17, 24, 39, 0.5);
  backdrop-filter: blur(2px);
}

.cart-drawer-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(420px, 92vw);
  display: flex;
  flex-direction: column;
  background: var(--color-white);
  border-left: 1px solid var(--color-border);
  box-shadow: -24px 0 48px rgba(15, 23, 42, 0.18);
}

.cart-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.cart-drawer-heading {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.cart-drawer-heading-icon {
  display: inline-flex;
  color: var(--color-primary);
}

.cart-drawer-title {
  margin: 0;
  font-size: 18px;
}

.cart-drawer-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-white);
  color: var(--color-text-secondary);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.cart-drawer-close:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.cart-drawer-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-6);
  text-align: center;
  color: var(--color-text-secondary);
}

.cart-drawer-state p {
  margin: 0;
  font-weight: 600;
  color: var(--color-text);
}

.cart-drawer-empty-icon {
  display: inline-flex;
  color: var(--color-border-strong);
}

.cart-drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-5);
}

.cart-drawer-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.cart-drawer-item {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.cart-drawer-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.cart-drawer-thumb {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  background: var(--color-bg-muted);
  display: grid;
  place-items: center;
  overflow: hidden;
  font-size: 11px;
  color: var(--color-text-muted);
}

.cart-drawer-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-drawer-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cart-drawer-item-title {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cart-drawer-item-meta {
  font-size: 12px;
  color: var(--color-text-muted);
}

.cart-drawer-item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: auto;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.cart-drawer-item-bottom strong {
  color: var(--color-text);
}

.cart-drawer-footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
}

.cart-drawer-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
  font-size: 15px;
}

.cart-drawer-total strong {
  font-size: 20px;
}

.cart-drawer-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.cart-drawer-footer .field-hint {
  margin: var(--space-2) 0 0;
  text-align: center;
}

.cart-drawer-enter-active,
.cart-drawer-leave-active {
  transition: opacity 0.2s ease;
}

.cart-drawer-enter-active .cart-drawer-panel,
.cart-drawer-leave-active .cart-drawer-panel {
  transition: transform 0.25s ease;
}

.cart-drawer-enter-from,
.cart-drawer-leave-to {
  opacity: 0;
}

.cart-drawer-enter-from .cart-drawer-panel,
.cart-drawer-leave-to .cart-drawer-panel {
  transform: translateX(100%);
}
</style>
