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
      </div>
    </div>

    <!-- REQ-MOB-04: Selector desplegable de módulos para móvil -->
    <div class="admin-mobile-nav">
      <label for="admin-mobile-module" class="admin-mobile-nav-label">Módulo</label>
      <select
        id="admin-mobile-module"
        class="select select-block"
        :value="moduloActual"
        @change="irAModulo($event.target.value)"
      >
        <option v-for="modulo in modulosDisponibles" :key="modulo.name" :value="modulo.name">
          {{ modulo.label }}
        </option>
      </select>
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

// REQ-MOB-04: módulos autorizados para la función activa en el selector móvil.
const modulosDisponibles = computed(() => {
  const modulos = [
    { name: 'admin-resumen', label: 'Dashboard y KPIs' },
    { name: 'admin-comunicados', label: 'Comunicados Internos' },
  ];

  if (esAdmin.value || puedeVendedor.value) {
    modulos.push({ name: 'admin-productos', label: 'Catálogo de Productos' });
  }
  if (esAdmin.value || puedeOperaciones.value) {
    modulos.push({ name: 'admin-pedidos', label: 'Pedidos y Despachos' });
    modulos.push({ name: 'admin-inventario', label: 'Inventario y Kardex' });
  }
  if (esAdmin.value || puedeSoporte.value) {
    modulos.push({ name: 'admin-soporte', label: 'Mesa de Soporte' });
  }
  if (esAdmin.value) {
    modulos.push({ name: 'admin-personal', label: 'Gestión de Personal' });
    modulos.push({ name: 'admin-auditoria', label: 'Cobros y Auditoría' });
    modulos.push({ name: 'admin-ajustes', label: 'Ajustes de Empresa' });
  }

  return modulos;
});

const moduloActual = computed(() => {
  const nombre = route.name === 'admin' ? 'admin-resumen' : route.name;
  const existe = modulosDisponibles.value.some((modulo) => modulo.name === nombre);
  return existe ? nombre : modulosDisponibles.value[0]?.name || 'admin-resumen';
});

function irAModulo(nombre) {
  if (!nombre || nombre === route.name) return;
  router.push({ name: nombre });
}

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
