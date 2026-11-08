<template>
  <span class="stars" :aria-label="`Calificación ${value} de 5`" role="img">
    <span v-for="n in 5" :key="n" :class="{ filled: n <= rounded }">★</span>
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: { type: Number, default: 0 },
});

const rounded = computed(() => Math.round(Number(props.value) || 0));
</script>
