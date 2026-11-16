# SPEC-024: Corrección de Desbordamiento y Eliminación de Scroll Horizontal en Vista Móvil

## 1. Contexto y Diagnóstico
En la vista móvil (`viewport <= 767px`) de la Landing Page ([LandingView.vue](file:///home/crismar/University/sis324/BytePro/frontend/src/views/LandingView.vue)), varios elementos estructurales presentan anchos intrínsecos (`min-content`) que superan el 100% del ancho del dispositivo, provocando la aparición de una barra de desplazamiento horizontal no deseada.

Entre los factores identificados:
1. Comportamiento por defecto de CSS Flexbox y CSS Grid donde el `min-width` inicial de los hijos es `auto` (calculando el ancho mínimo de contenido y negándose a encogerse si hay textos largos o botones con `white-space: nowrap`).
2. La cabecera móvil (`.landing-header-inner`) con `.landing-brand` a la izquierda y dos botones en `.landing-header-actions` a la derecha que, combinados con el padding lateral del contenedor y el tamaño de fuente global escalado (`html { font-size: 114%; }`), superan los 320px–360px de ancho disponible.
3. Las pestañas de presets del Hero (`.landing-preset-tabs` con "Gaming Ultra", "Creación de Contenido", "Oficina y Rendimiento"), cuyos anchos acumulados superan los 450px en una sola fila.
4. Botones de acción del Hero (`.landing-hero-actions`) y CTA (`.landing-cta-actions`) con padding horizontal extenso (`padding: 14px 28px`) que no se adaptan al 100% del contenedor en pantallas pequeñas.
5. Ausencia de contención estricta contra desbordamientos (`overflow-x: clip` o `overflow-x: hidden`) en `.landing-page` y `.landing-main`.

---

## 2. Requerimientos Funcionales en Sintaxis EARS

### REQ-MOB-FIX-01: Contención Absoluta del Viewport sin Scroll Horizontal
- **Tipo**: Ubicuo / Restricción Global.
- **Enunciado**: El sistema **debe** garantizar que la landing page (`.landing-page`), su contenedor principal (`.landing-main`) y todas sus secciones no excedan el 100% del ancho de la ventana gráfica (`width: 100%; max-width: 100vw; overflow-x: hidden; box-sizing: border-box;`), impidiendo cualquier aparición de barra o movimiento de scroll horizontal en cualquier dispositivo con ancho entre 320px y 767px.

### REQ-MOB-FIX-02: Reseteo de `min-width: 0` y Flexibilidad en Componentes
- **Tipo**: Regla de renderizado responsive.
- **Enunciado**: Cuando la pantalla sea menor o igual a 767px, todos los elementos flexibles (`display: flex`) y de cuadrícula (`display: grid`) de la landing page **deben** tener explícitamente `min-width: 0; max-width: 100%; box-sizing: border-box;`, permitiendo que el navegador comprima adecuadamente los textos, tarjetas e ilustraciones sin forzar desbordamiento.

### REQ-MOB-FIX-03: Cabecera Móvil Totalmente Auto-Ajustable (320px–480px)
- **Tipo**: Basado en estado móvil.
- **Enunciado**: Mientras se visualice la cabecera en dispositivos móviles (`<= 767px`), el contenedor `.landing-header-inner` y sus elementos hijos **deben** adaptarse fluidamente sin salirse del contenedor:
  - `.landing-container` en móviles: `padding: 0 14px; width: 100%; max-width: 100%; box-sizing: border-box;`.
  - `.landing-brand`: icono de 26x26px, texto de 0.90rem y `gap: 6px`.
  - `.landing-header-actions`: `gap: 6px`, botón de texto con `font-size: 0.78rem; padding: 6px 8px;` y botón primario con `font-size: 0.78rem; padding: 6px 12px; border-radius: 10px;`.
  - En pantallas ultra compactas (`<= 340px`), permitir compresión fluida o reducción proporcional sin desborde.

### REQ-MOB-FIX-04: Adaptación Fluida de Pestañas de Presets en el Hero
- **Tipo**: Basado en eventos / responsive.
- **Enunciado**: Cuando el viewport sea menor o igual a 767px, el selector de presets `.landing-preset-tabs` **debe** organizarse en una cuadrícula o lista adaptable (`display: grid; grid-template-columns: 1fr;` o flex en columna) donde cada botón `.landing-preset-tab` tome el 100% del ancho disponible, con texto centrado, `min-width: 0`, `white-space: normal` y padding táctil cómodo (`8px 12px`), eliminando cualquier desborde horizontal.

### REQ-MOB-FIX-05: Botones de Acción y Pilares de Confianza al 100% de Ancho
- **Tipo**: Basado en estado.
- **Enunciado**: Cuando el viewport sea menor o igual a 767px:
  - Los contenedores `.landing-hero-actions` y `.landing-cta-actions` **deben** estructurarse en columna (`flex-direction: column; width: 100%;`), y sus botones hijos (`.landing-primary-btn`, `.landing-secondary-btn`) deben adoptar ancho completo (`width: 100%; text-align: center; justify-content: center;`).
  - La lista `.landing-trust-inline` debe ordenarse en columna (`flex-direction: column; gap: 8px;`) con alineación a la izquierda.

---

## 3. Criterios de Aceptación y Pruebas

1. **Prueba de Scroll Horizontal en Viewports Extremos**:
   - En viewports de 320px, 360px, 375px, 414px y 767px, la propiedad calculada `document.documentElement.scrollWidth <= document.documentElement.clientWidth` debe ser estrictamente verdadera (`true`).
   - El scroll horizontal es nulo (`0px` de overflow).
2. **Prueba de Dimensiones de Header**:
   - En una pantalla de 320px, tanto `.landing-brand` como `.landing-header-actions` conviven sin desbordar el borde derecho ni encimarse.
3. **Prueba de Pestañas de Presets**:
   - Ninguna pestaña de preset genera anchura mayor a 100% del contenedor.
4. **Prueba de Compilación**:
   - `npm --prefix frontend run build` finaliza con código 0 y 0 errores.
