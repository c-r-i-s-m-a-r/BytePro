<template>
  <div class="container auth-wrap company-auth">
    <div class="auth-card">
      <RouterLink to="/" class="auth-brand" aria-label="BytePro Inicio">
        <img :src="byteproLogo" alt="BytePro" class="auth-logo" />
      </RouterLink>
      <h1>Acceso de empresa</h1>
      <p class="auth-subtitle">Portal para personal de BytePro.</p>

      <form @submit.prevent="submit">
        <div class="field">
          <label for="company-email">Correo corporativo</label>
          <input
            id="company-email"
            v-model="email"
            class="input"
            type="email"
            autocomplete="email"
            required
            :disabled="bloqueado || auth.loading"
          />
        </div>

        <div class="field">
          <label for="company-password">Contraseña</label>
          <input
            id="company-password"
            v-model="password"
            class="input"
            type="password"
            autocomplete="current-password"
            required
            :disabled="bloqueado || auth.loading"
          />
        </div>

        <p v-if="mensajeError" class="field-error mb-4">{{ mensajeError }}</p>

        <button
          class="btn btn-primary btn-block"
          type="submit"
          :disabled="auth.loading || bloqueado"
        >
          {{ auth.loading ? 'Ingresando…' : 'Ingresar al panel' }}
        </button>
      </form>

      <p class="auth-footer">
        <RouterLink :to="{ name: 'login' }">Soy cliente</RouterLink>
      </p>

      <div class="alert mt-4">Demo: admin@bytepro.com / Admin1234</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import byteproLogo from '../assets/icons/icon-bytepro.png';
import { useAuthStore } from '../store/auth';
import { useCartStore } from '../store/cart';
import { useUiStore } from '../store/ui';
import { useCountdown } from '../utils/useCountdown';

const auth = useAuthStore();
const cart = useCartStore();
const ui = useUiStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const error = ref('');
const { segundosRestantes, iniciar: iniciarCuentaRegresiva } = useCountdown();

const bloqueado = computed(() => segundosRestantes.value > 0);
const mensajeError = computed(() => {
  if (bloqueado.value) {
    return `Demasiados intentos. Intenta nuevamente en ${segundosRestantes.value}s...`;
  }
  return error.value;
});

watch(segundosRestantes, (valor, anterior) => {
  if (anterior > 0 && valor === 0) {
    error.value = '';
  }
});

async function submit() {
  if (bloqueado.value || auth.loading) return;
  error.value = '';
  try {
    await auth.loginEmpresa({ email: email.value, password: password.value });
    await cart.fetch();
    ui.success('Acceso de empresa concedido');
    router.push({ name: 'admin' });
  } catch (err) {
    error.value = auth.error || 'Credenciales incorrectas';
    const segundos = Number(err?.response?.data?.error?.segundosRestantes);
    if (Number.isFinite(segundos) && segundos > 0) {
      iniciarCuentaRegresiva(segundos);
    }
  }
}
</script>
