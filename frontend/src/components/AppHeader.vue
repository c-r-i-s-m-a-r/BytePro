<template>
  <header class="site-header" :class="{ 'corporate-header': auth.isStaff }">
    <div class="container header-inner">
      <!-- REQ-NAV-03: El logo lleva al portal si es staff y al catálogo si el cliente está autenticado -->
      <RouterLink class="brand" :to="brandTarget">
        <img :src="byteproLogo" alt="BytePro" class="brand-logo" />
        <span>BytePro{{ auth.isStaff ? ' Portal' : '' }}</span>
      </RouterLink>

      <!-- REQ-EMP-08: Ocultar barra pública de búsqueda de compras si es empleado o admin -->
      <form v-if="!auth.isStaff" class="search-bar" role="search" @submit.prevent="applySearch">
        <input
          v-model="term"
          class="search-input"
          type="search"
          placeholder="Busca por producto, marca o especificación"
          aria-label="Buscar productos"
          @input="onInput"
        />
      </form>

      <!-- REQ-EMP-05 / REQ-EMP-06: Conmutador de Función Activa en el header si tiene múltiples roles -->
      <div v-if="auth.isStaff && auth.tieneMultiplesFunciones" class="role-switcher-header">
        <label for="header-role-switch" class="muted mr-2">Función activa:</label>
        <select
          id="header-role-switch"
          class="select select-inline"
          :value="auth.funcionActiva"
          @change="onCambiarFuncion($event.target.value)"
        >
          <option v-for="r in auth.rolesDisponibles" :key="r" :value="r">
            {{ formatRoleName(r) }}
          </option>
        </select>
      </div>

      <nav class="header-actions" aria-label="Acciones de cuenta">
        <!-- REQ-EMP-08: Enlaces públicos de retail solo para clientes/invitados -->
        <template v-if="!auth.isStaff">
          <RouterLink
            class="header-link"
            to="/ayuda"
            :class="{ active: ['help', 'support', 'claims'].includes(route.name) }"
          >
            <AppIcon name="help" :size="18" />
            Ayuda y Reclamos
          </RouterLink>
          <RouterLink
            class="header-link"
            to="/seguimiento"
            :class="{ active: ['tracking', 'tracking-alias'].includes(route.name) }"
          >
            <AppIcon name="truck-side" :size="18" />
            Seguimiento
          </RouterLink>
          <RouterLink class="header-link" to="/comparar">
            <AppIcon name="transfer" :size="18" />
            Comparar
            <span v-if="compare.count" class="badge-count">{{ compare.count }}</span>
          </RouterLink>
          <button
            class="header-link header-cart-btn"
            :class="{ active: route.name === 'cart' }"
            type="button"
            @click="abrirCarrito"
          >
            <AppIcon name="shopping-cart" :size="18" />
            Carrito
            <span v-if="cart.count" class="badge-count">{{ cart.count }}</span>
          </button>
        </template>

        <template v-if="auth.isAuthenticated">
          <RouterLink
            v-if="!auth.isStaff"
            class="header-link"
            to="/mis-pedidos"
            :class="{ active: ['orders', 'account-orders', 'addresses'].includes(route.name) }"
          >
            <AppIcon name="cube" :size="18" />
            Mis pedidos
          </RouterLink>
          <span class="account-name" :title="auth.user.nombre">{{ auth.user.nombre }}</span>
          <RouterLink v-if="auth.isStaff" class="header-link font-semibold" to="/admin">
            Panel ({{ auth.funcionActiva }})
          </RouterLink>
          <button class="btn btn-danger btn-sm header-logout-btn" type="button" @click="logout">
            <AppIcon name="sign-out" :size="16" />
            Salir
          </button>
        </template>
        <template v-else>
          <RouterLink class="header-link" to="/login">
            <AppIcon name="sign-in" :size="18" />
            Ingresar
          </RouterLink>
        </template>
      </nav>
    </div>

    <!-- REQ-EMP-08: Ocultar barra de categorías de retail si es staff -->
    <div v-if="!auth.isStaff" class="category-bar">
      <div class="container category-bar-inner">
        <RouterLink
          class="category-link"
          :class="{ active: !catalog.filters.categoria }"
          :to="{ name: 'catalog' }"
          active-class="category-route-match"
          exact-active-class="category-route-match"
          @click.prevent="selectCategory('')"
        >
          Todo
        </RouterLink>
        <RouterLink
          v-for="categoria in catalog.categorias"
          :key="categoria.id"
          class="category-link"
          :class="{ active: catalog.filters.categoria === categoria.slug }"
          :to="{ name: 'catalog', query: { categoria: categoria.slug } }"
          active-class="category-route-match"
          exact-active-class="category-route-match"
          @click.prevent="selectCategory(categoria.slug)"
        >
          {{ categoria.nombre }}
        </RouterLink>
      </div>
    </div>

    <CartDrawer :open="drawerAbierto" @close="cerrarCarrito" />
  </header>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import byteproLogo from '../assets/icons/icon-bytepro.png';
import AppIcon from './AppIcon.vue';
import CartDrawer from './CartDrawer.vue';
import { useAuthStore } from '../store/auth';
import { useCartStore } from '../store/cart';
import { useCatalogStore } from '../store/catalog';
import { useCompareStore } from '../store/compare';
import { useUiStore } from '../store/ui';

const auth = useAuthStore();
const cart = useCartStore();
const catalog = useCatalogStore();
const compare = useCompareStore();
const ui = useUiStore();
const router = useRouter();
const route = useRoute();

const drawerAbierto = computed(() => ui.cartDrawerOpen);

const brandTarget = computed(() => {
  if (auth.isStaff) return '/admin';
  if (auth.isAuthenticated) return '/catalogo';
  return '/';
});

function abrirCarrito() {
  ui.openCartDrawer();
}

function cerrarCarrito() {
  ui.closeCartDrawer();
}

watch(
  () => route.fullPath,
  () => {
    ui.closeCartDrawer();
  }
);

function formatRoleName(role) {
  const map = {
    vendedor: 'Vendedor (Catálogo)',
    soporte: 'Soporte y Reclamos',
    operaciones: 'Operaciones y Envíos',
    admin: 'Administrador Global',
    empleado: 'Personal General',
  };
  return map[role] || role;
}

async function onCambiarFuncion(nueva) {
  try {
    await auth.cambiarFuncion(nueva);
    ui.success(`Función activa cambiada a: ${formatRoleName(nueva)}`);
    const rutaDestino =
      {
        vendedor: 'admin-productos',
        operaciones: 'admin-pedidos',
        soporte: 'admin-soporte',
      }[nueva] || 'admin-resumen';
    if (route.name !== rutaDestino) {
      router.push({ name: rutaDestino });
    }
  } catch (err) {
    ui.error('No se pudo cambiar la función');
  }
}

const term = ref(catalog.filters.q || '');
let debounceTimer = null;

watch(
  () => catalog.filters.q,
  (value) => {
    if (value !== term.value) term.value = value || '';
  }
);

function goToCatalog() {
  if (route.name !== 'catalog') {
    router.push({ name: 'catalog' });
  }
}

function applySearch() {
  goToCatalog();
  catalog.setFilter('q', term.value.trim());
}

function onInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(applySearch, 350);
}

function selectCategory(slug) {
  catalog.setFilter('categoria', slug);
  const query = slug ? { categoria: slug } : {};
  if (route.name === 'catalog') {
    router.replace({ name: 'catalog', query });
  } else {
    router.push({ name: 'catalog', query });
  }
}

function logout() {
  ui.closeCartDrawer();
  auth.logout();
  cart.reset();
  router.push({ name: 'landing' });
}

onMounted(async () => {
  if (!catalog.categorias.length) await catalog.fetchCategorias();
  if (auth.isAuthenticated) await auth.fetchMe();
  cart.fetch();
});
</script>
