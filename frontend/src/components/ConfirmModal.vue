<template>
  <div
    v-if="ui.confirmDialog.open"
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-modal-title"
    aria-describedby="confirm-modal-desc"
    @click.self="ui.cancelConfirm()"
  >
    <div class="modal-card">
      <div class="modal-header">
        <h2 id="confirm-modal-title" class="section-title mb-0">
          {{ ui.confirmDialog.title }}
        </h2>
      </div>

      <p id="confirm-modal-desc" class="modal-message">
        {{ ui.confirmDialog.message }}
      </p>

      <div class="modal-actions">
        <button
          type="button"
          class="btn btn-secondary"
          @click="ui.cancelConfirm()"
        >
          {{ ui.confirmDialog.cancelText }}
        </button>
        <button
          type="button"
          class="btn"
          :class="ui.confirmDialog.variant === 'danger' ? 'btn-danger' : 'btn-primary'"
          @click="ui.acceptConfirm()"
        >
          {{ ui.confirmDialog.confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useUiStore } from '../store/ui';

const ui = useUiStore();

function onKeydown(event) {
  if (event.key === 'Escape' && ui.confirmDialog.open) {
    ui.cancelConfirm();
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>
