<template>
  <nav v-if="pagination.totalPages > 1" class="pagination" aria-label="Paginación">
    <button
      class="page-btn"
      type="button"
      :disabled="pagination.page <= 1"
      @click="go(pagination.page - 1)"
    >
      Anterior
    </button>
    <button
      v-for="(page, index) in pages"
      :key="`${page}-${index}`"
      class="page-btn"
      :class="{ active: page === pagination.page }"
      type="button"
      :disabled="page === '...'"
      @click="page !== '...' && go(page)"
    >
      {{ page }}
    </button>
    <button
      class="page-btn"
      type="button"
      :disabled="pagination.page >= pagination.totalPages"
      @click="go(pagination.page + 1)"
    >
      Siguiente
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  pagination: { type: Object, required: true },
});

const emit = defineEmits(['change']);

const pages = computed(() => {
  const total = props.pagination.totalPages;
  const current = props.pagination.page;
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const result = [1];
  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);
  if (start > 2) result.push('...');
  for (let i = start; i <= end; i += 1) result.push(i);
  if (end < total - 1) result.push('...');
  result.push(total);
  return result;
});

function go(page) {
  if (page >= 1 && page <= props.pagination.totalPages) {
    emit('change', page);
  }
}
</script>
