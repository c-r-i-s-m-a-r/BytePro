<template>
  <div class="app-shell">
    <AppHeader />
    <main class="app-main">
      <RouterView />
    </main>
    <AppFooter />
    <ToastStack />
    <ConfirmModal />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router';
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';
import ToastStack from './components/ToastStack.vue';
import ConfirmModal from './components/ConfirmModal.vue';
</script>
