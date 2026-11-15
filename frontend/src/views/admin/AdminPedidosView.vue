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
              <th>Historial</th>
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
                  <button
                    v-if="p.estadoLogistica === 'PEDIDO_CONFIRMADO' || p.estadoLogistica === 'PREPARANDO_PEDIDO'"
                    type="button"
                    class="btn btn-secondary btn-sm"
                    :disabled="actualizandoPedidoId === p.id"
                    @click="abrirModalAvance(p, 'EN_PREPARACION')"
                  >
                    A Preparación
                  </button>
                  <button
                    v-else-if="p.estadoLogistica === 'EN_PREPARACION'"
                    type="button"
                    class="btn btn-secondary btn-sm"
                    :disabled="actualizandoPedidoId === p.id"
                    @click="abrirModalAvance(p, 'EN_CAMINO')"
                  >
                    A Ruta
                  </button>
                  <button
                    v-else-if="p.estadoLogistica === 'EN_CAMINO'"
                    type="button"
                    class="btn btn-primary btn-sm"
                    :disabled="actualizandoPedidoId === p.id"
                    @click="abrirModalAvance(p, 'ENTREGADO')"
                  >
                    Marcar Entregado
                  </button>
                </div>
              </td>
              <td>
                <button type="button" class="btn btn-tertiary btn-sm" @click="abrirHistorial(p)">
                  Ver historial
                </button>
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

    <!-- REQ-OPR-02: modal de avance de fase con evidencias fotográficas -->
    <div
      v-if="modalAvance.abierto"
      class="modal-backdrop"
      role="dialog"
      aria-modal="true"
      @click.self="cerrarModalAvance"
    >
      <div class="modal-card modal-card-lg">
        <div class="modal-header">
          <h2 class="section-title mb-0">
            Evidencias de despacho · {{ modalAvance.pedido?.numeroPedido }}
          </h2>
          <button type="button" class="btn btn-tertiary btn-sm" @click="cerrarModalAvance">
            Cerrar
          </button>
        </div>

        <p class="field-hint">
          Avanzando a <strong>{{ modalAvance.estado }}</strong>. Adjunta fotos de evidencia del
          empaque, la carga o la entrega (opcional).
        </p>

        <div v-if="modalAvance.error" class="alert alert-danger">{{ modalAvance.error }}</div>

        <div class="field">
          <label>Ubicación / punto de control</label>
          <input
            v-model="modalAvance.ubicacion"
            class="input"
            placeholder="Ej. Almacén central, sucursal, ruta..."
          />
        </div>

        <div class="field">
          <label>Notas o comentarios adicionales del proceso</label>
          <textarea
            v-model="modalAvance.nota"
            class="input"
            rows="3"
            placeholder="Ej. Entregado en portería, caja sellada, cliente firmó recepción..."
          ></textarea>
          <p class="field-hint">Esta nota quedará registrada en el hito del historial.</p>
        </div>

        <div class="field">
          <label>Fotografías de evidencia</label>
          <div class="evidence-upload-actions">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              :disabled="modalAvance.comprimiendo"
              @click="inputGaleria?.click()"
            >
              Subir de galería
            </button>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              :disabled="modalAvance.comprimiendo"
              @click="inputCamara?.click()"
            >
              Tomar foto
            </button>
          </div>
          <input
            ref="inputGaleria"
            type="file"
            accept="image/*"
            multiple
            class="evidence-file-input"
            @change="onFotosSeleccionadas"
          />
          <input
            ref="inputCamara"
            type="file"
            accept="image/*"
            capture="environment"
            class="evidence-file-input"
            @change="onFotosSeleccionadas"
          />
          <p class="field-hint">
            Se optimizan automáticamente a 1280 px y JPEG de alta calidad. Puedes adjuntar varias.
          </p>
          <p v-if="modalAvance.comprimiendo" class="field-hint">Optimizando imágenes...</p>
        </div>

        <div v-if="modalAvance.fotos.length" class="evidence-grid">
          <div
            v-for="(foto, idx) in modalAvance.fotos"
            :key="`${foto.nombre}-${idx}`"
            class="evidence-item"
          >
            <img :src="foto.dataUrl" :alt="foto.nombre" />
            <button
              type="button"
              class="evidence-remove"
              title="Eliminar foto"
              @click="quitarFoto(idx)"
            >
              ×
            </button>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="cerrarModalAvance">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="modalAvance.comprimiendo || Boolean(actualizandoPedidoId)"
            @click="confirmarAvance"
          >
            Confirmar y enviar
          </button>
        </div>
      </div>
    </div>

    <!-- REQ-VIS-03: historial del pedido con evidencias -->
    <div
      v-if="modalHistorial.abierto"
      class="modal-backdrop"
      role="dialog"
      aria-modal="true"
      @click.self="cerrarHistorial"
    >
      <div class="modal-card modal-card-lg">
        <div class="modal-header">
          <h2 class="section-title mb-0">
            Historial de despacho · {{ modalHistorial.pedido?.numeroPedido }}
          </h2>
          <button type="button" class="btn btn-tertiary btn-sm" @click="cerrarHistorial">
            Cerrar
          </button>
        </div>

        <p v-if="!historialPedido.length" class="field-hint">
          Este pedido aún no registra hitos de despacho.
        </p>

        <ul v-else class="dispatch-timeline">
          <li
            v-for="(evento, idx) in historialPedido"
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
                <img :src="foto" alt="Evidencia fotográfica" />
              </button>
            </div>
            <div v-else class="evidence-empty mt-2">Sin imágenes</div>
          </li>
        </ul>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="cerrarHistorial">
            Cerrar
          </button>
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
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import api, { apiErrorMessage } from '../../services/api';
import { subscribeToTables } from '../../services/realtime';
import { formatDateTime, formatPrice } from '../../utils/format';
import {
  compressImage,
  isSupportedImageType,
  MAX_SOURCE_IMAGE_BYTES,
} from '../../utils/imageCompressor';

const pedidos = ref([]);
const pedidosPagination = ref({ page: 1, limit: 15, total: 0, totalPages: 0 });
const actualizandoPedidoId = ref(null);
const despachoError = ref('');
const despachoExito = ref('');

const modalAvance = reactive({
  abierto: false,
  pedido: null,
  estado: '',
  ubicacion: '',
  nota: '',
  fotos: [],
  error: '',
  comprimiendo: false,
});

const modalHistorial = reactive({
  abierto: false,
  pedido: null,
});

const lightbox = reactive({ src: '' });
const inputGaleria = ref(null);
const inputCamara = ref(null);

const historialPedido = computed(() => {
  const despacho = modalHistorial.pedido?.despacho;
  const historial = despacho?.historial;
  if (Array.isArray(historial)) return historial;
  if (typeof historial === 'string' && historial.trim()) {
    try {
      const parsed = JSON.parse(historial);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
});

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

function abrirModalAvance(pedido, nuevoEstado) {
  despachoError.value = '';
  despachoExito.value = '';
  modalAvance.abierto = true;
  modalAvance.pedido = pedido;
  modalAvance.estado = nuevoEstado;
  modalAvance.ubicacion = pedido.ubicacionActual || '';
  modalAvance.nota = '';
  modalAvance.fotos = [];
  modalAvance.error = '';
  modalAvance.comprimiendo = false;
}

function cerrarModalAvance() {
  modalAvance.abierto = false;
  modalAvance.pedido = null;
  modalAvance.estado = '';
  modalAvance.ubicacion = '';
  modalAvance.nota = '';
  modalAvance.fotos = [];
  modalAvance.error = '';
  modalAvance.comprimiendo = false;
}

async function onFotosSeleccionadas(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  modalAvance.error = '';
  modalAvance.comprimiendo = true;

  try {
    for (const file of files) {
      if (!isSupportedImageType(file)) {
        modalAvance.error = 'El formato debe ser PNG, JPEG o WEBP.';
        continue;
      }

      if (file.size > MAX_SOURCE_IMAGE_BYTES) {
        modalAvance.error = 'Cada imagen original no puede superar los 20 MB.';
        continue;
      }

      try {
        // REQ-IMG-01: compresión automática antes de adjuntar la evidencia.
        const dataUrl = await compressImage(file);
        if (dataUrl) {
          modalAvance.fotos.push({
            dataUrl,
            nombre: file.name || 'evidencia.jpg',
          });
        }
      } catch {
        modalAvance.error = 'No se pudo procesar una de las imágenes seleccionadas.';
      }
    }
  } finally {
    modalAvance.comprimiendo = false;
    if (event.target) event.target.value = '';
  }
}

function quitarFoto(index) {
  modalAvance.fotos.splice(index, 1);
}

async function confirmarAvance() {
  const pedido = modalAvance.pedido;
  const nuevoEstado = modalAvance.estado;
  if (!pedido || !nuevoEstado || actualizandoPedidoId.value) return;

  despachoError.value = '';
  despachoExito.value = '';
  modalAvance.error = '';
  actualizandoPedidoId.value = pedido.id;

  try {
    await api.patch(`/admin/pedidos/${pedido.id}/estado`, {
      estado: nuevoEstado,
      ubicacion: modalAvance.ubicacion.trim() || undefined,
      nota: modalAvance.nota.trim() || undefined,
      fotos: modalAvance.fotos.map((foto) => foto.dataUrl),
    });
    despachoExito.value = `Pedido ${pedido.numeroPedido} actualizado a ${nuevoEstado}.`;
    cerrarModalAvance();
    await cargar();
  } catch (err) {
    modalAvance.error = apiErrorMessage(err);
  } finally {
    actualizandoPedidoId.value = null;
  }
}

function abrirHistorial(pedido) {
  modalHistorial.abierto = true;
  modalHistorial.pedido = pedido;
}

function cerrarHistorial() {
  modalHistorial.abierto = false;
  modalHistorial.pedido = null;
}

function verFoto(src) {
  lightbox.src = src;
}

function cerrarLightbox() {
  lightbox.src = '';
}

let unsubscribeRealtime = null;

// REQ-VIS-03: mantiene actualizado el historial abierto ante cambios en tiempo real.
watch(pedidos, (lista) => {
  if (!modalHistorial.abierto || !modalHistorial.pedido) return;
  const actualizado = lista.find((p) => p.id === modalHistorial.pedido.id);
  if (actualizado) modalHistorial.pedido = actualizado;
});

onMounted(() => {
  cargar();
  unsubscribeRealtime = subscribeToTables(
    ['ventas', 'despachos', 'transacciones'],
    cargar
  );
});

onUnmounted(() => {
  if (unsubscribeRealtime) unsubscribeRealtime();
  unsubscribeRealtime = null;
});
</script>
