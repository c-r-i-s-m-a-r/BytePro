<template>
  <div class="admin-page">
    <div class="flex-between mb-6">
      <div>
        <h2 class="section-title mb-1">Dashboard y Métricas Ejecutivas</h2>
        <p class="field-hint">
          Indicadores cuantitativos de ventas, pedidos y catálogo en tiempo real.
        </p>
      </div>
      <button type="button" class="btn btn-tertiary btn-sm" @click="cargar">
        Actualizar datos
      </button>
    </div>

    <div v-if="loading" class="state-message">
      <h3>Cargando métricas…</h3>
    </div>

    <div v-else class="kpi-grid mb-6">
      <div class="kpi-card">
        <div class="kpi-label">Ingresos acumulados</div>
        <div class="kpi-value">{{ formatPrice(resumen.ingresosAcumulados) }}</div>
        <div class="field-hint mt-1">
          Ventas del mes: {{ formatPrice(resumen.ventasMes) }}
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Pedidos realizados vs. pendientes</div>
        <div class="kpi-value">
          {{ resumen.pedidosRealizados }} / {{ resumen.pedidosPendientesDespacho }}
        </div>
        <div class="field-hint mt-1">
          {{ resumen.pedidosPendientesDespacho }} pendiente(s) de despacho
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Catálogo y variantes activas</div>
        <div class="kpi-value">{{ resumen.productos }} / {{ resumen.variantes }}</div>
        <div class="field-hint mt-1">
          Stock disponible: {{ resumen.stockDisponible }} uds.
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Productos con stock crítico</div>
        <div class="kpi-value">{{ resumen.stockBajo }}</div>
        <div class="field-hint mt-1">Bajo umbral de seguridad</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api from '../../services/api';
import { formatPrice } from '../../utils/format';

const loading = ref(true);
const resumen = ref({
  ingresosAcumulados: 0,
  ventasMes: 0,
  pedidosRealizados: 0,
  pedidosPendientesDespacho: 0,
  productos: 0,
  variantes: 0,
  stockDisponible: 0,
  stockBajo: 0,
});

async function cargar() {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/resumen');
    resumen.value = data;
  } catch (err) {
    //
  } finally {
    loading.value = false;
  }
}

onMounted(cargar);
</script>
