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
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';
import ToastStack from './components/ToastStack.vue';
import ConfirmModal from './components/ConfirmModal.vue';

const route = useRoute();
const esLanding = computed(() => route.name === 'landing');
</script>
