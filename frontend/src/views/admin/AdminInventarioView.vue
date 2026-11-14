<template>
  <div class="admin-page">
    <div class="flex-between mb-6">
      <div>
        <h2 class="section-title mb-1">Control de Inventario y Kardex</h2>
        <p class="field-hint">
          Existencias físicas, alertas de reabastecimiento crítico y registro de movimientos de almacén.
        </p>
      </div>
      <button type="button" class="btn btn-tertiary btn-sm" @click="cargar">
        Actualizar datos
      </button>
    </div>

    <!-- Alertas de Stock Crítico -->
    <div v-if="alertasCriticas.length" class="card alert-reabastecimiento-card mb-6">
      <h3 class="section-title mb-2 text-warning">Alertas de Stock Crítico</h3>
      <p class="field-hint mb-4">
        Variantes con existencias físicas en o por debajo de su umbral de seguridad.
      </p>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Producto / Variante</th>
              <th>Disponible</th>
              <th>Umbral</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in alertasCriticas" :key="a.varianteId">
              <td><strong>{{ a.sku }}</strong></td>
              <td>{{ a.nombreProducto }} - {{ a.nombreVariante || 'Estándar' }}</td>
              <td><span class="badge badge-agotado">{{ a.disponible }} uds.</span></td>
              <td>{{ a.stockSeguridad || 3 }}</td>
              <td>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  @click="prepararReposicion(a.varianteId)"
                >
                  Reponer stock
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Registro de Movimientos de Kardex -->
    <div class="card mb-6 border-primary">
      <h3 class="section-title mb-4">Registrar Movimiento de Almacén</h3>
      <div v-if="movimientoError" class="alert alert-danger mb-4">{{ movimientoError }}</div>
      <div v-if="movimientoExito" class="alert alert-success mb-4">{{ movimientoExito }}</div>

      <form @submit.prevent="registrarMovimiento">
        <div class="card-grid">
          <div class="field">
            <label>Variante / Componente *</label>
            <select v-model="movimiento.varianteId" class="select" required>
              <option value="">Selecciona componente</option>
              <option v-for="item in inventario" :key="item.varianteId" :value="item.varianteId">
                {{ item.nombreProducto }} ({{ item.nombreVariante || 'Base' }}) · Stock: {{ item.disponible }}
              </option>
            </select>
          </div>
          <div class="field">
            <label>Tipo de movimiento *</label>
            <select v-model="movimiento.tipo" class="select" required>
              <option value="entrada">ENTRADA (Reabastecimiento)</option>
              <option value="salida">SALIDA (Baja por daño/merma)</option>
              <option value="ajuste">AJUSTE (Auditoría física)</option>
            </select>
          </div>
          <div v-if="movimiento.tipo !== 'ajuste'" class="field">
            <label>Cantidad de unidades *</label>
            <input v-model.number="movimiento.cantidad" type="number" min="1" class="input" required />
          </div>
          <div v-else class="field">
            <label>Nuevo stock físico exacto *</label>
            <input v-model.number="movimiento.nuevoStock" type="number" min="0" class="input" required />
          </div>
        </div>
        <div class="field mt-3">
          <label>Motivo o justificación</label>
          <input v-model="movimiento.motivo" class="input" placeholder="Ej. Factura proveedor #123, merma de embalaje…" />
        </div>
        <button type="submit" class="btn btn-primary mt-4" :disabled="guardandoMovimiento">
          {{ guardandoMovimiento ? 'Procesando…' : 'Registrar movimiento' }}
        </button>
      </form>
    </div>

    <!-- Tabla de Existencias Actuales -->
    <div class="card mb-6">
      <h3 class="section-title mb-4">Existencias Físicas en Almacén</h3>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Producto</th>
              <th>Variante</th>
              <th>Físico</th>
              <th>Bloqueado</th>
              <th>Disponible</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in inventario" :key="item.varianteId">
              <td><strong>{{ item.sku }}</strong></td>
              <td>{{ item.nombreProducto }}</td>
              <td>{{ item.nombreVariante || 'Estándar' }}</td>
              <td>{{ item.cantidad }}</td>
              <td>{{ item.bloqueado }}</td>
              <td><strong>{{ item.disponible }}</strong></td>
              <td>
                <span class="badge" :class="item.disponible > 3 ? 'badge-stock' : 'badge-agotado'">
                  {{ item.disponible > 0 ? (item.critico ? 'Stock bajo' : 'Disponible') : 'Agotado' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Historial Kardex -->
    <div class="card">
      <h3 class="section-title mb-4">Historial de Movimientos Kardex</h3>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>SKU</th>
              <th>Tipo</th>
              <th>Cant.</th>
              <th>Saldo Ant.</th>
              <th>Nuevo Saldo</th>
              <th>Motivo</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="k in kardex" :key="k.id">
              <td>{{ formatDateTime(k.fecha) }}</td>
              <td>{{ k.variante?.sku || '—' }}</td>
              <td><span class="badge" :class="kardexBadge(k.tipo)">{{ k.tipo }}</span></td>
              <td>{{ k.cantidad }}</td>
              <td>{{ k.saldoAnterior }}</td>
              <td><strong>{{ k.saldoNuevo }}</strong></td>
              <td>{{ k.motivo || '—' }}</td>
              <td>{{ k.usuario ? k.usuario.username : 'Sistema' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import api, { apiErrorMessage } from '../../services/api';
import { subscribeToTables } from '../../services/realtime';
import { useUiStore } from '../../store/ui';
import { formatDateTime } from '../../utils/format';

const ui = useUiStore();

const inventario = ref([]);
const kardex = ref([]);
const guardandoMovimiento = ref(false);
const movimientoError = ref('');
const movimientoExito = ref('');

const movimiento = ref({
  varianteId: '',
  tipo: 'entrada',
  cantidad: null,
  nuevoStock: null,
  motivo: '',
});

const alertasCriticas = computed(() =>
  inventario.value.filter((i) => i.critico || i.disponible <= 3)
);

function kardexBadge(tipo) {
  if (tipo === 'ENTRADA') return 'badge-stock';
  if (tipo === 'SALIDA' || tipo === 'SALIDA_VENTA') return 'badge-agotado';
  if (tipo === 'AJUSTE') return 'badge-low';
  return 'badge';
}

function prepararReposicion(varianteId) {
  movimiento.value.varianteId = varianteId;
  movimiento.value.tipo = 'entrada';
  movimiento.value.cantidad = 10;
  movimiento.value.motivo = 'Reabastecimiento por alerta de stock crítico';
}

async function cargar() {
  try {
    const [invRes, karRes] = await Promise.all([
      api.get('/almacen/inventario'),
      api.get('/almacen/kardex', { params: { limit: 100 } }),
    ]);
    inventario.value = invRes.data.items || [];
    kardex.value = karRes.data.items || [];
  } catch (err) {
    movimientoError.value = apiErrorMessage(err);
  }
}

async function registrarMovimiento() {
  if (guardandoMovimiento.value) return;
  movimientoError.value = '';
  movimientoExito.value = '';

  const varianteId = Number(movimiento.value.varianteId);
  const tipo = movimiento.value.tipo;
  const payload = { varianteId, motivo: movimiento.value.motivo };

  if (tipo === 'ajuste') {
    payload.nuevoStock = Number(movimiento.value.nuevoStock);
  } else {
    payload.cantidad = Number(movimiento.value.cantidad);
  }

  const endpoints = {
    entrada: '/almacen/entradas',
    salida: '/almacen/salidas',
    ajuste: '/almacen/ajustes',
  };

  const esCritico = tipo === 'salida' || tipo === 'ajuste';
  const confirmed = await ui.confirm({
    title: esCritico ? 'Confirmar ajuste o baja de stock' : 'Confirmar ingreso de stock',
    message: `¿Confirmas registrar el movimiento de almacén (${tipo.toUpperCase()}) para la variante #${varianteId}?`,
    confirmText: 'Confirmar movimiento',
    cancelText: 'Cancelar / Volver',
    variant: esCritico ? 'danger' : 'primary',
  });
  if (!confirmed) return;

  guardandoMovimiento.value = true;
  try {
    await api.post(endpoints[tipo], payload);
    movimientoExito.value = 'Movimiento registrado correctamente.';
    movimiento.value = {
      varianteId: '',
      tipo: 'entrada',
      cantidad: null,
      nuevoStock: null,
      motivo: '',
    };
    await cargar();
  } catch (err) {
    movimientoError.value = apiErrorMessage(err);
  } finally {
    guardandoMovimiento.value = false;
  }
}

let unsubscribeRealtime = null;

onMounted(() => {
  cargar();
  unsubscribeRealtime = subscribeToTables(
    ['inventarios', 'kardex', 'productos', 'variantes'],
    cargar
  );
});

onUnmounted(() => {
  if (unsubscribeRealtime) unsubscribeRealtime();
  unsubscribeRealtime = null;
});
</script>
