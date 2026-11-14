<template>
  <div class="app-shell">
    <AppHeader v-if="!esLanding" />
    <main class="app-main" :class="{ 'app-main-landing': esLanding }">
      <RouterView />
    </main>
    <AppFooter v-if="!esLanding" />
    <ToastStack />
    <ConfirmModal />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';
import ToastStack from './components/ToastStack.vue';
import ConfirmModal from './components/ConfirmModal.vue';
import { initRealtime, subscribeToTables, disconnectRealtime } from './services/realtime';
import { useCartStore } from './store/cart';
import { useCatalogStore } from './store/catalog';

const route = useRoute();
const cart = useCartStore();
const catalog = useCatalogStore();
const esLanding = computed(() => route.name === 'landing');

let unsubscribeRealtime = null;

onMounted(() => {
  unsubscribeRealtime = subscribeToTables(
    ['productos', 'variantes', 'inventarios', 'categorias', 'resenas'],
    () => {
      catalog.refreshSilently();
      cart.fetchCart();
    }
  );
  initRealtime().catch(() => {
    // El SSE se reintenta automáticamente; no se bloquea la app.
  });
});

onUnmounted(() => {
  if (unsubscribeRealtime) unsubscribeRealtime();
  unsubscribeRealtime = null;
  disconnectRealtime();
});
</script>
