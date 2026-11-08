<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="false">
    <div
      v-for="toast in ui.toasts"
      :key="toast.id"
      class="toast"
      :class="`toast-${toast.type}`"
      role="status"
    >
      <span>{{ toast.message }}</span>
      <button class="toast-close" type="button" aria-label="Cerrar" @click="ui.remove(toast.id)">
        ×
      </button>
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from '../store/ui';

const ui = useUiStore();
</script>
