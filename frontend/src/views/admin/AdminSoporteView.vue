<template>
  <div class="admin-page">
    <div class="flex-between mb-6">
      <div>
        <h2 class="section-title mb-1">Mesa de Ayuda y Reclamos</h2>
        <p class="field-hint">
          Gestión, seguimiento y resolución de solicitudes de soporte de clientes.
        </p>
      </div>
      <button type="button" class="btn btn-tertiary btn-sm" @click="cargarReclamos">
        Actualizar tickets
      </button>
    </div>

    <div v-if="reclamosError" class="alert alert-danger mb-4">{{ reclamosError }}</div>
    <div v-if="reclamosExito" class="alert alert-success mb-4">{{ reclamosExito }}</div>

    <div class="card mb-6">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Fecha</th>
              <th>Contacto</th>
              <th>Tipo</th>
              <th>Pedido</th>
              <th>Estado</th>
              <th>Asignado a</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ticket in reclamos" :key="ticket.id">
              <td><strong>{{ ticket.codigoTicket }}</strong></td>
              <td>{{ formatDateTime(ticket.createdAt) }}</td>
              <td>
                <div>{{ ticket.nombreContacto }}</div>
                <small class="field-hint">{{ ticket.email || ticket.celular }}</small>
              </td>
              <td><span class="badge">{{ ticket.tipoSolicitud }}</span></td>
              <td>{{ ticket.numeroPedido || '—' }}</td>
              <td>
                <span class="badge" :class="ticketBadgeClass(ticket.estado)">
                  {{ ticket.estado }}
                </span>
              </td>
              <td>
                <span v-if="ticket.empleadoAsignado">
                  {{ ticket.empleadoAsignado.nombre || ticket.empleadoAsignado.username }}
                </span>
                <span v-else class="field-hint">Sin asignar</span>
              </td>
              <td>
                <div class="flex-row gap-2">
                  <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    @click="verDetalleTicket(ticket)"
                  >
                    {{ ticketSeleccionado?.id === ticket.id ? 'Cerrar vista' : 'Ver caso' }}
                  </button>
                  <button
                    v-if="ticket.estado === 'PENDIENTE'"
                    type="button"
                    class="btn btn-primary btn-sm"
                    @click="tomarTicket(ticket)"
                  >
                    Tomar caso
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!reclamos.length" class="empty-note">No hay tickets registrados.</p>
      </div>
    </div>

    <!-- Panel de Detalle y Resolución -->
    <div v-if="ticketSeleccionado" class="card border-primary">
      <div class="flex-between mb-3">
        <h3 class="section-title mb-0">Detalle: {{ ticketSeleccionado.codigoTicket }}</h3>
        <span class="badge" :class="ticketBadgeClass(ticketSeleccionado.estado)">
          {{ ticketSeleccionado.estado }}
        </span>
      </div>

      <div class="card-grid mb-4">
        <div>
          <span class="field-hint">Contacto:</span>
          <div class="font-semibold">{{ ticketSeleccionado.nombreContacto }}</div>
        </div>
        <div>
          <span class="field-hint">Canal:</span>
          <div>{{ ticketSeleccionado.email || ticketSeleccionado.celular }}</div>
        </div>
        <div>
          <span class="field-hint">Tipo:</span>
          <div>{{ ticketSeleccionado.tipoSolicitud }}</div>
        </div>
        <div>
          <span class="field-hint">Pedido ref:</span>
          <div>{{ ticketSeleccionado.numeroPedido || 'No especificado' }}</div>
        </div>
      </div>

      <div class="mb-4">
        <span class="field-hint">Descripción:</span>
        <p class="mt-1 p-3 bg-muted rounded">{{ ticketSeleccionado.descripcion }}</p>
      </div>

      <div v-if="ticketSeleccionado.solucion" class="mb-4">
        <span class="field-hint">Resolución guardada:</span>
        <p class="mt-1 p-3 alert alert-success">{{ ticketSeleccionado.solucion }}</p>
      </div>

      <div
        v-if="ticketSeleccionado.estado !== 'RESUELTO' && (ticketSeleccionado.empleadoAsignadoId === auth.user.id || auth.isAdmin)"
        class="mt-4"
      >
        <h4 class="font-semibold mb-2">Registrar notas y cerrar caso</h4>
        <textarea
          v-model="solucionTexto"
          class="textarea mb-3"
          rows="3"
          placeholder="Acciones tomadas, diagnóstico o respuesta al cliente…"
        ></textarea>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          :disabled="guardandoResolucion"
          @click="cerrarTicket(ticketSeleccionado)"
        >
          {{ guardandoResolucion ? 'Cerrando caso…' : 'Cerrar caso' }}
        </button>
      </div>

      <!-- REQ-VIS-02: historial de despacho del pedido asociado sin cambiar de pantalla -->
      <div v-if="ticketSeleccionado.numeroPedido" class="mt-6">
        <div class="flex-between mb-2">
          <h4 class="font-semibold mb-0">Historial de despacho y evidencias</h4>
          <button
            type="button"
            class="btn btn-tertiary btn-sm"
            :disabled="cargandoHistorial"
            @click="verHistorialDespacho(ticketSeleccionado)"
          >
            {{
              mostrarHistorial
                ? 'Ocultar historial'
                : cargandoHistorial
                  ? 'Cargando…'
                  : 'Ver historial y fotos'
            }}
          </button>
        </div>

        <p class="field-hint">
          Pedido asociado: <strong>{{ ticketSeleccionado.numeroPedido }}</strong>
        </p>

        <div v-if="historialError" class="alert alert-danger mt-2">{{ historialError }}</div>

        <div v-if="mostrarHistorial && historialDespacho" class="mt-3">
          <div class="card-grid mb-3">
            <div>
              <span class="field-hint">Guía:</span>
              <div class="font-semibold">
                {{ historialDespacho.codigoSeguimiento || 'Sin guía' }}
              </div>
            </div>
            <div>
              <span class="field-hint">Estado actual:</span>
              <div class="font-semibold">{{ historialDespacho.estado }}</div>
            </div>
            <div>
              <span class="field-hint">Ubicación actual:</span>
              <div>{{ historialDespacho.ubicacionActual || '—' }}</div>
            </div>
          </div>

          <p
            v-if="!historialDespacho.historial || !historialDespacho.historial.length"
            class="field-hint"
          >
            El despacho no registra hitos todavía.
          </p>

          <ul v-else class="dispatch-timeline">
            <li
              v-for="(evento, idx) in historialDespacho.historial"
              :key="`${evento.timestamp}-${idx}`"
              class="dispatch-timeline-item"
            >
              <div class="flex-between">
                <strong>{{ evento.estado }}</strong>
                <small class="field-hint">{{ formatDateTime(evento.timestamp) }}</small>
              </div>
              <div class="field-hint">
                {{ evento.ubicacion || 'Sin ubicación' }} ·
                {{ evento.operador || 'Operaciones BytePro' }}
              </div>
              <div v-if="evento.nota" class="dispatch-note mt-2">
                <span class="dispatch-note-label">Nota del operador</span>
                <p>{{ evento.nota }}</p>
              </div>

              <div v-if="evento.fotos && evento.fotos.length" class="evidence-grid mt-2">
                <button
                  v-for="(foto, fotoIdx) in evento.fotos"
                  :key="fotoIdx"
                  type="button"
                  class="evidence-thumb"
                  title="Ampliar evidencia"
                  @click="verFoto(foto)"
                >
                  <img :src="foto" alt="Evidencia fotográfica del despacho" />
                </button>
              </div>
              <div v-else class="evidence-empty mt-2">Sin imágenes</div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Lightbox de evidencias -->
    <div
      v-if="lightbox.src"
      class="modal-backdrop lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      @click.self="cerrarLightbox"
    >
      <img :src="lightbox.src" class="lightbox-image" alt="Evidencia ampliada" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import api, { apiErrorMessage } from '../../services/api';
import { subscribeToTables } from '../../services/realtime';
import { useAuthStore } from '../../store/auth';
import { formatDateTime } from '../../utils/format';

const auth = useAuthStore();

const reclamos = ref([]);
const reclamosError = ref('');
const reclamosExito = ref('');
const ticketSeleccionado = ref(null);
const solucionTexto = ref('');
const guardandoResolucion = ref(false);

const historialDespacho = ref(null);
const historialError = ref('');
const cargandoHistorial = ref(false);
const mostrarHistorial = ref(false);
const lightbox = reactive({ src: '' });

function verFoto(src) {
  lightbox.src = src;
}

function cerrarLightbox() {
  lightbox.src = '';
}

function codigoDespachoDesdePedido(numeroPedido) {
  const valor = String(numeroPedido || '').trim();
  if (!valor) return '';
  if (/^TRK-/i.test(valor)) return valor;

  const digitos = valor.match(/\d+/g);
  if (digitos && digitos.length) {
    return String(Number(digitos[digitos.length - 1]));
  }
  return valor;
}

async function cargarHistorialDespacho(numeroPedido) {
  const codigo = codigoDespachoDesdePedido(numeroPedido);
  if (!codigo) {
    historialError.value = 'El ticket no tiene un pedido o guía asociada.';
    return;
  }

  const esPedido = /^PED-/i.test(String(numeroPedido || '').trim());
  const ventaIdEsperada = esPedido ? Number(codigo) : null;

  historialError.value = '';
  cargandoHistorial.value = true;
  try {
    const { data } = await api.get(
      `/distribucion/despachos/${encodeURIComponent(codigo)}`
    );

    if (ventaIdEsperada && Number(data.ventaId) !== ventaIdEsperada) {
      historialDespacho.value = null;
      historialError.value = 'El pedido no tiene un despacho asociado.';
      return;
    }

    historialDespacho.value = data;
  } catch (err) {
    historialDespacho.value = null;
    historialError.value = apiErrorMessage(err);
  } finally {
    cargandoHistorial.value = false;
  }
}

async function verHistorialDespacho(ticket) {
  if (mostrarHistorial.value) {
    mostrarHistorial.value = false;
    return;
  }

  mostrarHistorial.value = true;
  historialDespacho.value = null;
  await cargarHistorialDespacho(ticket.numeroPedido);
}

function ticketBadgeClass(estado) {
  if (estado === 'RESUELTO') return 'badge-stock';
  if (estado === 'EN_ATENCION') return 'badge-low';
  return 'badge';
}

async function cargarReclamos() {
  reclamosError.value = '';
  try {
    const { data } = await api.get('/soporte/admin/reclamos');
    reclamos.value = data.items || [];
  } catch (err) {
    reclamosError.value = apiErrorMessage(err);
  }
}

function verDetalleTicket(ticket) {
  if (ticketSeleccionado.value?.id === ticket.id) {
    ticketSeleccionado.value = null;
    solucionTexto.value = '';
    mostrarHistorial.value = false;
    historialDespacho.value = null;
    historialError.value = '';
    return;
  }
  ticketSeleccionado.value = ticket;
  solucionTexto.value = ticket.solucion || '';
  mostrarHistorial.value = false;
  historialDespacho.value = null;
  historialError.value = '';
}

async function tomarTicket(ticket) {
  reclamosError.value = '';
  reclamosExito.value = '';
  try {
    const { data } = await api.post(`/soporte/reclamos/${ticket.id}/tomar`);
    reclamosExito.value = `Has tomado el caso ${ticket.codigoTicket}.`;
    await cargarReclamos();
    ticketSeleccionado.value = data;
  } catch (err) {
    reclamosError.value = apiErrorMessage(err);
  }
}

async function cerrarTicket(ticket) {
  if (!solucionTexto.value.trim()) {
    reclamosError.value = 'Debes ingresar las notas de resolución antes de cerrar el caso.';
    return;
  }
  reclamosError.value = '';
  reclamosExito.value = '';
  guardandoResolucion.value = true;
  try {
    const { data } = await api.post(`/soporte/reclamos/${ticket.id}/resolver`, {
      solucion: solucionTexto.value.trim(),
    });
    reclamosExito.value = `El caso ${ticket.codigoTicket} ha sido marcado como RESUELTO.`;
    await cargarReclamos();
    ticketSeleccionado.value = data;
  } catch (err) {
    reclamosError.value = apiErrorMessage(err);
  } finally {
    guardandoResolucion.value = false;
  }
}

let unsubscribeRealtime = null;

async function onRealtimeUpdate() {
  await cargarReclamos();
  if (mostrarHistorial.value && ticketSeleccionado.value?.numeroPedido) {
    await cargarHistorialDespacho(ticketSeleccionado.value.numeroPedido);
  }
}

onMounted(() => {
  cargarReclamos();
  unsubscribeRealtime = subscribeToTables(
    ['reclamos', 'despachos', 'ventas'],
    onRealtimeUpdate
  );
});

onUnmounted(() => {
  if (unsubscribeRealtime) unsubscribeRealtime();
  unsubscribeRealtime = null;
});
</script>
