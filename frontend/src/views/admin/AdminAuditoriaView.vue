<template>
  <div class="admin-page">
    <div class="flex-between mb-6">
      <div>
        <h2 class="section-title mb-1">Transacciones Financieras y Auditoría</h2>
        <p class="field-hint">
          Registro inmutable de cobros, dispersiones de pago y eventos de seguridad.
        </p>
      </div>
      <button type="button" class="btn btn-tertiary btn-sm" @click="cargar">
        Actualizar registros
      </button>
    </div>

    <!-- Tabla Transacciones -->
    <div class="card mb-6">
      <h3 class="section-title mb-4">Transacciones de Cobro</h3>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Código Transacción</th>
              <th>Venta</th>
              <th>Cliente</th>
              <th>Método</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Recibo</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in transacciones" :key="item.id">
              <td><strong>{{ item.codigoTransaccion }}</strong></td>
              <td>#{{ item.venta ? item.venta.id : item.ventaId }}</td>
              <td>{{ item.usuario ? item.usuario.email : '—' }}</td>
              <td>{{ item.metodo }}</td>
              <td>{{ formatPrice(item.monto) }}</td>
              <td>
                <span class="badge" :class="item.estado === 'aprobado' ? 'badge-stock' : 'badge-agotado'">
                  {{ item.estado }}
                </span>
              </td>
              <td>{{ item.recibo ? item.recibo.numero : '—' }}</td>
              <td>{{ formatDateTime(item.fechaProcesado) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!transacciones.length" class="empty-note">No hay transacciones registradas.</p>
      </div>
    </div>

    <!-- Tabla Auditoría -->
    <div class="card">
      <h3 class="section-title mb-4">Bitácora de Auditoría del Sistema</h3>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Severidad</th>
              <th>Tipo</th>
              <th>Mensaje</th>
              <th>Venta / Ref</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="evento in auditoria" :key="evento.id">
              <td>{{ formatDateTime(evento.fecha) }}</td>
              <td>
                <span class="badge" :class="evento.severidad === 'critica' ? 'badge-agotado' : 'badge-low'">
                  {{ evento.severidad }}
                </span>
              </td>
              <td>{{ evento.tipo }}</td>
              <td>{{ evento.mensaje }}</td>
              <td>{{ evento.ventaId ? `#${evento.ventaId}` : '—' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!auditoria.length" class="empty-note">Sin eventos de auditoría registrados.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api from '../../services/api';
import { formatDateTime, formatPrice } from '../../utils/format';

const transacciones = ref([]);
const auditoria = ref([]);

async function cargar() {
  try {
    const [txRes, auRes] = await Promise.all([
      api.get('/admin/transacciones'),
      api.get('/admin/auditoria'),
    ]);
    transacciones.value = txRes.data.items || [];
    auditoria.value = auRes.data.items || [];
  } catch (err) {
    //
  }
}

onMounted(cargar);
</script>
