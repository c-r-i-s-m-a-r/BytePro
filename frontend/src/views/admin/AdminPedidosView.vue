<template>
  <div class="admin-page">
    <div class="flex-between mb-6">
      <div>
        <h2 class="section-title mb-1">Pedidos y Despachos Logísticos</h2>
        <p class="field-hint">
          Control de fases secuenciales, asignación de guías TRK y estado de entregas.
        </p>
      </div>
      <button type="button" class="btn btn-tertiary btn-sm" @click="cargar">
        Actualizar pedidos
      </button>
    </div>

    <div v-if="despachoError" class="alert alert-danger mb-4">{{ despachoError }}</div>
    <div v-if="despachoExito" class="alert alert-success mb-4">{{ despachoExito }}</div>

    <div class="card mb-6">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Guía logística</th>
              <th>Fase logística</th>
              <th>Avanzar fase</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in pedidos" :key="p.id">
              <td><strong>{{ p.numeroPedido }}</strong></td>
              <td>
                <div>{{ p.usuario ? p.usuario.nombre : 'Cliente' }}</div>
                <small class="field-hint">{{ p.usuario ? p.usuario.email : '' }}</small>
              </td>
              <td>{{ formatDateTime(p.fecha) }}</td>
              <td>{{ formatPrice(p.total) }}</td>
              <td>
                <span class="badge" :class="p.estadoPago === 'aprobado' ? 'badge-stock' : 'badge-low'">
                  {{ p.estadoPago }}
                </span>
              </td>
              <td>
                <span v-if="p.codigoSeguimiento" class="font-semibold text-primary">
                  {{ p.codigoSeguimiento }}
                </span>
                <span v-else class="field-hint">Sin guía</span>
              </td>
              <td>
                <span class="badge" :class="logisticaBadge(p.estadoLogistica)">
                  {{ p.estadoLogistica }}
                </span>
              </td>
              <td>
                <span v-if="esPedidoCancelado(p)" class="field-hint">-</span>
                <div v-else-if="p.estadoLogistica === 'ENTREGADO'" class="field-hint text-success">
                  Entrega completada
                </div>
                <div v-else class="admin-dispatch-controls">
                  <input
                    v-model="ubicacionesInput[p.id]"
                    class="input input-sm"
                    placeholder="Ubicación o punto"
                  />
                  <button
                    v-if="p.estadoLogistica === 'PEDIDO_CONFIRMADO' || p.estadoLogistica === 'PREPARANDO_PEDIDO'"
                    type="button"
                    class="btn btn-secondary btn-sm"
                    :disabled="actualizandoPedidoId === p.id"
                    @click="avanzarEstadoPedido(p, 'EN_PREPARACION')"
                  >
                    A Preparación
                  </button>
                  <button
                    v-else-if="p.estadoLogistica === 'EN_PREPARACION'"
                    type="button"
                    class="btn btn-secondary btn-sm"
                    :disabled="actualizandoPedidoId === p.id"
                    @click="avanzarEstadoPedido(p, 'EN_CAMINO')"
                  >
                    A Ruta
                  </button>
                  <button
                    v-else-if="p.estadoLogistica === 'EN_CAMINO'"
                    type="button"
                    class="btn btn-primary btn-sm"
                    :disabled="actualizandoPedidoId === p.id"
                    @click="avanzarEstadoPedido(p, 'ENTREGADO')"
                  >
                    Marcar Entregado
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!pedidos.length" class="empty-note">No hay pedidos registrados.</p>
      </div>

      <div v-if="pedidosPagination.totalPages > 1" class="pagination mt-4">
        <button
          v-for="page in pedidosPagination.totalPages"
          :key="page"
          type="button"
          class="page-btn"
          :class="{ active: page === pedidosPagination.page }"
          @click="cambiarPagina(page)"
        >
          {{ page }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api, { apiErrorMessage } from '../../services/api';
import { useUiStore } from '../../store/ui';
import { formatDateTime, formatPrice } from '../../utils/format';

const ui = useUiStore();

const pedidos = ref([]);
const pedidosPagination = ref({ page: 1, limit: 15, total: 0, totalPages: 0 });
const ubicacionesInput = reactive({});
const actualizandoPedidoId = ref(null);
const despachoError = ref('');
const despachoExito = ref('');

function esPedidoCancelado(pedido) {
  if (!pedido) return false;
  return (
    pedido.estadoLogistica === 'CANCELADO' ||
    String(pedido.estadoPago || '').toLowerCase() === 'cancelado'
  );
}

function logisticaBadge(estado) {
  if (estado === 'ENTREGADO') return 'badge-stock';
  if (estado === 'CANCELADO') return 'badge-agotado';
  if (estado === 'EN_CAMINO' || estado === 'EN_PREPARACION') return 'badge-low';
  return '';
}

async function cargar() {
  despachoError.value = '';
  try {
    const { data } = await api.get('/admin/pedidos', {
      params: { page: pedidosPagination.value.page, limit: pedidosPagination.value.limit },
    });
    pedidos.value = data.items || [];
    if (data.pagination) pedidosPagination.value = data.pagination;
  } catch (err) {
    despachoError.value = apiErrorMessage(err);
  }
}

async function cambiarPagina(page) {
  pedidosPagination.value.page = page;
  await cargar();
}

async function avanzarEstadoPedido(pedido, nuevoEstado) {
  if (actualizandoPedidoId.value) return;
  const confirmed = await ui.confirm({
    title: 'Confirmar cambio de estado logístico',
    message: `¿Confirmas avanzar el pedido ${pedido.numeroPedido} al estado ${nuevoEstado}?`,
    confirmText: 'Confirmar cambio',
    cancelText: 'Cancelar / Volver',
    variant: 'primary',
  });
  if (!confirmed) return;

  despachoError.value = '';
  despachoExito.value = '';
  actualizandoPedidoId.value = pedido.id;

  try {
    await api.patch(`/admin/pedidos/${pedido.id}/estado`, {
      estado: nuevoEstado,
      ubicacion: ubicacionesInput[pedido.id] || undefined,
    });
    despachoExito.value = `Pedido ${pedido.numeroPedido} actualizado a ${nuevoEstado}.`;
    ubicacionesInput[pedido.id] = '';
    await cargar();
  } catch (err) {
    despachoError.value = apiErrorMessage(err);
  } finally {
    actualizandoPedidoId.value = null;
  }
}

onMounted(cargar);
</script>
