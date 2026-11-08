<template>
  <div class="qty-control">
    <button
      type="button"
      aria-label="Disminuir cantidad"
      :disabled="modelValue <= min"
      @click="update(modelValue - 1)"
    >
      −
    </button>
    <input
      :value="modelValue"
      type="number"
      :min="min"
      :max="max"
      aria-label="Cantidad"
      @change="onInput"
    />
    <button
      type="button"
      aria-label="Aumentar cantidad"
      :disabled="modelValue >= max"
      @click="update(modelValue + 1)"
    >
      +
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Number, default: 1 },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 999 },
});

const emit = defineEmits(['update:modelValue']);

function clamp(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return props.min;
  return Math.min(Math.max(Math.trunc(n), props.min), props.max);
}

function update(value) {
  emit('update:modelValue', clamp(value));
}

function onInput(event) {
  update(event.target.value);
  event.target.value = clamp(event.target.value);
}
</script>
