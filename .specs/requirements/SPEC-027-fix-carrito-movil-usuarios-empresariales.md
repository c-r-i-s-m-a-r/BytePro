# SPEC-027: Corrección de Exposición de Carrito en Vista Móvil para Usuarios Empresariales / Staff

## 1. Contexto y Justificación del Problema

En la especificación `SPEC-012` y `SPEC-013` se estableció el desacoplamiento estricto entre el ecosistema retail de compra (clientes e invitados) y el portal corporativo (personal, empleados y administradores). Los usuarios empresariales (`auth.isStaff === true`) tienen prohibido el acceso a flujos de compra, carrito y checkout (`REQ-EMP-08`, `REQ-EMP-10`).

Sin embargo, tras la introducción de la barra de navegación móvil en `SPEC-020`, el componente [`frontend/src/components/AppHeader.vue`](file:///home/crismar/University/sis324/BytePro/frontend/src/components/AppHeader.vue) renderizaba el botón de acceso rápido al carrito (`.mobile-cart-btn`) dentro de `.mobile-header-actions` de forma incondicional en pantallas móviles (`<= 767px`), sin validar si el usuario autenticado pertenece al personal corporativo.

Esto ocasionaba que administradores y empleados con funciones de ventas, operaciones o soporte visualizaran el icono de carrito de compras en la cabecera móvil de sus teléfonos, y al pulsarlo, se desplegara el panel lateral `CartDrawer`, violando la separación de roles retail vs. corporativo.

---

## 2. Requerimientos del Sistema (Estándar EARS)

### REQ-MOB-STAFF-01: Ocultamiento del Botón de Carrito Móvil para Personal Corporativo
- **Clasificación**: Ubicuo / Condicional.
- **Definición**: MIENTRAS el usuario autenticado posea rol de personal o funciones empresariales (`auth.isStaff === true`), el sistema **NO DEBE** renderizar ni mostrar el botón de carrito móvil (`.mobile-cart-btn`) en la barra `.mobile-header-actions` de [`AppHeader.vue`](file:///home/crismar/University/sis324/BytePro/frontend/src/components/AppHeader.vue).

### REQ-MOB-STAFF-02: Bloqueo de Invocación y Montaje del Drawer de Carrito
- **Clasificación**: Condicional.
- **Definición**: MIENTRAS el usuario sea personal corporativo (`auth.isStaff === true`), la función `abrirCarrito()` en [`AppHeader.vue`](file:///home/crismar/University/sis324/BytePro/frontend/src/components/AppHeader.vue) **DEBE** retornar inmediatamente sin disparar `ui.openCartDrawer()`, y el componente `<CartDrawer>` en el template **NO DEBE** montarse ni abrirse (`v-if="!auth.isStaff"`).

### REQ-MOB-STAFF-03: Preservación Completa para Clientes e Invitados
- **Clasificación**: Basado en Estado.
- **Definición**: CUANDO el usuario navegue como cliente autenticado o usuario invitado (`auth.isStaff === false`), el botón `.mobile-cart-btn` en `.mobile-header-actions` y el panel deslizable `CartDrawer` **DEBEN** mantenerse plenamente visibles y funcionales en dispositivos móviles, reflejando el contador reactivo de ítems (`cart.count`).

### REQ-MOB-STAFF-04: Alineación y Estabilidad Visual en Cabecera Móvil
- **Clasificación**: Ubicuo.
- **Definición**: En pantallas de teléfono (`<= 767px`) para usuarios corporativos, la sección `.mobile-header-actions` **DEBE** contener exclusivamente el botón del menú de navegación (`.mobile-menu-toggle`), manteniéndose correctamente alineada al extremo derecho de la cabecera mediante `margin-left: auto;` sin desbordamientos ni saltos visuales.

---

## 3. Plan de Verificación y Criterios de Aceptación (QA)

1. **Inspección de Template Frontend**:
   - Verificar que `.mobile-cart-btn` cuente con directiva `v-if="!auth.isStaff"`.
   - Verificar que `<CartDrawer>` cuente con directiva `v-if="!auth.isStaff"`.
   - Verificar guarda defensiva en `abrirCarrito()`.
2. **Pruebas de Componente / Integración**:
   - Sesión con rol `admin`, `vendedor`, `operaciones` o `soporte`: en viewport móvil (`<= 767px`), `.mobile-cart-btn` no existe en el DOM y pulsar sobre la cabecera no abre el carrito.
   - Sesión con rol `cliente` o usuario no autenticado (invitado): `.mobile-cart-btn` existe y abre el drawer correctamente.
3. **Compilación Limpia**:
   - `npm --prefix frontend run build` sin advertencias ni errores.
