<template>
  <div class="container auth-wrap company-auth">
    <div class="auth-card">
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
          />
        </div>

        <p v-if="error" class="field-error mb-4">{{ error }}</p>

        <button class="btn btn-primary btn-block" type="submit" :disabled="auth.loading">
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
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { useCartStore } from '../store/cart';
import { useUiStore } from '../store/ui';

const auth = useAuthStore();
const cart = useCartStore();
const ui = useUiStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const error = ref('');

async function submit() {
  error.value = '';
  try {
    await auth.loginEmpresa({ email: email.value, password: password.value });
    await cart.fetch();
    ui.success('Acceso de empresa concedido');
    router.push({ name: 'admin' });
  } catch (err) {
    error.value = 'Credenciales incorrectas';
  }
}
</script>
