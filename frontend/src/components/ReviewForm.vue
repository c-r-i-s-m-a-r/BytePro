<template>
  <form class="card" @submit.prevent="submit">
    <h3 class="section-title">Escribe tu reseña</h3>

    <div class="field">
      <label for="review-rating">Calificación</label>
      <select id="review-rating" v-model.number="calificacion" class="select">
        <option v-for="n in 5" :key="n" :value="n">{{ n }} {{ n === 1 ? 'estrella' : 'estrellas' }}</option>
      </select>
    </div>

    <div class="field">
      <label for="review-comment">Comentario</label>
      <textarea
        id="review-comment"
        v-model="comentario"
        class="textarea"
        maxlength="1000"
        placeholder="Cuéntanos tu experiencia con el producto"
      ></textarea>
      <span class="field-hint">{{ comentario.length }}/1000 caracteres</span>
    </div>

    <p v-if="error" class="field-error mb-4">{{ error }}</p>

    <button class="btn btn-primary" type="submit" :disabled="submitting">
      {{ submitting ? 'Enviando…' : 'Publicar reseña' }}
    </button>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  submitting: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
  resetSignal: { type: Number, default: 0 },
});

const emit = defineEmits(['submit']);

const calificacion = ref(5);
const comentario = ref('');
const error = ref('');

watch(
  () => props.serverError,
  (value) => {
    if (value) error.value = value;
  }
);

watch(
  () => props.resetSignal,
  () => {
    comentario.value = '';
    calificacion.value = 5;
    error.value = '';
  }
);

function submit() {
  error.value = '';
  if (comentario.value.trim().length < 5) {
    error.value = 'La reseña debe tener al menos 5 caracteres';
    return;
  }
  if (comentario.value.length > 1000) {
    error.value = 'La reseña supera la longitud máxima permitida (1000 caracteres)';
    return;
  }
  emit('submit', {
    calificacion: calificacion.value,
    comentario: comentario.value.trim(),
  });
}
</script>
