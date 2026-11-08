<template>
  <div class="container">
    <div class="state-message">
      <h3>Página no encontrada</h3>
      <p>La ruta que buscas no existe o fue movida.</p>
      <RouterLink class="btn btn-primary" :to="{ name: 'catalog' }">
        Volver al catálogo
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>
