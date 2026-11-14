<template>
  <div class="admin-page">
    <div class="flex-between mb-6">
      <div>
        <h2 class="section-title mb-1">
          {{ productoEditando ? 'Editar producto' : 'Gestión de Catálogo y Productos' }}
        </h2>
        <p class="field-hint">
          Alta, edición y baja de productos para el catálogo de la tienda.
        </p>
      </div>
      <button type="button" class="btn btn-primary btn-sm" @click="alternarFormulario">
        {{ mostrarFormProducto ? 'Cancelar' : '+ Nuevo producto' }}
      </button>
    </div>

    <div v-if="productoError" class="alert alert-danger mb-4">{{ productoError }}</div>
    <div v-if="productoExito" class="alert alert-success mb-4">{{ productoExito }}</div>

    <form
      v-if="mostrarFormProducto"
      ref="formProductoRef"
      id="form-producto"
      class="mb-6 card border-primary"
      @submit.prevent="guardarProducto"
    >
      <h3 class="section-title mb-4">
        {{ productoEditando ? `Editar: ${productoEditando.nombre}` : 'Crear nuevo componente' }}
      </h3>

      <div class="card-grid">
        <div class="field">
          <label>Nombre del producto *</label>
          <input
            v-model="nuevoProd.nombre"
            class="input"
            placeholder="Ej. Tarjeta de Video RTX 4070"
            required
          />
        </div>
        <div class="field">
          <label>Marca *</label>
          <input
            v-model="nuevoProd.marca"
            class="input"
            placeholder="Ej. ASUS, MSI, AMD"
            required
          />
        </div>
        <div class="field">
          <label>Modelo</label>
          <input v-model="nuevoProd.modelo" class="input" placeholder="Ej. RTX 4070 Super" />
        </div>
        <div class="field">
          <label>Categoría *</label>
          <select
            v-model="nuevoProd.categoriaId"
            class="select"
            required
            @change="onCategoriaChange"
          >
            <option value="">Selecciona categoría</option>
            <option v-for="cat in categoriasLista" :key="cat.id" :value="cat.id">
              {{ cat.nombre }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>Precio base (Bs.) *</label>
          <input
            v-model.number="nuevoProd.precioBase"
            type="number"
            step="0.01"
            min="0"
            class="input"
            required
          />
        </div>
      </div>

      <div class="field mt-3">
        <label>Descripción</label>
        <textarea
          v-model="nuevoProd.descripcion"
          class="textarea"
          rows="3"
          placeholder="Detalles técnicos y especificaciones"
        ></textarea>
      </div>

      <!-- REQ-PROD-08: Carga y galería de múltiples imágenes -->
      <div class="card-grid mt-3">
        <div class="field">
          <label>Subir imágenes del producto</label>
          <input
            ref="fileInput"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            class="input"
            @change="onImagenesSeleccionadas"
          />
          <p class="field-hint">PNG, JPEG o WEBP (máx. 5 MB por archivo). Puedes seleccionar múltiples imágenes.</p>
        </div>
        <div class="field">
          <label>O añadir por enlace / URL de imagen</label>
          <div class="input-inline-group">
            <input
              v-model="urlImagenInput"
              class="input"
              placeholder="https://ejemplo.com/producto.png"
              @keydown.enter.prevent="agregarImagenUrl"
            />
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              :disabled="!urlImagenInput.trim()"
              @click="agregarImagenUrl"
            >
              + Añadir
            </button>
          </div>
          <p class="field-hint">Pega una URL y presiona "Añadir" para incorporarla a la galería.</p>
        </div>
      </div>

      <!-- Galería de imágenes con miniaturas y controles de eliminación -->
      <div v-if="nuevoProd.imagenes.length" class="gallery-preview-container mt-3">
        <div class="gallery-preview-header">
          <span class="gallery-preview-title">
            Galería de fotos ({{ nuevoProd.imagenes.length }})
          </span>
          <button
            type="button"
            class="btn btn-tertiary btn-sm"
            @click="limpiarTodasImagenes"
          >
            Quitar todas
          </button>
        </div>
        <div class="gallery-preview-grid">
          <div
            v-for="(img, idx) in nuevoProd.imagenes"
            :key="idx"
            class="gallery-preview-item"
            :class="{ 'is-cover': idx === 0 }"
          >
            <img :src="img" :alt="`Foto ${idx + 1}`" />
            <span v-if="idx === 0" class="gallery-badge-cover">Principal</span>
            <div class="gallery-item-tools">
              <button
                v-if="idx > 0"
                type="button"
                class="btn-gallery-tool btn-gallery-star"
                title="Hacer imagen principal"
                @click="hacerImagenPrincipal(idx)"
              >
                ★
              </button>
              <button
                type="button"
                class="btn-gallery-tool btn-gallery-delete"
                title="Eliminar imagen"
                @click="eliminarImagen(idx)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="atributosCategoria.length" class="mt-4">
        <h4 class="section-title mb-2">Especificaciones técnicas</h4>
        <div class="card-grid">
          <div v-for="attr in atributosCategoria" :key="attr.clave" class="field">
            <label>
              {{ attr.etiqueta }}
              <span v-if="attr.requerido">*</span>
            </label>
            <select
              v-if="attr.tipo === 'select'"
              v-model="nuevoProd.especificaciones[attr.clave]"
              class="select"
              :required="attr.requerido"
            >
              <option value="">Selecciona una opción</option>
              <option v-for="opcion in attr.opciones || []" :key="opcion" :value="opcion">
                {{ opcion }}
              </option>
            </select>
            <input
              v-else-if="attr.tipo === 'number'"
              v-model.number="nuevoProd.especificaciones[attr.clave]"
              type="number"
              class="input"
              :required="attr.requerido"
            />
            <input
              v-else
              v-model="nuevoProd.especificaciones[attr.clave]"
              class="input"
              :required="attr.requerido"
            />
          </div>
        </div>
      </div>

      <!-- REQ-PROD-09: Variantes de especificaciones tanto en creación como en edición -->
      <div class="mt-4">
        <div class="flex-between mb-2">
          <div>
            <h4 class="section-title mb-0">
              {{ productoEditando ? 'Variantes de especificaciones' : 'Variantes iniciales' }}
            </h4>
            <p class="field-hint mb-0">
              Añade variantes de especificaciones con nombre, SKU, precio y stock.
            </p>
          </div>
          <button type="button" class="btn btn-tertiary btn-sm" @click="agregarVariante">
            + Añadir variante
          </button>
        </div>

        <div
          v-for="(variante, index) in nuevoProd.variantes"
          :key="variante.id ?? index"
          class="card-grid mb-2 variant-row"
        >
          <div class="field">
            <label>Especificación / Nombre *</label>
            <input
              v-model="variante.nombre"
              class="input"
              placeholder="Ej. 16GB 3200MHz / Negro / 512GB"
              required
            />
          </div>
          <div class="field">
            <label>SKU</label>
            <input
              v-model="variante.sku"
              class="input"
              placeholder="Auto si se deja vacío"
            />
          </div>
          <div class="field">
            <label>Precio (Bs.) *</label>
            <input
              v-model.number="variante.precio"
              type="number"
              step="0.01"
              min="0"
              class="input"
              :placeholder="String(nuevoProd.precioBase || 0)"
              required
            />
          </div>
          <div class="field">
            <label>Stock disponible *</label>
            <input
              v-model.number="variante.stock"
              type="number"
              min="0"
              class="input"
              required
            />
          </div>
          <div class="field field-actions">
            <button
              v-if="nuevoProd.variantes.length > 1"
              type="button"
              class="btn btn-danger btn-sm"
              @click="quitarVariante(index)"
            >
              Quitar variante
            </button>
          </div>
        </div>
      </div>

      <div class="mt-4 flex-row gap-2">
        <button type="submit" class="btn btn-primary" :disabled="guardandoProd">
          {{
            guardandoProd
              ? 'Guardando…'
              : productoEditando
                ? 'Guardar cambios'
                : 'Crear producto'
          }}
        </button>
        <button type="button" class="btn btn-tertiary" @click="cerrarFormulario">
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
              <th>Imagen</th>
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
              <td>
                <img
                  v-if="p.imagenPrincipal || p.imagen"
                  :src="p.imagenPrincipal || p.imagen"
                  class="admin-product-thumb"
                  :alt="`Imagen de ${p.nombre}`"
                />
                <span v-else class="field-hint">Sin imagen</span>
              </td>
              <td><strong>{{ p.nombre }}</strong></td>
              <td>{{ p.marca }}</td>
              <td>{{ p.categoria?.nombre || 'General' }}</td>
              <td>{{ formatPrice(p.precio ?? p.precioVenta ?? 0) }}</td>
              <td>
                <div class="flex-row gap-2">
                  <button
                    type="button"
                    class="btn btn-tertiary btn-sm"
                    @click="editarProducto(p)"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    class="btn btn-danger btn-sm"
                    @click="eliminarProducto(p)"
                  >
                    Dar de baja
                  </button>
                </div>
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
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue';
import api, { apiErrorMessage } from '../../services/api';
import { subscribeToTables } from '../../services/realtime';
import { useUiStore } from '../../store/ui';
import { formatPrice } from '../../utils/format';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const IMAGE_ERROR = 'El formato debe ser PNG, JPEG o WEBP y no superar los 5 MB';

const ui = useUiStore();

const productosLista = ref([]);
const categoriasLista = ref([]);
const mostrarFormProducto = ref(false);
const guardandoProd = ref(false);
const productoError = ref('');
const productoExito = ref('');
const productoEditando = ref(null);
const fileInput = ref(null);
const formProductoRef = ref(null);
const urlImagenInput = ref('');

function crearVariante(precio = 0) {
  return {
    id: null,
    sku: '',
    nombre: 'Estándar',
    precio: Number(precio) || 0,
    stock: 0,
    cantidad: 0,
  };
}

const nuevoProd = reactive({
  nombre: '',
  marca: '',
  modelo: '',
  categoriaId: '',
  precioBase: 0,
  descripcion: '',
  imagenes: [],
  imagen: '',
  imagenUrl: '',
  especificaciones: {},
  variantes: [crearVariante(0)],
});

const categoriaSeleccionada = computed(
  () =>
    categoriasLista.value.find(
      (categoria) => Number(categoria.id) === Number(nuevoProd.categoriaId)
    ) || null
);

const atributosCategoria = computed(() => categoriaSeleccionada.value?.atributos || []);

const imagenPreview = computed(
  () => nuevoProd.imagenes[0] || nuevoProd.imagen || nuevoProd.imagenUrl || ''
);

function inicializarEspecificaciones() {
  const especificaciones = {};
  for (const atributo of atributosCategoria.value) {
    especificaciones[atributo.clave] = '';
  }
  nuevoProd.especificaciones = especificaciones;
}

function onCategoriaChange() {
  inicializarEspecificaciones();
}

function leerArchivoComoDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}

async function onImagenesSeleccionadas(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  productoError.value = '';

  for (const file of files) {
    if (!IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES) {
      productoError.value = IMAGE_ERROR;
      continue;
    }

    try {
      const dataUrl = await leerArchivoComoDataUrl(file);
      if (dataUrl && !nuevoProd.imagenes.includes(dataUrl)) {
        nuevoProd.imagenes.push(dataUrl);
      }
    } catch {
      productoError.value = 'No se pudo leer una de las imágenes seleccionadas.';
    }
  }

  nuevoProd.imagen = nuevoProd.imagenes[0] || '';
  if (fileInput.value) fileInput.value.value = '';
}

function onImagenSeleccionada(event) {
  onImagenesSeleccionadas(event);
}

function agregarImagenUrl() {
  const url = (urlImagenInput.value || '').trim();
  if (!url) return;
  productoError.value = '';

  if (!/^https?:\/\//i.test(url) && !url.startsWith('/uploads/') && !url.startsWith('data:')) {
    productoError.value = 'La URL de la imagen debe comenzar con http:// o https://';
    return;
  }
  if (!nuevoProd.imagenes.includes(url)) {
    nuevoProd.imagenes.push(url);
  }
  nuevoProd.imagen = nuevoProd.imagenes[0] || '';
  urlImagenInput.value = '';
}

function eliminarImagen(index) {
  if (typeof index === 'number') {
    nuevoProd.imagenes.splice(index, 1);
  } else {
    nuevoProd.imagenes = [];
  }
  nuevoProd.imagen = nuevoProd.imagenes[0] || '';
}

function quitarImagen(index) {
  eliminarImagen(index);
}

function hacerImagenPrincipal(index) {
  if (index > 0 && index < nuevoProd.imagenes.length) {
    const [img] = nuevoProd.imagenes.splice(index, 1);
    nuevoProd.imagenes.unshift(img);
    nuevoProd.imagen = nuevoProd.imagenes[0] || '';
  }
}

function limpiarTodasImagenes() {
  nuevoProd.imagenes = [];
  nuevoProd.imagen = '';
  nuevoProd.imagenUrl = '';
  if (fileInput.value) fileInput.value.value = '';
}

function resetFormulario() {
  nuevoProd.nombre = '';
  nuevoProd.marca = '';
  nuevoProd.modelo = '';
  nuevoProd.categoriaId = '';
  nuevoProd.precioBase = 0;
  nuevoProd.descripcion = '';
  nuevoProd.imagenes = [];
  nuevoProd.imagen = '';
  nuevoProd.imagenUrl = '';
  nuevoProd.especificaciones = {};
  nuevoProd.variantes = [crearVariante(0)];
  urlImagenInput.value = '';
  if (fileInput.value) fileInput.value.value = '';
}

function alternarFormulario() {
  if (mostrarFormProducto.value) {
    cerrarFormulario();
    return;
  }
  productoEditando.value = null;
  resetFormulario();
  mostrarFormProducto.value = true;
}

function cerrarFormulario() {
  mostrarFormProducto.value = false;
  productoEditando.value = null;
  resetFormulario();
}

function agregarVariante() {
  nuevoProd.variantes.push(crearVariante(nuevoProd.precioBase));
}

function quitarVariante(index) {
  if (nuevoProd.variantes.length > 1) {
    nuevoProd.variantes.splice(index, 1);
  }
}

function editarProducto(producto) {
  productoError.value = '';
  productoExito.value = '';
  productoEditando.value = producto;
  mostrarFormProducto.value = true;

  const galeria = [];
  if (Array.isArray(producto.imagenes) && producto.imagenes.length) {
    galeria.push(...producto.imagenes);
  } else if (producto.imagenPrincipal || producto.imagen) {
    galeria.push(producto.imagenPrincipal || producto.imagen);
  }

  const especificaciones = {};
  for (const atributo of producto.categoria?.atributos || []) {
    especificaciones[atributo.clave] = producto.especificaciones?.[atributo.clave] ?? '';
  }
  for (const [clave, valor] of Object.entries(producto.especificaciones || {})) {
    if (!(clave in especificaciones)) especificaciones[clave] = valor;
  }

  const precioProd = Number(producto.precio ?? producto.precioVenta ?? 0);

  nuevoProd.nombre = producto.nombre || '';
  nuevoProd.marca = producto.marca || '';
  nuevoProd.modelo = producto.modelo || '';
  nuevoProd.categoriaId = producto.categoria?.id || producto.categoriaId || '';
  nuevoProd.precioBase = precioProd;
  nuevoProd.descripcion = producto.descripcion || '';
  nuevoProd.imagenes = galeria;
  nuevoProd.imagen = galeria[0] || '';
  nuevoProd.imagenUrl = '';
  nuevoProd.especificaciones = especificaciones;
  nuevoProd.variantes =
    producto.variantes && producto.variantes.length
      ? producto.variantes.map((variante) => ({
          id: variante.id,
          sku: variante.sku || '',
          nombre: variante.nombre || 'Estándar',
          precio: Number(variante.precio ?? variante.precioVenta ?? precioProd),
          stock: Number(variante.stock ?? variante.cantidad ?? 0),
          cantidad: Number(variante.stock ?? variante.cantidad ?? 0),
        }))
      : [
          {
            id: null,
            sku: '',
            nombre: 'Estándar',
            precio: precioProd,
            stock: Number(producto.stock || 0),
            cantidad: Number(producto.stock || 0),
          },
        ];

  urlImagenInput.value = '';
  if (fileInput.value) fileInput.value.value = '';

  // REQ-PROD-10: Auto-scroll suave hacia el formulario de edición
  nextTick(() => {
    if (formProductoRef.value) {
      formProductoRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

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
  if (guardandoProd.value) return;

  productoError.value = '';
  productoExito.value = '';

  const editando = Boolean(productoEditando.value);
  const especificaciones = Object.fromEntries(
    Object.entries(nuevoProd.especificaciones).filter(
      ([, valor]) => valor !== '' && valor !== null && valor !== undefined
    )
  );

  const payload = {
    nombre: nuevoProd.nombre.trim(),
    marca: nuevoProd.marca.trim(),
    modelo: nuevoProd.modelo.trim() || null,
    categoriaId: Number(nuevoProd.categoriaId),
    precioVenta: Number(nuevoProd.precioBase) || 0,
    descripcion: nuevoProd.descripcion.trim(),
    especificaciones,
    imagenes: [...nuevoProd.imagenes],
    imagenPrincipal: nuevoProd.imagenes[0] || null,
    imagen: nuevoProd.imagenes[0] || null,
    variantes: nuevoProd.variantes.map((variante) => ({
      id: variante.id || undefined,
      sku: (variante.sku || '').trim(),
      nombre: (variante.nombre || '').trim() || 'Estándar',
      precio:
        variante.precio !== undefined && variante.precio !== null && variante.precio !== ''
          ? Number(variante.precio)
          : Number(nuevoProd.precioBase) || 0,
      precioVenta:
        variante.precio !== undefined && variante.precio !== null && variante.precio !== ''
          ? Number(variante.precio)
          : Number(nuevoProd.precioBase) || 0,
      stock: Math.max(0, Number(variante.stock ?? variante.cantidad) || 0),
      cantidad: Math.max(0, Number(variante.stock ?? variante.cantidad) || 0),
    })),
  };

  guardandoProd.value = true;
  try {
    if (editando) {
      await api.put(`/productos/${productoEditando.value.id}`, payload);
    } else {
      await api.post('/productos', payload);
    }
    productoExito.value = editando
      ? 'Producto actualizado con éxito.'
      : 'Producto creado con éxito.';
    cerrarFormulario();
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

let unsubscribeRealtime = null;

onMounted(() => {
  cargar();
  unsubscribeRealtime = subscribeToTables(
    ['productos', 'variantes', 'inventarios', 'categorias'],
    cargar
  );
});

onUnmounted(() => {
  if (unsubscribeRealtime) unsubscribeRealtime();
  unsubscribeRealtime = null;
});
</script>

<style scoped>
.input-inline-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input-inline-group .input {
  flex: 1;
}

.gallery-preview-container {
  background: var(--color-bg-muted, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  padding: 1rem;
}

.gallery-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.gallery-preview-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text, #1e293b);
}

.gallery-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 0.75rem;
}

.gallery-preview-item {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--color-border, #cbd5e1);
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.gallery-preview-item.is-cover {
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.gallery-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gallery-badge-cover {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: var(--color-primary, #2563eb);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 9999px;
  letter-spacing: 0.3px;
}

.gallery-item-tools {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 3px;
}

.btn-gallery-tool {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.65);
  color: #ffffff;
  font-size: 11px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
  line-height: 1;
}

.btn-gallery-tool:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
}

.btn-gallery-delete:hover {
  background: #dc2626;
}

.btn-gallery-star {
  color: #facc15;
}

.btn-gallery-star:hover {
  background: #ca8a04;
  color: #ffffff;
}

.variant-row {
  align-items: flex-end;
}
</style>
