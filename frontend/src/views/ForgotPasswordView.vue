<template>
  <div class="container auth-wrap">
    <div class="auth-card">
      <RouterLink to="/" class="auth-brand" aria-label="BytePro Inicio">
        <img :src="byteproLogo" alt="BytePro" class="auth-logo" />
      </RouterLink>
      <h1>Recuperar contraseña</h1>
      <p class="auth-subtitle">Restablece el acceso a tu cuenta de cliente BytePro.</p>

      <div v-if="paso === 1">
        <form @submit.prevent="enviarCodigo">
          <div class="field">
            <label for="forgot-email">Correo electrónico</label>
            <input
              id="forgot-email"
              v-model="email"
              class="input"
              type="email"
              autocomplete="email"
              required
              :disabled="enviando"
            />
          </div>

          <p v-if="mensaje" class="field-hint mb-4">{{ mensaje }}</p>
          <p v-if="error" class="field-error mb-4">{{ error }}</p>

          <button class="btn btn-primary btn-block" type="submit" :disabled="enviando">
            {{ enviando ? 'Enviando…' : 'Enviar código de recuperación' }}
          </button>
        </form>
      </div>

      <div v-else>
        <div
          class="recovery-countdown"
          :class="{ 'recovery-countdown-expired': expirado }"
        >
          <template v-if="!expirado">
            El código expira en <strong>{{ cuentaFormateada }}</strong>
          </template>
          <template v-else>El código expiró. Solicita uno nuevo.</template>
        </div>

        <form @submit.prevent="restablecer">
          <p v-if="mensaje" class="field-hint mb-4">{{ mensaje }}</p>

          <div class="field">
            <label for="forgot-code">Código de 6 dígitos</label>
            <input
              id="forgot-code"
              v-model="codigo"
              class="input"
              inputmode="numeric"
              maxlength="6"
              pattern="[0-9]{6}"
              placeholder="000000"
              autocomplete="one-time-code"
              required
              :disabled="restableciendo"
            />
          </div>

          <div class="field">
            <label for="forgot-password">Nueva contraseña</label>
            <input
              id="forgot-password"
              v-model="nuevoPassword"
              class="input"
              type="password"
              autocomplete="new-password"
              required
              :disabled="restableciendo"
            />
            <span class="field-hint">Mínimo 8 caracteres.</span>
          </div>

          <div class="field">
            <label for="forgot-password-confirm">Confirmar contraseña</label>
            <input
              id="forgot-password-confirm"
              v-model="confirmarPassword"
              class="input"
              type="password"
              autocomplete="new-password"
              required
              :disabled="restableciendo"
            />
          </div>

          <p v-if="error" class="field-error mb-4">{{ error }}</p>

          <button
            class="btn btn-primary btn-block"
            type="submit"
            :disabled="restableciendo || expirado"
          >
            {{ restableciendo ? 'Actualizando…' : 'Restablecer contraseña' }}
          </button>
          <button
            class="btn btn-tertiary btn-block mt-2"
            type="button"
            :disabled="enviando || restableciendo"
            @click="reenviar"
          >
            {{ enviando ? 'Reenviando…' : 'Solicitar un código nuevo' }}
          </button>
        </form>
      </div>

      <p class="auth-footer">
        <RouterLink :to="{ name: 'login' }">Volver al inicio de sesión</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import byteproLogo from '../assets/icons/icon-bytepro.png';
import api, { apiErrorMessage } from '../services/api';
import { useCountdown } from '../utils/useCountdown';
import { useUiStore } from '../store/ui';

const MENSAJE_GENERICO =
  'Si el correo corresponde a una cuenta de cliente registrada, recibirás un código temporal para restablecer tu contraseña.';

const router = useRouter();
const ui = useUiStore();

const paso = ref(1);
const email = ref('');
const codigo = ref('');
const nuevoPassword = ref('');
const confirmarPassword = ref('');
const error = ref('');
const mensaje = ref('');
const enviando = ref(false);
const restableciendo = ref(false);

const { segundosRestantes, iniciar: iniciarCuentaRegresiva } = useCountdown();

const expirado = computed(() => paso.value === 2 && segundosRestantes.value <= 0);
const cuentaFormateada = computed(() => {
  const total = Math.max(0, segundosRestantes.value);
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
});

async function enviarCodigo() {
  if (enviando.value) return;
  error.value = '';
  mensaje.value = '';

  if (!email.value.trim()) {
    error.value = 'Ingresa tu correo electrónico.';
    return;
  }

  enviando.value = true;
  try {
    const { data } = await api.post('/auth/recuperar-password', {
      email: email.value.trim(),
    });
    mensaje.value = data?.mensaje || MENSAJE_GENERICO;
    paso.value = 2;
    iniciarCuentaRegresiva(15 * 60);
  } catch (err) {
    error.value = apiErrorMessage(err);
  } finally {
    enviando.value = false;
  }
}

async function reenviar() {
  if (enviando.value || restableciendo.value) return;
  await enviarCodigo();
  if (paso.value === 2) {
    codigo.value = '';
    error.value = '';
  }
}

async function restablecer() {
  if (restableciendo.value) return;
  error.value = '';

  if (nuevoPassword.value.length < 8) {
    error.value = 'La nueva contraseña debe tener al menos 8 caracteres.';
    return;
  }
  if (nuevoPassword.value !== confirmarPassword.value) {
    error.value = 'Las contraseñas no coinciden.';
    return;
  }

  restableciendo.value = true;
  try {
    const { data } = await api.post('/auth/restablecer-password', {
      email: email.value.trim(),
      codigo: codigo.value.trim(),
      nuevoPassword: nuevoPassword.value,
    });
    ui.success(data?.mensaje || 'Contraseña actualizada correctamente.');
    router.push({ name: 'login', query: { recuperado: '1' } });
  } catch (err) {
    error.value = apiErrorMessage(err);
  } finally {
    restableciendo.value = false;
  }
}
</script>
