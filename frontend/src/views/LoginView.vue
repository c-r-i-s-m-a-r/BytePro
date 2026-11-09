<template>
  <div class="container auth-wrap">
    <div class="auth-card">
      <RouterLink to="/" class="auth-brand" aria-label="BytePro Inicio">
        <img :src="byteproLogo" alt="BytePro" class="auth-logo" />
      </RouterLink>
      <h1>Iniciar sesión</h1>
      <p class="auth-subtitle">Accede a tu cuenta de cliente BytePro.</p>

      <form @submit.prevent="submit">
        <div class="field">
          <label for="login-email">Correo electrónico</label>
          <input
            id="login-email"
            v-model="email"
            class="input"
            type="email"
            autocomplete="email"
            required
            :disabled="bloqueado || auth.loading"
          />
        </div>

        <div class="field">
          <label for="login-password">Contraseña</label>
          <input
            id="login-password"
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
          {{ auth.loading ? 'Ingresando…' : 'Ingresar' }}
        </button>
      </form>

      <p class="auth-footer">
        ¿No tienes cuenta?
        <RouterLink :to="{ name: 'register' }">Crear cuenta</RouterLink>
      </p>
      <p class="auth-footer">
        <RouterLink :to="{ name: 'company-login' }">Acceso de empresa</RouterLink>
      </p>

      <div class="alert mt-4">Demo: cliente@bytepro.com / Cliente1234</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import byteproLogo from '../assets/icons/icon-bytepro.png';
import { useAuthStore } from '../store/auth';
import { useCartStore } from '../store/cart';
import { useUiStore } from '../store/ui';
import { useCountdown } from '../utils/useCountdown';

const auth = useAuthStore();
const cart = useCartStore();
const ui = useUiStore();
const router = useRouter();
const route = useRoute();

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
    await auth.login({ email: email.value, password: password.value });
    await cart.fetch();
    ui.success('Bienvenido de vuelta');
    const redirect =
      typeof route.query.redirect === 'string'
        ? route.query.redirect
        : { name: 'catalog' };
    router.push(redirect);
  } catch (err) {
    error.value = auth.error || 'No se pudo iniciar sesión';
    const segundos = Number(err?.response?.data?.error?.segundosRestantes);
    if (Number.isFinite(segundos) && segundos > 0) {
      iniciarCuentaRegresiva(segundos);
    }
  }
}
</script>
