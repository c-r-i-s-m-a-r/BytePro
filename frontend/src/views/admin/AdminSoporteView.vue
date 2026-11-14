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
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
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
    return;
  }
  ticketSeleccionado.value = ticket;
  solucionTexto.value = ticket.solucion || '';
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

onMounted(() => {
  cargarReclamos();
  unsubscribeRealtime = subscribeToTables(['reclamos'], cargarReclamos);
});

onUnmounted(() => {
  if (unsubscribeRealtime) unsubscribeRealtime();
  unsubscribeRealtime = null;
});
</script>
