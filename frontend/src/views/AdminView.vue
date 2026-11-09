<template>
  <div class="container">
    <div class="breadcrumbs">
      <span>Portal Corporativo</span>
      <span>/</span>
      <span>Administración</span>
    </div>

    <div class="flex-between mb-6">
      <div>
        <h1 class="page-title">Portal de Gestión y Operaciones</h1>
        <p class="page-subtitle">
          Sistema modular de administración y control operativo de BytePro.
        </p>
      </div>
      <div class="flex-row gap-2 align-center">
        <!-- Conmutador de función activa para empleados con múltiples roles (REQ-ADM-09) -->
        <div v-if="auth.tieneMultiplesFunciones" class="flex-row gap-2 align-center">
          <label for="portal-role-select" class="field-hint mb-0 font-semibold">Función activa:</label>
          <select
            id="portal-role-select"
            class="select select-inline"
            :value="auth.funcionActiva"
            @change="cambiarFuncionUsuario($event.target.value)"
          >
            <option v-for="r in auth.rolesDisponibles" :key="r" :value="r">
              {{ formatRoleName(r) }}
            </option>
          </select>
        </div>
        <span class="badge badge-stock">Función: {{ auth.funcionActiva }}</span>
      </div>
    </div>

    <div class="admin-layout">
      <!-- Barra lateral de navegación dinámica reactiva por rol/función (REQ-ADM-07 y REQ-ADM-08) -->
      <aside class="admin-sidebar" aria-label="Menú corporativo">
        <div class="admin-sidebar-title">Módulos: {{ auth.funcionActiva }}</div>

        <!-- Dashboard y Resumen: común a todos los roles -->
        <RouterLink
          to="/admin/resumen"
          class="admin-nav-link"
          :class="{ active: route.name === 'admin-resumen' || route.name === 'admin' }"
        >
          Dashboard y KPIs
        </RouterLink>

        <!-- Tablón de comunicados: lectura para todo el personal -->
        <RouterLink
          to="/admin/comunicados"
          class="admin-nav-link"
          :class="{ active: route.name === 'admin-comunicados' }"
        >
          Comunicados Internos
        </RouterLink>

        <!-- Función vendedor: Resumen y Productos -->
        <RouterLink
          v-if="esAdmin || puedeVendedor"
          to="/admin/productos"
          class="admin-nav-link"
          :class="{ active: route.name === 'admin-productos' }"
        >
          Catálogo de Productos
        </RouterLink>

        <!-- Función operaciones: Pedidos (despachos) e Inventario (Kardex) -->
        <template v-if="esAdmin || puedeOperaciones">
          <RouterLink
            to="/admin/pedidos"
            class="admin-nav-link"
            :class="{ active: route.name === 'admin-pedidos' }"
          >
            Pedidos y Despachos
          </RouterLink>
          <RouterLink
            to="/admin/inventario"
            class="admin-nav-link"
            :class="{ active: route.name === 'admin-inventario' }"
          >
            Inventario y Kardex
          </RouterLink>
        </template>

        <!-- Función soporte: Resumen y Soporte (tickets/reclamos) -->
        <RouterLink
          v-if="esAdmin || puedeSoporte"
          to="/admin/soporte"
          class="admin-nav-link"
          :class="{ active: route.name === 'admin-soporte' }"
        >
          Mesa de Soporte
        </RouterLink>

        <!-- Exclusivo rol admin: Gestión de Personal y Auditoría -->
        <template v-if="esAdmin">
          <RouterLink
            to="/admin/personal"
            class="admin-nav-link"
            :class="{ active: route.name === 'admin-personal' }"
          >
            Gestión de Personal
          </RouterLink>
          <RouterLink
            to="/admin/auditoria"
            class="admin-nav-link"
            :class="{ active: route.name === 'admin-auditoria' }"
          >
            Cobros y Auditoría
          </RouterLink>
          <RouterLink
            to="/admin/ajustes"
            class="admin-nav-link"
            :class="{ active: route.name === 'admin-ajustes' }"
          >
            Ajustes de Empresa
          </RouterLink>
        </template>
      </aside>

      <!-- Contenedor dinámico de subpáginas modulares -->
      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { useUiStore } from '../store/ui';

const auth = useAuthStore();
const ui = useUiStore();
const route = useRoute();
const router = useRouter();

const funcionActiva = computed(() => auth.funcionActiva || auth.user?.rol);
const esAdmin = computed(() => auth.isAdmin || auth.user?.rol === 'admin');
const puedeVendedor = computed(() => funcionActiva.value === 'vendedor' || esAdmin.value);
const puedeSoporte = computed(() => funcionActiva.value === 'soporte' || esAdmin.value);
const puedeOperaciones = computed(() => funcionActiva.value === 'operaciones' || funcionActiva.value === 'empleado' || esAdmin.value);

function formatRoleName(role) {
  const map = {
    vendedor: 'VENDEDOR (Catálogo)',
    soporte: 'SOPORTE (Reclamos)',
    operaciones: 'OPERACIONES (Logística)',
    admin: 'ADMINISTRADOR',
    empleado: 'PERSONAL GENERAL',
  };
  return map[role] || role.toUpperCase();
}

// REQ-ADM-09: Actualización instantánea del menú y redirección a la subpágina autorizada
async function cambiarFuncionUsuario(nueva) {
  try {
    await auth.cambiarFuncion(nueva);
    ui.success(`Función activa cambiada a: ${nueva.toUpperCase()}`);

    // Redirigir según la nueva función
    if (nueva === 'vendedor') {
      router.push({ name: 'admin-productos' });
    } else if (nueva === 'soporte') {
      router.push({ name: 'admin-soporte' });
    } else if (nueva === 'operaciones') {
      router.push({ name: 'admin-pedidos' });
    } else {
      router.push({ name: 'admin-resumen' });
    }
  } catch (err) {
    ui.error('No se pudo cambiar la función activa');
  }
}
</script>
