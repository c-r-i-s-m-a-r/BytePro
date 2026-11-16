# Especificación EARS: Rediseño Interactivo y Minimalista Moderno de la Landing Page de BytePro

- **Módulo**: E-commerce / Landing Page (`requirements/ecomerce.md`)
- **Estado**: Aprobado por el usuario (Listo para plan/implementación)
- **Autor**: `especificador`
- **Código**: `SPEC-021-landing-page-rediseño-interactivo`
- **Estilo Visual Seleccionado**: **Retail Minimalista Moderno** (fondo claro limpio `#F8FAFC`, tipografía elegante `Inter`, sombras suaves y acentos en azul eléctrico `#2563EB`).
- **Referencias**:
  - `SPEC-002-ecommerce-catalogo.md`
  - `SPEC-010-interfaz-diseno-ux.md`
  - `SPEC-015-moneda-bolivianos-accesorios-dashboard-analitico.md`
  - `SPEC-016-comparador-comunicados-ajustes-retiro-tienda.md`

---

## 1. Hero Section con Showcase Interactivo y Selector de Presets de Setup

- **[REQ-LND-01] Acción (Hero Minimalista con Selector de Presets de Setup):**  
  La sección Hero DEBE presentar una estética limpia en fondo claro (`#F8FAFC` o blanco puro) con tipografía contrastada y un **selector interactivo de presets de uso** compuesto por 3 pestañas redondeadas:
  1. **Gaming Ultra**: Enfocado en máxima tasa de cuadros y trazado de rayos (GPU dedicada de alto rendimiento, CPU multi-núcleo y RAM rápida).
  2. **Creación de Contenido**: Enfocado en render 3D, edición 4K y multitarea pesada (CPU de alta frecuencia, 32GB/64GB RAM y almacenamiento NVMe ultrarrápido).
  3. **Oficina y Productividad**: Enfocado en fluidez extrema, bajo consumo, silencio y eficiencia para estaciones de trabajo.

- **[REQ-LND-02] Evento (Conmutación Reactiva del Componente Insignia en el Hero):**  
  Cuando el usuario seleccione cualquiera de los presets en el Hero:
  1. El sistema DEBE actualizar instantáneamente y de forma fluida (con transición de fade/desplazamiento suave) la tarjeta visual del componente insignia, mostrando su fotografía, nombre, especificación destacada (ej. VRAM, Cores/Threads, Frecuencia) y precio base de referencia en Bolivianos (`Bs.`).
  2. El botón principal de llamada a la acción ("Explorar configuración") DEBE actualizar su enlace para dirigir al catálogo filtrando por los componentes recomendados para ese perfil específico.

---

## 2. Simulador Interactivo de Presupuesto ("Arma tu Setup en 3 Pasos")

- **[REQ-LND-03] Acción (Simulador Interactivo de Hardware por Presupuesto en Bs.):**  
  La Landing Page DEBE incorporar una herramienta interactiva moderna en 3 pasos accesible para cualquier visitante:
  - **Paso 1: Propósito del Equipo**: Tres botones/tarjetas de selección táctil (Gaming, Trabajo/Render, Uso General/Estudio).
  - **Paso 2: Rango de Inversión (Slider Dinámico)**: Una barra deslizante interactiva (*slider*) con rango de **2.500 Bs. a 25.000 Bs.** (con paso de 250 Bs.), mostrando el monto seleccionado en tiempo real en formato moneda boliviana (`Bs.`).
  - **Paso 3: Sugerencia Inteligente de Componentes**: De acuerdo al rango de presupuesto y propósito seleccionado, el simulador DEBE desplegar en una tarjeta elegante el desglose sugerido:
    * **Procesador (CPU)** recomendado.
    * **Tarjeta Gráfica (GPU)** sugerida.
    * **Memoria RAM** óptima.
    * **Almacenamiento** base.
    * **Presupuesto total estimado** y botón directo: *"Ver estos componentes en el Catálogo"*.

- **[REQ-LND-04] Acción (Interacción Rápida y Fluidez sin Recargar):**  
  Todo el cálculo y actualización de la configuración sugerida en el simulador DEBE ejecutarse de forma 100% reactiva en el cliente (Vue 3 reactive/computed) sin requerir peticiones de red bloqueantes, garantizando una respuesta instantánea mientras el visitante desliza la barra de presupuesto.

---

## 3. Cuadrícula de Categorías Enriquecida con Micro-interacciones

- **[REQ-LND-05] Acción (Tarjetas de Categoría con Elevación y Micro-animaciones):**  
  La cuadrícula de categorías destacadas (Procesadores, Tarjetas Gráficas, Memorias RAM, Accesorios) DEBE mantener la paleta minimalista clara con las siguientes micro-interacciones:
  1. Efecto de elevación suave (*lift on hover*: `transform: translateY(-4px)` con sombra difusa `box-shadow: 0 12px 24px -4px rgba(37, 99, 235, 0.08)`).
  2. Animación sutil de escala en el icono central al pasar el cursor.
  3. Enlace directo al catálogo con el parámetro de categoría pre-filtrado.

---

## 4. Franja de Beneficios Clave y Retiro en Tienda

- **[REQ-LND-06] Acción (Pilares de Compra y Beneficio de Retiro en Tienda):**  
  La Landing Page DEBE consolidar 4 pilares en tarjetas limpias con iconos SVG:
  1. **Retiro en Tienda con Descuento**: Recordatorio del 7% (>= 500 Bs.) y 5% (< 500 Bs.) en sucursales físicas.
  2. **Garantía Oficial de Hardware**: Componentes 100% probados y con respaldo oficial de marca.
  3. **Envíos Asegurados a Todo el País**: Embalaje de alta protección para componentes delicados y tracking en tiempo real.
  4. **Precios en Moneda Nacional (Bs.)**: Facturación transparente y sin costos ocultos.
