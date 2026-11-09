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
      <section class="landing-hero">
        <div class="landing-container landing-hero-grid">
          <div class="landing-hero-copy">
            <p class="landing-eyebrow">Hardware de alto rendimiento</p>
            <h1>BytePro</h1>
            <h2>Componentes y equipos para llevar tu setup al siguiente nivel</h2>
            <p class="landing-hero-subtitle">
              Procesadores, tarjetas gráficas, memorias y periféricos seleccionados
              para gamers, creadores y profesionales. Compra seguro y recibe en todo el país.
            </p>
            <div class="landing-hero-actions">
              <RouterLink class="landing-primary-btn landing-primary-btn-lg" :to="{ name: 'catalog' }">
                Explorar productos
              </RouterLink>
            </div>
            <ul class="landing-trust-inline">
              <li>Compra protegida</li>
              <li>Envíos asegurados</li>
              <li>Devoluciones simples</li>
            </ul>
          </div>

          <div class="landing-hero-media" aria-label="Imagen principal de BytePro">
            <div class="landing-hero-media-glow"></div>
            <div class="landing-hero-chip">
              <span class="landing-hero-chip-mark">BP</span>
              <span class="landing-hero-chip-label">BYTEPRO · PERFORMANCE HARDWARE</span>
            </div>
          </div>
        </div>
      </section>

      <section class="landing-brands">
        <div class="landing-container landing-brands-row">
          <span class="landing-brand-pill">Envío 24/48 h</span>
          <span class="landing-brand-pill">Garantía oficial</span>
          <span class="landing-brand-pill">Pago seguro</span>
          <span class="landing-brand-pill">Soporte especializado</span>
        </div>
      </section>

      <section id="categorias" class="landing-section">
        <div class="landing-container">
          <div class="landing-section-head">
            <h2>Explora por categoría</h2>
            <RouterLink class="landing-text-link" :to="{ name: 'catalog' }">
              Ver todas
            </RouterLink>
          </div>

          <div class="landing-category-grid">
            <RouterLink
              v-for="(categoria, index) in categoriasDestacadas"
              :key="categoria.id"
              class="landing-category-card"
              :class="`landing-category-card-${index + 1}`"
              :to="{ name: 'catalog', query: { categoria: categoria.slug } }"
            >
              <div class="landing-category-media">
                <span class="landing-category-bg" aria-hidden="true"></span>
                <span class="landing-category-icon-wrap">
                  <img
                    class="landing-category-icon"
                    :src="categoria.icon"
                    :alt="`Icono de ${categoria.nombre}`"
                  />
                </span>
                <span class="landing-category-media-label">{{ categoria.nombre }}</span>
              </div>
              <div class="landing-category-footer">
                <strong>{{ categoria.nombre }}</strong>
                <span class="landing-arrow" aria-hidden="true">→</span>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="landing-benefits">
        <div class="landing-container">
          <h2 class="landing-benefits-title">Por qué comprar con nosotros</h2>
          <div class="landing-benefits-grid">
            <article class="landing-benefit-card">
              <span class="landing-benefit-icon">✓</span>
              <h3>Productos verificados</h3>
              <p>Trabajamos con marcas oficiales y componentes probados antes de cada envío.</p>
            </article>
            <article class="landing-benefit-card">
              <span class="landing-benefit-icon">⚡</span>
              <h3>Entrega rápida y segura</h3>
              <p>Seguimiento en línea de tu pedido y embalaje protegido para hardware delicado.</p>
            </article>
            <article class="landing-benefit-card">
              <span class="landing-benefit-icon">★</span>
              <h3>Asesoría especializada</h3>
              <p>Te ayudamos a elegir compatibilidad, rendimiento y el mejor precio para tu equipo.</p>
            </article>
          </div>
        </div>
      </section>

      <section class="landing-cta-section">
        <div class="landing-container">
          <div class="landing-cta">
            <h2>Arma el setup que siempre quisiste</h2>
            <p>Crea tu cuenta gratis, guarda tus favoritos y recibe ofertas exclusivas.</p>
            <RouterLink class="landing-primary-btn landing-primary-btn-lg" :to="{ name: 'register' }">
              Crear cuenta gratis
            </RouterLink>
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
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import byteproLogo from '../assets/icons/icon-bytepro.png';
import iconAccesorio from '../assets/icons/icon-accesorio.png';
import iconGrafica from '../assets/icons/icon-grafica.png';
import iconMemoria from '../assets/icons/icon-memoria.png';
import iconProcesador from '../assets/icons/icon-procesador.png';
import { useAuthStore } from '../store/auth';
import { useCatalogStore } from '../store/catalog';

const auth = useAuthStore();
const catalog = useCatalogStore();
const year = new Date().getFullYear();

// REQ-NAV-03: El brand lleva al catálogo cuando el cliente ya inició sesión.
const brandTarget = computed(() => {
  if (auth.isStaff) return '/admin';
  if (auth.isAuthenticated) return '/catalogo';
  return '/';
});

// REQ-LAND-01: Cuatro categorías destacadas, en orden fijo y con icono propio.
const CATEGORIAS_DESTACADAS = [
  {
    nombre: 'Procesadores',
    slug: 'procesadores',
    aliases: ['procesadores'],
    icon: iconProcesador,
  },
  {
    nombre: 'Tarjetas Gráficas',
    slug: 'tarjetas-graficas',
    aliases: ['tarjetas-graficas', 'tarjetas-grafica'],
    icon: iconGrafica,
  },
  {
    nombre: 'Memorias RAM',
    slug: 'memorias',
    aliases: ['memorias', 'memoria-ram'],
    icon: iconMemoria,
  },
  {
    nombre: 'Accesorios',
    slug: 'accesorios',
    aliases: ['accesorios'],
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
  if (!catalog.categorias.length) {
    await catalog.fetchCategorias();
  }
});
</script>

<style scoped>
.landing-page {
  background: var(--color-white);
  color: var(--color-text);
}

.landing-container {
  width: 100%;
  max-width: 90%;
  margin: 0 auto;
  padding: 0 24px;
}

.landing-header {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-white);
  position: sticky;
  top: 0;
  z-index: 20;
}

.landing-header-inner {
  display: flex;
  align-items: center;
  gap: 32px;
  min-height: 72px;
}

.landing-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--color-text);
  text-decoration: none;
}

.landing-brand-logo {
  width: 38px;
  height: 38px;
  object-fit: contain;
  display: block;
}

.landing-brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--color-bg-muted);
  display: grid;
  place-items: center;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  color: var(--color-primary);
}

.landing-nav {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

.landing-nav a {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.92rem;
  font-weight: 500;
}

.landing-nav a:hover {
  color: var(--color-primary);
}

/* REQ-NAV-05: Enlace activo resaltado de forma persistente */
.landing-nav a.router-link-active {
  color: var(--color-primary);
  font-weight: 700;
}

.landing-header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.landing-link-btn {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.92rem;
  font-weight: 600;
}

.landing-link-btn:hover {
  color: var(--color-primary);
}

.landing-primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--color-primary);
  color: var(--color-white);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 11px 20px;
  border-radius: var(--radius-md);
  transition: background 0.2s ease;
}

.landing-primary-btn:hover {
  background: var(--color-primary-dark);
}

.landing-primary-btn-lg {
  padding: 14px 26px;
  font-size: 0.98rem;
}

.landing-hero {
  padding: 72px 0 56px;
}

.landing-hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: center;
}

.landing-eyebrow {
  margin: 0 0 12px;
  color: var(--color-primary);
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.landing-hero-copy h1 {
  margin: 0;
  font-size: 4rem;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--color-text);
}

.landing-hero-copy h2 {
  margin: 18px 0 0;
  font-size: 1.85rem;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.landing-hero-subtitle {
  margin: 18px 0 0;
  max-width: 560px;
  color: var(--color-text-secondary);
  font-size: 1rem;
  line-height: 1.6;
}

.landing-hero-actions {
  margin-top: 28px;
}

.landing-trust-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin: 26px 0 0;
  padding: 0;
  list-style: none;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.landing-trust-inline li {
  position: relative;
  padding-left: 18px;
}

.landing-trust-inline li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--color-success);
  font-weight: 700;
}

.landing-hero-media {
  position: relative;
  min-height: 400px;
  border-radius: var(--radius-3xl);
  background: linear-gradient(135deg, #eef2ff 0%, #f3f4f6 55%, #e5e7eb 100%);
  display: grid;
  place-items: center;
  overflow: hidden;
}

.landing-hero-media::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(37, 99, 235, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37, 99, 235, 0.06) 1px, transparent 1px);
  background-size: 34px 34px;
}

.landing-hero-media-glow {
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, rgba(37, 99, 235, 0) 70%);
}

.landing-hero-chip {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 44px 52px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(6px);
}

.landing-hero-chip-mark {
  width: 84px;
  height: 84px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  background: var(--color-primary);
  color: var(--color-white);
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.landing-hero-chip-label {
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  color: var(--color-text-muted);
  font-weight: 700;
  text-align: center;
}

.landing-brands {
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  padding: 22px 0;
}

.landing-brands-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.landing-brand-pill {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: var(--color-bg-muted);
  color: var(--color-text-muted);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  padding: 14px 16px;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: default;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease,
    color 0.25s ease, border-color 0.25s ease;
}

.landing-brand-pill::before {
  content: '';
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
  transition: width 0.25s ease, height 0.25s ease, box-shadow 0.25s ease,
    background-color 0.25s ease;
}

.landing-brand-pill:nth-child(2)::before {
  background: #7c3aed;
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
}

.landing-brand-pill:nth-child(3)::before {
  background: #047857;
  box-shadow: 0 0 0 4px rgba(4, 120, 87, 0.12);
}

.landing-brand-pill:nth-child(4)::before {
  background: #b45309;
  box-shadow: 0 0 0 4px rgba(180, 83, 9, 0.12);
}

.landing-brand-pill:hover {
  transform: translateY(-4px);
  background: var(--color-white);
  color: var(--color-primary-dark);
  border-color: rgba(37, 99, 235, 0.25);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.12);
}

.landing-brand-pill:hover::before {
  width: 12px;
  height: 12px;
  background: var(--color-primary-dark);
  box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.16);
}

.landing-section {
  padding: 72px 0;
}

.landing-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 26px;
}

.landing-section-head h2 {
  margin: 0;
  font-size: 1.7rem;
  letter-spacing: -0.02em;
}

.landing-text-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}

.landing-category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.landing-category-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  background: var(--color-white);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.landing-category-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-primary);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.12);
}

/* REQ-LAND-02: icono visible en reposo y fondo temático revelado en hover */
.landing-category-media {
  position: relative;
  height: 170px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--color-bg-muted);
}

.landing-category-bg {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: scale(1.08);
  pointer-events: none;
  transition: opacity 0.45s ease, transform 0.55s ease;
}

.landing-category-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 82% 18%, rgba(255, 255, 255, 0.65), transparent 42%),
    linear-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.16) 1px, transparent 1px);
  background-size: auto, 26px 26px, 26px 26px;
}

.landing-category-card:hover .landing-category-bg {
  opacity: 1;
  transform: scale(1);
}

.landing-category-card-1 .landing-category-bg {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 55%, #93c5fd 100%);
}

.landing-category-card-2 .landing-category-bg {
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 55%, #c4b5fd 100%);
}

.landing-category-card-3 .landing-category-bg {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 55%, #86efac 100%);
}

.landing-category-card-4 .landing-category-bg {
  background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 55%, #fdba74 100%);
}

.landing-category-icon-wrap {
  position: relative;
  z-index: 1;
  width: 92px;
  height: 92px;
  display: grid;
  place-items: center;
  border-radius: 24px;
  background: var(--color-white);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}

.landing-category-card:hover .landing-category-icon-wrap {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.18);
}

.landing-category-icon {
  width: 68px;
  height: 68px;
  object-fit: contain;
  transition: transform 0.35s ease;
}

.landing-category-card:hover .landing-category-icon {
  transform: scale(1.06) rotate(-2deg);
}

.landing-category-media-label {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 12px;
  z-index: 1;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.3s ease, transform 0.3s ease, color 0.3s ease;
}

.landing-category-card:hover .landing-category-media-label {
  opacity: 1;
  transform: translateY(0);
  color: var(--color-text);
}

.landing-category-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  font-size: 0.95rem;
}

.landing-arrow {
  color: var(--color-primary);
  font-size: 1.05rem;
  transition: transform 0.25s ease;
}

.landing-category-card:hover .landing-arrow {
  transform: translateX(4px);
}

.landing-benefits {
  background: var(--color-bg);
  padding: 72px 0;
}

.landing-benefits-title {
  margin: 0 0 34px;
  text-align: center;
  font-size: 1.8rem;
  letter-spacing: -0.02em;
}

.landing-benefits-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}

.landing-benefit-card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 28px;
}

.landing-benefit-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 1.25rem;
  font-weight: 800;
}

.landing-benefit-card h3 {
  margin: 18px 0 8px;
  font-size: 1.05rem;
}

.landing-benefit-card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
}

.landing-cta-section {
  padding: 72px 0;
}

.landing-cta {
  background: var(--color-primary-soft);
  border-radius: var(--radius-3xl);
  padding: 58px 24px;
  text-align: center;
}

.landing-cta h2 {
  margin: 0;
  font-size: 1.9rem;
  letter-spacing: -0.02em;
}

.landing-cta p {
  margin: 12px 0 26px;
  color: var(--color-text-secondary);
}

.landing-footer {
  border-top: 1px solid var(--color-border);
  padding: 54px 0 26px;
  background: var(--color-white);
}

.landing-footer-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 32px;
}

.landing-footer-brand p {
  margin: 14px 0 0;
  max-width: 280px;
  color: var(--color-text-muted);
  font-size: 0.88rem;
  line-height: 1.6;
}

.landing-footer-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.landing-footer-col h4 {
  margin: 0 0 4px;
  font-size: 0.92rem;
}

.landing-footer-col a {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.88rem;
}

.landing-footer-col a:hover {
  color: var(--color-primary);
}

.landing-footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 44px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

@media (max-width: 1023px) {
  .landing-hero-grid {
    grid-template-columns: 1fr;
    gap: 36px;
  }

  .landing-hero-media {
    min-height: 300px;
  }

  .landing-category-grid,
  .landing-brands-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .landing-benefits-grid {
    grid-template-columns: 1fr;
  }

  .landing-footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 767px) {
  .landing-header-inner {
    flex-wrap: wrap;
    gap: 14px;
    padding: 14px 0;
  }

  .landing-nav {
    order: 3;
    flex-basis: 100%;
    gap: 16px;
    overflow-x: auto;
  }

  .landing-header-actions {
    margin-left: auto;
  }

  .landing-hero {
    padding: 44px 0 36px;
  }

  .landing-hero-copy h1 {
    font-size: 2.9rem;
  }

  .landing-hero-copy h2 {
    font-size: 1.45rem;
  }

  .landing-category-grid,
  .landing-brands-row,
  .landing-footer-grid {
    grid-template-columns: 1fr;
  }

  .landing-footer-bottom {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
