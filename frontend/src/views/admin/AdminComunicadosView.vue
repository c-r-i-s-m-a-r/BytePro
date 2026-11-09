<template>
  <div class="admin-page">
    <div class="flex-between mb-6">
      <div>
        <h2 class="section-title mb-1">Tablón de Comunicados Internos</h2>
        <p class="field-hint">
          Avisos oficiales para todo el personal de BytePro. La lectura está disponible para
          vendedores, soporte, operaciones y administración; solo el administrador puede publicar,
          editar o eliminar comunicados.
        </p>
      </div>
      <button
        v-if="esAdmin"
        type="button"
        class="btn btn-primary btn-sm"
        @click="alternarFormulario"
      >
        {{ mostrarForm ? 'Cancelar' : '+ Nuevo comunicado' }}
      </button>
    </div>

    <div v-if="error" class="alert alert-danger mb-4">{{ error }}</div>
    <div v-if="exito" class="alert alert-success mb-4">{{ exito }}</div>

    <form
      v-if="esAdmin && mostrarForm"
      class="card border-primary mb-6"
      @submit.prevent="guardarComunicado"
    >
      <h3 class="section-title mb-4">
        {{ editandoId ? 'Editar comunicado' : 'Publicar nuevo comunicado' }}
      </h3>

      <div class="card-grid mb-4">
        <div class="field">
          <label for="comunicado-titulo">Título</label>
          <input
            id="comunicado-titulo"
            v-model="form.titulo"
            class="input"
            maxlength="160"
            placeholder="Título breve del comunicado"
          />
        </div>
        <div class="field">
          <label for="comunicado-prioridad">Prioridad</label>
          <select id="comunicado-prioridad" v-model="form.prioridad" class="select">
            <option v-for="prioridad in prioridades" :key="prioridad" :value="prioridad">
              {{ prioridad }}
            </option>
          </select>
        </div>
      </div>

      <div class="field mb-4">
        <label for="comunicado-contenido">Contenido</label>
        <textarea
          id="comunicado-contenido"
          v-model="form.contenido"
          class="textarea"
          rows="5"
          placeholder="Escribe el mensaje que verá todo el personal…"
        ></textarea>
      </div>

      <div class="flex-row gap-2">
        <button class="btn btn-primary" type="submit" :disabled="guardando">
          {{ guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Publicar' }}
        </button>
        <button class="btn btn-secondary" type="button" @click="cancelarFormulario">
          Cancelar
        </button>
      </div>
    </form>

    <div v-if="cargando" class="state-message">
      <h3>Cargando comunicados…</h3>
    </div>

    <div v-else-if="!comunicados.length" class="state-message">
      <h3>No hay comunicados publicados</h3>
      <p>Cuando el administrador publique un aviso, aparecerá en este tablón.</p>
    </div>

    <div v-else class="comunicados-grid">
      <article
        v-for="comunicado in comunicados"
        :key="comunicado.id"
        class="card comunicado-card"
        :class="`comunicado-${comunicado.prioridad.toLowerCase()}`"
      >
        <div class="flex-between mb-2">
          <span class="badge" :class="badgePrioridad(comunicado.prioridad)">
            {{ comunicado.prioridad }}
          </span>
          <span class="field-hint">{{ formatDateTime(comunicado.fecha) }}</span>
        </div>

        <h3 class="comunicado-titulo">{{ comunicado.titulo }}</h3>
        <p class="comunicado-contenido">{{ comunicado.contenido }}</p>

        <div class="flex-between mt-4 align-center">
          <span class="field-hint">
            Publicado por
            {{ comunicado.autor?.nombre || comunicado.autor?.email || 'Administración' }}
          </span>
          <div v-if="esAdmin" class="flex-row gap-2">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              @click="editarComunicado(comunicado)"
            >
              Editar
            </button>
            <button
              type="button"
              class="btn btn-danger btn-sm"
              @click="eliminarComunicado(comunicado)"
            >
              Eliminar
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api, { apiErrorMessage } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { formatDateTime } from '../../utils/format';

const auth = useAuthStore();
const ui = useUiStore();

const prioridades = ['Informativo', 'Importante', 'Urgente'];

const comunicados = ref([]);
const cargando = ref(true);
const error = ref('');
const exito = ref('');
const mostrarForm = ref(false);
const editandoId = ref(null);
const guardando = ref(false);

const form = reactive({
  titulo: '',
  contenido: '',
  prioridad: 'Informativo',
});

const esAdmin = computed(() => auth.isAdmin || auth.user?.rol === 'admin');

function badgePrioridad(prioridad) {
  if (prioridad === 'Urgente') return 'badge-agotado';
  if (prioridad === 'Importante') return 'badge-low';
  return 'badge';
}

function limpiarMensajes() {
  error.value = '';
  exito.value = '';
}

function limpiarFormulario() {
  form.titulo = '';
  form.contenido = '';
  form.prioridad = 'Informativo';
  editandoId.value = null;
}

function alternarFormulario() {
  limpiarMensajes();
  if (mostrarForm.value) {
    mostrarForm.value = false;
    limpiarFormulario();
  } else {
    mostrarForm.value = true;
  }
}

function cancelarFormulario() {
  mostrarForm.value = false;
  limpiarFormulario();
}

async function cargarComunicados() {
  cargando.value = true;
  error.value = '';
  try {
    const { data } = await api.get('/admin/comunicados');
    comunicados.value = data.items || [];
  } catch (err) {
    error.value = apiErrorMessage(err);
  } finally {
    cargando.value = false;
  }
}

function editarComunicado(comunicado) {
  limpiarMensajes();
  editandoId.value = comunicado.id;
  form.titulo = comunicado.titulo;
  form.contenido = comunicado.contenido;
  form.prioridad = comunicado.prioridad;
  mostrarForm.value = true;
}

async function guardarComunicado() {
  limpiarMensajes();

  if (form.titulo.trim().length < 3) {
    error.value = 'El título debe tener al menos 3 caracteres.';
    return;
  }
  if (form.contenido.trim().length < 3) {
    error.value = 'El contenido del comunicado es obligatorio.';
    return;
  }

  guardando.value = true;
  try {
    const payload = {
      titulo: form.titulo.trim(),
      contenido: form.contenido.trim(),
      prioridad: form.prioridad,
    };

    if (editandoId.value) {
      await api.put(`/admin/comunicados/${editandoId.value}`, payload);
      exito.value = 'Comunicado actualizado correctamente.';
    } else {
      await api.post('/admin/comunicados', payload);
      exito.value = 'Comunicado publicado correctamente.';
    }

    ui.success(exito.value);
    mostrarForm.value = false;
    limpiarFormulario();
    await cargarComunicados();
  } catch (err) {
    error.value = apiErrorMessage(err);
  } finally {
    guardando.value = false;
  }
}

async function eliminarComunicado(comunicado) {
  limpiarMensajes();
  const confirmado = await ui.confirm({
    title: 'Eliminar comunicado',
    message: `¿Eliminar el comunicado “${comunicado.titulo}”? Esta acción no se puede deshacer.`,
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    variant: 'danger',
  });
  if (!confirmado) return;

  try {
    await api.delete(`/admin/comunicados/${comunicado.id}`);
    exito.value = 'Comunicado eliminado correctamente.';
    ui.success(exito.value);
    if (editandoId.value === comunicado.id) {
      mostrarForm.value = false;
      limpiarFormulario();
    }
    await cargarComunicados();
  } catch (err) {
    error.value = apiErrorMessage(err);
  }
}

onMounted(cargarComunicados);
</script>

<style scoped>
.comunicados-grid {
  display: grid;
  gap: var(--space-4);
}

.comunicado-card {
  border-left: 4px solid var(--color-border, #d0d5dd);
}

.comunicado-informativo {
  border-left-color: #3b82f6;
}

.comunicado-importante {
  border-left-color: #f59e0b;
}

.comunicado-urgente {
  border-left-color: #ef4444;
}

.comunicado-titulo {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: var(--space-2);
}

.comunicado-contenido {
  white-space: pre-line;
  line-height: 1.55;
  color: var(--color-text-muted, #475467);
}
</style>
