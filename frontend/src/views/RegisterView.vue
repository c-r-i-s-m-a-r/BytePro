<template>
  <div class="container auth-wrap">
    <div class="auth-card">
      <h1>Crear cuenta</h1>
      <p class="auth-subtitle">Regístrate para comprar y reseñar productos.</p>

      <form @submit.prevent="submit">
        <div class="field">
          <label for="register-name">Nombre completo</label>
          <input
            id="register-name"
            v-model="nombre"
            class="input"
            :class="{ 'has-error': fieldErrors.nombre }"
            type="text"
            autocomplete="name"
            required
          />
          <span v-if="fieldErrors.nombre" class="field-error">{{ fieldErrors.nombre }}</span>
        </div>

        <div class="field">
          <label for="register-email">Correo electrónico</label>
          <input
            id="register-email"
            v-model="email"
            class="input"
            :class="{ 'has-error': fieldErrors.email }"
            type="email"
            autocomplete="email"
            required
          />
          <span v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</span>
        </div>

        <div class="field">
          <label for="register-phone">Teléfono (opcional)</label>
          <input
            id="register-phone"
            v-model="telefono"
            class="input"
            type="tel"
            autocomplete="tel"
          />
        </div>

        <div class="field">
          <label for="register-password">Contraseña</label>
          <input
            id="register-password"
            v-model="password"
            class="input"
            :class="{ 'has-error': fieldErrors.password }"
            type="password"
            autocomplete="new-password"
            required
          />
          <span class="field-hint">Mínimo 8 caracteres.</span>
          <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span>
        </div>

        <p v-if="error" class="field-error mb-4">{{ error }}</p>

        <button class="btn btn-primary btn-block" type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Creando cuenta…' : 'Crear cuenta' }}
        </button>
      </form>

      <p class="auth-footer">
        ¿Ya tienes cuenta?
        <RouterLink :to="{ name: 'login' }">Iniciar sesión</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { apiErrorDetails, apiErrorMessage } from '../services/api';
import { useAuthStore } from '../store/auth';
import { useCartStore } from '../store/cart';
import { useUiStore } from '../store/ui';

const auth = useAuthStore();
const cart = useCartStore();
const ui = useUiStore();
const router = useRouter();
const route = useRoute();

const nombre = ref('');
const email = ref('');
const telefono = ref('');
const password = ref('');
const error = ref('');
const fieldErrors = reactive({});

async function submit() {
  error.value = '';
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);

  try {
    await auth.register({
      nombre: nombre.value,
      email: email.value,
      telefono: telefono.value || undefined,
      password: password.value,
    });
    await cart.fetch();
    ui.success('Cuenta creada correctamente');
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    router.push(redirect);
  } catch (err) {
    const details = apiErrorDetails(err);
    if (details?.length) {
      details.forEach((d) => {
        if (d.field) fieldErrors[d.field] = d.message;
      });
    }
    error.value = apiErrorMessage(err);
  }
}
</script>
