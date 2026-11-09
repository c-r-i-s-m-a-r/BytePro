<template>
  <div class="container">
    <div class="breadcrumbs">
      <RouterLink to="/">Inicio</RouterLink>
      <span>/</span>
      <span>Recibo digital</span>
    </div>

    <div v-if="loading" class="state-message">
      <h3>Cargando recibo…</h3>
    </div>

    <div v-else-if="error" class="state-message">
      <h3>No se pudo cargar el recibo</h3>
      <p>{{ error }}</p>
      <RouterLink class="btn btn-primary" :to="{ name: 'catalog' }">
        Volver al catálogo
      </RouterLink>
    </div>

    <article v-else-if="recibo" class="receipt-card">
      <header class="receipt-header">
        <div>
          <div class="receipt-brand">BytePro</div>
          <div class="muted">Recibo digital de compra</div>
        </div>
        <div class="receipt-header-right">
          <div class="receipt-number">{{ recibo.numero }}</div>
          <div class="muted">{{ formatDate(recibo.fecha) }}</div>
        </div>
      </header>

      <section class="receipt-meta">
        <div>
          <span class="receipt-meta-label">Cliente</span>
          <div>{{ recibo.clienteNombre || 'Cliente BytePro' }}</div>
          <div class="muted">{{ recibo.clienteEmail || '—' }}</div>
        </div>
        <div>
          <span class="receipt-meta-label">Pago</span>
          <div>{{ metodoLabel(recibo.metodo) }}</div>
          <div class="muted">Transacción {{ recibo.codigoTransaccion || '—' }}</div>
        </div>
        <div>
          <span class="receipt-meta-label">Entrega</span>
          <div>
            {{ recibo.metodoEntrega === 'retiro' ? 'Retiro en tienda' : 'Envío a domicilio' }}
          </div>
          <template v-if="recibo.metodoEntrega === 'retiro' && recibo.sucursal">
            <div class="muted">{{ recibo.sucursal.nombre }}</div>
            <div class="muted">{{ recibo.sucursal.direccion }} · {{ recibo.sucursal.ciudad }}</div>
            <div class="muted">
              {{ recibo.sucursal.telefono }} · {{ recibo.sucursal.horarios }}
            </div>
          </template>
        </div>
      </section>

      <div class="table-wrap receipt-table-wrap">
        <table class="receipt-items">
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th class="text-right">Cantidad</th>
              <th class="text-right">Precio</th>
              <th class="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in recibo.items" :key="index">
              <td>
                <div>{{ item.nombreProducto }}</div>
                <div v-if="item.nombreVariante" class="muted">
                  {{ item.nombreVariante }}
                </div>
              </td>
              <td>{{ item.sku || '—' }}</td>
              <td class="text-right">{{ item.cantidad }}</td>
              <td class="text-right">{{ formatPrice(item.precioUnitario) }}</td>
              <td class="text-right">{{ formatPrice(item.subtotal) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="receipt-totals">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>{{ formatPrice(recibo.subtotal) }}</span>
        </div>
        <div v-if="Number(recibo.descuentoRetiro) > 0" class="summary-row discount-row">
          <span>Descuento retiro en tienda (-{{ Number(recibo.descuentoPorcentaje) }}%)</span>
          <span>-{{ formatPrice(recibo.descuentoRetiro) }}</span>
        </div>
        <div class="summary-row">
          <span>Impuestos</span>
          <span>{{ formatPrice(recibo.impuestos) }}</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span>{{ formatPrice(recibo.total) }}</span>
        </div>
      </div>

      <p class="field-hint mt-4">
        Se envió una copia de este recibo a
        {{ recibo.clienteEmail || 'tu correo registrado' }}. El pedido fue notificado al área
        de distribución.
      </p>

      <div class="receipt-actions mt-6">
        <button class="btn btn-primary" type="button" @click="imprimir">
          Imprimir o guardar PDF
        </button>
        <RouterLink class="btn btn-secondary" :to="{ name: 'catalog' }">
          Seguir comprando
        </RouterLink>
      </div>
    </article>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useCheckoutStore } from '../store/checkout';
import { formatDate, formatPrice } from '../utils/format';

const route = useRoute();
const checkout = useCheckoutStore();

const loading = ref(true);
const error = ref('');
const recibo = ref(null);

function metodoLabel(metodo) {
  const labels = {
    tarjeta: 'Tarjeta de crédito o débito',
    transferencia: 'Transferencia bancaria',
    pasarela: 'Pasarela digital',
  };
  return labels[metodo] || metodo || '—';
}

function imprimir() {
  window.print();
}

onMounted(async () => {
  try {
    recibo.value = await checkout.cargarRecibo(route.params.ventaId);
  } catch (err) {
    error.value =
      (err && err.response && err.response.data && err.response.data.error
        ? err.response.data.error.message
        : null) || 'No se pudo obtener el recibo solicitado.';
  } finally {
    loading.value = false;
  }
});
</script>
