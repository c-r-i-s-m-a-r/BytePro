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

    <template v-else>
      <div class="kpi-grid mb-6">
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

      <section class="analytics-panel mb-6">
        <div class="analytics-head">
          <div>
            <h3 class="section-title mb-1">Evolución de ventas, ingresos y demanda</h3>
            <p class="field-hint">
              {{ analitica.periodo || 'Período actual' }} · moneda oficial Bs.
            </p>
          </div>
          <div class="analytics-actions">
            <span v-if="actualizando" class="field-hint">Actualizando…</span>
            <div class="granularity-switch" role="group" aria-label="Agrupar métricas por">
              <button
                v-for="opcion in opcionesGranularidad"
                :key="opcion.valor"
                type="button"
                class="granularity-btn"
                :class="{ active: granularidad === opcion.valor }"
                :aria-pressed="granularidad === opcion.valor"
                @click="granularidad = opcion.valor"
              >
                {{ opcion.etiqueta }}
              </button>
            </div>
          </div>
        </div>

        <div class="analytics-totals">
          <div class="analytics-total">
            <span class="kpi-label">Ventas del período</span>
            <strong>{{ analitica.totales.ventas }} pedido(s)</strong>
          </div>
          <div class="analytics-total">
            <span class="kpi-label">Ingresos del período</span>
            <strong>{{ formatPrice(analitica.totales.ingresos) }}</strong>
          </div>
          <div class="analytics-total">
            <span class="kpi-label">Demanda del período</span>
            <strong>{{ analitica.totales.demanda }} uds.</strong>
          </div>
        </div>

        <div v-if="!analitica.sinDatos" class="analytics-carousel">
          <div class="carousel-viewport">
            <button
              type="button"
              class="carousel-arrow carousel-arrow-prev"
              aria-label="Métrica anterior"
              @click="anterior"
            >
              &#8249;
            </button>

            <Transition name="carousel-slide" mode="out-in">
              <AnalyticsChart
                :key="serieActiva.key"
                class="carousel-slide"
                :labels="analitica.series.etiquetas"
                :series="[serieActiva]"
              />
            </Transition>

            <button
              type="button"
              class="carousel-arrow carousel-arrow-next"
              aria-label="Métrica siguiente"
              @click="siguiente"
            >
              &#8250;
            </button>
          </div>

          <div class="carousel-dots" role="tablist" aria-label="Seleccionar métrica">
            <button
              v-for="(serie, indice) in seriesGrafico"
              :key="serie.key"
              type="button"
              class="carousel-dot"
              :class="{ active: indice === indiceSerie }"
              role="tab"
              :aria-selected="indice === indiceSerie"
              @click="indiceSerie = indice"
            >
              {{ serie.titulo }}
            </button>
          </div>
        </div>
        <div v-else class="analytics-empty">
          <p>Sin datos de ventas en este período</p>
          <span class="field-hint">
            Las series de ventas, ingresos y demanda aparecerán cuando se registren pedidos.
          </span>
        </div>
      </section>

      <div class="analytics-grid">
        <section class="analytics-panel">
          <div class="analytics-head">
            <div>
              <h3 class="section-title mb-1">Top productos por demanda</h3>
              <p class="field-hint">Productos más vendidos y total recaudado en Bs.</p>
            </div>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th class="text-right">Unidades</th>
                  <th class="text-right">Recaudación</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="producto in analitica.topProductos" :key="producto.productoId || producto.nombre">
                  <td>{{ producto.nombre }}</td>
                  <td>{{ producto.categoria }}</td>
                  <td class="text-right">{{ producto.unidades }}</td>
                  <td class="text-right">{{ formatPrice(producto.ingresos) }}</td>
                </tr>
                <tr v-if="analitica.topProductos.length === 0">
                  <td colspan="4" class="empty-note">Sin datos de ventas en este período</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="analytics-panel">
          <div class="analytics-head">
            <div>
              <h3 class="section-title mb-1">Demanda por categoría</h3>
              <p class="field-hint">Unidades vendidas y participación por categoría.</p>
            </div>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th class="text-right">Unidades</th>
                  <th>Participación</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="categoria in analitica.demandaCategorias" :key="categoria.categoriaId || categoria.nombre">
                  <td>{{ categoria.nombre }}</td>
                  <td class="text-right">{{ categoria.unidades }}</td>
                  <td>
                    <div class="demand-share">
                      <span class="demand-share-bar">
                        <span
                          class="demand-share-fill"
                          :style="{ width: `${Math.min(categoria.porcentaje, 100)}%` }"
                        ></span>
                      </span>
                      <span class="demand-share-value">{{ formatPorcentaje(categoria.porcentaje) }}</span>
                    </div>
                  </td>
                </tr>
                <tr v-if="analitica.demandaCategorias.length === 0">
                  <td colspan="3" class="empty-note">Sin datos de ventas en este período</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import AnalyticsChart from '../../components/AnalyticsChart.vue';
import api from '../../services/api';
import { subscribeToTables } from '../../services/realtime';
import { formatPrice } from '../../utils/format';

const opcionesGranularidad = [
  { valor: 'dia', etiqueta: 'Día' },
  { valor: 'mes', etiqueta: 'Mes' },
  { valor: 'anio', etiqueta: 'Año' },
];

const loading = ref(true);
const actualizando = ref(false);
const granularidad = ref('mes');

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

function analiticaVacia() {
  return {
    granularidad: 'mes',
    periodo: 'Año actual',
    moneda: 'BOB',
    series: { etiquetas: [], ventas: [], ingresos: [], demanda: [] },
    totales: { ventas: 0, ingresos: 0, demanda: 0 },
    topProductos: [],
    demandaCategorias: [],
    sinDatos: true,
  };
}

const analitica = ref(analiticaVacia());

const indiceSerie = ref(0);

const seriesGrafico = computed(() => [
  {
    key: 'ventas',
    titulo: 'Ventas (pedidos)',
    descripcion: 'Cantidad de pedidos registrados',
    valores: analitica.value.series.ventas,
    color: '#2563eb',
    tipo: 'numero',
    total: analitica.value.totales.ventas,
  },
  {
    key: 'ingresos',
    titulo: 'Ingresos',
    descripcion: 'Monto recaudado en bolivianos',
    valores: analitica.value.series.ingresos,
    color: '#047857',
    tipo: 'moneda',
    total: analitica.value.totales.ingresos,
  },
  {
    key: 'demanda',
    titulo: 'Demanda',
    descripcion: 'Unidades vendidas en el período',
    valores: analitica.value.series.demanda,
    color: '#b45309',
    tipo: 'numero',
    total: analitica.value.totales.demanda,
  },
]);

const serieActiva = computed(
  () => seriesGrafico.value[indiceSerie.value] || seriesGrafico.value[0]
);

function anterior() {
  const total = seriesGrafico.value.length;
  if (!total) return;
  indiceSerie.value = (indiceSerie.value - 1 + total) % total;
}

function siguiente() {
  const total = seriesGrafico.value.length;
  if (!total) return;
  indiceSerie.value = (indiceSerie.value + 1) % total;
}

function formatPorcentaje(valor) {
  return `${Number(valor || 0).toFixed(1)} %`;
}

async function cargarResumen() {
  try {
    const { data } = await api.get('/admin/resumen');
    resumen.value = data;
  } catch (err) {
    //
  }
}

async function cargarAnalitica() {
  actualizando.value = true;
  try {
    const { data } = await api.get('/admin/analitica', {
      params: { granularidad: granularidad.value },
    });
    analitica.value = { ...analiticaVacia(), ...data };
  } catch (err) {
    analitica.value = analiticaVacia();
  } finally {
    actualizando.value = false;
  }
}

async function cargar() {
  loading.value = true;
  try {
    await Promise.all([cargarResumen(), cargarAnalitica()]);
  } finally {
    loading.value = false;
  }
}

watch(granularidad, cargarAnalitica);

let unsubscribeRealtime = null;

onMounted(() => {
  cargar();
  unsubscribeRealtime = subscribeToTables(
    ['ventas', 'inventarios', 'reclamos', 'despachos', 'productos'],
    () => {
      cargarResumen();
      cargarAnalitica();
    }
  );
});

onUnmounted(() => {
  if (unsubscribeRealtime) unsubscribeRealtime();
  unsubscribeRealtime = null;
});
</script>

<style scoped>
.analytics-carousel {
  max-width: 1060px;
  margin: 0 auto;
}

.carousel-viewport {
  position: relative;
  padding: 0 44px;
}

.analytics-carousel :deep(.analytics-chart) {
  gap: 0;
}

.analytics-carousel :deep(.chart-card) {
  padding: var(--space-5) var(--space-6);
  border-radius: var(--radius-xl);
}

.analytics-carousel :deep(.chart-svg) {
  max-height: 340px;
}

.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-white);
  color: var(--color-text-secondary);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.1);
  transition: color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.carousel-arrow:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.carousel-arrow-prev {
  left: 0;
}

.carousel-arrow-next {
  right: 0;
}

.carousel-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.carousel-dot {
  border: 1px solid var(--color-border);
  background: var(--color-white);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.carousel-dot:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.carousel-dot.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.carousel-slide-enter-active,
.carousel-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.carousel-slide-enter-from {
  opacity: 0;
  transform: translateX(18px);
}

.carousel-slide-leave-to {
  opacity: 0;
  transform: translateX(-18px);
}

@media (max-width: 767px) {
  .analytics-carousel {
    max-width: none;
  }
  .carousel-viewport {
    padding: 0 34px;
  }
  .analytics-carousel :deep(.chart-card) {
    padding: var(--space-4);
  }
  .carousel-arrow {
    width: 30px;
    height: 30px;
    font-size: 20px;
  }
  .carousel-dot {
    padding: 5px 11px;
  }
}
</style>
