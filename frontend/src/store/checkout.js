import { defineStore } from 'pinia';
import api, { apiErrorMessage, apiErrorDetails } from '../services/api';
import { generateIdempotencyKey } from '../utils/idempotency';
import { useCartStore } from './cart';
import { useUiStore } from './ui';

function storageKey(ventaId) {
  return `bytepro_idem_${ventaId}`;
}

function leerClave(ventaId) {
  if (!ventaId) return null;
  try {
    return sessionStorage.getItem(storageKey(ventaId));
  } catch (err) {
    return null;
  }
}

function guardarClave(ventaId, clave) {
  if (!ventaId) return;
  try {
    sessionStorage.setItem(storageKey(ventaId), clave);
  } catch (err) {
    // sessionStorage no disponible: la clave sigue en memoria.
  }
}

function borrarClave(ventaId) {
  if (!ventaId) return;
  try {
    sessionStorage.removeItem(storageKey(ventaId));
  } catch (err) {
    // sin acción
  }
}

export const useCheckoutStore = defineStore('checkout', {
  state: () => ({
    session: null,
    loading: false,
    processing: false,
    error: null,
    errorDetails: null,
    result: null,
    idempotencyKey: null,
    idempotencyVentaId: null,
  }),
  getters: {
    items: (state) => (state.session ? state.session.items : []),
    metodosPago: (state) => (state.session ? state.session.metodosPago : []),
    direccionesGuardadas: (state) =>
      state.session && Array.isArray(state.session.direccionesGuardadas)
        ? state.session.direccionesGuardadas
        : [],
    ciudadesCobertura: (state) =>
      state.session && Array.isArray(state.session.ciudadesCobertura)
        ? state.session.ciudadesCobertura
        : ['La Paz', 'El Alto', 'Cochabamba', 'Santa Cruz', 'Sucre', 'Oruro', 'Potosí', 'Tarija', 'Trinidad', 'Cobija'],
    totales: (state) =>
      state.session
        ? {
            subtotal: state.session.subtotal,
            impuestos: state.session.impuestos,
            total: state.session.total,
            moneda: state.session.moneda,
          }
        : null,
    aprobado: (state) =>
      Boolean(
        state.result &&
          state.result.transaccion &&
          state.result.transaccion.estado === 'aprobado'
      ),
  },
  actions: {
    nuevaClave(ventaId) {
      this.idempotencyKey = generateIdempotencyKey();
      this.idempotencyVentaId = ventaId || null;
      guardarClave(ventaId, this.idempotencyKey);
      return this.idempotencyKey;
    },
    async crearSesion(payload = {}) {
      this.loading = true;
      this.error = null;
      this.errorDetails = null;
      try {
        const { data } = await api.post('/cobros/checkout', payload);
        this.session = data;

        if (
          this.idempotencyKey &&
          Number(this.idempotencyVentaId) === Number(data.ventaId)
        ) {
          guardarClave(data.ventaId, this.idempotencyKey);
        } else {
          const guardada = leerClave(data.ventaId);
          if (guardada) {
            this.idempotencyKey = guardada;
            this.idempotencyVentaId = data.ventaId;
          } else {
            this.nuevaClave(data.ventaId);
          }
        }

        return data;
      } catch (err) {
        this.error = apiErrorMessage(err);
        this.errorDetails = apiErrorDetails(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async pagar({ metodo, datosPago, direccionEntrega }) {
      this.processing = true;
      this.error = null;
      this.errorDetails = null;
      this.result = null;
      const ventaId = this.session.ventaId;
      const key = this.idempotencyKey || this.nuevaClave(ventaId);

      try {
        const { data } = await api.post(
          '/cobros/pagar',
          { ventaId, metodo, datosPago, direccionEntrega },
          { headers: { 'Idempotency-Key': key } }
        );

        this.result = data;
        borrarClave(ventaId);
        this.session = null;
        this.idempotencyKey = null;
        this.idempotencyVentaId = null;
        await useCartStore().fetch();
        useUiStore().success('Pago aprobado. Recibo digital y guía de envío generados.');
        return data;
      } catch (err) {
        this.error = apiErrorMessage(err);
        this.errorDetails = apiErrorDetails(err);
        this.nuevaClave(ventaId);
        throw err;
      } finally {
        this.processing = false;
      }
    },
    async cargarVenta(ventaId) {
      const { data } = await api.get(`/cobros/ventas/${ventaId}`);
      return data;
    },
    async cargarRecibo(ventaId) {
      const { data } = await api.get(`/cobros/ventas/${ventaId}/recibo`);
      return data;
    },
    limpiar() {
      if (this.session) borrarClave(this.session.ventaId);
      this.session = null;
      this.result = null;
      this.error = null;
      this.errorDetails = null;
      this.idempotencyKey = null;
      this.idempotencyVentaId = null;
    },
  },
});
