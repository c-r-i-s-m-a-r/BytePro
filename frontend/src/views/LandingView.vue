<template>
  <div class="landing-page">
    <header class="landing-header">
      <div class="landing-container landing-header-inner">
        <RouterLink class="landing-brand" :to="brandTarget">
          <img :src="byteproLogo" alt="BytePro" class="landing-brand-logo" />
          <span>BytePro</span>
        </RouterLink>

        <nav class="landing-nav" aria-label="Navegación principal">
          <RouterLink :to="{ name: 'catalog' }">Productos</RouterLink>
          <a href="#simulador">Arma tu setup</a>
          <a href="#categorias">Categorías</a>
          <RouterLink :to="{ name: 'tracking' }">Envíos</RouterLink>
          <RouterLink :to="{ name: 'help' }">Ayuda</RouterLink>
        </nav>

        <div class="landing-header-actions">
          <template v-if="auth.isAuthenticated">
            <RouterLink
              class="landing-link-btn"
              :to="auth.isStaff ? { name: 'admin' } : { name: 'catalog' }"
            >
              {{ auth.isStaff ? 'Panel corporativo' : 'Mi cuenta' }}
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink class="landing-link-btn" :to="{ name: 'login' }">
              Iniciar sesión
            </RouterLink>
            <RouterLink class="landing-primary-btn" :to="{ name: 'register' }">
              Crear cuenta
            </RouterLink>
          </template>
        </div>
      </div>
    </header>

    <div class="landing-main">
      <!-- REQ-LND-01 / REQ-LND-02: Hero minimalista con selector de presets -->
      <section class="landing-hero">
        <div class="landing-container landing-hero-grid">
          <div class="landing-hero-copy">
            <p class="landing-eyebrow">Hardware de alto rendimiento</p>
            <h1>El hardware que impulsa tu próximo nivel</h1>
            <p class="landing-hero-subtitle">
              Procesadores, tarjetas gráficas, memorias y periféricos seleccionados
              para gamers, creadores y profesionales. Compra seguro y recibe en todo el país.
            </p>

            <div class="landing-preset-tabs" role="tablist" aria-label="Presets de setup">
              <button
                v-for="preset in PRESETS"
                :key="preset.id"
                :id="`preset-tab-${preset.id}`"
                type="button"
                role="tab"
                class="landing-preset-tab"
                :class="{ active: presetActivoId === preset.id }"
                :aria-selected="presetActivoId === preset.id ? 'true' : 'false'"
                @click="presetActivoId = preset.id"
              >
                {{ preset.label }}
              </button>
            </div>

            <div class="landing-hero-actions">
              <RouterLink
                class="landing-primary-btn landing-primary-btn-lg"
                :to="presetLink"
              >
                Explorar configuración
              </RouterLink>
              <a class="landing-secondary-btn" href="#simulador">Arma tu setup</a>
            </div>

            <ul class="landing-trust-inline">
              <li>Compra protegida</li>
              <li>Envíos asegurados</li>
              <li>Retiro con descuento</li>
            </ul>
          </div>

          <div class="landing-hero-showcase">
            <Transition name="preset-swap" mode="out-in">
              <article
                :key="presetActivo.id"
                class="landing-feature-card"
                :class="`landing-feature-card--${presetActivo.id}`"
                role="tabpanel"
                :aria-labelledby="`preset-tab-${presetActivo.id}`"
              >
                <div class="landing-feature-top">
                  <span class="landing-feature-badge">{{ presetActivo.etiqueta }}</span>
                  <span class="landing-feature-category">{{ insignia.categoria }}</span>
                </div>

                <div class="landing-feature-media">
                  <!-- REQ-SET-04: prioriza la fotografía real del producto; si no existe, usa el icono temático -->
                  <img
                    v-if="insignia.imagen"
                    class="landing-feature-photo"
                    :src="insignia.imagen"
                    :alt="insignia.nombre"
                  />
                  <img
                    v-else
                    :src="presetActivo.icon"
                    :alt="insignia.nombre"
                    class="landing-feature-icon"
                  />
                </div>

                <h2 class="landing-feature-name">{{ insignia.nombre }}</h2>
                <p class="landing-feature-spec">{{ insignia.especificacion }}</p>
                <p class="landing-feature-desc">{{ insignia.descripcion }}</p>

                <ul class="landing-feature-points">
                  <li v-for="punto in insignia.puntos" :key="punto">{{ punto }}</li>
                </ul>

                <div class="landing-feature-footer">
                  <div class="landing-feature-price">
                    <span>Desde</span>
                    <strong>{{ formatBs(insignia.precio) }}</strong>
                  </div>
                  <RouterLink class="landing-primary-btn" :to="presetLink">
                    Ver en catálogo
                  </RouterLink>
                </div>
              </article>
            </Transition>
          </div>
        </div>
      </section>

      <!-- REQ-LND-03 / REQ-LND-04: Simulador interactivo en 3 pasos -->
      <section id="simulador" class="landing-section landing-builder">
        <div class="landing-container">
          <div class="landing-section-head landing-section-head--center">
            <p class="landing-eyebrow">Simulador de presupuesto</p>
            <h2>Arma tu setup en 3 pasos</h2>
            <p class="landing-section-subtitle">
              Elige tu propósito, ajusta tu inversión y recibe una sugerencia al instante.
              Todo el cálculo ocurre en tu navegador, sin recargas.
            </p>
          </div>

          <div class="landing-builder-layout">
            <div class="landing-builder-controls">
              <div class="landing-step">
                <div class="landing-step-head">
                  <span class="landing-step-number">01</span>
                  <div>
                    <h3>Propósito del equipo</h3>
                    <p>¿Para qué usarás tu nuevo setup?</p>
                  </div>
                </div>

                <div class="landing-purpose-grid" role="group" aria-label="Propósito del equipo">
                  <button
                    v-for="proposito in PROPOSITOS"
                    :key="proposito.id"
                    type="button"
                    class="landing-purpose-btn"
                    :class="{ active: propositoActivo === proposito.id }"
                    :aria-pressed="propositoActivo === proposito.id ? 'true' : 'false'"
                    @click="propositoActivo = proposito.id"
                  >
                    <img
                      :src="proposito.icon"
                      alt=""
                      aria-hidden="true"
                      class="landing-purpose-icon"
                    />
                    <span class="landing-purpose-label">{{ proposito.label }}</span>
                    <span class="landing-purpose-hint">{{ proposito.hint }}</span>
                  </button>
                </div>
              </div>

              <div class="landing-step">
                <div class="landing-step-head">
                  <span class="landing-step-number">02</span>
                  <div>
                    <h3>Rango de inversión</h3>
                    <p>Desliza para ajustar tu presupuesto en Bolivianos.</p>
                  </div>
                </div>

                <div class="landing-slider-value">{{ formatBs(presupuesto) }}</div>
                <input
                  v-model.number="presupuesto"
                  class="landing-slider"
                  type="range"
                  min="2500"
                  max="25000"
                  step="250"
                  :style="sliderStyle"
                  :aria-valuetext="formatBs(presupuesto)"
                  aria-label="Presupuesto en Bolivianos"
                />
                <div class="landing-slider-scale">
                  <span>Bs. 2.500</span>
                  <span>Bs. 25.000</span>
                </div>
              </div>
            </div>

            <aside class="landing-suggestion" aria-live="polite">
              <div class="landing-suggestion-head">
                <span class="landing-suggestion-kicker">Paso 03 · Tu setup sugerido</span>
                <span class="landing-suggestion-chip">{{ propositoActivoInfo.label }}</span>
              </div>

              <ul class="landing-suggestion-list">
                <li v-for="fila in filasSugerencia" :key="fila.clave">
                  <span class="landing-suggestion-label">{{ fila.etiqueta }}</span>
                  <strong class="landing-suggestion-name">{{ fila.nombre }}</strong>
                  <span class="landing-suggestion-price">{{ fila.precioTexto }}</span>
                </li>
              </ul>

              <div class="landing-suggestion-total">
                <span>Total estimado</span>
                <strong>{{ formatBs(sugerencia.total) }}</strong>
              </div>

              <p class="landing-suggestion-note">
                Quedan <strong>{{ formatBs(sugerencia.restante) }}</strong> para placa madre,
                fuente, gabinete y periféricos.
              </p>

              <p v-if="sugerencia.omitidos.length" class="landing-suggestion-note landing-suggestion-warning">
                Sin stock o variante disponible:
                <strong>{{ nombresOmitidos }}</strong>
              </p>

              <p v-if="cargandoProductos" class="landing-suggestion-note">
                Cargando precios reales del catálogo…
              </p>

              <!-- REQ-SET-03: adición directa del setup real al carrito -->
              <button
                type="button"
                class="landing-primary-btn landing-primary-btn-block landing-add-setup-btn"
                :disabled="agregandoSetup || cargandoProductos || !puedeAgregarSetup"
                @click="agregarSetupAlCarrito"
              >
                <span v-if="agregandoSetup" class="landing-spinner" aria-hidden="true"></span>
                <AppIcon v-else name="cart-add" :size="18" />
                {{ agregandoSetup ? 'Agregando setup...' : 'Agregar setup al carrito' }}
              </button>
            </aside>
          </div>
        </div>
      </section>

      <!-- REQ-LND-05: Cuadrícula de categorías con micro-animaciones -->
      <section id="categorias" class="landing-section">
        <div class="landing-container">
          <div class="landing-section-head">
            <div>
              <p class="landing-eyebrow">Explora por categoría</p>
              <h2>Los componentes de tu próximo setup</h2>
            </div>
            <RouterLink class="landing-text-link" :to="{ name: 'catalog' }">
              Ver todas
            </RouterLink>
          </div>

          <div class="landing-category-grid">
            <RouterLink
              v-for="categoria in categoriasDestacadas"
              :key="categoria.id"
              class="landing-category-card"
              :to="{ name: 'catalog', query: { categoria: categoria.slug } }"
            >
              <div class="landing-category-media">
                <span class="landing-category-icon-wrap">
                  <img
                    class="landing-category-icon"
                    :src="categoria.icon"
                    :alt="`Icono de ${categoria.nombre}`"
                  />
                </span>
              </div>
              <div class="landing-category-body">
                <h3>{{ categoria.nombre }}</h3>
                <p>{{ categoria.descripcion }}</p>
                <span class="landing-category-cta">
                  Ver categoría
                  <span class="landing-arrow" aria-hidden="true">→</span>
                </span>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- REQ-LND-06: Franja de 4 beneficios clave -->
      <section class="landing-section landing-benefits">
        <div class="landing-container">
          <div class="landing-section-head landing-section-head--center">
            <p class="landing-eyebrow">Compra con confianza</p>
            <h2>Cuatro razones para elegir BytePro</h2>
          </div>

          <div class="landing-benefits-grid">
            <article class="landing-benefit-card">
              <span class="landing-benefit-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9.5 5 4h14l2 5.5" />
                  <path d="M4 9.5V20h16V9.5" />
                  <path d="M9.5 20v-5h5v5" />
                </svg>
              </span>
              <h3>Retiro en tienda con descuento</h3>
              <p>
                Ahorra <strong>7%</strong> en compras desde Bs. 500 y <strong>5%</strong> en
                compras menores al retirar en nuestras sucursales.
              </p>
            </article>

            <article class="landing-benefit-card">
              <span class="landing-benefit-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3 5 6v6c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
              <h3>Garantía oficial de hardware</h3>
              <p>
                Componentes 100% probados y con respaldo directo de cada marca.
              </p>
            </article>

            <article class="landing-benefit-card">
              <span class="landing-benefit-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 7h11v10H3z" />
                  <path d="M14 10h4l3 3v4h-7" />
                  <circle cx="7" cy="18" r="1.8" />
                  <circle cx="17" cy="18" r="1.8" />
                </svg>
              </span>
              <h3>Envíos asegurados a todo el país</h3>
              <p>
                Embalaje de alta protección para componentes delicados y
                seguimiento en tiempo real de tu pedido.
              </p>
            </article>

            <article class="landing-benefit-card">
              <span class="landing-benefit-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2.6" />
                  <path d="M6 9v6M18 9v6" />
                </svg>
              </span>
              <h3>Precios en moneda nacional</h3>
              <p>
                Todo en Bolivianos (Bs.), con facturación transparente y sin
                costos ocultos.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section class="landing-cta-section">
        <div class="landing-container">
          <div class="landing-cta">
            <h2>Arma el setup que siempre quisiste</h2>
            <p>Crea tu cuenta gratis, guarda tus favoritos y recibe ofertas exclusivas.</p>
            <div class="landing-cta-actions">
              <RouterLink class="landing-primary-btn landing-primary-btn-lg" :to="{ name: 'register' }">
                Crear cuenta gratis
              </RouterLink>
              <RouterLink class="landing-secondary-btn" :to="{ name: 'catalog' }">
                Explorar catálogo
              </RouterLink>
            </div>
          </div>
        </div>
      </section>
    </div>

    <footer class="landing-footer">
      <div class="landing-container landing-footer-grid">
        <div class="landing-footer-brand">
          <RouterLink class="landing-brand" :to="brandTarget">
            <img :src="byteproLogo" alt="BytePro" class="landing-brand-logo" />
            <span>BytePro</span>
          </RouterLink>
          <p>Hardware de alto rendimiento para gamers, creadores y profesionales.</p>
        </div>

        <div class="landing-footer-col">
          <h4>Enlaces</h4>
          <RouterLink :to="{ name: 'catalog' }">Productos</RouterLink>
          <a href="#simulador">Arma tu setup</a>
          <a href="#categorias">Categorías</a>
          <RouterLink :to="{ name: 'compare' }">Comparar</RouterLink>
        </div>

        <div class="landing-footer-col">
          <h4>Atención al cliente</h4>
          <RouterLink :to="{ name: 'help' }">Ayuda y reclamos</RouterLink>
          <RouterLink :to="{ name: 'tracking' }">Rastrear envío</RouterLink>
          <RouterLink :to="{ name: 'login' }">Iniciar sesión</RouterLink>
        </div>

        <div class="landing-footer-col">
          <h4>Para empresas</h4>
          <RouterLink :to="{ name: 'company-login' }">Portal corporativo</RouterLink>
          <RouterLink :to="{ name: 'register' }">Crear cuenta</RouterLink>
          <RouterLink :to="{ name: 'help' }">Contacto</RouterLink>
        </div>
      </div>

      <div class="landing-container landing-footer-bottom">
        <span>© {{ year }} BytePro. Todos los derechos reservados.</span>
        <span>Compra segura · Envíos a todo el país</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import api from '../services/api';
import byteproLogo from '../assets/icons/icon-bytepro.png';
import iconAccesorio from '../assets/icons/icon-accesorio.png';
import iconGrafica from '../assets/icons/icon-grafica.png';
import iconMemoria from '../assets/icons/icon-memoria.png';
import iconProcesador from '../assets/icons/icon-procesador.png';
import { useAuthStore } from '../store/auth';
import { useCartStore } from '../store/cart';
import { useCatalogStore } from '../store/catalog';
import { useUiStore } from '../store/ui';

const auth = useAuthStore();
const cart = useCartStore();
const catalog = useCatalogStore();
const ui = useUiStore();
const year = new Date().getFullYear();

// REQ-NAV-03: El brand lleva al catálogo cuando el cliente ya inició sesión.
const brandTarget = computed(() => {
  if (auth.isStaff) return '/admin';
  if (auth.isAuthenticated) return '/catalogo';
  return '/';
});

const formateadorBs = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatBs(valor) {
  return `Bs. ${formateadorBs.format(Number(valor) || 0)}`;
}

/* ---------- REQ-LND-01 / REQ-LND-02: presets del Hero ---------- */
const PRESETS = [
  {
    id: 'gaming',
    label: 'Gaming Ultra',
    etiqueta: 'Máximo FPS',
    categoria: 'Tarjetas Gráficas',
    nombre: 'GeForce RTX 4080 SUPER',
    especificacion: '16 GB GDDR6X · Ray Tracing',
    precio: 9850,
    descripcion: 'Domina 1440p y 4K con DLSS 3 y trazado de rayos en tiempo real.',
    puntos: [
      'Ray tracing en tiempo real',
      'DLSS 3 con generación de cuadros',
      'Ideal para 1440p a 240 Hz',
    ],
    icon: iconGrafica,
    categoriaCatalogo: 'tarjetas-graficas',
    categoriasProducto: ['tarjetas-graficas', 'tarjetas-grafica'],
    clavesProducto: ['4090', '4080', '4070', 'rtx'],
  },
  {
    id: 'creacion',
    label: 'Creación de Contenido',
    etiqueta: 'Render y 4K',
    categoria: 'Procesadores',
    nombre: 'AMD Ryzen 9 7950X',
    especificacion: '16 Cores / 32 Threads',
    precio: 5200,
    descripcion: 'Renderiza, edita y transmite sin cuellos de botella.',
    puntos: [
      '16 núcleos para multitarea pesada',
      'Hasta 5.7 GHz de frecuencia boost',
      'Perfecto para edición 4K y 3D',
    ],
    icon: iconProcesador,
    categoriaCatalogo: 'procesadores',
    categoriasProducto: ['procesadores'],
    clavesProducto: ['ryzen 9', 'ryzen 7', 'i9', 'i7'],
  },
  {
    id: 'oficina',
    label: 'Oficina & Productividad',
    etiqueta: 'Eficiencia',
    categoria: 'Memorias RAM',
    nombre: 'Kingston Fury Beast 32 GB',
    especificacion: '32 GB DDR5 6000 MHz',
    precio: 1150,
    descripcion: 'Fluidez total para trabajo, estudio y multitarea diaria.',
    puntos: [
      'Doble canal de alto rendimiento',
      'Bajo consumo y operación silenciosa',
      'Espacio para decenas de pestañas',
    ],
    icon: iconMemoria,
    categoriaCatalogo: 'memorias',
    categoriasProducto: ['memoria-ram', 'memorias', 'memoria'],
    clavesProducto: ['vengeance', 'fury', 'ddr5', 'ddr4'],
  },
];

const presetActivoId = ref('gaming');
const presetActivo = computed(
  () => PRESETS.find((preset) => preset.id === presetActivoId.value) || PRESETS[0]
);
const presetLink = computed(() => {
  const preset = presetActivo.value;
  const categoriaReal = (catalog.categorias || []).find((categoria) =>
    preset.categoriasProducto.includes(categoria.slug)
  );
  return {
    name: 'catalog',
    query: { categoria: categoriaReal?.slug || preset.categoriaCatalogo },
  };
});

/* ---------- REQ-SET-01 / REQ-SET-04: productos reales de la tienda ---------- */
const productosTienda = ref([...(catalog.items || [])]);
const cargandoProductos = ref(false);

const CATEGORIAS_SIMULADOR = {
  cpu: ['procesadores'],
  gpu: ['tarjetas-graficas', 'tarjetas-grafica'],
  ram: ['memoria-ram', 'memorias', 'memoria'],
  almacenamiento: ['almacenamiento', 'almacenamientos'],
};

function obtenerVariante(producto) {
  const variantes = producto?.variantes || [];
  return variantes.find((variante) => variante.disponible) || variantes[0] || null;
}

function obtenerImagen(producto, variante = null) {
  return (
    producto?.imagenPrincipal ||
    producto?.imagen ||
    (producto?.imagenes && producto.imagenes[0]) ||
    variante?.imagen ||
    (variante?.imagenes && variante.imagenes[0]) ||
    null
  );
}

async function cargarProductos() {
  cargandoProductos.value = true;
  try {
    const { data } = await api.get('/productos', {
      params: { page: 1, limit: 24, orden: 'precio_asc' },
    });
    const items = [...(data.items || [])];
    const totalPaginas = Number(data.pagination?.totalPages) || 1;
    if (totalPaginas > 1) {
      const respuestas = await Promise.all(
        Array.from({ length: totalPaginas - 1 }, (_, indice) =>
          api.get('/productos', {
            params: { page: indice + 2, limit: 24, orden: 'precio_asc' },
          })
        )
      );
      respuestas.forEach((respuesta) => {
        items.push(...(respuesta.data.items || []));
      });
    }
    productosTienda.value = items;
  } catch {
    // REQ-SET-01: si la API no responde se conserva el catálogo ya cargado o el fallback local.
    productosTienda.value = [...(catalog.items || [])];
  } finally {
    cargandoProductos.value = false;
  }
}

watch(
  () => catalog.items,
  (items) => {
    if (!productosTienda.value.length && items?.length) {
      productosTienda.value = [...items];
    }
  }
);

function buscarProductoPreset(preset) {
  const lista = productosTienda.value.length ? productosTienda.value : catalog.items || [];
  const deCategoria = lista.filter((producto) =>
    preset.categoriasProducto.includes(producto.categoria?.slug)
  );
  if (!deCategoria.length) return null;

  const texto = (producto) =>
    `${producto.nombre || ''} ${producto.marca || ''} ${producto.modelo || ''}`.toLowerCase();

  for (const clave of preset.clavesProducto) {
    const encontrado = deCategoria.find((producto) => texto(producto).includes(clave));
    if (encontrado) return encontrado;
  }
  return deCategoria[0];
}

function especificacionProducto(producto, fallback) {
  const specs = producto?.especificaciones || {};
  const slug = producto?.categoria?.slug;

  if (slug === 'tarjetas-graficas' || slug === 'tarjetas-grafica') {
    const partes = [specs.vram, specs.tipoMemoria].filter(Boolean);
    if (partes.length) return partes.join(' ');
  }
  if (slug === 'procesadores' && specs.nucleos) {
    return `${specs.nucleos} Cores / ${specs.hilos || '—'} Threads`;
  }
  if (slug === 'memoria-ram' || slug === 'memorias' || slug === 'memoria') {
    const partes = [specs.capacidad, specs.tipo, specs.velocidad].filter(Boolean);
    if (partes.length) return partes.join(' ');
  }
  if (slug === 'almacenamiento' || slug === 'almacenamientos') {
    const partes = [specs.capacidad, specs.tipo].filter(Boolean);
    if (partes.length) return partes.join(' ');
  }
  return fallback;
}

const insignia = computed(() => {
  const preset = presetActivo.value;
  const producto = buscarProductoPreset(preset);

  if (!producto) {
    return {
      ...preset,
      nombre: preset.nombre,
      categoria: preset.categoria,
      especificacion: preset.especificacion,
      precio: preset.precio,
      imagen: null,
    };
  }

  const variante = obtenerVariante(producto);
  return {
    ...preset,
    nombre: producto.nombre,
    categoria: producto.categoria?.nombre || preset.categoria,
    precio: Number(variante?.precio ?? producto.precio ?? preset.precio),
    especificacion: especificacionProducto(producto, preset.especificacion),
    imagen: obtenerImagen(producto, variante),
  };
});

/* ---------- REQ-LND-03 / REQ-LND-04: simulador "Arma tu Setup" ---------- */
const PROPOSITOS = [
  {
    id: 'gaming',
    label: 'Gaming',
    hint: 'Máximo FPS y fluidez',
    icon: iconGrafica,
  },
  {
    id: 'render',
    label: 'Render / 3D',
    hint: 'Edición y creación',
    icon: iconProcesador,
  },
  {
    id: 'oficina',
    label: 'Oficina / Estudio',
    hint: 'Productividad diaria',
    icon: iconAccesorio,
  },
];

const propositoActivo = ref('gaming');
const propositoActivoInfo = computed(
  () => PROPOSITOS.find((p) => p.id === propositoActivo.value) || PROPOSITOS[0]
);

const PRESUPUESTO_MIN = 2500;
const PRESUPUESTO_MAX = 25000;
const presupuesto = ref(8000);

const sliderProgreso = computed(
  () =>
    ((presupuesto.value - PRESUPUESTO_MIN) / (PRESUPUESTO_MAX - PRESUPUESTO_MIN)) * 100
);
const sliderStyle = computed(() => ({
  background: `linear-gradient(90deg, #2563eb ${sliderProgreso.value}%, #e2e8f0 ${sliderProgreso.value}%)`,
}));

// Catálogo local de componentes ordenado por precio ascendente.
const COMPONENTES = {
  cpu: {
    gaming: [
      { nombre: 'AMD Ryzen 3 4100', precio: 550 },
      { nombre: 'AMD Ryzen 5 5600', precio: 1150 },
      { nombre: 'AMD Ryzen 5 7600', precio: 1750 },
      { nombre: 'AMD Ryzen 7 7800X3D', precio: 3200 },
      { nombre: 'AMD Ryzen 9 7950X3D', precio: 5600 },
    ],
    render: [
      { nombre: 'AMD Ryzen 5 5600G', precio: 1050 },
      { nombre: 'AMD Ryzen 7 5700X', precio: 1450 },
      { nombre: 'AMD Ryzen 9 5900X', precio: 2400 },
      { nombre: 'AMD Ryzen 9 7900X', precio: 3900 },
      { nombre: 'AMD Ryzen 9 7950X', precio: 5200 },
    ],
    oficina: [
      { nombre: 'AMD Ryzen 3 4100', precio: 550 },
      { nombre: 'AMD Ryzen 5 5600G', precio: 1050 },
      { nombre: 'AMD Ryzen 5 7600', precio: 1750 },
      { nombre: 'AMD Ryzen 7 8700G', precio: 2200 },
      { nombre: 'AMD Ryzen 7 7700', precio: 2400 },
    ],
  },
  gpu: {
    gaming: [
      { nombre: 'NVIDIA GTX 1650', precio: 1050 },
      { nombre: 'NVIDIA RTX 3050', precio: 2100 },
      { nombre: 'NVIDIA RTX 4060', precio: 3000 },
      { nombre: 'NVIDIA RTX 4060 Ti', precio: 4100 },
      { nombre: 'NVIDIA RTX 4070 Super', precio: 6300 },
      { nombre: 'NVIDIA RTX 4080 Super', precio: 9800 },
      { nombre: 'NVIDIA RTX 4090', precio: 16500 },
    ],
    render: [
      { nombre: 'Gráficos integrados', precio: 0 },
      { nombre: 'NVIDIA GTX 1660 Super', precio: 1600 },
      { nombre: 'NVIDIA RTX 3060 12 GB', precio: 2800 },
      { nombre: 'NVIDIA RTX 4060 Ti 16 GB', precio: 4600 },
      { nombre: 'NVIDIA RTX 4070 Ti Super', precio: 7500 },
      { nombre: 'NVIDIA RTX 4080 Super', precio: 9800 },
      { nombre: 'NVIDIA RTX 4090', precio: 16500 },
    ],
    oficina: [
      { nombre: 'Gráficos integrados', precio: 0 },
      { nombre: 'NVIDIA GTX 1650', precio: 1050 },
      { nombre: 'NVIDIA RTX 3050', precio: 2100 },
      { nombre: 'NVIDIA RTX 4060', precio: 3000 },
    ],
  },
  ram: {
    gaming: [
      { nombre: '8 GB DDR4 3200 MHz', precio: 210 },
      { nombre: '16 GB DDR4 3200 MHz', precio: 380 },
      { nombre: '32 GB DDR4 3600 MHz', precio: 700 },
      { nombre: '32 GB DDR5 6000 MHz', precio: 1150 },
      { nombre: '64 GB DDR5 6000 MHz', precio: 2250 },
    ],
    render: [
      { nombre: '16 GB DDR4 3200 MHz', precio: 380 },
      { nombre: '32 GB DDR5 6000 MHz', precio: 1150 },
      { nombre: '64 GB DDR5 6000 MHz', precio: 2250 },
      { nombre: '64 GB DDR5 6400 MHz', precio: 2600 },
      { nombre: '128 GB DDR5 5600 MHz', precio: 4800 },
    ],
    oficina: [
      { nombre: '8 GB DDR4 3200 MHz', precio: 210 },
      { nombre: '16 GB DDR4 3200 MHz', precio: 380 },
      { nombre: '16 GB DDR5 5600 MHz', precio: 620 },
      { nombre: '32 GB DDR5 6000 MHz', precio: 1150 },
    ],
  },
  almacenamiento: {
    gaming: [
      { nombre: 'SSD 500 GB NVMe', precio: 320 },
      { nombre: 'SSD 1 TB NVMe', precio: 520 },
      { nombre: 'SSD 2 TB NVMe Gen4', precio: 980 },
      { nombre: 'SSD 2 TB NVMe Gen5', precio: 1450 },
    ],
    render: [
      { nombre: 'SSD 500 GB NVMe', precio: 320 },
      { nombre: 'SSD 1 TB NVMe', precio: 520 },
      { nombre: 'SSD 2 TB NVMe Gen4', precio: 980 },
      { nombre: 'SSD 4 TB NVMe Gen4', precio: 1900 },
    ],
    oficina: [
      { nombre: 'SSD 480 GB SATA', precio: 250 },
      { nombre: 'SSD 500 GB NVMe', precio: 320 },
      { nombre: 'SSD 1 TB NVMe', precio: 520 },
      { nombre: 'SSD 2 TB NVMe', precio: 980 },
    ],
  },
};

// Reparto porcentual del presupuesto según el propósito.
const REPARTO = {
  gaming: { cpu: 0.17, gpu: 0.66, ram: 0.09, almacenamiento: 0.08 },
  render: { cpu: 0.34, gpu: 0.4, ram: 0.14, almacenamiento: 0.12 },
  oficina: { cpu: 0.3, gpu: 0.12, ram: 0.22, almacenamiento: 0.2 },
};

function mejorComponente(lista, montoAsignado) {
  const asequibles = lista.filter((item) => item.precio <= montoAsignado);
  return asequibles.length ? asequibles[asequibles.length - 1] : lista[0];
}

const productosReales = computed(() => {
  const grupos = { cpu: [], gpu: [], ram: [], almacenamiento: [] };
  const lista = productosTienda.value || [];

  lista.forEach((producto) => {
    const slug = producto.categoria?.slug;
    if (!slug) return;
    const tipo = Object.keys(CATEGORIAS_SIMULADOR).find((clave) =>
      CATEGORIAS_SIMULADOR[clave].includes(slug)
    );
    if (!tipo) return;

    const variante = obtenerVariante(producto);
    const precio = Number(variante?.precio ?? producto.precio ?? 0);
    if (!producto.nombre || !Number.isFinite(precio)) return;

    grupos[tipo].push({
      id: producto.id,
      nombre: producto.nombre,
      marca: producto.marca || '',
      precio,
      imagen: obtenerImagen(producto, variante),
      varianteId: variante?.id ?? null,
      disponible: Boolean(variante?.disponible),
      esReal: true,
      tipo,
    });
  });

  Object.values(grupos).forEach((grupo) => grupo.sort((a, b) => a.precio - b.precio));
  return grupos;
});

function listaComponentes(tipo, proposito) {
  const reales = productosReales.value[tipo] || [];
  if (reales.length) return reales;
  return (COMPONENTES[tipo][proposito] || []).map((componente) => ({
    ...componente,
    varianteId: null,
    disponible: false,
    imagen: null,
    esReal: false,
    tipo,
  }));
}

const sugerencia = computed(() => {
  const proposito = propositoActivo.value;
  const reparto = REPARTO[proposito];
  const monto = presupuesto.value;

  const cpu = mejorComponente(listaComponentes('cpu', proposito), monto * reparto.cpu);
  const gpu = mejorComponente(listaComponentes('gpu', proposito), monto * reparto.gpu);
  const ram = mejorComponente(listaComponentes('ram', proposito), monto * reparto.ram);
  const almacenamiento = mejorComponente(
    listaComponentes('almacenamiento', proposito),
    monto * reparto.almacenamiento
  );

  const componentes = [cpu, gpu, ram, almacenamiento];
  const total = componentes.reduce((suma, componente) => suma + componente.precio, 0);
  const agregables = componentes.filter(
    (componente) => componente.varianteId && componente.disponible
  );
  const omitidos = componentes.filter(
    (componente) => !componente.varianteId || !componente.disponible
  );

  return {
    cpu,
    gpu,
    ram,
    almacenamiento,
    componentes,
    total,
    restante: Math.max(monto - total, 0),
    agregables,
    omitidos,
  };
});

const puedeAgregarSetup = computed(() => sugerencia.value.agregables.length > 0);
const nombresOmitidos = computed(() =>
  sugerencia.value.omitidos.map((componente) => componente.nombre).join(', ')
);

const agregandoSetup = ref(false);

async function agregarSetupAlCarrito() {
  if (agregandoSetup.value || !puedeAgregarSetup.value) return;

  agregandoSetup.value = true;
  const omitidos = [...sugerencia.value.omitidos];
  const avisos = [];
  let agregados = 0;

  try {
    for (const componente of sugerencia.value.agregables) {
      try {
        const resultado = await cart.add(componente.varianteId, 1, { silencioso: true });
        agregados += 1;
        if (resultado?.warning) avisos.push(resultado.warning);
      } catch {
        omitidos.push(componente);
      }
    }

    if (agregados > 0) {
      ui.openCartDrawer();
      ui.success('Setup completo agregado al carrito');
      if (omitidos.length) {
        ui.warning(`Componentes omitidos: ${omitidos.map((c) => c.nombre).join(', ')}`);
      }
      if (avisos.length) {
        ui.warning([...new Set(avisos)].join(' '));
      }
    } else {
      const detalle = omitidos.length
        ? `Componentes sin stock o variante: ${omitidos.map((c) => c.nombre).join(', ')}`
        : 'No se pudo agregar el setup al carrito';
      ui.warning(detalle);
    }
  } finally {
    agregandoSetup.value = false;
  }
}

const filasSugerencia = computed(() => {
  const s = sugerencia.value;
  return [
    {
      clave: 'cpu',
      etiqueta: 'Procesador (CPU)',
      nombre: s.cpu.nombre,
      precioTexto: formatBs(s.cpu.precio),
    },
    {
      clave: 'gpu',
      etiqueta: 'Tarjeta gráfica (GPU)',
      nombre: s.gpu.nombre,
      precioTexto: s.gpu.precio === 0 ? 'Incluida' : formatBs(s.gpu.precio),
    },
    {
      clave: 'ram',
      etiqueta: 'Memoria RAM',
      nombre: s.ram.nombre,
      precioTexto: formatBs(s.ram.precio),
    },
    {
      clave: 'almacenamiento',
      etiqueta: 'Almacenamiento',
      nombre: s.almacenamiento.nombre,
      precioTexto: formatBs(s.almacenamiento.precio),
    },
  ];
});

/* ---------- Categorías destacadas ---------- */
const CATEGORIAS_DESTACADAS = [
  {
    nombre: 'Procesadores',
    slug: 'procesadores',
    aliases: ['procesadores'],
    descripcion: 'Potencia multi-núcleo para gaming, render y multitarea.',
    icon: iconProcesador,
  },
  {
    nombre: 'Tarjetas Gráficas',
    slug: 'tarjetas-graficas',
    aliases: ['tarjetas-graficas', 'tarjetas-grafica'],
    descripcion: 'Ray tracing y máximos FPS en 1440p y 4K.',
    icon: iconGrafica,
  },
  {
    nombre: 'Memorias RAM',
    slug: 'memorias',
    aliases: ['memorias', 'memoria-ram'],
    descripcion: 'Velocidad y capacidad para trabajar sin límites.',
    icon: iconMemoria,
  },
  {
    nombre: 'Accesorios',
    slug: 'accesorios',
    aliases: ['accesorios'],
    descripcion: 'Periféricos y componentes para completar tu setup.',
    icon: iconAccesorio,
  },
];

const categoriasDestacadas = computed(() => {
  const disponibles = catalog.categorias || [];
  return CATEGORIAS_DESTACADAS.map((destacada) => {
    const encontrada = disponibles.find((categoria) =>
      destacada.aliases.includes(categoria.slug)
    );
    return {
      ...destacada,
      id: encontrada?.id ?? destacada.slug,
      slug: encontrada?.slug ?? destacada.slug,
    };
  });
});

onMounted(async () => {
  const tareas = [cargarProductos()];
  if (!catalog.categorias.length) {
    tareas.push(catalog.fetchCategorias());
  }
  await Promise.all(tareas);
});
</script>

<style scoped>
.landing-page {
  --lp-bg: #f8fafc;
  --lp-surface: #ffffff;
  --lp-border: #e2e8f0;
  --lp-border-strong: #cbd5e1;
  --lp-text: #0f172a;
  --lp-text-soft: #475569;
  --lp-muted: #64748b;
  --lp-accent: #2563eb;
  --lp-accent-dark: #1d4ed8;
  --lp-accent-soft: #eff6ff;
  --lp-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 20px -14px rgba(15, 23, 42, 0.18);
  --lp-shadow-md: 0 12px 24px -4px rgba(37, 99, 235, 0.08);
  --lp-shadow-lg: 0 28px 60px -30px rgba(15, 23, 42, 0.3);

  background: var(--lp-bg);
  color: var(--lp-text);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;

  /* REQ-MOB-FIX-01: contención absoluta del viewport, sin scroll horizontal */
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  overflow-x: clip;
  box-sizing: border-box;
}

.landing-main {
  /* REQ-MOB-FIX-01: el contenedor principal tampoco puede exceder el viewport */
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  overflow-x: clip;
  box-sizing: border-box;
}

/* REQ-MOB-FIX-02: el modelo de caja no suma padding/borde al ancho declarado */
.landing-page *,
.landing-page *::before,
.landing-page *::after {
  box-sizing: border-box;
}

.landing-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ---------- Cabecera ---------- */
.landing-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid var(--lp-border);
  backdrop-filter: blur(12px);
}

.landing-header-inner {
  display: flex;
  align-items: center;
  gap: 32px;
  min-height: 74px;
}

.landing-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
  color: var(--lp-text);
  text-decoration: none;
}

.landing-brand:hover {
  color: var(--lp-text);
}

.landing-brand-logo {
  width: 34px;
  height: 34px;
  object-fit: contain;
  display: block;
}

.landing-nav {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

.landing-nav a {
  color: var(--lp-text-soft);
  text-decoration: none;
  font-size: 0.87rem;
  font-weight: 500;
  transition: color 0.18s ease;
}

.landing-nav a:hover {
  color: var(--lp-accent);
}

.landing-nav a.router-link-active {
  color: var(--lp-accent);
  font-weight: 700;
}

.landing-header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.landing-link-btn {
  color: var(--lp-text-soft);
  text-decoration: none;
  font-size: 0.87rem;
  font-weight: 600;
}

.landing-link-btn:hover {
  color: var(--lp-accent);
}

.landing-primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--lp-accent);
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.87rem;
  padding: 12px 22px;
  border-radius: 12px;
  box-shadow: 0 12px 22px -14px rgba(37, 99, 235, 0.95);
  transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.landing-primary-btn:hover {
  background: var(--lp-accent-dark);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 16px 26px -14px rgba(37, 99, 235, 0.95);
}

.landing-primary-btn-lg {
  padding: 14px 28px;
  font-size: 0.93rem;
}

.landing-primary-btn-block {
  width: 100%;
  margin-top: 18px;
}

.landing-add-setup-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.landing-spinner {
  width: 16px;
  height: 16px;
  flex: none;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #ffffff;
  animation: landing-spin 0.7s linear infinite;
}

@keyframes landing-spin {
  to {
    transform: rotate(360deg);
  }
}

.landing-secondary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 13px 24px;
  border-radius: 12px;
  border: 1px solid var(--lp-border-strong);
  background: var(--lp-surface);
  color: var(--lp-text);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.87rem;
  transition: border-color 0.18s ease, color 0.18s ease, background-color 0.18s ease;
}

.landing-secondary-btn:hover {
  border-color: var(--lp-accent);
  color: var(--lp-accent-dark);
  background: var(--lp-accent-soft);
}

/* ---------- Hero ---------- */
.landing-hero {
  padding: 68px 0 60px;
  background:
    radial-gradient(circle at 86% 6%, rgba(37, 99, 235, 0.1), transparent 42%),
    linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.landing-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: 56px;
  align-items: center;
}

.landing-eyebrow {
  margin: 0;
  color: var(--lp-accent);
  font-weight: 700;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.landing-hero-copy h1 {
  margin: 14px 0 0;
  font-size: clamp(2.3rem, 4.2vw, 3.5rem);
  line-height: 1.05;
  letter-spacing: -0.035em;
  font-weight: 800;
  color: var(--lp-text);
}

.landing-hero-subtitle {
  margin: 18px 0 0;
  max-width: 540px;
  color: var(--lp-text-soft);
  font-size: 0.98rem;
  line-height: 1.65;
}

.landing-preset-tabs {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 28px;
  padding: 12px;
  background: var(--lp-surface);
  border: 1px solid var(--lp-border);
  border-radius: 30px;
  box-shadow: var(--lp-shadow-sm);
}

.landing-preset-tab {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 10px 18px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 0.83rem;
  font-weight: 600;
  color: var(--lp-text-soft);
  transition: background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.landing-preset-tab:hover {
  color: var(--lp-accent-dark);
  background: var(--lp-accent-soft);
}

.landing-preset-tab.active {
  background: var(--lp-accent);
  color: #ffffff;
  box-shadow: 0 10px 20px -10px rgba(37, 99, 235, 0.9);
}

.landing-preset-tab:focus-visible {
  outline: 2px solid var(--lp-accent);
  outline-offset: 2px;
}

.landing-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.landing-trust-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin: 26px 0 0;
  padding: 0;
  list-style: none;
  color: var(--lp-muted);
  font-size: 0.8rem;
}

.landing-trust-inline li {
  position: relative;
  padding-left: 18px;
}

.landing-trust-inline li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--lp-accent);
  font-weight: 700;
}

/* ---------- Tarjeta insignia del Hero ---------- */
.landing-hero-showcase {
  position: relative;
}

.landing-feature-card {
  background: var(--lp-surface);
  border: 1px solid var(--lp-border);
  border-radius: 24px;
  padding: 24px;
  box-shadow: var(--lp-shadow-lg);
}

.landing-feature-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.landing-feature-badge {
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--lp-accent-dark);
  background: var(--lp-accent-soft);
  padding: 6px 12px;
  border-radius: 999px;
}

.landing-feature-category {
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--lp-muted);
}

.landing-feature-media {
  position: relative;
  display: grid;
  place-items: center;
  height: 198px;
  margin-top: 18px;
  border-radius: 18px;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.9), transparent 62%),
    linear-gradient(135deg, #e0edff 0%, #eef2ff 60%, #e2e8f0 100%);
}

.landing-feature-media::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(37, 99, 235, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37, 99, 235, 0.06) 1px, transparent 1px);
  background-size: 28px 28px;
}

.landing-feature-card--creacion .landing-feature-media {
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.9), transparent 62%),
    linear-gradient(135deg, #ede9fe 0%, #f1f5ff 60%, #e2e8f0 100%);
}

.landing-feature-card--oficina .landing-feature-media {
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.9), transparent 62%),
    linear-gradient(135deg, #dcfce7 0%, #eefbf3 60%, #e2e8f0 100%);
}

.landing-feature-icon {
  position: relative;
  z-index: 1;
  width: 128px;
  height: 128px;
  object-fit: contain;
  filter: drop-shadow(0 18px 22px rgba(15, 23, 42, 0.18));
}

/* REQ-SET-04: fotografía real del producto con contención nítida */
.landing-feature-photo {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  padding: 14px;
  object-fit: contain;
  filter: drop-shadow(0 16px 22px rgba(15, 23, 42, 0.16));
}

.landing-feature-name {
  margin: 18px 0 0;
  font-size: 1.3rem;
  letter-spacing: -0.02em;
  color: var(--lp-text);
}

.landing-feature-spec {
  margin: 4px 0 0;
  font-size: 0.87rem;
  font-weight: 700;
  color: var(--lp-accent-dark);
}

.landing-feature-desc {
  margin: 10px 0 0;
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--lp-text-soft);
}

.landing-feature-points {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  font-size: 0.8rem;
  color: var(--lp-text-soft);
}

.landing-feature-points li {
  position: relative;
  padding-left: 18px;
}

.landing-feature-points li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--lp-accent);
  font-weight: 700;
}

.landing-feature-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--lp-border);
}

.landing-feature-price {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.landing-feature-price span {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--lp-muted);
}

.landing-feature-price strong {
  font-size: 1.3rem;
  letter-spacing: -0.02em;
  color: var(--lp-text);
}

/* Transición de conmutación de preset */
.preset-swap-enter-active,
.preset-swap-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.preset-swap-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.preset-swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ---------- Secciones ---------- */
.landing-section {
  padding: 72px 0;
}

.landing-section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 30px;
}

.landing-section-head h2 {
  margin: 8px 0 0;
  font-size: clamp(1.5rem, 2.4vw, 2rem);
  letter-spacing: -0.025em;
  color: var(--lp-text);
}

.landing-section-head--center {
  display: block;
  max-width: 620px;
  margin: 0 auto 38px;
  text-align: center;
}

.landing-section-subtitle {
  margin: 12px 0 0;
  color: var(--lp-text-soft);
  font-size: 0.92rem;
  line-height: 1.6;
}

.landing-text-link {
  flex: none;
  color: var(--lp-accent);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.86rem;
}

.landing-text-link:hover {
  color: var(--lp-accent-dark);
}

/* ---------- Simulador ---------- */
.landing-builder {
  background: #f8fafc;
  border-top: 1px solid var(--lp-border);
  border-bottom: 1px solid var(--lp-border);
}

.landing-builder-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr);
  gap: 24px;
  align-items: start;
}

.landing-step {
  background: var(--lp-surface);
  border: 1px solid var(--lp-border);
  border-radius: 20px;
  padding: 24px;
  box-shadow: var(--lp-shadow-sm);
}

.landing-step + .landing-step {
  margin-top: 20px;
}

.landing-step-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.landing-step-number {
  flex: none;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--lp-accent-soft);
  color: var(--lp-accent-dark);
  font-size: 0.82rem;
  font-weight: 800;
}

.landing-step-head h3 {
  margin: 0;
  font-size: 1rem;
  letter-spacing: -0.01em;
  color: var(--lp-text);
}

.landing-step-head p {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: var(--lp-muted);
}

.landing-purpose-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.landing-purpose-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 16px 10px;
  border: 1px solid var(--lp-border);
  border-radius: 16px;
  background: var(--lp-surface);
  font-family: inherit;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
}

.landing-purpose-btn:hover {
  border-color: #bfdbfe;
  background: var(--lp-accent-soft);
}

.landing-purpose-btn.active {
  border-color: var(--lp-accent);
  background: var(--lp-accent-soft);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.landing-purpose-btn:focus-visible {
  outline: 2px solid var(--lp-accent);
  outline-offset: 2px;
}

.landing-purpose-icon {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.landing-purpose-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--lp-text);
}

.landing-purpose-hint {
  font-size: 0.68rem;
  line-height: 1.3;
  color: var(--lp-muted);
}

.landing-slider-value {
  margin-top: 18px;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--lp-text);
}

.landing-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  margin-top: 12px;
  border-radius: 999px;
  outline: none;
  cursor: pointer;
}

.landing-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ffffff;
  border: 5px solid var(--lp-accent);
  box-shadow: 0 2px 10px rgba(37, 99, 235, 0.4);
  cursor: pointer;
}

.landing-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  border: 5px solid var(--lp-accent);
  box-shadow: 0 2px 10px rgba(37, 99, 235, 0.4);
  cursor: pointer;
}

.landing-slider:focus-visible {
  outline: 2px solid var(--lp-accent);
  outline-offset: 4px;
}

.landing-slider-scale {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.72rem;
  color: var(--lp-muted);
}

.landing-suggestion {
  padding: 26px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid #bfdbfe;
  border-radius: 24px;
  box-shadow: 0 24px 50px -30px rgba(37, 99, 235, 0.55);
}

.landing-suggestion-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.landing-suggestion-kicker {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--lp-accent-dark);
}

.landing-suggestion-chip {
  align-self: flex-start;
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--lp-accent-soft);
  color: var(--lp-accent-dark);
  font-size: 0.74rem;
  font-weight: 600;
}

.landing-suggestion-list {
  display: flex;
  flex-direction: column;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}

.landing-suggestion-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 12px;
  padding: 11px 0;
  border-bottom: 1px dashed var(--lp-border);
}

.landing-suggestion-label {
  grid-column: 1;
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--lp-muted);
}

.landing-suggestion-name {
  grid-column: 1;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--lp-text);
}

.landing-suggestion-price {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--lp-text-soft);
  white-space: nowrap;
}

.landing-suggestion-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  font-size: 0.85rem;
  color: var(--lp-text-soft);
}

.landing-suggestion-total strong {
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--lp-accent-dark);
}

.landing-suggestion-note {
  margin: 8px 0 0;
  font-size: 0.73rem;
  line-height: 1.5;
  color: var(--lp-muted);
}

.landing-suggestion-note strong {
  color: var(--lp-text-soft);
}

.landing-suggestion-warning {
  color: #b45309;
}

.landing-suggestion-warning strong {
  color: #92400e;
}

/* ---------- Categorías ---------- */
.landing-category-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.landing-category-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--lp-surface);
  border: 1px solid var(--lp-border);
  border-radius: 20px;
  text-decoration: none;
  color: inherit;
  box-shadow: var(--lp-shadow-sm);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.landing-category-card:hover {
  transform: translateY(-4px);
  border-color: #bfdbfe;
  box-shadow: 0 12px 24px -4px rgba(37, 99, 235, 0.08);
}

.landing-category-media {
  display: grid;
  place-items: center;
  height: 148px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid var(--lp-border);
}

.landing-category-icon-wrap {
  display: grid;
  place-items: center;
  width: 86px;
  height: 86px;
  border-radius: 20px;
  background: var(--lp-surface);
  border: 1px solid var(--lp-border);
  box-shadow: 0 10px 22px -14px rgba(15, 23, 42, 0.35);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.landing-category-card:hover .landing-category-icon-wrap {
  transform: scale(1.08);
  border-color: #bfdbfe;
  box-shadow: 0 16px 30px -16px rgba(37, 99, 235, 0.45);
}

.landing-category-icon {
  width: 58px;
  height: 58px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.landing-category-card:hover .landing-category-icon {
  transform: scale(1.06);
}

.landing-category-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px;
}

.landing-category-body h3 {
  margin: 0;
  font-size: 0.98rem;
  letter-spacing: -0.01em;
  color: var(--lp-text);
}

.landing-category-body p {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--lp-muted);
}

.landing-category-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--lp-accent);
}

.landing-arrow {
  transition: transform 0.25s ease;
}

.landing-category-card:hover .landing-arrow {
  transform: translateX(4px);
}

/* ---------- Beneficios ---------- */
.landing-benefits {
  background: var(--lp-surface);
  border-top: 1px solid var(--lp-border);
  border-bottom: 1px solid var(--lp-border);
}

.landing-benefits-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.landing-benefit-card {
  padding: 24px;
  background: var(--lp-surface);
  border: 1px solid var(--lp-border);
  border-radius: 20px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.landing-benefit-card:hover {
  transform: translateY(-3px);
  border-color: #bfdbfe;
  box-shadow: var(--lp-shadow-md);
}

.landing-benefit-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: var(--lp-accent-soft);
  color: var(--lp-accent);
}

.landing-benefit-icon svg {
  width: 24px;
  height: 24px;
}

.landing-benefit-card h3 {
  margin: 16px 0 6px;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
  color: var(--lp-text);
}

.landing-benefit-card p {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.55;
  color: var(--lp-text-soft);
}

.landing-benefit-card p strong {
  color: var(--lp-accent-dark);
}

/* ---------- CTA ---------- */
.landing-cta-section {
  padding: 72px 0;
}

.landing-cta {
  padding: 54px 28px;
  text-align: center;
  border: 1px solid #bfdbfe;
  border-radius: 26px;
  background:
    radial-gradient(circle at 15% 20%, rgba(37, 99, 235, 0.1), transparent 45%),
    linear-gradient(135deg, #eff6ff 0%, #ffffff 70%);
}

.landing-cta h2 {
  margin: 0;
  font-size: clamp(1.5rem, 2.6vw, 2rem);
  letter-spacing: -0.025em;
  color: var(--lp-text);
}

.landing-cta p {
  margin: 12px 0 26px;
  color: var(--lp-text-soft);
  font-size: 0.92rem;
}

.landing-cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

/* ---------- Footer ---------- */
.landing-footer {
  padding: 54px 0 26px;
  background: var(--lp-surface);
  border-top: 1px solid var(--lp-border);
}

.landing-footer-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 32px;
}

.landing-footer-brand p {
  margin: 14px 0 0;
  max-width: 280px;
  color: var(--lp-muted);
  font-size: 0.84rem;
  line-height: 1.6;
}

.landing-footer-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.landing-footer-col h4 {
  margin: 0 0 4px;
  font-size: 0.88rem;
  color: var(--lp-text);
}

.landing-footer-col a {
  color: var(--lp-muted);
  text-decoration: none;
  font-size: 0.84rem;
}

.landing-footer-col a:hover {
  color: var(--lp-accent);
}

.landing-footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 44px;
  padding-top: 20px;
  border-top: 1px solid var(--lp-border);
  color: var(--lp-muted);
  font-size: 0.78rem;
}

/* ---------- Responsive ---------- */
@media (max-width: 1023px) {
  .landing-hero {
    padding: 52px 0 46px;
  }

  .landing-hero-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .landing-builder-layout {
    grid-template-columns: 1fr;
  }

  .landing-category-grid,
  .landing-benefits-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .landing-footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 767px) {
  /* REQ-MOB-FIX-01 / REQ-MOB-FIX-03: contenedor móvil sin desbordes */
  .landing-container {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    padding: 0 14px;
  }

  /* REQ-MOB-FIX-02: los hijos flex/grid pueden encogerse por debajo de su min-content */
  .landing-container > *,
  .landing-header-inner > *,
  .landing-hero-grid > *,
  .landing-preset-tabs > *,
  .landing-hero-actions > *,
  .landing-trust-inline > *,
  .landing-feature-top > *,
  .landing-feature-points > *,
  .landing-feature-footer > *,
  .landing-section-head > *,
  .landing-builder-layout > *,
  .landing-step-head > *,
  .landing-purpose-grid > *,
  .landing-purpose-btn > *,
  .landing-slider-scale > *,
  .landing-suggestion-head > *,
  .landing-suggestion-list > *,
  .landing-suggestion-list li > *,
  .landing-suggestion-total > *,
  .landing-category-grid > *,
  .landing-category-card > *,
  .landing-category-body > *,
  .landing-benefits-grid > *,
  .landing-cta-actions > *,
  .landing-footer-grid > *,
  .landing-footer-col > *,
  .landing-footer-bottom > * {
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  /* REQ-MOB-FIX-03: cabecera móvil en una sola fila, branding a la izquierda y acciones a la derecha */
  .landing-header-inner {
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    min-height: 56px;
    padding: 8px 0;
  }

  /* REQ-LND-MOB-01: la barra de navegación se oculta por completo en móviles */
  .landing-nav {
    display: none;
  }

  .landing-header .landing-brand {
    flex: 0 0 auto;
    gap: 6px;
    font-size: 0.90rem;
  }

  .landing-header .landing-brand-logo {
    width: 26px;
    height: 26px;
  }

  /* REQ-LND-MOB-03 / REQ-LND-MOB-04: acciones alineadas a la derecha sin saltos de línea */
  .landing-header-actions {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    white-space: nowrap;
  }

  .landing-header-actions .landing-link-btn {
    font-size: 0.78rem;
    padding: 6px 8px;
    white-space: nowrap;
  }

  .landing-header-actions .landing-primary-btn {
    padding: 6px 12px;
    font-size: 0.78rem;
    border-radius: 10px;
    white-space: nowrap;
  }

  .landing-hero {
    padding: 40px 0 36px;
  }

  .landing-hero-copy h1 {
    font-size: 2.2rem;
  }

  .landing-hero-subtitle {
    font-size: 0.92rem;
  }

  /* REQ-MOB-FIX-04: presets apilados al 100% del ancho, sin desbordar */
  .landing-preset-tabs {
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
    max-width: 100%;
    border-radius: 14px;
    padding: 4px;
    gap: 4px;
  }

  .landing-preset-tab {
    width: 100%;
    min-width: 0;
    padding: 9px 12px;
    border-radius: 10px;
    font-size: 0.78rem;
    text-align: center;
    justify-content: center;
    white-space: normal;
    word-break: break-word;
  }

  /* REQ-MOB-FIX-05: acciones del Hero a ancho completo */
  .landing-hero-actions {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }

  .landing-hero-actions .landing-primary-btn,
  .landing-hero-actions .landing-secondary-btn {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .landing-trust-inline {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .landing-step {
    padding: 16px;
    border-radius: 16px;
  }

  .landing-slider-scale {
    font-size: 0.70rem;
  }

  .landing-feature-card {
    padding: 18px;
  }

  .landing-feature-media {
    height: 168px;
  }

  .landing-feature-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .landing-feature-footer .landing-primary-btn {
    width: 100%;
  }

  .landing-section {
    padding: 54px 0;
  }

  .landing-section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .landing-section-head--center {
    text-align: left;
  }

  .landing-purpose-grid {
    grid-template-columns: 1fr;
  }

  .landing-purpose-btn {
    flex-direction: row;
    justify-content: flex-start;
    gap: 12px;
    padding: 12px 14px;
    text-align: left;
  }

  .landing-purpose-label {
    flex: 1;
  }

  .landing-purpose-hint {
    display: none;
  }

  .landing-slider-value {
    font-size: 1.7rem;
  }

  .landing-suggestion {
    padding: 16px;
    border-radius: 16px;
  }

  .landing-suggestion-name {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .landing-category-grid,
  .landing-benefits-grid,
  .landing-footer-grid {
    grid-template-columns: 1fr;
  }

  .landing-cta {
    padding: 32px 16px;
    border-radius: 20px;
  }

  .landing-cta-actions {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }

  .landing-cta-actions .landing-primary-btn,
  .landing-cta-actions .landing-secondary-btn {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .landing-footer-bottom {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* REQ-MOB-FIX-03: compresión fluida en pantallas ultra compactas (<= 340px) */
@media (max-width: 340px) {
  .landing-container {
    padding: 0 10px;
  }

  .landing-header .landing-brand {
    gap: 5px;
    font-size: 0.82rem;
  }

  .landing-header .landing-brand-logo {
    width: 22px;
    height: 22px;
  }

  .landing-header-actions {
    gap: 4px;
  }

  .landing-header-actions .landing-link-btn {
    padding: 5px 5px;
    font-size: 0.70rem;
  }

  .landing-header-actions .landing-primary-btn {
    padding: 5px 9px;
    font-size: 0.70rem;
  }
}
</style>
