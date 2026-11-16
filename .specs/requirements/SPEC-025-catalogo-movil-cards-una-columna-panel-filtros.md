# SPEC-025: Adaptación Móvil del Catálogo: Productos a Una Columna y Reducción del Panel de Filtros

## 1. Contexto y Diagnóstico
En la vista del catálogo de productos ([CatalogView.vue](file:///home/crismar/University/sis324/BytePro/frontend/src/views/CatalogView.vue)), en dispositivos móviles (`viewport <= 767px`), se presentan múltiples problemas de desbordamiento horizontal y usabilidad:

1. **Cuadrícula de productos forzada a 2 columnas**:
   - En pantallas móviles estrechas (320px–414px), `.product-grid` forzaba `repeat(2, minmax(0, 1fr))`. Cada tarjeta contaba con menos de 160px de ancho disponible, provocando que los botones de acción ("Agregar al carrito", "Ver detalle", "Comparar") se desbordaran o se encimaran.
   - El usuario solicita expresamente: *"Las cards de productos pueden entrar en uno por fila"*.
2. **Desbordamiento horizontal por `.select-inline`**:
   - En `.catalog-toolbar`, los selectores de "Ordenar" y "Mostrar" utilizan la clase `.select-inline` con un `min-width: 190px` fijo. Al situarse en línea junto a etiquetas y espaciados, su ancho acumulado superaba los 460px, generando un scroll horizontal destructivo en la página del catálogo.
3. **Panel de filtros voluminoso y desproporcionado**:
   - `.filters-panel` en móviles mantiene paddings excesivos (`var(--space-5)` = 23px) y espaciados amplios entre cada grupo de atributos, ocupando una altura desmesurada y desbordando en pantallas compactas. Requiere una versión compacta y optimizada para pantallas táctiles.

---

## 2. Requerimientos Funcionales en Sintaxis EARS

### REQ-CAT-MOB-01: Cuadrícula de Productos a Una Sola Columna en Móviles
- **Tipo**: Regla responsive / Basado en viewport.
- **Enunciado**: Cuando la pantalla sea menor o igual a 767 píxeles (`@media (max-width: 767px)`), el sistema **debe** renderizar `.product-grid` y `.loading-grid` en una sola columna (`grid-template-columns: 1fr; gap: var(--space-4); width: 100%;`), permitiendo que cada tarjeta de producto (`.product-card`) aproveche el ancho completo del contenedor.

### REQ-CAT-MOB-02: Reducción y Compactación del Panel de Filtros
- **Tipo**: Regla responsive / Basado en estado móvil.
- **Enunciado**: Mientras el catálogo se visualice en resoluciones móviles (`<= 767px`), el panel de filtros `.filters-panel` **debe** reducir sus dimensiones y espaciados:
  - `padding: var(--space-3) var(--space-4);`
  - Grupos de filtro `.filter-group` con `padding: var(--space-2) 0;`
  - Selectores e inputs con `height: 38px; font-size: 13px;`
  - El encabezado `.filters-header` debe incorporar un control colapsable/acordeón o diseño plegable que permita al usuario desplegar u ocultar los filtros en móviles para acceder de inmediato a los productos.

### REQ-CAT-MOB-03: Reseteo de Ancho en Selectores de Barra de Herramientas
- **Tipo**: Ubicuo / Corrección de Desbordamiento.
- **Enunciado**: Cuando el viewport sea menor o igual a 767px, el sistema **debe** anular el `min-width: 190px` de `.select-inline`, estableciendo `min-width: 0; width: 100%;`, y reorganizar `.toolbar-controls` en una cuadrícula fluida de 2 columnas (`display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); width: 100%;`), eliminando cualquier desborde horizontal en la cabecera del catálogo.

### REQ-CAT-MOB-04: Adaptación de Acciones de Tarjeta de Producto a Una Columna
- **Tipo**: Basado en estado.
- **Enunciado**: Cuando las tarjetas de producto se rendericen a 1 columna en móviles, el contenedor `.product-actions` **debe** distribuir sus botones de forma limpia: el botón primario "Agregar al carrito" en fila completa (`flex: 1 1 100%; min-height: 42px;`), y los botones "Ver detalle" y "Comparar" compartiendo la fila inferior en mitades proporcionales (`flex: 1; min-height: 38px;`), con textos legibles y sin desbordes.

### REQ-CAT-MOB-05: Eliminación Total de Scroll Horizontal en `/catalogo`
- **Tipo**: Criterio de Calidad Global.
- **Enunciado**: El sistema **debe** garantizar que en cualquier resolución móvil entre 320px y 767px, la vista de catálogo ([CatalogView.vue](file:///home/crismar/University/sis324/BytePro/frontend/src/views/CatalogView.vue)) tenga una anchura máxima del 100% de la pantalla (`scrollWidth <= clientWidth`), con ausencia total de scroll horizontal.

---

## 3. Criterios de Aceptación y Pruebas

1. **Prueba de Cuadrícula de Productos**:
   - En viewport de 360px, `.product-grid` tiene exactamente 1 columna (`grid-template-columns: 1fr`).
   - Cada tarjeta de producto ocupa el 100% del ancho del contenedor menos los márgenes laterales.
2. **Prueba de Barra de Herramientas (`.catalog-toolbar`)**:
   - En viewports de 320px a 767px, los selects "Ordenar" y "Mostrar" no exceden el ancho de la pantalla y no generan scroll horizontal.
3. **Prueba de Panel de Filtros (`.filters-panel`)**:
   - El panel de filtros no desborda la pantalla y presenta un diseño compacto con opción para desplegar/ocultar en móvil.
4. **Prueba de Compilación**:
   - `npm --prefix frontend run build` finaliza con código 0 y 0 errores.
