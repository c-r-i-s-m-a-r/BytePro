<template>
  <footer v-if="!auth.isStaff" class="site-footer">
    <div class="container footer-inner">
      <span>© {{ year }} BytePro · Hardware de alto rendimiento</span>
      <div class="footer-links">
        <RouterLink to="/ayuda" class="footer-link">Ayuda y Reclamos</RouterLink>
        <RouterLink to="/seguimiento" class="footer-link">Rastrear envío</RouterLink>
        <span>Compra segura · Envíos a todo el país</span>
      </div>
    </div>
  </footer>
  <footer v-else class="site-footer corporate-footer">
    <div class="container footer-inner">
      <span>Portal Corporativo BytePro · Sesión activa: {{ auth.user?.nombre }} ({{ auth.funcionActiva }})</span>
      <span>Sistema Interno de Gestión y Operaciones</span>
    </div>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import { useAuthStore } from '../store/auth';

const auth = useAuthStore();
const year = new Date().getFullYear();
</script>
