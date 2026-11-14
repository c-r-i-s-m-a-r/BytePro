<template>
  <div class="container">
    <div class="breadcrumbs">
      <RouterLink to="/">Inicio</RouterLink>
      <span>/</span>
      <RouterLink to="/carrito">Carrito</RouterLink>
      <span>/</span>
      <span>Checkout</span>
    </div>

    <div v-if="checkout.aprobado" class="checkout-success">
      <span class="success-badge">Pago confirmado</span>
      <h1 class="page-title mt-4">Gracias por tu compra</h1>
      <p class="page-subtitle">
        Pedido #{{ checkout.result.venta.id }} · Recibo {{ checkout.result.recibo.numero }}
      </p>

      <div class="summary-card checkout-success-card mt-6">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>{{ formatPrice(checkout.result.checkout.subtotal) }}</span>
        </div>
        <div
          v-if="Number(checkout.result.checkout.descuentoRetiro) > 0"
          class="summary-row discount-row"
        >
          <span>
            Descuento retiro en tienda (-{{
              Number(checkout.result.checkout.descuentoPorcentaje)
            }}%)
          </span>
          <span>-{{ formatPrice(checkout.result.checkout.descuentoRetiro) }}</span>
        </div>
        <div class="summary-row">
          <span>Impuestos</span>
          <span>{{ formatPrice(checkout.result.checkout.impuestos) }}</span>
        </div>
        <div class="summary-row total">
          <span>Total pagado</span>
          <span>{{ formatPrice(checkout.result.checkout.total) }}</span>
        </div>
        <div class="summary-row">
          <span>Método de pago</span>
          <span>{{ metodoLabel(checkout.result.transaccion.metodo) }}</span>
        </div>
        <div class="summary-row">
          <span>Código de transacción</span>
          <span>{{ checkout.result.transaccion.codigoTransaccion }}</span>
        </div>
        <div v-if="checkout.result.despacho?.codigoSeguimiento" class="summary-row">
          <span>Guía de seguimiento</span>
          <span class="font-semibold">{{ checkout.result.despacho.codigoSeguimiento }}</span>
        </div>
        <div class="summary-row">
          <span>Estado logístico</span>
          <span>
            {{
              checkout.result.despacho ? checkout.result.despacho.estado : 'PEDIDO_CONFIRMADO'
            }}
          </span>
        </div>
      </div>

      <div class="alert alert-success mt-4">
        Se envió una copia del recibo a {{ emailDestino }}. El área de distribución fue
        notificada para preparar tu pedido.
      </div>

      <div class="success-actions mt-6">
        <RouterLink
          v-if="checkout.result.despacho?.codigoSeguimiento"
          class="btn btn-primary"
          :to="{
            name: 'tracking',
            params: { codigo: checkout.result.despacho.codigoSeguimiento },
          }"
        >
          Seguimiento de envío
        </RouterLink>
        <RouterLink
          class="btn btn-secondary"
          :to="{ name: 'receipt', params: { ventaId: checkout.result.venta.id } }"
        >
          Ver recibo digital
        </RouterLink>
        <RouterLink class="btn btn-tertiary" to="/mis-pedidos">
          Ir a Mis Pedidos
        </RouterLink>
        <button class="btn btn-tertiary" type="button" @click="nuevaCompra">
          Seguir comprando
        </button>
      </div>
    </div>

    <template v-else>
      <div class="flex-between mb-6">
        <div>
          <h1 class="page-title">Checkout seguro</h1>
          <p class="page-subtitle">
            Selecciona tu dirección de entrega, elige tu método de pago y confirma la compra.
          </p>
        </div>
        <span class="badge">Compra protegida</span>
      </div>

      <div v-if="checkout.loading && !checkout.session" class="state-message">
        <h3>Preparando tu checkout…</h3>
        <p>Estamos reservando el stock de los productos de tu carrito.</p>
      </div>

      <div v-else-if="checkout.error && !checkout.session" class="state-message">
        <h3>No se pudo iniciar el checkout</h3>
        <p>{{ checkout.error }}</p>
        <button class="btn btn-primary" type="button" @click="reintentarSesion">
          Reintentar
        </button>
      </div>

      <div v-else-if="!checkout.items.length" class="state-message">
        <h3>Tu carrito está vacío</h3>
        <p>Agrega productos antes de continuar con el pago.</p>
        <RouterLink class="btn btn-primary" :to="{ name: 'catalog' }">
          Explorar catálogo
        </RouterLink>
      </div>

      <div v-else class="checkout-layout">
        <section class="checkout-panel">
          <h2 class="section-title">1. Método de entrega</h2>

          <div class="payment-methods mb-4">
            <button
              type="button"
              class="payment-option"
              :class="{ active: metodoEntrega === 'domicilio' }"
              @click="seleccionarMetodoEntrega('domicilio')"
            >
              <span class="payment-option-title">Envío a domicilio</span>
              <span class="payment-option-desc">
                Entrega en tu dirección registrada dentro del área de cobertura.
              </span>
            </button>
            <button
              type="button"
              class="payment-option"
              :class="{ active: metodoEntrega === 'retiro' }"
              @click="seleccionarMetodoEntrega('retiro')"
            >
              <span class="payment-option-title">Retiro en tienda física</span>
              <span class="payment-option-desc">
                Retira en una sucursal BytePro y obtén
                {{ configuracionRetiro.descuentoRetiroAlto }}% de descuento en compras de
                {{ formatPrice(configuracionRetiro.umbralDescuentoRetiro) }} o más, o
                {{ configuracionRetiro.descuentoRetiroBajo }}% en compras menores.
              </span>
            </button>
          </div>

          <div v-if="metodoEntrega === 'retiro'" class="mb-6">
            <p class="field-hint mb-2">Selecciona la sucursal donde retirarás tu pedido:</p>
            <div v-if="sucursales.length" class="address-grid mb-3">
              <label
                v-for="sucursal in sucursales"
                :key="sucursal.id"
                class="address-card selectable-card"
                :class="{ active: sucursalSeleccionadaId === sucursal.id }"
                @click="seleccionarSucursal(sucursal.id)"
              >
                <div class="flex-between mb-1">
                  <span class="badge">{{ sucursal.ciudad }}</span>
                  <input
                    type="radio"
                    name="pickup-branch"
                    :value="sucursal.id"
                    :checked="sucursalSeleccionadaId === sucursal.id"
                    @change="seleccionarSucursal(sucursal.id)"
                  />
                </div>
                <div class="font-semibold">{{ sucursal.nombre }}</div>
                <div>{{ sucursal.direccion }}</div>
                <div class="field-hint">
                  {{ sucursal.telefono }} · {{ sucursal.horarios }}
                </div>
              </label>
            </div>
            <div v-else class="alert alert-danger">
              No hay sucursales activas disponibles para retiro. Elige envío a domicilio.
            </div>
            <p v-if="errors.sucursalId" class="field-error">{{ errors.sucursalId }}</p>

            <div class="field mt-3">
              <label for="pickup-notes">Notas para el retiro (opcional)</label>
              <input
                id="pickup-notes"
                v-model="notasRetiro"
                class="input"
                placeholder="Nombre de quien retira, horario preferido…"
              />
            </div>
          </div>

          <template v-else>
            <div v-if="direccionesGuardadas.length" class="mb-4">
              <p class="field-hint mb-2">
                Selecciona una de tus direcciones guardadas con un solo clic o ingresa una nueva:
              </p>
              <div class="address-grid mb-3">
                <label
                  v-for="dir in direccionesGuardadas"
                  :key="dir.id"
                  class="address-card selectable-card"
                  :class="{ active: direccionSeleccionadaId === dir.id }"
                  @click="seleccionarDireccionGuardada(dir)"
                >
                  <div class="flex-between mb-1">
                    <span class="badge">{{ dir.etiqueta }}</span>
                    <input
                      type="radio"
                      name="saved-address"
                      :value="dir.id"
                      :checked="direccionSeleccionadaId === dir.id"
                      @change="seleccionarDireccionGuardada(dir)"
                    />
                  </div>
                  <div class="font-semibold">{{ dir.nombreDestinatario }}</div>
                  <div>{{ dir.calle }}</div>
                  <div class="field-hint">{{ dir.ciudad }} · {{ dir.telefono }}</div>
                </label>
              </div>
            </div>

            <div class="card-grid mb-4">
              <div class="field">
                <label for="shipping-name">Nombre del destinatario</label>
                <input
                  id="shipping-name"
                  v-model="entrega.nombreDestinatario"
                  class="input"
                  :class="{ 'has-error': errors.nombreDestinatario }"
                  placeholder="Nombre completo de quien recibe"
                />
                <p v-if="errors.nombreDestinatario" class="field-error">
                  {{ errors.nombreDestinatario }}
                </p>
              </div>

              <div class="field">
                <label for="shipping-phone">Teléfono de contacto</label>
                <input
                  id="shipping-phone"
                  v-model="entrega.telefono"
                  class="input"
                  :class="{ 'has-error': errors.telefono }"
                  placeholder="70000000"
                />
                <p v-if="errors.telefono" class="field-error">{{ errors.telefono }}</p>
              </div>

              <div class="field">
                <label for="shipping-address">Dirección exacta</label>
                <input
                  id="shipping-address"
                  v-model="entrega.direccion"
                  class="input"
                  :class="{ 'has-error': errors.direccion }"
                  placeholder="Av. Principal #123, Zona Central"
                />
                <p v-if="errors.direccion" class="field-error">{{ errors.direccion }}</p>
              </div>

              <div class="field">
                <label for="shipping-city">Ciudad (área de cobertura)</label>
                <select
                  id="shipping-city"
                  v-model="entrega.ciudad"
                  class="select"
                  :class="{ 'has-error': errors.ciudad }"
                >
                  <option v-for="c in checkout.ciudadesCobertura" :key="c" :value="c">
                    {{ c }}
                  </option>
                </select>
                <p v-if="errors.ciudad" class="field-error">{{ errors.ciudad }}</p>
              </div>
            </div>

            <div class="field mb-4">
              <label for="shipping-notes">Notas especiales de entrega (opcional)</label>
              <input
                id="shipping-notes"
                v-model="entrega.notas"
                class="input"
                placeholder="Referencias del domicilio, horario preferido…"
              />
            </div>

            <div class="flex-between mb-6">
              <div class="field-inline">
                <input
                  id="save-address-check"
                  v-model="guardarEnLibreta"
                  type="checkbox"
                />
                <label for="save-address-check">
                  Guardar esta dirección en mi libreta de direcciones
                </label>
              </div>
              <input
                v-if="guardarEnLibreta"
                v-model="entrega.etiqueta"
                class="input input-inline"
                placeholder="Etiqueta (Casa, Oficina)"
              />
            </div>
          </template>

          <h2 class="section-title">2. Método de pago</h2>

          <div class="payment-methods">
            <button
              v-for="metodo in checkout.metodosPago"
              :key="metodo.id"
              type="button"
              class="payment-option"
              :class="{ active: metodoSeleccionado === metodo.id }"
              @click="seleccionarMetodo(metodo.id)"
            >
              <span class="payment-option-title">{{ metodo.nombre }}</span>
              <span class="payment-option-desc">{{ metodo.descripcion }}</span>
            </button>
          </div>

          <div v-if="checkout.error" class="alert alert-danger mb-4">
            {{ checkout.error }}
          </div>

          <form @submit.prevent="pagar">
            <template v-if="metodoSeleccionado === 'tarjeta'">
              <div class="field">
                <label for="card-number">Número de tarjeta</label>
                <input
                  id="card-number"
                  :value="form.numero"
                  class="input"
                  :class="{ 'has-error': errors.numero }"
                  inputmode="numeric"
                  autocomplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  @input="onNumeroInput"
                />
                <p v-if="errors.numero" class="field-error">{{ errors.numero }}</p>
              </div>

              <div class="field">
                <label for="card-name">Titular de la tarjeta</label>
                <input
                  id="card-name"
                  v-model="form.titular"
                  class="input"
                  :class="{ 'has-error': errors.titular }"
                  autocomplete="cc-name"
                  placeholder="Nombre como aparece en la tarjeta"
                />
                <p v-if="errors.titular" class="field-error">{{ errors.titular }}</p>
              </div>

              <div class="card-grid">
                <div class="field">
                  <label for="card-month">Expiración</label>
                  <div class="expiry-row">
                    <input
                      id="card-month"
                      v-model="form.mes"
                      class="input"
                      :class="{ 'has-error': errors.expira }"
                      inputmode="numeric"
                      maxlength="2"
                      placeholder="MM"
                      autocomplete="cc-exp-month"
                    />
                    <span>/</span>
                    <input
                      v-model="form.anio"
                      class="input"
                      :class="{ 'has-error': errors.expira }"
                      inputmode="numeric"
                      maxlength="4"
                      placeholder="AA"
                      autocomplete="cc-exp-year"
                    />
                  </div>
                  <p v-if="errors.expira" class="field-error">{{ errors.expira }}</p>
                </div>

                <div class="field">
                  <label for="card-cvv">CVV</label>
                  <input
                    id="card-cvv"
                    v-model="form.cvv"
                    class="input"
                    :class="{ 'has-error': errors.cvv }"
                    inputmode="numeric"
                    maxlength="4"
                    autocomplete="cc-csc"
                    placeholder="123"
                  />
                  <p v-if="errors.cvv" class="field-error">{{ errors.cvv }}</p>
                </div>
              </div>

              <p class="field-hint">
                Nunca almacenamos el número completo ni el CVV.
              </p>
            </template>

            <template v-else-if="metodoSeleccionado === 'transferencia'">
              <div class="qr-box">
                <span>QR de pago</span>
                <small>Simulado para el entorno de laboratorio</small>
              </div>
              <p class="field-hint text-center mb-4">
                Escanea el QR con tu aplicación bancaria o usa los datos de la cuenta y
                registra la referencia del comprobante.
              </p>
              <div class="field">
                <label for="transfer-ref">Referencia o número de comprobante</label>
                <input
                  id="transfer-ref"
                  v-model="form.referenciaComprobante"
                  class="input"
                  :class="{ 'has-error': errors.referenciaComprobante }"
                  placeholder="Ej. TRF-2026-000123"
                />
                <p v-if="errors.referenciaComprobante" class="field-error">
                  {{ errors.referenciaComprobante }}
                </p>
              </div>
            </template>

            <template v-else>
              <div class="payment-providers">
                <button
                  type="button"
                  class="provider-option"
                  :class="{ active: form.proveedor === 'stripe' }"
                  @click="form.proveedor = 'stripe'"
                >
                  Stripe sandbox
                </button>
                <button
                  type="button"
                  class="provider-option"
                  :class="{ active: form.proveedor === 'paypal' }"
                  @click="form.proveedor = 'paypal'"
                >
                  PayPal sandbox
                </button>
              </div>
              <p class="field-hint">
                La pasarela simulada autoriza el cobro y entrega un token antes de confirmar
                la transacción.
              </p>
            </template>

            <div class="sandbox-panel mt-4">
              <div class="field">
                <label for="sandbox-sim">Entorno sandbox: simular resultado</label>
                <select id="sandbox-sim" v-model="simulacion" class="select">
                  <option value="aprobado">Pago aprobado</option>
                  <option value="fondos">Rechazo: fondos insuficientes</option>
                  <option value="fraude">Rechazo: sospecha de fraude</option>
                  <option value="red">Rechazo: error de red</option>
                  <option value="discrepancia">Discrepancia de monto (auditoría crítica)</option>
                </select>
                <p class="field-hint">
                  Pasarela simulada. El selector permite validar los flujos de rechazo y de
                  conciliación manual.
                </p>
              </div>
            </div>

            <button
              class="btn btn-primary btn-block mt-4"
              type="submit"
              :disabled="checkout.processing || enviando"
            >
              <span v-if="checkout.processing || enviando" class="processing-note">
                <span class="spinner" aria-hidden="true"></span>
                Procesando pago seguro…
              </span>
              <span v-else>Pagar {{ formatPrice(totales.total) }}</span>
            </button>

            <p class="field-hint mt-2">
              Al confirmar el pago aceptas los términos de compra de BytePro. La reserva de
              stock es temporal (10 minutos).
            </p>
          </form>
        </section>

        <aside class="summary-card">
          <h2 class="section-title">Resumen del pedido</h2>

          <div v-for="item in checkout.items" :key="item.varianteId" class="checkout-line">
            <span>{{ item.cantidad }} × {{ item.nombreProducto }}</span>
            <span>{{ formatPrice(item.subtotal) }}</span>
          </div>

          <div class="summary-row">
            <span>Subtotal</span>
            <span>{{ formatPrice(totales.subtotal) }}</span>
          </div>
          <div v-if="Number(totales.descuentoRetiro) > 0" class="summary-row discount-row">
            <span>Descuento retiro en tienda (-{{ Number(totales.descuentoPorcentaje) }}%)</span>
            <span>-{{ formatPrice(totales.descuentoRetiro) }}</span>
          </div>
          <div class="summary-row">
            <span>Impuestos {{ tasaLabel }}</span>
            <span>{{ formatPrice(totales.impuestos) }}</span>
          </div>
          <div class="summary-row total">
            <span>Total</span>
            <span>{{ formatPrice(totales.total) }}</span>
          </div>

          <div class="lock-note mt-4">
            <strong>Reserva temporal de stock</strong>
            <p class="field-hint">
              Tus productos están reservados por {{ restanteTexto }}. Si el tiempo expira,
              deberás iniciar el checkout nuevamente.
            </p>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import api from '../services/api';
import { subscribeToTables } from '../services/realtime';
import { useAuthStore } from '../store/auth';
import { useCartStore } from '../store/cart';
import { useCheckoutStore } from '../store/checkout';
import { useUiStore } from '../store/ui';
import { formatPrice } from '../utils/format';
import {
  formatCardNumber,
  generatePaymentToken,
  luhnCheck,
  tokenizeCard,
  validateCvv,
  validateExpiry,
} from '../utils/card';

const auth = useAuthStore();
const checkout = useCheckoutStore();
const cart = useCartStore();
const ui = useUiStore();
const router = useRouter();

const metodoSeleccionado = ref('tarjeta');
const simulacion = ref('aprobado');
const direccionSeleccionadaId = ref(null);
const guardarEnLibreta = ref(false);
const direccionesLista = ref([]);
const metodoEntrega = ref('domicilio');
const sucursalSeleccionadaId = ref(null);
const notasRetiro = ref('');
const entregaTocada = ref(false);

const entrega = reactive({
  etiqueta: 'Casa',
  nombreDestinatario: auth.user?.nombre || '',
  direccion: '',
  ciudad: 'La Paz',
  telefono: '',
  notas: '',
});

const form = reactive({
  numero: '',
  titular: '',
  mes: '',
  anio: '',
  cvv: '',
  referenciaComprobante: '',
  proveedor: 'stripe',
});
const errors = reactive({});
const restante = ref(0);
const enviando = ref(false);
let timer = null;
let unsubscribeRealtime = null;

const direccionesGuardadas = computed(() =>
  direccionesLista.value.length ? direccionesLista.value : checkout.direccionesGuardadas
);

const sucursales = computed(() => checkout.sucursales || []);

const configuracionRetiro = computed(() => checkout.configuracionRetiro);

const totales = computed(
  () =>
    checkout.totales || {
      subtotal: 0,
      descuentoRetiro: 0,
      descuentoPorcentaje: 0,
      baseImponible: 0,
      impuestos: 0,
      total: 0,
      moneda: 'BOB',
    }
);

const tasaLabel = computed(() => {
  const base = Number(totales.value.baseImponible || totales.value.subtotal) || 0;
  const impuestos = Number(totales.value.impuestos) || 0;
  if (!base) return '';
  return `${Math.round((impuestos / base) * 100)}%`;
});

const restanteTexto = computed(() => {
  const minutos = Math.floor(restante.value / 60);
  const segundos = String(restante.value % 60).padStart(2, '0');
  return `${minutos}:${segundos}`;
});

const emailDestino = computed(() => {
  if (!checkout.result) return '';
  return (
    (checkout.result.email && checkout.result.email.destino) ||
    (checkout.result.recibo && checkout.result.recibo.clienteEmail) ||
    'tu correo registrado'
  );
});

function metodoLabel(metodo) {
  const labels = {
    tarjeta: 'Tarjeta de crédito o débito',
    transferencia: 'Transferencia bancaria',
    pasarela: 'Pasarela digital',
  };
  return labels[metodo] || metodo;
}

function limpiarErrores() {
  Object.keys(errors).forEach((key) => delete errors[key]);
}

function seleccionarDireccionGuardada(dir) {
  if (!dir) return;
  direccionSeleccionadaId.value = dir.id;
  entrega.etiqueta = dir.etiqueta || 'Casa';
  entrega.nombreDestinatario = dir.nombreDestinatario || '';
  entrega.direccion = dir.calle || dir.direccion || '';
  entrega.ciudad = dir.ciudad || 'La Paz';
  entrega.telefono = dir.telefono || '';
  entrega.notas = dir.referencias || dir.notas || '';
}

function direccionEntregaValida() {
  return (
    entrega.nombreDestinatario.trim().length >= 2 &&
    entrega.direccion.trim().length >= 4 &&
    Boolean(entrega.ciudad.trim()) &&
    entrega.telefono.trim().length >= 5
  );
}

async function aplicarEntrega() {
  if (!checkout.session) return null;
  const payload = {
    metodoEntrega: metodoEntrega.value,
    sucursalId: metodoEntrega.value === 'retiro' ? sucursalSeleccionadaId.value : null,
  };
  if (metodoEntrega.value === 'retiro') {
    payload.notas = notasRetiro.value.trim() || null;
  }
  if (metodoEntrega.value === 'domicilio' && direccionEntregaValida()) {
    payload.direccionEntrega = construirDireccionEntrega();
  }
  try {
    return await checkout.actualizarEntrega(payload);
  } catch (err) {
    // El store conserva el mensaje de error para mostrarlo en pantalla.
    return null;
  }
}

async function seleccionarMetodoEntrega(metodo) {
  if (metodoEntrega.value === metodo) return;
  if (metodo === 'retiro' && !sucursales.value.length) {
    ui.warning('No hay sucursales activas disponibles para retiro en tienda.');
    return;
  }
  entregaTocada.value = true;
  metodoEntrega.value = metodo;
  limpiarErrores();

  if (metodo === 'retiro') {
    if (!sucursalSeleccionadaId.value && sucursales.value.length) {
      sucursalSeleccionadaId.value = sucursales.value[0].id;
    }
  } else {
    sucursalSeleccionadaId.value = null;
  }

  await aplicarEntrega();
}

async function seleccionarSucursal(id) {
  if (sucursalSeleccionadaId.value === id) return;
  entregaTocada.value = true;
  sucursalSeleccionadaId.value = id;
  limpiarErrores();
  if (metodoEntrega.value === 'retiro') {
    await aplicarEntrega();
  }
}

function onNumeroInput(event) {
  form.numero = formatCardNumber(event.target.value);
}

function seleccionarMetodo(id) {
  metodoSeleccionado.value = id;
  limpiarErrores();
  checkout.error = null;
  checkout.errorDetails = null;
}

function validarFormulario() {
  limpiarErrores();

  if (metodoEntrega.value === 'retiro') {
    if (!sucursalSeleccionadaId.value) {
      errors.sucursalId = 'Selecciona una sucursal activa para retirar tu pedido.';
    }
  } else {
    if (!entrega.nombreDestinatario.trim() || entrega.nombreDestinatario.trim().length < 2) {
      errors.nombreDestinatario = 'Ingresa el nombre del destinatario.';
    }
    if (!entrega.direccion.trim() || entrega.direccion.trim().length < 4) {
      errors.direccion = 'Ingresa la dirección exacta de entrega.';
    }
    if (!entrega.ciudad.trim()) {
      errors.ciudad = 'Selecciona una ciudad de cobertura.';
    }
    if (!entrega.telefono.trim() || entrega.telefono.trim().length < 5) {
      errors.telefono = 'Ingresa un teléfono de contacto válido.';
    }
  }

  if (metodoSeleccionado.value === 'tarjeta') {
    if (!luhnCheck(form.numero)) {
      errors.numero = 'Número de tarjeta inválido. Revisa el dígito verificador.';
    }
    if (!form.titular.trim() || form.titular.trim().length < 3) {
      errors.titular = 'Ingresa el nombre del titular de la tarjeta.';
    }
    if (!validateExpiry(form.mes, form.anio)) {
      errors.expira = 'Fecha de expiración inválida.';
    }
    if (!validateCvv(form.cvv)) {
      errors.cvv = 'CVV inválido. Debe tener 3 o 4 dígitos.';
    }
  } else if (metodoSeleccionado.value === 'transferencia') {
    if (form.referenciaComprobante.trim().length < 4) {
      errors.referenciaComprobante =
        'Ingresa la referencia del comprobante (mínimo 4 caracteres).';
    }
  }

  return Object.keys(errors).length === 0;
}

function construirDatosPago() {
  if (metodoSeleccionado.value === 'tarjeta') {
    return { ...tokenizeCard(form), simulacion: simulacion.value };
  }
  if (metodoSeleccionado.value === 'transferencia') {
    return {
      referenciaComprobante: form.referenciaComprobante.trim(),
      simulacion: simulacion.value,
    };
  }
  return {
    tokenPasarela: generatePaymentToken(form.proveedor === 'paypal' ? 'sb' : 'tok'),
    proveedor: form.proveedor,
    simulacion: simulacion.value,
  };
}

function construirDireccionEntrega() {
  return {
    nombreDestinatario: entrega.nombreDestinatario.trim(),
    direccion: entrega.direccion.trim(),
    ciudad: entrega.ciudad.trim(),
    telefono: entrega.telefono.trim(),
    notas: entrega.notas.trim() || null,
  };
}

async function pagar() {
  if (enviando.value || checkout.processing) return;
  if (!validarFormulario()) return;

  const confirmed = await ui.confirm({
    title: 'Confirmar pago de orden',
    message: `¿Confirmas realizar el pago por un total de ${formatPrice(totales.value.total)} mediante ${metodoLabel(metodoSeleccionado.value)}?`,
    confirmText: 'Confirmar y pagar',
    cancelText: 'Cancelar / Volver',
    variant: 'primary',
  });
  if (!confirmed) return;

  enviando.value = true;
  try {
    const esRetiro = metodoEntrega.value === 'retiro';
    const direccionEntrega = esRetiro ? null : construirDireccionEntrega();
    if (!esRetiro && guardarEnLibreta.value) {
      try {
        const { data: nueva } = await api.post('/clientes/direcciones', {
          etiqueta: entrega.etiqueta || 'Casa',
          nombreDestinatario: direccionEntrega.nombreDestinatario,
          calle: direccionEntrega.direccion,
          ciudad: direccionEntrega.ciudad,
          telefono: direccionEntrega.telefono,
          referencias: direccionEntrega.notas,
          predeterminada: true,
        });
        direccionesLista.value = [nueva, ...direccionesLista.value];
        guardarEnLibreta.value = false;
      } catch (err) {
        // La validación principal se realiza también en el checkout/pago.
      }
    }

    await checkout.crearSesion({
      direccionEntrega: direccionEntrega || undefined,
      metodoEntrega: metodoEntrega.value,
      sucursalId: esRetiro ? sucursalSeleccionadaId.value : undefined,
      notas: esRetiro ? notasRetiro.value.trim() || undefined : undefined,
    });
    await checkout.pagar({
      metodo: metodoSeleccionado.value,
      datosPago: construirDatosPago(),
      direccionEntrega: direccionEntrega || undefined,
      metodoEntrega: metodoEntrega.value,
      sucursalId: esRetiro ? sucursalSeleccionadaId.value : undefined,
    });
  } catch (err) {
    // El store conserva el mensaje de error para mostrarlo en pantalla.
  } finally {
    enviando.value = false;
  }
}

async function reintentarSesion() {
  try {
    const esRetiro = metodoEntrega.value === 'retiro';
    await checkout.crearSesion({
      metodoEntrega: metodoEntrega.value,
      sucursalId: esRetiro ? sucursalSeleccionadaId.value : undefined,
      notas: esRetiro ? notasRetiro.value.trim() || undefined : undefined,
      direccionEntrega:
        !esRetiro && direccionEntregaValida() ? construirDireccionEntrega() : undefined,
    });
  } catch (err) {
    // El store conserva el mensaje de error.
  }
}

async function refrescarCheckoutEnVivo() {
  if (!checkout.session) return;

  const esRetiro = metodoEntrega.value === 'retiro';
  const payload = {
    metodoEntrega: metodoEntrega.value,
    sucursalId: esRetiro ? sucursalSeleccionadaId.value : null,
    notas: esRetiro ? notasRetiro.value.trim() || null : null,
  };

  if (!esRetiro && direccionEntregaValida()) {
    payload.direccionEntrega = construirDireccionEntrega();
  }

  try {
    await checkout.refrescarSesionSilenciosa(payload);
  } catch (err) {
    try {
      const { data } = await api.get('/cobros/sucursales');
      const disponibles = data.items || [];
      if (checkout.session) {
        checkout.session = { ...checkout.session, sucursales: disponibles };
      }
      if (
        esRetiro &&
        !disponibles.some((sucursal) => sucursal.id === sucursalSeleccionadaId.value)
      ) {
        sucursalSeleccionadaId.value = disponibles.length ? disponibles[0].id : null;
      }
    } catch (error) {
      // El refresco silencioso no interrumpe el formulario de pago.
    }
  }
}

function iniciarContador(segundos) {
  restante.value = Math.max(0, Number(segundos) || 0);
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    if (restante.value > 0) {
      restante.value -= 1;
    } else {
      clearInterval(timer);
      timer = null;
    }
  }, 1000);
}

watch(
  () => checkout.session,
  (session) => {
    if (session) {
      iniciarContador(session.segundosRestantes);

      if (!entregaTocada.value) {
        metodoEntrega.value = session.metodoEntrega || 'domicilio';
        sucursalSeleccionadaId.value = session.sucursal
          ? session.sucursal.id
          : metodoEntrega.value === 'retiro' && sucursales.value.length
            ? sucursales.value[0].id
            : null;
      }

      if (
        metodoEntrega.value === 'domicilio' &&
        !entrega.direccion &&
        session.datosEntrega &&
        session.datosEntrega.direccion
      ) {
        entrega.nombreDestinatario =
          session.datosEntrega.nombreDestinatario || auth.user?.nombre || '';
        entrega.direccion = session.datosEntrega.direccion || '';
        entrega.ciudad = session.datosEntrega.ciudad || 'La Paz';
        entrega.telefono = session.datosEntrega.telefono || '';
        entrega.notas = session.datosEntrega.notas || '';
      }
    }
  }
);

function nuevaCompra() {
  checkout.limpiar();
  router.push({ name: 'catalog' });
}

onMounted(async () => {
  unsubscribeRealtime = subscribeToTables(
    [
      'sucursales',
      'configuraciones_empresa',
      'configuracion_empresa',
      'productos',
      'variantes',
      'inventarios',
    ],
    refrescarCheckoutEnVivo
  );

  await cart.fetch();

  try {
    const { data } = await api.get('/clientes/direcciones');
    direccionesLista.value = data.items || [];
    if (direccionesLista.value.length) {
      seleccionarDireccionGuardada(direccionesLista.value[0]);
    }
  } catch (err) {
    // sin acción
  }

  if (checkout.result) {
    if (!cart.items.length) return;
    checkout.limpiar();
  }

  if (!cart.items.length) return;

  try {
    await checkout.crearSesion();
    if (entregaTocada.value) {
      await aplicarEntrega();
    }
  } catch (err) {
    // El store conserva el mensaje de error.
  }
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (unsubscribeRealtime) unsubscribeRealtime();
  unsubscribeRealtime = null;
});
</script>
