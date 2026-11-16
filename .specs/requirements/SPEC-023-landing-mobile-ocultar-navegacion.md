# SPEC-023: Ocultamiento de la Barra de Navegación en Vista Móvil de la Landing Page

## 1. Contexto y Justificación
En la Landing Page ([LandingView.vue](file:///home/crismar/University/sis324/BytePro/frontend/src/views/LandingView.vue)), en pantallas móviles (`viewport <= 767px`), la cabecera renderizaba los enlaces de navegación de la página (`.landing-nav`: *Productos*, *Arma tu setup*, *Categorías*, *Envíos*, *Ayuda*) con desplazamiento horizontal inferior, saturando el encabezado y desviando la atención de la acción principal del usuario.

El usuario ha solicitado explícitamente que en dispositivos móviles no se muestre la barra de navegación en la landing page, y que la cabecera esté compuesta únicamente por:
1. El branding a la izquierda: logotipo e isotipo de **BytePro** (`.landing-brand`).
2. Las acciones de cuenta a la derecha: botones de **Iniciar sesión** y **Crear cuenta** (o acceso a cuenta si ya está autenticado).

---

## 2. Requerimientos Funcionales en Sintaxis EARS

### REQ-LND-MOB-01: Ocultamiento Estricto de Navegación en Pantallas Móviles
- **Tipo**: Ubicuo / Condicional por Media Query.
- **Enunciado**: Cuando el viewport del dispositivo sea menor o igual a 767 píxeles (`@media (max-width: 767px)`), el sistema **debe** ocultar completamente el elemento de navegación `.landing-nav` (`display: none;`) en la landing page.

### REQ-LND-MOB-02: Distribución y Alineación Bipolar en Cabecera Móvil
- **Tipo**: Basado en estado.
- **Enunciado**: Mientras la landing page se visualice en resoluciones móviles (`<= 767px`), la cabecera `.landing-header-inner` **debe** mantener una distribución flex en una sola fila (`flex-direction: row; justify-content: space-between; align-items: center; flex-wrap: nowrap;`), garantizando que el branding `.landing-brand` permanezca visible a la izquierda y el contenedor `.landing-header-actions` se posicione a la derecha.

### REQ-LND-MOB-03: Visibilidad y Espaciado de Botones para Invitados
- **Tipo**: Basado en eventos / estado.
- **Enunciado**: Mientras un usuario no autenticado visualice la cabecera en móviles, el contenedor `.landing-header-actions` **debe** renderizar exclusivamente el botón de texto "Iniciar sesión" y el botón primario "Crear cuenta", aplicando un espaciado óptimo (`gap: 10px`) y evitando saltos de línea no deseados o colapso visual.

### REQ-LND-MOB-04: Visibilidad para Usuarios Autenticados
- **Tipo**: Basado en estado.
- **Enunciado**: Mientras un usuario autenticado (cliente o personal de staff) visualice la cabecera en móviles, el contenedor `.landing-header-actions` **debe** mostrar el enlace directo ("Mi cuenta" o "Panel corporativo" según su rol) alineado a la derecha sin verse afectado por la ausencia de la barra de navegación.

### REQ-LND-MOB-05: Conservación de Navegación en Vista Tablet y Desktop
- **Tipo**: Regla de preservación.
- **Enunciado**: Cuando el viewport sea igual o mayor a 768 píxeles (`min-width: 768px`), el sistema **debe** preservar la visualización y funcionalidad completa de la barra de navegación horizontal `.landing-nav` con todos sus enlaces de anclaje y navegación.

---

## 3. Criterios de Aceptación y Pruebas

1. **Prueba de Media Query en Mobile (<= 767px)**:
   - Al inspeccionar `.landing-nav` en viewport móvil, su propiedad calculada es `display: none`.
   - No existe scroll horizontal ni saltos de fila causados por enlaces del menú.
2. **Prueba de Elementos Visibles en Header Móvil**:
   - Se visualiza el logo y el texto "BytePro" en `.landing-brand`.
   - Se visualizan los botones "Iniciar sesión" y "Crear cuenta" en `.landing-header-actions` con usuario no logueado.
3. **Prueba en Desktop (>= 768px)**:
   - Se visualizan todos los enlaces de `.landing-nav` de forma horizontal sin alteraciones.
