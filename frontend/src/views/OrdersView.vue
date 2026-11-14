<template>
  <div class="container">
    <div class="breadcrumbs">
      <RouterLink to="/">Inicio</RouterLink>
      <span>/</span>
      <span>Mi cuenta</span>
      <span>/</span>
      <span>Mis pedidos y direcciones</span>
    </div>

    <div class="flex-between mb-6">
      <div>
        <h1 class="page-title">Mis pedidos</h1>
        <p class="page-subtitle">
          Consulta tu historial de compras, gestiona cancelaciones y administra tu libreta de
          direcciones.
        </p>
      </div>
      <RouterLink class="btn btn-tertiary" to="/seguimiento">
        Rastrear con número de guía
      </RouterLink>
    </div>

    <div v-if="loading" class="state-message">
      <h3>Cargando tus pedidos…</h3>
    </div>

    <div v-else-if="error" class="alert alert-danger mb-6">
      {{ error }}
    </div>

    <template v-else>
      <div v-if="!pedidos.length" class="state-message mb-6">
        <h3>Aún no tienes pedidos registrados</h3>
        <p>Explora nuestro catálogo de hardware y realiza tu primera compra.</p>
        <RouterLink class="btn btn-primary" :to="{ name: 'catalog' }">
          Explorar catálogo
        </RouterLink>
      </div>

      <div v-else class="orders-list mb-6">
        <article v-for="pedido in pedidos" :key="pedido.id" class="card order-card mb-4">
          <div class="order-card-header">
            <div>
              <span class="field-hint">Pedido</span>
              <div class="order-number">{{ pedido.numeroPedido }} (#{{ pedido.id }})</div>
            </div>
            <div>
              <span class="field-hint">Fecha de compra</span>
              <div>{{ formatDateTime(pedido.fecha) }}</div>
            </div>
            <div>
              <span class="field-hint">Total pagado</span>
              <div class="font-semibold">{{ formatPrice(pedido.total) }}</div>
            </div>
            <div>
              <span class="field-hint">Estado actual</span>
              <div>
                <span class="badge" :class="pildoraClass(pedido.pildora)">
                  {{ pedido.pildora }}
                </span>
              </div>
            </div>
            <div class="order-actions">
              <button
                type="button"
                class="btn btn-tertiary btn-sm"
                @click="toggleDetalle(pedido.id)"
              >
                {{ pedidoActivoId === pedido.id ? 'Ocultar detalle' : 'Ver detalle' }}
              </button>
              <RouterLink
                v-if="pedido.codigoSeguimiento"
                class="btn btn-secondary btn-sm"
                :to="{ name: 'tracking', params: { codigo: pedido.codigoSeguimiento } }"
              >
                Seguimiento de envío
              </RouterLink>
            </div>
          </div>

          <div v-if="pedidoActivoId === pedido.id" class="order-detail-panel mt-4">
            <div class="checkout-layout">
              <div>
                <h3 class="section-title">Desglose de componentes adquiridos</h3>
                <div class="table-wrap">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Componente</th>
                        <th>Variante / SKU</th>
                        <th>Cant.</th>
                        <th>Precio unit.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in detalleActual?.items || pedido.items" :key="item.varianteId">
                        <td>
                          <div class="order-item-cell">
                            <div class="order-item-thumb">
                              <img
                                v-if="item.imagen"
                                :src="item.imagen"
                                :alt="item.nombreProducto"
                              />
                              <span v-else>HW</span>
                            </div>
                            <div>
                              <div class="font-semibold">{{ item.nombreProducto }}</div>
                              <small v-if="item.marca" class="field-hint">{{ item.marca }}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>{{ item.nombreVariante || 'Estándar' }}</div>
                          <small class="field-hint">{{ item.sku || '—' }}</small>
                        </td>
                        <td>{{ item.cantidad }}</td>
                        <td>{{ formatPrice(item.precioUnitario) }}</td>
                        <td>{{ formatPrice(item.subtotal) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <aside class="summary-card">
                <h3 class="section-title">Información de despacho y pago</h3>
                <div class="summary-row">
                  <span>Método de pago</span>
                  <span>{{ metodoLabel(pedido.metodoPago) }}</span>
                </div>
                <div v-if="pedido.codigoSeguimiento" class="summary-row">
                  <span>Guía logística</span>
                  <span>{{ pedido.codigoSeguimiento }}</span>
                </div>
                <template v-if="pedido.datosEntrega">
                  <div class="summary-row">
                    <span>Destinatario</span>
                    <span>{{ pedido.datosEntrega.nombreDestinatario }}</span>
                  </div>
                  <div class="summary-row">
                    <span>Dirección de despacho</span>
                    <span>
                      {{ pedido.datosEntrega.direccion }}, {{ pedido.datosEntrega.ciudad }}
                    </span>
                  </div>
                  <div class="summary-row">
                    <span>Teléfono</span>
                    <span>{{ pedido.datosEntrega.telefono }}</span>
                  </div>
                </template>

                <div class="mt-4 flex-col gap-2">
                  <RouterLink
                    v-if="pedido.recibo"
                    class="btn btn-secondary btn-block"
                    :to="{ name: 'receipt', params: { ventaId: pedido.id } }"
                  >
                    Ver o descargar comprobante ({{ pedido.recibo.numero }})
                  </RouterLink>

                  <template v-if="pedido.puedeCancelar">
                    <button
                      type="button"
                      class="btn btn-danger btn-block"
                      :disabled="cancelandoId === pedido.id"
                      @click="confirmarCancelacion(pedido)"
                    >
                      {{
                        cancelandoId === pedido.id ? 'Cancelando pedido…' : 'Cancelar pedido'
                      }}
                    </button>
                    <p class="field-hint">
                      Disponible mientras el pedido esté confirmado o en preparación antes de
                      salir a ruta. El stock se reintegrará automáticamente.
                    </p>
                  </template>

                  <p
                    v-else-if="
                      pedido.estadoLogistica === 'EN_CAMINO' ||
                      pedido.estadoLogistica === 'ENTREGADO'
                    "
                    class="field-hint"
                  >
                    El pedido ya se encuentra en ruta de entrega y no puede ser cancelado
                    directamente.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </article>
      </div>

      <section class="card mt-8">
        <div class="flex-between mb-4">
          <div>
            <h2 class="section-title mb-0">Libreta de direcciones de envío</h2>
            <p class="field-hint">
              Tus direcciones guardadas se cargarán automáticamente en el Checkout.
            </p>
          </div>
          <span class="badge">{{ direcciones.length }} guardada(s)</span>
        </div>

        <div v-if="direcciones.length" class="address-grid mb-6">
          <div
            v-for="dir in direcciones"
            :key="dir.id"
            class="address-card"
            :class="{ active: dir.predeterminada }"
          >
            <div class="flex-between mb-2">
              <span class="badge">{{ dir.etiqueta }}</span>
              <span v-if="dir.predeterminada" class="field-hint">Predeterminada</span>
            </div>
            <div class="font-semibold">{{ dir.nombreDestinatario }}</div>
            <div>{{ dir.calle }}</div>
            <div class="field-hint">{{ dir.ciudad }} · Tel: {{ dir.telefono }}</div>
            <div v-if="dir.referencias" class="field-hint">{{ dir.referencias }}</div>
            <div class="mt-3">
              <button
                type="button"
                class="btn btn-danger btn-sm"
                @click="borrarDireccion(dir.id)"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
        <p v-else class="empty-note mb-4">
          Aún no tienes direcciones guardadas en tu perfil.
        </p>

        <h3 class="section-title">Agregar nueva dirección</h3>
        <form @submit.prevent="guardarDireccion">
          <div class="card-grid">
            <div class="field">
              <label for="dir-etiqueta">Etiqueta (ej. Casa, Oficina)</label>
              <input
                id="dir-etiqueta"
                v-model="nuevaDir.etiqueta"
                class="input"
                placeholder="Casa u Oficina"
                required
              />
            </div>
            <div class="field">
              <label for="dir-destinatario">Nombre del destinatario</label>
              <input
                id="dir-destinatario"
                v-model="nuevaDir.nombreDestinatario"
                class="input"
                placeholder="Nombre completo"
                required
              />
            </div>
            <div class="field">
              <label for="dir-calle">Dirección exacta / Calle</label>
              <input
                id="dir-calle"
                v-model="nuevaDir.calle"
                class="input"
                placeholder="Av. Principal #123, Edificio A"
                required
              />
            </div>
            <div class="field">
              <label for="dir-ciudad">Ciudad</label>
              <select id="dir-ciudad" v-model="nuevaDir.ciudad" class="select" required>
                <option v-for="c in ciudadesCobertura" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="field">
              <label for="dir-telefono">Teléfono de contacto</label>
              <input
                id="dir-telefono"
                v-model="nuevaDir.telefono"
                class="input"
                placeholder="70000000"
                required
              />
            </div>
            <div class="field">
              <label for="dir-referencias">Referencias o notas de entrega</label>
              <input
                id="dir-referencias"
                v-model="nuevaDir.referencias"
                class="input"
                placeholder="Portón gris, dejar en recepción…"
              />
            </div>
          </div>

          <button type="submit" class="btn btn-primary mt-2" :disabled="guardandoDir">
            {{ guardandoDir ? 'Guardando…' : 'Guardar dirección' }}
          </button>
        </form>

        <p v-if="dirError" class="alert alert-danger mt-4">{{ dirError }}</p>
        <p v-if="dirExito" class="alert alert-success mt-4">{{ dirExito }}</p>
      </section>
    </template>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import api, { apiErrorMessage } from '../services/api';
import { subscribeToTables } from '../services/realtime';
import { useAuthStore } from '../store/auth';
import { useUiStore } from '../store/ui';
import { formatDateTime, formatPrice } from '../utils/format';

const auth = useAuthStore();
const ui = useUiStore();

const loading = ref(true);
const error = ref('');
const pedidos = ref([]);
const direcciones = ref([]);
const pedidoActivoId = ref(null);
const detalleActual = ref(null);
const cancelandoId = ref(null);
const guardandoDir = ref(false);
const dirError = ref('');
const dirExito = ref('');

const ciudadesCobertura = ref([
  'La Paz',
  'El Alto',
  'Cochabamba',
  'Santa Cruz',
  'Sucre',
  'Oruro',
  'Potosí',
  'Tarija',
  'Trinidad',
  'Cobija',
]);

const nuevaDir = reactive({
  etiqueta: 'Casa',
  nombreDestinatario: auth.user?.nombre || '',
  calle: '',
  ciudad: 'La Paz',
  telefono: '',
  referencias: '',
  predeterminada: true,
});

function metodoLabel(metodo) {
  const labels = {
    tarjeta: 'Tarjeta de crédito o débito',
    transferencia: 'Transferencia bancaria',
    pasarela: 'Pasarela digital',
  };
  return labels[metodo] || metodo || 'Tarjeta';
}

function pildoraClass(pildora) {
  if (pildora === 'Entregado' || pildora === 'Pagado') return 'badge-stock';
  if (pildora === 'Cancelado') return 'badge-agotado';
  if (pildora === 'En camino' || pildora === 'En preparación') return 'badge-low';
  return '';
}

async function toggleDetalle(ventaId) {
  if (pedidoActivoId.value === ventaId) {
    pedidoActivoId.value = null;
    detalleActual.value = null;
    return;
  }
  pedidoActivoId.value = ventaId;
  try {
    const { data } = await api.get(`/clientes/pedidos/${ventaId}`);
    detalleActual.value = data;
  } catch (err) {
    detalleActual.value = null;
  }
}

async function confirmarCancelacion(pedido) {
  if (cancelandoId.value) return;
  const confirmed = await ui.confirm({
    title: 'Cancelar pedido',
    message: `¿Estás seguro de que deseas cancelar el pedido ${pedido.numeroPedido}? El stock reservado se reintegrará automáticamente.`,
    confirmText: 'Sí, cancelar pedido',
    cancelText: 'Cancelar / Volver',
    variant: 'danger',
  });
  if (!confirmed) return;

  cancelandoId.value = pedido.id;
  try {
    const { data } = await api.post(`/clientes/pedidos/${pedido.id}/cancelar`, {
      motivo: 'Cancelado por el cliente desde Mis Pedidos',
    });
    ui.success(`Pedido ${pedido.numeroPedido} cancelado y stock reintegrado.`);
    detalleActual.value = data;
    await cargarDatos();
  } catch (err) {
    ui.error(apiErrorMessage(err));
  } finally {
    cancelandoId.value = null;
  }
}

async function guardarDireccion() {
  if (guardandoDir.value) return;
  dirError.value = '';
  dirExito.value = '';
  guardandoDir.value = true;
  try {
    await api.post('/clientes/direcciones', { ...nuevaDir });
    dirExito.value = 'Dirección guardada en tu libreta.';
    nuevaDir.calle = '';
    nuevaDir.referencias = '';
    await cargarDatos();
  } catch (err) {
    dirError.value = apiErrorMessage(err);
  } finally {
    guardandoDir.value = false;
  }
}

async function borrarDireccion(id) {
  const confirmed = await ui.confirm({
    title: 'Eliminar dirección',
    message: '¿Estás seguro de que deseas eliminar esta dirección de tu libreta de envíos?',
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar / Volver',
    variant: 'danger',
  });
  if (!confirmed) return;

  try {
    await api.delete(`/clientes/direcciones/${id}`);
    await cargarDatos();
  } catch (err) {
    dirError.value = apiErrorMessage(err);
  }
}

let unsubscribeRealtime = null;

async function cargarDatos(silencioso = false) {
  if (!silencioso) loading.value = true;
  error.value = '';
  try {
    const [pedRes, dirRes] = await Promise.all([
      api.get('/clientes/pedidos'),
      api.get('/clientes/direcciones'),
    ]);
    pedidos.value = pedRes.data.items || [];
    direcciones.value = dirRes.data.items || [];
  } catch (err) {
    error.value = apiErrorMessage(err);
  } finally {
    if (!silencioso) loading.value = false;
  }
}

async function refrescarEnVivo() {
  await cargarDatos(true);
  if (!pedidoActivoId.value) return;
  try {
    const { data } = await api.get(`/clientes/pedidos/${pedidoActivoId.value}`);
    detalleActual.value = data;
  } catch (err) {
    // El detalle abierto se mantiene si el refresco falla.
  }
}

onMounted(() => {
  cargarDatos();
  unsubscribeRealtime = subscribeToTables(
    ['ventas', 'despachos', 'recibos'],
    refrescarEnVivo
  );
});

onUnmounted(() => {
  if (unsubscribeRealtime) unsubscribeRealtime();
  unsubscribeRealtime = null;
});
</script>
