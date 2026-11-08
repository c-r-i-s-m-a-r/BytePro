<template>
  <div class="admin-page">
    <div class="flex-between mb-6">
      <div>
        <h2 class="section-title mb-1">Gestión de Catálogo y Productos</h2>
        <p class="field-hint">
          Alta, edición y baja de productos para el catálogo de la tienda.
        </p>
      </div>
      <button
        type="button"
        class="btn btn-primary btn-sm"
        @click="mostrarFormProducto = !mostrarFormProducto"
      >
        {{ mostrarFormProducto ? 'Cancelar' : '+ Nuevo producto' }}
      </button>
    </div>

    <div v-if="productoError" class="alert alert-danger mb-4">{{ productoError }}</div>
    <div v-if="productoExito" class="alert alert-success mb-4">{{ productoExito }}</div>

    <form v-if="mostrarFormProducto" class="mb-6 card border-primary" @submit.prevent="guardarProducto">
      <h3 class="section-title mb-4">Crear nuevo componente</h3>
      <div class="card-grid">
        <div class="field">
          <label>Nombre del producto *</label>
          <input v-model="nuevoProd.nombre" class="input" placeholder="Ej. Tarjeta de Video RTX 4070" required />
        </div>
        <div class="field">
          <label>Marca *</label>
          <input v-model="nuevoProd.marca" class="input" placeholder="Ej. ASUS, MSI, AMD" required />
        </div>
        <div class="field">
          <label>Categoría *</label>
          <select v-model="nuevoProd.categoriaId" class="select" required>
            <option value="">Selecciona categoría</option>
            <option v-for="cat in categoriasLista" :key="cat.id" :value="cat.id">
              {{ cat.nombre }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>Precio base (USD) *</label>
          <input v-model.number="nuevoProd.precioBase" type="number" step="0.01" min="0" class="input" required />
        </div>
      </div>
      <div class="field mt-3">
        <label>Descripción</label>
        <textarea v-model="nuevoProd.descripcion" class="textarea" rows="3" placeholder="Detalles técnicos y especificaciones"></textarea>
      </div>
      <div class="mt-4 flex-row gap-2">
        <button type="submit" class="btn btn-primary" :disabled="guardandoProd">
          {{ guardandoProd ? 'Guardando…' : 'Crear producto' }}
        </button>
        <button type="button" class="btn btn-tertiary" @click="mostrarFormProducto = false">
          Cancelar
        </button>
      </div>
    </form>

    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Producto</th>
              <th>Marca</th>
              <th>Categoría</th>
              <th>Precio base</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in productosLista" :key="p.id">
              <td>#{{ p.id }}</td>
              <td><strong>{{ p.nombre }}</strong></td>
              <td>{{ p.marca }}</td>
              <td>{{ p.categoria?.nombre || 'General' }}</td>
              <td>{{ formatPrice(p.precioBase) }}</td>
              <td>
                <button
                  type="button"
                  class="btn btn-danger btn-sm"
                  @click="eliminarProducto(p)"
                >
                  Dar de baja
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!productosLista.length" class="empty-note">Cargando productos…</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api, { apiErrorMessage } from '../../services/api';
import { useUiStore } from '../../store/ui';
import { formatPrice } from '../../utils/format';

const ui = useUiStore();

const productosLista = ref([]);
const categoriasLista = ref([]);
const mostrarFormProducto = ref(false);
const guardandoProd = ref(false);
const productoError = ref('');
const productoExito = ref('');

const nuevoProd = reactive({
  nombre: '',
  marca: '',
  categoriaId: '',
  precioBase: 0,
  descripcion: '',
});

async function cargar() {
  try {
    const [pRes, cRes] = await Promise.all([
      api.get('/productos', { params: { limit: 100 } }),
      api.get('/categorias'),
    ]);
    productosLista.value = pRes.data.items || [];
    categoriasLista.value = cRes.data.items || cRes.data || [];
  } catch (err) {
    productoError.value = apiErrorMessage(err);
  }
}

async function guardarProducto() {
  productoError.value = '';
  productoExito.value = '';
  guardandoProd.value = true;
  try {
    await api.post('/productos', {
      nombre: nuevoProd.nombre,
      marca: nuevoProd.marca,
      categoriaId: Number(nuevoProd.categoriaId),
      precioBase: Number(nuevoProd.precioBase),
      descripcion: nuevoProd.descripcion,
    });
    productoExito.value = 'Producto creado con éxito.';
    nuevoProd.nombre = '';
    nuevoProd.marca = '';
    nuevoProd.categoriaId = '';
    nuevoProd.precioBase = 0;
    nuevoProd.descripcion = '';
    mostrarFormProducto.value = false;
    await cargar();
  } catch (err) {
    productoError.value = apiErrorMessage(err);
  } finally {
    guardandoProd.value = false;
  }
}

async function eliminarProducto(p) {
  const confirmed = await ui.confirm({
    title: 'Dar de baja producto',
    message: `¿Estás seguro de que deseas dar de baja "${p.nombre}" del catálogo?`,
    confirmText: 'Sí, dar de baja',
    variant: 'danger',
  });
  if (!confirmed) return;
  try {
    await api.delete(`/productos/${p.id}`);
    productoExito.value = `Producto "${p.nombre}" dado de baja correctamente.`;
    await cargar();
  } catch (err) {
    productoError.value = apiErrorMessage(err);
  }
}

onMounted(cargar);
</script>
