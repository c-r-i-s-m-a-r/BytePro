<template>
  <div class="container">
    <div class="breadcrumbs">
      <RouterLink to="/">Inicio</RouterLink>
      <span>/</span>
      <span>Seguimiento de envío</span>
    </div>

    <div class="flex-between mb-6">
      <div>
        <h1 class="page-title">Seguimiento de envío</h1>
        <p class="page-subtitle">
          Consulta el estado logístico de tu pedido en tiempo real con tu código de guía.
        </p>
      </div>
      <span v-if="tracking" class="badge">{{ tracking.pildora }}</span>
    </div>

    <section class="card mb-6">
      <form class="tracking-search-form" @submit.prevent="buscarGuia">
        <div class="field tracking-search-field">
          <label for="tracking-code-input">Número de guía (Tracking)</label>
          <div class="tracking-input-row">
            <input
              id="tracking-code-input"
              v-model="codigoInput"
              class="input"
              placeholder="Ej. TRK-20261107-0001"
              autocomplete="off"
            />
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Consultando…' : 'Rastrear envío' }}
            </button>
          </div>
          <p class="field-hint">
            Ingresa el código alfanumérico asignado al confirmar el pago de tu compra.
          </p>
        </div>
      </form>
    </section>

    <div v-if="loading" class="state-message">
      <h3>Consultando estado del envío…</h3>
      <p>Verificando registros logísticos en tiempo real.</p>
    </div>

    <div v-else-if="error" class="alert alert-danger mb-6" role="alert">
      {{ error }}
    </div>

    <template v-else-if="tracking">
      <section class="card mb-6">
        <div class="flex-between flex-wrap gap-4 mb-4">
          <div>
            <span class="field-hint">Guía de seguimiento</span>
            <h2 class="section-title mb-0">{{ tracking.codigoSeguimiento }}</h2>
          </div>
          <div class="tracking-meta-group">
            <div>
              <span class="field-hint">Estado actual</span>
              <div>
                <span class="badge" :class="estadoClass(tracking.estado)">
                  {{ tracking.pildora }} ({{ tracking.estado }})
                </span>
              </div>
            </div>
            <div>
              <span class="field-hint">Punto de control actual</span>
              <div class="font-semibold">{{ tracking.ubicacionActual }}</div>
            </div>
            <div>
              <span class="field-hint">Fecha estimada de entrega</span>
              <div class="font-semibold">{{ formatDate(tracking.fechaEstimadaEntrega) }}</div>
            </div>
          </div>
        </div>

        <div class="tracking-progress-bar" aria-label="Progreso del envío">
          <div
            class="tracking-progress-fill"
            :style="{ width: `${tracking.progreso || 0}%` }"
          ></div>
        </div>

        <div class="tracking-stages mt-6">
          <div
            v-for="etapa in tracking.etapas"
            :key="etapa.codigo"
            class="tracking-stage-item"
            :class="{
              completed: etapa.completado,
              current: etapa.enProgreso,
              pending: etapa.pendiente,
            }"
          >
            <div class="tracking-stage-header">
              <span
                class="timeline-dot"
                :class="{
                  'dot-completed': etapa.completado && !etapa.enProgreso,
                  'dot-progress': etapa.enProgreso,
                  'dot-pending': etapa.pendiente,
                }"
              ></span>
              <span class="tracking-stage-name">{{ etapa.nombre }}</span>
            </div>
            <p class="field-hint">{{ etapa.descripcion }}</p>
            <p v-if="etapa.ubicacion" class="field-hint mt-1">
              <strong>Ubicación:</strong> {{ etapa.ubicacion }}
            </p>
            <p v-if="etapa.timestamp" class="field-hint">
              {{ formatDateTime(etapa.timestamp) }}
            </p>
          </div>
        </div>
      </section>

      <div class="checkout-layout">
        <section class="card">
          <h2 class="section-title">Historial de actualizaciones</h2>
          <div v-if="tracking.historial && tracking.historial.length" class="tracking-history">
            <div
              v-for="(evento, idx) in tracking.historial"
              :key="idx"
              class="tracking-history-row"
            >
              <span class="timeline-dot dot-completed"></span>
              <div class="tracking-history-body">
                <div class="flex-between">
                  <strong>{{ evento.estado }}</strong>
                  <span class="field-hint">{{ formatDateTime(evento.timestamp) }}</span>
                </div>
                <p class="field-hint">{{ evento.ubicacion || evento.puntoControl }}</p>
                <p v-if="evento.nota">{{ evento.nota }}</p>
              </div>
            </div>
          </div>
          <p v-else class="empty-note">Sin eventos adicionales registrados.</p>

          <template v-if="tracking.privado && tracking.componentes && tracking.componentes.length">
            <h2 class="section-title mt-6">Componentes adquiridos</h2>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Componente</th>
                    <th>SKU</th>
                    <th>Cant.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in tracking.componentes" :key="item.varianteId">
                    <td>
                      <div>{{ item.nombreProducto }}</div>
                      <small v-if="item.nombreVariante" class="field-hint">
                        {{ item.nombreVariante }}
                      </small>
                    </td>
                    <td>{{ item.sku || '—' }}</td>
                    <td>{{ item.cantidad }}</td>
                    <td>{{ formatPrice(item.subtotal) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </section>

        <aside class="summary-card">
          <template v-if="tracking.privado && tracking.datosEntrega">
            <h2 class="section-title">Datos de entrega</h2>
            <div class="summary-row">
              <span>Destinatario</span>
              <span>{{ tracking.datosEntrega.nombreDestinatario }}</span>
            </div>
            <div class="summary-row">
              <span>Dirección exacta</span>
              <span>{{ tracking.datosEntrega.direccion }}</span>
            </div>
            <div class="summary-row">
              <span>Ciudad</span>
              <span>{{ tracking.datosEntrega.ciudad }}</span>
            </div>
            <div class="summary-row">
              <span>Teléfono</span>
              <span>{{ tracking.datosEntrega.telefono }}</span>
            </div>
            <div v-if="tracking.datosEntrega.notas" class="summary-row">
              <span>Notas</span>
              <span>{{ tracking.datosEntrega.notas }}</span>
            </div>

            <template v-if="tracking.comprobante">
              <h2 class="section-title mt-6">Comprobante asociado</h2>
              <div class="summary-row">
                <span>Recibo</span>
                <span>{{ tracking.comprobante.numero }}</span>
              </div>
              <div class="summary-row">
                <span>Total pagado</span>
                <span>{{ formatPrice(tracking.comprobante.total) }}</span>
              </div>
              <RouterLink
                class="btn btn-secondary btn-block mt-4"
                :to="{ name: 'receipt', params: { ventaId: tracking.ventaId } }"
              >
                Ver comprobante de venta
              </RouterLink>
            </template>
          </template>

          <template v-else>
            <h2 class="section-title">Vista pública protegida</h2>
            <p class="field-hint mb-4">
              Por seguridad y privacidad, los datos personales del destinatario, la dirección
              exacta y el detalle de componentes solo se muestran al iniciar sesión con la
              cuenta compradora.
            </p>
            <div class="summary-row">
              <span>Ciudad destino</span>
              <span>{{ tracking.ciudad || 'Nacional' }}</span>
            </div>
            <RouterLink
              v-if="!auth.isAuthenticated"
              class="btn btn-primary btn-block mt-4"
              :to="{ name: 'login', query: { redirect: route.fullPath } }"
            >
              Iniciar sesión para ver detalle completo
            </RouterLink>
          </template>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import api, { apiErrorMessage } from '../services/api';
import { useAuthStore } from '../store/auth';
import { formatDate, formatDateTime, formatPrice } from '../utils/format';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const codigoInput = ref('');
const loading = ref(false);
const error = ref('');
const tracking = ref(null);

function estadoClass(estado) {
  if (estado === 'ENTREGADO') return 'badge-stock';
  if (estado === 'CANCELADO') return 'badge-agotado';
  if (estado === 'EN_CAMINO') return 'badge-low';
  return '';
}

async function cargarTracking(codigo) {
  const limpio = String(codigo || '').trim();
  if (!limpio) return;

  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get(`/distribucion/tracking/${encodeURIComponent(limpio)}`);
    tracking.value = data;
  } catch (err) {
    tracking.value = null;
    error.value = apiErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

function buscarGuia() {
  const limpio = String(codigoInput.value || '').trim();
  if (!limpio) {
    error.value = 'Ingresa un número de guía para realizar la consulta.';
    return;
  }
  router.replace({ name: 'tracking', params: { codigo: limpio } });
  cargarTracking(limpio);
}

watch(
  () => route.params.codigo,
  (nuevo) => {
    if (nuevo) {
      codigoInput.value = String(nuevo);
      cargarTracking(nuevo);
    }
  }
);

onMounted(() => {
  const inicial = route.params.codigo || route.query.codigo || '';
  if (inicial) {
    codigoInput.value = String(inicial);
    cargarTracking(inicial);
  }
});
</script>
