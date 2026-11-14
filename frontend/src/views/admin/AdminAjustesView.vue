<template>
  <div class="admin-page">
    <div class="flex-between mb-6">
      <div>
        <h2 class="section-title mb-1">Ajustes de la Empresa</h2>
        <p class="field-hint">
          Configuración exclusiva del administrador: descuentos por retiro en tienda, proveedores y
          sucursales de BytePro.
        </p>
      </div>
      <button type="button" class="btn btn-tertiary btn-sm" :disabled="cargando" @click="cargarAjustes()">
        {{ cargando ? 'Actualizando…' : 'Actualizar datos' }}
      </button>
    </div>

    <div v-if="error" class="alert alert-danger mb-4">{{ error }}</div>
    <div v-if="exito" class="alert alert-success mb-4">{{ exito }}</div>

    <!-- Configuración de descuentos por retiro -->
    <section class="card mb-6">
      <h3 class="section-title mb-2">Descuento por retiro en tienda</h3>
      <p class="field-hint mb-4">
        Los porcentajes se aplican automáticamente al elegir “Retiro en tienda” en el checkout.
        El descuento se calcula sobre el subtotal antes de impuestos.
      </p>

      <form class="card-grid mb-4" @submit.prevent="guardarConfiguracion">
        <div class="field">
          <label for="descuento-alto">Descuento para compras sobre el umbral (%)</label>
          <input
            id="descuento-alto"
            v-model.number="configForm.descuentoRetiroAlto"
            class="input"
            type="number"
            min="0"
            max="100"
            step="0.01"
          />
        </div>
        <div class="field">
          <label for="descuento-bajo">Descuento para compras bajo el umbral (%)</label>
          <input
            id="descuento-bajo"
            v-model.number="configForm.descuentoRetiroBajo"
            class="input"
            type="number"
            min="0"
            max="100"
            step="0.01"
          />
        </div>
        <div class="field">
          <label for="umbral-descuento">Umbral de subtotal (Bs.)</label>
          <input
            id="umbral-descuento"
            v-model.number="configForm.umbralDescuentoRetiro"
            class="input"
            type="number"
            min="0"
            step="0.01"
          />
        </div>
      </form>

      <div class="alert alert-info mb-4">
        Actualmente: {{ configForm.descuentoRetiroAlto }}% para compras de
        {{ formatPrice(configForm.umbralDescuentoRetiro) }} o más, y
        {{ configForm.descuentoRetiroBajo }}% para compras menores.
      </div>

      <button class="btn btn-primary" type="button" :disabled="guardandoConfig" @click="guardarConfiguracion">
        {{ guardandoConfig ? 'Guardando…' : 'Guardar descuentos' }}
      </button>
    </section>

    <!-- Proveedores -->
    <section class="card mb-6">
      <div class="flex-between mb-4">
        <div>
          <h3 class="section-title mb-1">Proveedores</h3>
          <p class="field-hint">Registro de proveedores y datos de contacto.</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" @click="alternarFormProveedor">
          {{ mostrarFormProveedor ? 'Cancelar' : '+ Nuevo proveedor' }}
        </button>
      </div>

      <form
        v-if="mostrarFormProveedor"
        class="mb-5 p-4 bg-muted rounded"
        @submit.prevent="guardarProveedor"
      >
        <h4 class="font-semibold mb-3">
          {{ editandoProveedorId ? 'Editar proveedor' : 'Nuevo proveedor' }}
        </h4>
        <div class="card-grid mb-3">
          <div class="field">
            <label for="proveedor-nombre">Nombre o razón social</label>
            <input id="proveedor-nombre" v-model="proveedorForm.nombre" class="input" maxlength="160" />
          </div>
          <div class="field">
            <label for="proveedor-correo">Correo electrónico</label>
            <input id="proveedor-correo" v-model="proveedorForm.correo" class="input" type="email" maxlength="160" />
          </div>
          <div class="field">
            <label for="proveedor-telefono">Teléfono</label>
            <input id="proveedor-telefono" v-model="proveedorForm.telefono" class="input" maxlength="40" />
          </div>
          <div class="field">
            <label for="proveedor-direccion">Dirección</label>
            <input id="proveedor-direccion" v-model="proveedorForm.direccion" class="input" maxlength="255" />
          </div>
        </div>
        <div class="flex-row gap-2">
          <button class="btn btn-primary btn-sm" type="submit" :disabled="guardandoProveedor">
            {{ guardandoProveedor ? 'Guardando…' : 'Guardar proveedor' }}
          </button>
          <button class="btn btn-secondary btn-sm" type="button" @click="cancelarProveedor">
            Cancelar
          </button>
        </div>
      </form>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="proveedor in proveedores" :key="proveedor.id">
              <td><strong>{{ proveedor.nombre }}</strong></td>
              <td>{{ proveedor.direccion }}</td>
              <td>{{ proveedor.telefono }}</td>
              <td>{{ proveedor.correo }}</td>
              <td>
                <span class="badge" :class="proveedor.activo ? 'badge-stock' : 'badge-agotado'">
                  {{ proveedor.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div class="flex-row gap-2">
                  <button type="button" class="btn btn-secondary btn-sm" @click="editarProveedor(proveedor)">
                    Editar
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm"
                    :class="proveedor.activo ? 'btn-danger' : 'btn-primary'"
                    @click="cambiarEstadoProveedor(proveedor)"
                  >
                    {{ proveedor.activo ? 'Dar de baja' : 'Reactivar' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!proveedores.length" class="empty-note">No hay proveedores registrados.</p>
      </div>
    </section>

    <!-- Sucursales -->
    <section class="card">
      <div class="flex-between mb-4">
        <div>
          <h3 class="section-title mb-1">Sucursales</h3>
          <p class="field-hint">
            Solo las sucursales activas aparecen como opción de retiro en el checkout.
          </p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" @click="alternarFormSucursal">
          {{ mostrarFormSucursal ? 'Cancelar' : '+ Nueva sucursal' }}
        </button>
      </div>

      <form
        v-if="mostrarFormSucursal"
        class="mb-5 p-4 bg-muted rounded"
        @submit.prevent="guardarSucursal"
      >
        <h4 class="font-semibold mb-3">
          {{ editandoSucursalId ? 'Editar sucursal' : 'Nueva sucursal' }}
        </h4>
        <div class="card-grid mb-3">
          <div class="field">
            <label for="sucursal-nombre">Nombre</label>
            <input id="sucursal-nombre" v-model="sucursalForm.nombre" class="input" maxlength="120" />
          </div>
          <div class="field">
            <label for="sucursal-ciudad">Ciudad</label>
            <input id="sucursal-ciudad" v-model="sucursalForm.ciudad" class="input" maxlength="100" />
          </div>
          <div class="field">
            <label for="sucursal-telefono">Teléfono</label>
            <input id="sucursal-telefono" v-model="sucursalForm.telefono" class="input" maxlength="40" />
          </div>
          <div class="field">
            <label for="sucursal-horarios">Horarios</label>
            <input
              id="sucursal-horarios"
              v-model="sucursalForm.horarios"
              class="input"
              maxlength="255"
              placeholder="Lun a Vie 09:00-19:00 · Sáb 09:00-13:00"
            />
          </div>
          <div class="field">
            <label for="sucursal-direccion">Dirección</label>
            <input id="sucursal-direccion" v-model="sucursalForm.direccion" class="input" maxlength="255" />
          </div>
        </div>
        <div class="flex-row gap-2">
          <button class="btn btn-primary btn-sm" type="submit" :disabled="guardandoSucursal">
            {{ guardandoSucursal ? 'Guardando…' : 'Guardar sucursal' }}
          </button>
          <button class="btn btn-secondary btn-sm" type="button" @click="cancelarSucursal">
            Cancelar
          </button>
        </div>
      </form>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Ciudad</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Horarios</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sucursal in sucursales" :key="sucursal.id">
              <td><strong>{{ sucursal.nombre }}</strong></td>
              <td>{{ sucursal.ciudad }}</td>
              <td>{{ sucursal.direccion }}</td>
              <td>{{ sucursal.telefono }}</td>
              <td>{{ sucursal.horarios }}</td>
              <td>
                <span class="badge" :class="sucursal.activa ? 'badge-stock' : 'badge-agotado'">
                  {{ sucursal.activa ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td>
                <div class="flex-row gap-2">
                  <button type="button" class="btn btn-secondary btn-sm" @click="editarSucursal(sucursal)">
                    Editar
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm"
                    :class="sucursal.activa ? 'btn-danger' : 'btn-primary'"
                    @click="cambiarEstadoSucursal(sucursal)"
                  >
                    {{ sucursal.activa ? 'Dar de baja' : 'Reactivar' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!sucursales.length" class="empty-note">No hay sucursales registradas.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import api, { apiErrorMessage } from '../../services/api';
import { subscribeToTables } from '../../services/realtime';
import { useUiStore } from '../../store/ui';
import { formatPrice } from '../../utils/format';

const ui = useUiStore();

const cargando = ref(false);
const error = ref('');
const exito = ref('');

const configuracion = ref(null);
const configForm = reactive({
  descuentoRetiroAlto: 7,
  descuentoRetiroBajo: 5,
  umbralDescuentoRetiro: 500,
});
const guardandoConfig = ref(false);

const proveedores = ref([]);
const mostrarFormProveedor = ref(false);
const editandoProveedorId = ref(null);
const guardandoProveedor = ref(false);
const proveedorForm = reactive({
  nombre: '',
  direccion: '',
  telefono: '',
  correo: '',
});

const sucursales = ref([]);
const mostrarFormSucursal = ref(false);
const editandoSucursalId = ref(null);
const guardandoSucursal = ref(false);
const sucursalForm = reactive({
  nombre: '',
  ciudad: '',
  direccion: '',
  telefono: '',
  horarios: '',
});

function limpiarMensajes() {
  error.value = '';
  exito.value = '';
}

function notificarExito(mensaje) {
  exito.value = mensaje;
  ui.success(mensaje);
}

function aplicarConfiguracion(config) {
  if (!config) return;
  configuracion.value = config;
  configForm.descuentoRetiroAlto = Number(config.descuentoRetiroAlto);
  configForm.descuentoRetiroBajo = Number(config.descuentoRetiroBajo);
  configForm.umbralDescuentoRetiro = Number(config.umbralDescuentoRetiro);
}

async function cargarAjustes(silencioso = false) {
  if (!silencioso) cargando.value = true;
  if (!silencioso) limpiarMensajes();
  try {
    const { data } = await api.get('/admin/ajustes');
    aplicarConfiguracion(data.configuracion);
    proveedores.value = data.proveedores || [];
    sucursales.value = data.sucursales || [];
  } catch (err) {
    error.value = apiErrorMessage(err);
  } finally {
    if (!silencioso) cargando.value = false;
  }
}

async function guardarConfiguracion() {
  limpiarMensajes();
  guardandoConfig.value = true;
  try {
    const { data } = await api.put('/admin/ajustes', {
      descuentoRetiroAlto: Number(configForm.descuentoRetiroAlto),
      descuentoRetiroBajo: Number(configForm.descuentoRetiroBajo),
      umbralDescuentoRetiro: Number(configForm.umbralDescuentoRetiro),
    });
    aplicarConfiguracion(data.configuracion);
    notificarExito('Configuración de descuentos actualizada.');
  } catch (err) {
    error.value = apiErrorMessage(err);
  } finally {
    guardandoConfig.value = false;
  }
}

function alternarFormProveedor() {
  limpiarMensajes();
  mostrarFormProveedor.value = !mostrarFormProveedor.value;
  if (!mostrarFormProveedor.value) cancelarProveedor();
}

function cancelarProveedor() {
  mostrarFormProveedor.value = false;
  editandoProveedorId.value = null;
  proveedorForm.nombre = '';
  proveedorForm.direccion = '';
  proveedorForm.telefono = '';
  proveedorForm.correo = '';
}

function editarProveedor(proveedor) {
  limpiarMensajes();
  editandoProveedorId.value = proveedor.id;
  proveedorForm.nombre = proveedor.nombre;
  proveedorForm.direccion = proveedor.direccion;
  proveedorForm.telefono = proveedor.telefono;
  proveedorForm.correo = proveedor.correo;
  mostrarFormProveedor.value = true;
}

async function guardarProveedor() {
  limpiarMensajes();

  const payload = {
    nombre: proveedorForm.nombre.trim(),
    direccion: proveedorForm.direccion.trim(),
    telefono: proveedorForm.telefono.trim(),
    correo: proveedorForm.correo.trim(),
  };

  if (
    payload.nombre.length < 2 ||
    payload.direccion.length < 4 ||
    payload.telefono.length < 5 ||
    payload.correo.length < 5
  ) {
    error.value = 'Completa nombre, dirección, teléfono y correo del proveedor.';
    return;
  }

  guardandoProveedor.value = true;
  try {
    if (editandoProveedorId.value) {
      await api.put(`/admin/proveedores/${editandoProveedorId.value}`, payload);
      notificarExito('Proveedor actualizado correctamente.');
    } else {
      await api.post('/admin/proveedores', payload);
      notificarExito('Proveedor registrado correctamente.');
    }
    cancelarProveedor();
    await cargarAjustes(true);
  } catch (err) {
    error.value = apiErrorMessage(err);
  } finally {
    guardandoProveedor.value = false;
  }
}

async function cambiarEstadoProveedor(proveedor) {
  limpiarMensajes();
  const activar = !proveedor.activo;
  if (!activar) {
    const confirmado = await ui.confirm({
      title: 'Dar de baja proveedor',
      message: `¿Dar de baja a “${proveedor.nombre}”? Podrás reactivarlo cuando lo necesites.`,
      confirmText: 'Dar de baja',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmado) return;
  }

  try {
    await api.put(`/admin/proveedores/${proveedor.id}`, { activo: activar });
    notificarExito(activar ? 'Proveedor reactivado.' : 'Proveedor dado de baja.');
    await cargarAjustes(true);
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
}

function alternarFormSucursal() {
  limpiarMensajes();
  mostrarFormSucursal.value = !mostrarFormSucursal.value;
  if (!mostrarFormSucursal.value) cancelarSucursal();
}

function cancelarSucursal() {
  mostrarFormSucursal.value = false;
  editandoSucursalId.value = null;
  sucursalForm.nombre = '';
  sucursalForm.ciudad = '';
  sucursalForm.direccion = '';
  sucursalForm.telefono = '';
  sucursalForm.horarios = '';
}

function editarSucursal(sucursal) {
  limpiarMensajes();
  editandoSucursalId.value = sucursal.id;
  sucursalForm.nombre = sucursal.nombre;
  sucursalForm.ciudad = sucursal.ciudad;
  sucursalForm.direccion = sucursal.direccion;
  sucursalForm.telefono = sucursal.telefono;
  sucursalForm.horarios = sucursal.horarios;
  mostrarFormSucursal.value = true;
}

async function guardarSucursal() {
  limpiarMensajes();

  const payload = {
    nombre: sucursalForm.nombre.trim(),
    ciudad: sucursalForm.ciudad.trim(),
    direccion: sucursalForm.direccion.trim(),
    telefono: sucursalForm.telefono.trim(),
    horarios: sucursalForm.horarios.trim(),
  };

  if (
    payload.nombre.length < 2 ||
    payload.ciudad.length < 2 ||
    payload.direccion.length < 4 ||
    payload.telefono.length < 5 ||
    payload.horarios.length < 3
  ) {
    error.value = 'Completa nombre, ciudad, dirección, teléfono y horarios de la sucursal.';
    return;
  }

  guardandoSucursal.value = true;
  try {
    if (editandoSucursalId.value) {
      await api.put(`/admin/sucursales/${editandoSucursalId.value}`, payload);
      notificarExito('Sucursal actualizada correctamente.');
    } else {
      await api.post('/admin/sucursales', payload);
      notificarExito('Sucursal registrada correctamente.');
    }
    cancelarSucursal();
    await cargarAjustes(true);
  } catch (err) {
    error.value = apiErrorMessage(err);
  } finally {
    guardandoSucursal.value = false;
  }
}

async function cambiarEstadoSucursal(sucursal) {
  limpiarMensajes();
  const activar = !sucursal.activa;
  if (!activar) {
    const confirmado = await ui.confirm({
      title: 'Dar de baja sucursal',
      message: `¿Dar de baja “${sucursal.nombre}”? Dejará de aparecer como opción de retiro.`,
      confirmText: 'Dar de baja',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmado) return;
  }

  try {
    await api.put(`/admin/sucursales/${sucursal.id}`, { activa: activar });
    notificarExito(activar ? 'Sucursal reactivada.' : 'Sucursal dada de baja.');
    await cargarAjustes(true);
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
}

let unsubscribeRealtime = null;

onMounted(() => {
  cargarAjustes();
  unsubscribeRealtime = subscribeToTables(
    ['proveedores', 'sucursales', 'configuraciones_empresa', 'configuracion_empresa'],
    () => cargarAjustes(true)
  );
});

onUnmounted(() => {
  if (unsubscribeRealtime) unsubscribeRealtime();
  unsubscribeRealtime = null;
});
</script>

<style scoped>
.bg-muted {
  background: var(--color-surface-muted, #f8fafc);
}

.rounded {
  border-radius: var(--radius-md, 8px);
}
</style>
