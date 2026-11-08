<template>
  <div class="container auth-wrap">
    <div class="auth-card">
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
          />
        </div>

        <p v-if="error" class="field-error mb-4">{{ error }}</p>

        <button class="btn btn-primary btn-block" type="submit" :disabled="auth.loading">
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
import { ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { useCartStore } from '../store/cart';
import { useUiStore } from '../store/ui';

const auth = useAuthStore();
const cart = useCartStore();
const ui = useUiStore();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const error = ref('');

async function submit() {
  error.value = '';
  try {
    await auth.login({ email: email.value, password: password.value });
    await cart.fetch();
    ui.success('Bienvenido de vuelta');
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    router.push(redirect);
  } catch (err) {
    error.value = auth.error || 'No se pudo iniciar sesión';
  }
}
</script>
