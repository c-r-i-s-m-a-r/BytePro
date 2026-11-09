<template>
  <footer v-if="!auth.isStaff" class="site-footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <img :src="byteproLogo" alt="BytePro" class="footer-logo" />
        <span>© {{ year }} BytePro · Hardware de alto rendimiento</span>
      </div>
      <div class="footer-links">
        <RouterLink to="/ayuda" class="footer-link">Ayuda y Reclamos</RouterLink>
        <RouterLink to="/seguimiento" class="footer-link">Rastrear envío</RouterLink>
        <span>Compra segura · Envíos a todo el país</span>
      </div>
    </div>
  </footer>
  <footer v-else class="site-footer corporate-footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <img :src="byteproLogo" alt="BytePro" class="footer-logo" />
        <span>Portal Corporativo BytePro · Sesión activa: {{ auth.user?.nombre }} ({{ auth.funcionActiva }})</span>
      </div>
      <span>Sistema Interno de Gestión y Operaciones</span>
    </div>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import byteproLogo from '../assets/icons/icon-bytepro.png';
import { useAuthStore } from '../store/auth';

const auth = useAuthStore();
const year = new Date().getFullYear();
</script>
