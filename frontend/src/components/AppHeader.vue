<template>
  <header class="site-header" :class="{ 'corporate-header': auth.isStaff }">
    <div class="container header-inner">
      <RouterLink class="brand" :to="auth.isStaff ? '/admin' : '/'">
        <span class="brand-mark">BP</span>
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
          <RouterLink class="header-link" to="/ayuda">Ayuda y Reclamos</RouterLink>
          <RouterLink class="header-link" to="/seguimiento">Seguimiento</RouterLink>
          <RouterLink class="header-link" to="/comparar">
            Comparar
            <span v-if="compare.count" class="badge-count">{{ compare.count }}</span>
          </RouterLink>
          <RouterLink class="header-link" to="/carrito">
            Carrito
            <span v-if="cart.count" class="badge-count">{{ cart.count }}</span>
          </RouterLink>
        </template>

        <template v-if="auth.isAuthenticated">
          <RouterLink v-if="!auth.isStaff" class="header-link" to="/mis-pedidos">
            Mis pedidos
          </RouterLink>
          <span class="account-name" :title="auth.user.nombre">{{ auth.user.nombre }}</span>
          <RouterLink v-if="auth.isStaff" class="header-link font-semibold" to="/admin">
            Panel ({{ auth.funcionActiva }})
          </RouterLink>
          <button class="btn btn-danger btn-sm" type="button" @click="logout">Salir</button>
        </template>
        <template v-else>
          <RouterLink class="header-link" to="/login">Ingresar</RouterLink>
          <RouterLink class="header-link" to="/empresa/login">Empresa</RouterLink>
        </template>
      </nav>
    </div>

    <!-- REQ-EMP-08: Ocultar barra de categorías de retail si es staff -->
    <div v-if="!auth.isStaff" class="category-bar">
      <div class="container category-bar-inner">
        <RouterLink
          class="category-link"
          :class="{ active: !catalog.filters.categoria }"
          to="/"
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
          @click.prevent="selectCategory(categoria.slug)"
        >
          {{ categoria.nombre }}
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
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
    if (route.name !== 'admin') {
      router.push({ name: 'admin' });
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
  auth.logout();
  cart.reset();
  router.push({ name: 'catalog' });
}

onMounted(async () => {
  if (!catalog.categorias.length) await catalog.fetchCategorias();
  if (auth.isAuthenticated) await auth.fetchMe();
  cart.fetch();
});
</script>
