<template>
  <div class="analytics-chart">
    <article v-for="serie in series" :key="serie.key" class="chart-card">
      <header class="chart-head">
        <div>
          <h3 class="chart-title">{{ serie.titulo }}</h3>
          <p class="field-hint">{{ serie.descripcion }}</p>
        </div>
        <strong class="chart-total">{{ formatearTotal(serie) }}</strong>
      </header>

      <svg
        class="chart-svg"
        viewBox="0 0 640 220"
        role="img"
        :aria-label="`Evolución de ${serie.titulo}`"
      >
        <g class="chart-grid">
          <line
            v-for="linea in lineasGuia(serie)"
            :key="`${serie.key}-grid-${linea.posicion}`"
            :x1="padding.left"
            :x2="ancho - padding.right"
            :y1="linea.y"
            :y2="linea.y"
          />
        </g>

        <g class="chart-axis-labels">
          <text
            v-for="linea in lineasGuia(serie)"
            :key="`${serie.key}-label-${linea.posicion}`"
            :x="padding.left - 8"
            :y="linea.y + 4"
            text-anchor="end"
          >
            {{ formatearEje(linea.valor, serie.tipo) }}
          </text>
        </g>

        <polygon
          v-if="puntos(serie).length > 1"
          :points="areaPoligono(serie)"
          :fill="serie.color"
          fill-opacity="0.1"
        />

        <polyline
          v-if="puntos(serie).length > 1"
          :points="polilinea(serie)"
          fill="none"
          :stroke="serie.color"
          stroke-width="2.5"
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <g>
          <circle
            v-for="(punto, indice) in puntos(serie)"
            :key="`${serie.key}-punto-${indice}`"
            :cx="punto.x"
            :cy="punto.y"
            r="3"
            :fill="serie.color"
          >
            <title>{{ punto.etiqueta }}: {{ formatearTotal({ ...serie, total: punto.valor }) }}</title>
          </circle>
        </g>

        <g class="chart-axis-labels">
          <text
            v-for="(etiqueta, indice) in etiquetasVisibles"
            :key="`${serie.key}-x-${indice}`"
            :x="posicionEtiqueta(indice, serie)"
            :y="alto - 8"
            text-anchor="middle"
          >
            {{ etiqueta }}
          </text>
        </g>
      </svg>
    </article>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatPrice } from '../utils/format';

const props = defineProps({
  labels: { type: Array, default: () => [] },
  series: { type: Array, default: () => [] },
});

const ancho = 640;
const alto = 220;
const padding = { top: 18, right: 16, bottom: 32, left: 64 };

const etiquetasVisibles = computed(() => {
  const total = props.labels.length;
  if (total === 0) return [];
  const paso = total > 12 ? Math.ceil(total / 8) : 1;
  return props.labels.filter(
    (_, indice) => indice % paso === 0 || indice === total - 1
  );
});

function valorMaximo(serie) {
  const valores = (serie.valores || []).map((valor) => Number(valor) || 0);
  return Math.max(1, ...valores);
}

function lineasGuia(serie) {
  const maximo = valorMaximo(serie);
  const alturaUtil = alto - padding.top - padding.bottom;
  return [0, 0.25, 0.5, 0.75, 1].map((factor) => ({
    posicion: factor,
    valor: maximo * factor,
    y: padding.top + alturaUtil * (1 - factor),
  }));
}

function puntos(serie) {
  const valores = serie.valores || [];
  const maximo = valorMaximo(serie);
  const anchoUtil = ancho - padding.left - padding.right;
  const alturaUtil = alto - padding.top - padding.bottom;
  const total = Math.max(valores.length, 1);
  const paso = total > 1 ? anchoUtil / (total - 1) : 0;

  return valores.map((valor, indice) => {
    const numero = Number(valor) || 0;
    return {
      x: padding.left + (total > 1 ? paso * indice : anchoUtil / 2),
      y: padding.top + alturaUtil - (numero / maximo) * alturaUtil,
      valor: numero,
      etiqueta: props.labels[indice] ?? '',
    };
  });
}

function polilinea(serie) {
  return puntos(serie)
    .map((punto) => `${punto.x},${punto.y}`)
    .join(' ');
}

function areaPoligono(serie) {
  const lista = puntos(serie);
  if (lista.length === 0) return '';
  const base = alto - padding.bottom;
  return [
    `${lista[0].x},${base}`,
    ...lista.map((punto) => `${punto.x},${punto.y}`),
    `${lista[lista.length - 1].x},${base}`,
  ].join(' ');
}

function posicionEtiqueta(indice, serie) {
  const lista = puntos(serie);
  const total = lista.length;
  if (total === 0) return padding.left;
  const paso = total > 12 ? Math.ceil(total / 8) : 1;
  const indiceReal = Math.min(indice * paso, total - 1);
  return lista[indiceReal]?.x ?? padding.left;
}

function formatearEje(valor, tipo) {
  const numero = Number(valor) || 0;
  const prefijo = tipo === 'moneda' ? 'Bs. ' : '';
  if (numero >= 1000) {
    return `${prefijo}${(numero / 1000).toFixed(numero >= 10000 ? 0 : 1)}k`;
  }
  return `${prefijo}${numero.toLocaleString('es-BO', { maximumFractionDigits: 2 })}`;
}

function formatearTotal(serie) {
  if (serie.tipo === 'moneda') return formatPrice(serie.total);
  return Number(serie.total || 0).toLocaleString('es-BO');
}
</script>
