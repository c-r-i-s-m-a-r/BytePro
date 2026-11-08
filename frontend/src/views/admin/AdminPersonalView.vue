<template>
  <div class="admin-page">
    <div class="flex-between mb-6">
      <div>
        <h2 class="section-title mb-1">Gestión de Personal y Cuentas de Empleados</h2>
        <p class="field-hint">
          Módulo exclusivo para personal corporativo (vendedor, soporte, operaciones y admin). Los clientes y compradores no se listan en este panel.
        </p>
      </div>
      <button
        type="button"
        class="btn btn-primary btn-sm"
        @click="mostrarFormUsuario = !mostrarFormUsuario; editandoUsrId = null"
      >
        {{ mostrarFormUsuario ? 'Cancelar' : '+ Nuevo empleado' }}
      </button>
    </div>

    <div v-if="usuarioError" class="alert alert-danger mb-4">{{ usuarioError }}</div>
    <div v-if="usuarioExito" class="alert alert-success mb-4">{{ usuarioExito }}</div>

    <!-- Formulario Crear / Editar Empleado -->
    <form v-if="mostrarFormUsuario" class="mb-6 card border-primary" @submit.prevent="guardarUsuario">
      <h3 class="section-title mb-4">
        {{ editandoUsrId ? 'Editar personal y roles' : 'Crear cuenta de personal' }}
      </h3>
      <div class="card-grid">
        <div class="field">
          <label>Nombre completo *</label>
          <input v-model="formUsr.nombre" class="input" placeholder="Nombre y apellido" required />
        </div>
        <div class="field">
          <label>Nombre de usuario (username) *</label>
          <input
            v-model="formUsr.username"
            class="input"
            placeholder="ej. jdoe"
            :disabled="Boolean(editandoUsrId)"
            required
          />
        </div>
        <div class="field">
          <label>Correo electrónico *</label>
          <input
            v-model="formUsr.email"
            type="email"
            class="input"
            placeholder="personal@bytepro.com"
            :disabled="Boolean(editandoUsrId)"
            required
          />
        </div>
        <div class="field">
          <label>{{ editandoUsrId ? 'Nueva contraseña (opcional)' : 'Contraseña inicial *' }}</label>
          <input
            v-model="formUsr.password"
            type="password"
            class="input"
            :placeholder="editandoUsrId ? 'Dejar en blanco si no cambia' : 'Mínimo 6 caracteres'"
            :required="!editandoUsrId"
          />
        </div>
        <div class="field">
          <label>Teléfono de contacto</label>
          <input v-model="formUsr.telefono" class="input" placeholder="70000000" />
        </div>
        <div class="field">
          <label>Puesto o cargo</label>
          <input v-model="formUsr.puesto" class="input" placeholder="Ej. Encargado de logística" />
        </div>
      </div>

      <!-- Selección de roles múltiples mediante checkboxes -->
      <div class="field mt-4">
        <label class="font-semibold mb-2">Asignar roles y funciones múltiples *</label>
        <div class="flex-row gap-4 mt-2 flex-wrap">
          <label class="flex-row gap-2 align-center">
            <input type="checkbox" value="vendedor" v-model="formUsr.roles" />
            <span>Vendedor (Catálogo y Productos)</span>
          </label>
          <label class="flex-row gap-2 align-center">
            <input type="checkbox" value="soporte" v-model="formUsr.roles" />
            <span>Soporte (Tickets y Reclamos)</span>
          </label>
          <label class="flex-row gap-2 align-center">
            <input type="checkbox" value="operaciones" v-model="formUsr.roles" />
            <span>Operaciones (Logística y Almacén)</span>
          </label>
          <label class="flex-row gap-2 align-center">
            <input type="checkbox" value="admin" v-model="formUsr.roles" />
            <span>Administrador Global</span>
          </label>
        </div>
      </div>

      <div v-if="editandoUsrId" class="field mt-3">
        <label class="flex-row gap-2 align-center">
          <input type="checkbox" v-model="formUsr.activo" />
          <span class="font-semibold">Cuenta activa</span>
        </label>
      </div>

      <div class="mt-4 flex-row gap-2">
        <button type="submit" class="btn btn-primary" :disabled="guardandoUsr">
          {{ guardandoUsr ? 'Guardando…' : (editandoUsrId ? 'Guardar cambios' : 'Registrar personal') }}
        </button>
        <button type="button" class="btn btn-tertiary" @click="cancelarEdicion">
          Cancelar
        </button>
      </div>
    </form>

    <!-- Tabla de Personal -->
    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre completo</th>
              <th>Usuario / Email</th>
              <th>Roles Asignados</th>
              <th>Función Activa</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in usuariosLista" :key="u.id">
              <td>#{{ u.id }}</td>
              <td><strong>{{ u.nombre }}</strong></td>
              <td>
                <div>{{ u.username }}</div>
                <small class="field-hint">{{ u.email }}</small>
              </td>
              <td>
                <div class="flex-row gap-1 flex-wrap">
                  <span v-for="r in u.roles" :key="r" class="badge">
                    {{ r }}
                  </span>
                </div>
              </td>
              <td>
                <span class="badge badge-stock">{{ u.funcionActiva }}</span>
              </td>
              <td>
                <span class="badge" :class="u.activo ? 'badge-stock' : 'badge-agotado'">
                  {{ u.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div class="table-actions-grid">
                  <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    @click="editarUsuario(u)"
                  >
                    Editar roles
                  </button>
                  <button
                    v-if="u.id !== auth.user.id"
                    type="button"
                    class="btn btn-tertiary btn-sm"
                    @click="toggleActivo(u)"
                  >
                    {{ u.activo ? 'Desactivar' : 'Activar' }}
                  </button>
                  <span v-else class="btn btn-tertiary btn-sm disabled opacity-50 cursor-default">
                    Activo
                  </span>
                  <button
                    v-if="u.id !== auth.user.id"
                    type="button"
                    class="btn btn-danger btn-sm"
                    @click="eliminarUsuario(u)"
                  >
                    Eliminar
                  </button>
                  <span v-else class="btn btn-tertiary btn-sm disabled opacity-50 cursor-default">
                    Actual
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!usuariosLista.length" class="empty-note">Cargando personal…</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api, { apiErrorMessage } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { useUiStore } from '../../store/ui';

const auth = useAuthStore();
const ui = useUiStore();

const usuariosLista = ref([]);
const mostrarFormUsuario = ref(false);
const editandoUsrId = ref(null);
const guardandoUsr = ref(false);
const usuarioError = ref('');
const usuarioExito = ref('');

const formUsr = reactive({
  nombre: '',
  username: '',
  email: '',
  password: '',
  telefono: '',
  puesto: '',
  roles: ['vendedor'],
  activo: true,
});

async function cargarUsuarios() {
  usuarioError.value = '';
  try {
    const { data } = await api.get('/admin/usuarios');
    // Filtrar estrictamente solo usuarios del personal/staff
    const staffRoles = ['admin', 'vendedor', 'soporte', 'operaciones', 'empleado'];
    usuariosLista.value = (data.items || []).filter(
      (u) => staffRoles.includes(u.rol) || (u.roles && u.roles.some((r) => staffRoles.includes(r)))
    );
  } catch (err) {
    usuarioError.value = apiErrorMessage(err);
  }
}

function cancelarEdicion() {
  mostrarFormUsuario.value = false;
  editandoUsrId.value = null;
  formUsr.nombre = '';
  formUsr.username = '';
  formUsr.email = '';
  formUsr.password = '';
  formUsr.telefono = '';
  formUsr.puesto = '';
  formUsr.roles = ['vendedor'];
  formUsr.activo = true;
}

function editarUsuario(u) {
  editandoUsrId.value = u.id;
  formUsr.nombre = u.nombre;
  formUsr.username = u.username;
  formUsr.email = u.email;
  formUsr.password = '';
  formUsr.telefono = u.telefono || '';
  formUsr.roles = [...(u.roles || [u.rol])];
  formUsr.activo = Boolean(u.activo);
  mostrarFormUsuario.value = true;
}

async function guardarUsuario() {
  usuarioError.value = '';
  usuarioExito.value = '';

  if (!formUsr.roles || !formUsr.roles.length) {
    usuarioError.value = 'Debes seleccionar al menos un rol/función para el empleado.';
    return;
  }

  guardandoUsr.value = true;
  try {
    if (editandoUsrId.value) {
      const payload = {
        nombre: formUsr.nombre,
        telefono: formUsr.telefono,
        roles: formUsr.roles,
        activo: formUsr.activo,
      };
      if (formUsr.password) payload.password = formUsr.password;
      await api.put(`/admin/usuarios/${editandoUsrId.value}`, payload);
      usuarioExito.value = `Usuario "${formUsr.nombre}" actualizado correctamente.`;
    } else {
      await api.post('/admin/usuarios', {
        nombre: formUsr.nombre,
        username: formUsr.username,
        email: formUsr.email,
        password: formUsr.password,
        telefono: formUsr.telefono,
        puesto: formUsr.puesto,
        roles: formUsr.roles,
      });
      usuarioExito.value = `Empleado "${formUsr.nombre}" registrado exitosamente.`;
    }
    cancelarEdicion();
    await cargarUsuarios();
  } catch (err) {
    usuarioError.value = apiErrorMessage(err);
  } finally {
    guardandoUsr.value = false;
  }
}

async function toggleActivo(u) {
  const accion = u.activo ? 'desactivar' : 'activar';
  const confirmed = await ui.confirm({
    title: `${u.activo ? 'Desactivar' : 'Activar'} cuenta`,
    message: `¿Estás seguro de ${accion} la cuenta de "${u.nombre}" (${u.username})?`,
    confirmText: `Sí, ${accion}`,
    variant: u.activo ? 'danger' : 'primary',
  });
  if (!confirmed) return;

  try {
    await api.put(`/admin/usuarios/${u.id}`, { activo: !u.activo });
    usuarioExito.value = `Cuenta de "${u.nombre}" ${!u.activo ? 'activada' : 'desactivada'}.`;
    await cargarUsuarios();
  } catch (err) {
    usuarioError.value = apiErrorMessage(err);
  }
}

async function eliminarUsuario(u) {
  const confirmed = await ui.confirm({
    title: 'Eliminar personal',
    message: `¿Estás seguro de eliminar permanentemente la cuenta de "${u.nombre}" (${u.username})?`,
    confirmText: 'Sí, eliminar',
    variant: 'danger',
  });
  if (!confirmed) return;

  try {
    await api.delete(`/admin/usuarios/${u.id}`);
    usuarioExito.value = `Usuario "${u.nombre}" eliminado.`;
    await cargarUsuarios();
  } catch (err) {
    usuarioError.value = apiErrorMessage(err);
  }
}

onMounted(cargarUsuarios);
</script>
