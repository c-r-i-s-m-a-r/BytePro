<template>
  <div class="container">
    <div class="breadcrumbs">
      <RouterLink to="/">Inicio</RouterLink>
      <span>/</span>
      <span>Ayuda y Reclamos</span>
    </div>

    <div class="support-layout">
      <div class="support-intro mb-6">
        <h1 class="page-title">Centro de Ayuda y Reclamos</h1>
        <p class="page-subtitle">
          ¿Tienes algún inconveniente con tu compra, envío o producto? Nuestro equipo de soporte
          especializado te atenderá a la brevedad.
        </p>
      </div>

      <div v-if="ticketCreado" class="card support-success-card">
        <div class="success-icon" aria-hidden="true">✓</div>
        <h2>¡Solicitud registrada con éxito!</h2>
        <p class="mt-2">
          Hemos recibido tu solicitud y se ha generado tu número de caso oficial:
        </p>
        <div class="ticket-badge mt-4">
          <span class="field-hint">Código de Ticket</span>
          <div class="ticket-code">{{ ticketCreado.codigoTicket }}</div>
        </div>
        <p class="field-hint mt-4">
          Guarda este código para consultar el estado de tu caso. Nos contactaremos al
          <strong>{{ ticketCreado.email || ticketCreado.celular }}</strong>.
        </p>
        <div class="support-actions mt-6">
          <button class="btn btn-secondary" type="button" @click="resetFormulario">
            Enviar otra consulta
          </button>
          <RouterLink class="btn btn-primary" to="/">
            Volver a la tienda
          </RouterLink>
        </div>
      </div>

      <div v-else class="card support-card">
        <form @submit.prevent="enviarSolicitud">
          <div class="card-grid">
            <div class="field">
              <label for="sup-nombre">Nombre de contacto <span class="text-danger">*</span></label>
              <input
                id="sup-nombre"
                v-model="form.nombreContacto"
                class="input"
                :class="{ 'has-error': errors.nombreContacto }"
                placeholder="Nombre completo"
                required
              />
              <span v-if="errors.nombreContacto" class="field-error">
                {{ errors.nombreContacto }}
              </span>
            </div>

            <div class="field">
              <label for="sup-email">Correo electrónico</label>
              <input
                id="sup-email"
                v-model="form.email"
                type="email"
                class="input"
                :class="{ 'has-error': errors.contacto || errors.email }"
                placeholder="ejemplo@correo.com"
              />
              <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
            </div>

            <div class="field">
              <label for="sup-celular">Número de celular o WhatsApp</label>
              <input
                id="sup-celular"
                v-model="form.celular"
                type="tel"
                class="input"
                :class="{ 'has-error': errors.contacto || errors.celular }"
                placeholder="70000000"
              />
              <span v-if="errors.celular" class="field-error">{{ errors.celular }}</span>
            </div>

            <div class="field">
              <label for="sup-tipo">Tipo de solicitud <span class="text-danger">*</span></label>
              <select id="sup-tipo" v-model="form.tipoSolicitud" class="select" required>
                <option value="CONSULTA_PRODUCTO">Consulta de producto o especificación</option>
                <option value="PROBLEMA_ENVIO">Problema con el envío o despacho</option>
                <option value="FALLA_HARDWARE">Falla de hardware o mal funcionamiento</option>
                <option value="GARANTIA_RECLAMO">Reclamo formal y aplicación de garantía</option>
                <option value="OTRO">Otro tipo de consulta</option>
              </select>
            </div>
          </div>

          <div v-if="errors.contacto" class="alert alert-danger mt-2 mb-2">
            {{ errors.contacto }}
          </div>

          <div class="field mt-3">
            <label for="sup-pedido">Número de pedido o guía (opcional)</label>
            <input
              id="sup-pedido"
              v-model="form.numeroPedido"
              class="input"
              placeholder="Ej. PED-2026-0001 o TRK-20261108-0001"
            />
          </div>

          <div class="field mt-3">
            <label for="sup-desc">
              Descripción detallada del problema o reclamo <span class="text-danger">*</span>
            </label>
            <textarea
              id="sup-desc"
              v-model="form.descripcion"
              class="textarea"
              :class="{ 'has-error': errors.descripcion }"
              rows="5"
              placeholder="Describe detalladamente lo ocurrido, componentes afectados, síntomas de la falla o solicitud de garantía…"
              required
            ></textarea>
            <span v-if="errors.descripcion" class="field-error">
              {{ errors.descripcion }}
            </span>
          </div>

          <p class="field-hint mt-2">
            * Debes proporcionar al menos un medio de contacto válido (correo o celular) para que
            el equipo de soporte se comunique contigo.
          </p>

          <div class="mt-6 flex-between">
            <button class="btn btn-primary" type="submit" :disabled="enviando">
              {{ enviando ? 'Registrando solicitud…' : 'Enviar solicitud de ayuda' }}
            </button>
            <RouterLink class="btn btn-tertiary" to="/seguimiento">
              ¿Deseas rastrear un envío?
            </RouterLink>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onUnmounted } from 'vue';
import { RouterLink } from 'vue-router';
import api, { apiErrorMessage } from '../services/api';
import { subscribeToTables } from '../services/realtime';
import { useAuthStore } from '../store/auth';
import { useUiStore } from '../store/ui';

const auth = useAuthStore();
const ui = useUiStore();

const enviando = ref(false);
const ticketCreado = ref(null);

const form = reactive({
  nombreContacto: '',
  email: '',
  celular: '',
  tipoSolicitud: 'CONSULTA_PRODUCTO',
  numeroPedido: '',
  descripcion: '',
});

const errors = reactive({});

let unsubscribeRealtime = null;

async function refrescarTicketEnVivo() {
  if (!ticketCreado.value) return;
  const referencia = ticketCreado.value.id || ticketCreado.value.codigoTicket;
  if (!referencia) return;

  try {
    const { data } = await api.get(`/soporte/reclamos/${referencia}`);
    ticketCreado.value = data;
  } catch (err) {
    // La consulta del ticket se mantiene si el refresco falla.
  }
}

onMounted(() => {
  if (auth.user) {
    form.nombreContacto = auth.user.nombre || '';
    form.email = auth.user.email || '';
    form.celular = auth.user.telefono || '';
  }
  unsubscribeRealtime = subscribeToTables(['reclamos'], refrescarTicketEnVivo);
});

onUnmounted(() => {
  if (unsubscribeRealtime) unsubscribeRealtime();
  unsubscribeRealtime = null;
});

function validar() {
  Object.keys(errors).forEach((k) => delete errors[k]);

  if (!form.nombreContacto.trim()) {
    errors.nombreContacto = 'Ingresa tu nombre completo.';
  }

  const tieneMail = form.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const tieneCel = form.celular.replace(/\D/g, '').length >= 7;

  if (!tieneMail && !tieneCel) {
    errors.contacto = 'Debes ingresar al menos un medio de contacto válido (correo con formato válido o celular de 7 dígitos).';
  }

  if (!form.descripcion.trim()) {
    errors.descripcion = 'Por favor describe el motivo o falla de tu solicitud.';
  }

  return Object.keys(errors).length === 0;
}

async function enviarSolicitud() {
  if (!validar()) {
    ui.error('Revisa los campos requeridos en rojo');
    return;
  }

  enviando.value = true;
  try {
    const { data } = await api.post('/soporte/reclamos', {
      nombreContacto: form.nombreContacto.trim(),
      email: form.email.trim() || undefined,
      celular: form.celular.trim() || undefined,
      tipoSolicitud: form.tipoSolicitud,
      numeroPedido: form.numeroPedido.trim() || undefined,
      descripcion: form.descripcion.trim(),
    });

    ticketCreado.value = data;
    ui.success(`Ticket registrado: ${data.codigoTicket}`);
  } catch (err) {
    ui.error(apiErrorMessage(err));
  } finally {
    enviando.value = false;
  }
}

function resetFormulario() {
  ticketCreado.value = null;
  form.descripcion = '';
  form.numeroPedido = '';
}
</script>

<style scoped>
.support-layout {
  max-width: 860px;
  margin: 0 auto;
}
.support-card {
  padding: var(--space-8);
}
.support-success-card {
  text-align: center;
  padding: var(--space-10) var(--space-8);
}
.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-success-soft);
  color: var(--color-success);
  font-size: 32px;
  display: grid;
  place-items: center;
  margin: 0 auto var(--space-4);
  font-weight: 700;
}
.ticket-badge {
  background: var(--color-bg);
  border: 1px dashed var(--color-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  display: inline-block;
  min-width: 260px;
}
.ticket-code {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 1px;
}
.support-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
}
</style>
