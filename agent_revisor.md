# Coordinación y Plan de Calidad del Agente Revisor

## Rol: `revisor` (Antigravity Instancia Dos)
- **Responsabilidad Exclusiva de Pruebas:** Conforme a la instrucción de coordinación, **toda la fase de pruebas** (unitarias, integración, validación de criterios EARS, pruebas de regresión y seguridad) queda formal y exclusivamente a cargo del `revisor`. `implementador` se enfoca únicamente en producir código.
- Supervisar y verificar las especificaciones EARS de `.specs/requirements/`.
- Auditar el código en `backend/` y `frontend/` (arquitectura MVC, JavaScript, Vue.js, guía de estilos, restricciones locales sin alterar el SO).
- Mantener suites de prueba automatizadas en `.tmp/` (`unit.test.js`, `ears_integration.test.js`, `cobros_ears.test.js`, `almacen_kardex_ears.test.js`, `run-all-tests.js`).
- Registrar hallazgos, bloqueantes y estado de aprobación de cada requerimiento.

---

## 1. Matriz de Control de Calidad y Criterios EARS

### Módulo: Seguridad (`SPEC-001` / `seguridad.md`)
- [x] **[REQ-SEC-01] Hashing seguro:** Validadas funciones de hash bcrypt con salt (10 rondas por defecto) en `backend/src/utils/hash.js`. Contraseñas nunca expuestas en texto plano.
- [x] **[REQ-SEC-02] Registro cliente:** Creación exitosa de usuarios con rol `cliente` y username/email normalizado.
- [x] **[REQ-SEC-03] Duplicados:** Rechazo con HTTP 409 y mensaje exacto: `"El correo electrónico ya está en uso"`.
- [x] **[REQ-SEC-04] Validación de entrada:** Rechazo con HTTP 400 y arreglo de errores por campos obligatorios, formato de email y longitud mínima de contraseña (8 caracteres).
- [x] **[REQ-SEC-05] Generación JWT:** Emisión de token JWT con rol, expiración (2h por defecto) e ID.
- [x] **[REQ-SEC-06] Mensaje de autenticación unificado:** Mensaje exacto `"Usuario o contraseña incorrecta"` (HTTP 401) tanto si la cuenta no existe como si la contraseña es errónea, y también en `/auth/login-empresa` para accesos denegados a clientes, previniendo enumeración de cuentas en cliente y corporativo. Fallback consistente en `LoginView.vue` y `CompanyLoginView.vue`.
- [x] **[REQ-SEC-07] Middleware expiración/token:** Rutas autenticadas (`/api/auth/me`) responden HTTP 401 si el token no existe, está corrupto o expiró.
- [x] **[REQ-SEC-08] & [REQ-SEC-09] RBAC:** Middleware `requireStaff` rechaza con HTTP 403 Forbidden a usuarios con rol `cliente` en `/api/admin/*`. Acceso permitido para rol `admin`.
- [x] **[REQ-SEC-10] Bloqueo y rate limiting progresivo para clientes:** Penalización por ciclos de 8 intentos fallidos consecutivos de contraseña con escala `{30s, 1m, 5m, 10m, 1h, 24h}`, respondiendo HTTP 429 e informando el tiempo restante de espera.
- [x] **[REQ-SEC-11] Bloqueo y rate limiting para empleados no-admin:** Penalización por ciclos de 5 intentos fallidos consecutivos en login corporativo con escala `{1m, 5m, bloqueo definitivo (activo = false)}`, respondiendo HTTP 403 en bloqueo definitivo requiriendo desbloqueo manual de admin. Administradores (`admin`) exentos de bloqueo automático.

### Módulo: E-commerce - Catálogo Base (`SPEC-002` / `ecomerce.md`)
- [x] **[REQ-ECO-01] Cuadrícula y campos:** Catálogo público paginado con campos: nombre, marca, modelo, precio, stock, especificaciones y categorías.
- [x] **[REQ-ECO-02] Filtros reactivos:** Filtrado preciso por categoría (slug) y rango de precio (`precioMin`, `precioMax`).
- [x] **[REQ-ECO-03] Búsqueda superior:** Búsqueda textual por nombre, modelo y especificaciones.
- [x] **[REQ-ECO-04] Empty state:** Respuesta con arreglo vacío `items: []` y `total: 0` ante términos sin coincidencia.
- [x] **[REQ-ECO-05] Detalle de producto:** Carga de producto por slug o ID con variantes, inventario y especificaciones.
- [x] **[REQ-ECO-06] Stock cero:** Indicador `disponible: false` cuando el stock es 0.
- [x] **[REQ-ECO-07] Producto inexistente:** Retorno HTTP 404 ante slugs inexistentes.
- [x] **[REQ-ECO-08] & [REQ-ECO-09] Validación de stock:** Restricción al límite físico disponible y aviso preventivo si se excede.

### Módulo: E-commerce - Catálogo Avanzado (`SPEC-003` / `ecomerce.md`)
- [x] **[REQ-CAT-01] a [REQ-CAT-03] Atributos dinámicos y taxonomía:** Filtrado por atributos de hardware (socket, vram, chipset) en catálogo.
- [x] **[REQ-CAT-04] Ordenamiento:** Ordenamiento ascendente/descendente por precio (`precio_asc`, `precio_desc`), recientes y mejor valorados.
- [x] **[REQ-CAT-05] & [REQ-CAT-06] Paginación y sanitización:** Paginación con límite máximo 24; sanitización contra caracteres XSS/SQLi y truncado a 120 caracteres.
- [x] **[REQ-CAT-07] a [REQ-CAT-09] Matriz de variantes & SKU:** Cada variante cuenta con SKU, precio y stock propio en inventario.
- [x] **[REQ-CAT-10] & [REQ-CAT-11] Comparador:** Comparación de hasta 4 productos de la misma categoría; rechazo con HTTP 400 si son de categorías diferentes.
- [x] **[REQ-CAT-12] a [REQ-CAT-14] Reseñas verificadas:** Validación de compra previa (`tieneCompraVerificada`). HTTP 403 para usuarios sin compra y HTTP 409 ante reseñas duplicadas por usuario.

### Módulo: Ventas - Carrito y Control de Sesión (`SPEC-004` / `ventas.md`)
- [x] **[REQ-VNT-01] Persistencia de carrito:** Persistencia por usuario o por cabecera de invitado `x-session-id`. Banner superior en CartView para invitados con ítems invitando a iniciar sesión / registrarse.
- [x] **[REQ-VNT-02] Estado vacío diferenciado para invitado:** CartView renderiza mensaje explicativo para usuarios no autenticados sin ítems ("No has iniciado sesión...").
- [x] **[REQ-VNT-03] Estado vacío autenticado:** CartView renderiza "Tu carrito está vacío..." cuando el usuario con sesión no tiene productos.
- [x] **[REQ-VNT-04] Fusión transparente:** Al autenticarse, los ítems del carrito invitado se fusionan en el carrito del usuario en servidor.
- [x] **[REQ-VNT-05] Actualización dinámica:** Modificación de cantidad de items con recálculo.
- [x] **[REQ-VNT-06] Stock insuficiente en carrito:** Si se solicita más del stock, se ajusta al stock máximo y se envía warning: `"Solo quedan X unidades disponibles"` / toast `"Cantidad máxima disponible alcanzada"`.
- [x] **[REQ-VNT-07] Eliminación de producto:** Vaciado completo del carrito (`DELETE /api/carrito`).
- [x] **[REQ-VNT-08] Interceptación al checkout sin sesión:** Intento de checkout sin autenticación redirige a `/login?redirect=/checkout` con alerta `"Debes iniciar sesión para continuar con el proceso de pago"`.
- [x] **[REQ-VNT-09] Checkout autenticado:** Bloqueo temporal de existencias a 10 min e inicio del flujo de pago.

### Módulo: Cobros - Pasarela de Pago y Transacciones (`SPEC-005` / `cobros.md`)
- [x] **[REQ-COB-01] Métodos de cobro:** Soportados en `/api/cobros/metodos` (tarjeta, transferencia, pasarela).
- [x] **[REQ-COB-02] Validación de tarjetas (Luhn):** Algoritmo de Luhn en cliente y backend (`luhnCheck`) y tokenización segura (`tok_*`).
- [x] **[REQ-COB-03] Tarjetas inválidas o vencidas:** Validación de mes/año (`isValidExpiry`), CVV (`isValidCvv`), y bloqueo de números de tarjeta en texto plano con HTTP 400.
- [x] **[REQ-COB-04] Idempotencia:** Requisito estricto de `Idempotency-Key` (HTTP 400 si falta).
- [x] **[REQ-COB-05] Prevención de doble envío:** Envío duplicado con la misma clave responde resultado idempotente (`idempotente: true`) sin re-cobrar; claves cruzadas entre órdenes responden HTTP 409.
- [x] **[REQ-COB-06] Bloqueo temporal de stock (10 minutos):** Modelo `BloqueoStock` activo con expiración de 10 minutos en checkout (validado `diffMin` entre 9 y 11 min).
- [x] **[REQ-COB-07] Liberación de stock ante rechazo:** En rechazo de pasarela (fondos, fraude, red), el stock se libera inmediatamente a `liberado` y la venta queda en `pendiente` (HTTP 402).
- [x] **[REQ-COB-08] Confirmación de pago exitoso:** Transacción registrada en `Transaccion`, estado de venta `pagada` y registro de despacho creado en `Despacho`.
- [x] **[REQ-COB-09] Comprobante y desglose:** Generación de `Recibo` oficial desglosando subtotal, impuestos (13%), total pagado, cliente y líneas.
- [x] **[REQ-COB-10] Detección de discrepancias:** Ante discrepancia de montos entre pasarela y orden, se pausa confirmación (HTTP 409), no se marca pagada y se emite evento crítico en `EventoAuditoria`.

### Módulo: Almacén e Inventario (`SPEC-006` / `almacen.md`)
- [x] **[REQ-ALM-01] Persistencia local ACID en SQLite:** Existencias, variantes y movimientos almacenados exclusivamente en `backend/data/bytepro.sqlite`.
- [x] **[REQ-ALM-02] Historial inmutable Kardex:** Asientos con variante, tipo (`ENTRADA`, `SALIDA`, `AJUSTE`, `RESERVA_VENTA`, `LIBERACION_VENTA`, `SALIDA_VENTA`), stock anterior, stock resultante y usuario responsable.
- [x] **[REQ-ALM-03] Entrada de mercancía:** Incremento de stock físico y registro de asiento en Kardex por usuario staff.
- [x] **[REQ-ALM-04] Bloqueo temporal de 10 minutos:** En checkout se bloquean existencias por exactamente 10 minutos.
- [x] **[REQ-ALM-05] Descuento definitivo por venta:** Al confirmar pago, el stock bloqueado se descuenta del inventario físico y se genera movimiento `SALIDA_VENTA`.
- [x] **[REQ-ALM-06] Liberación automática por expiración o rechazo:** Restitución inmediata del stock disponible ante rechazo o expiración de orden con asiento `LIBERACION_VENTA`.
- [x] **[REQ-ALM-07] Umbral de stock crítico:** Etiqueta y alerta cuando el stock físico disponible es menor o igual al umbral mínimo configurado (`critico: disponible <= umbralBajo`).
- [x] **[REQ-ALM-08] Rechazo de stock negativo:** Bloqueo de operaciones con cantidad negativa retornando HTTP 400 y mensaje `"La operación supera las existencias físicas disponibles"`.

### Módulo: Distribución y Envíos (`SPEC-007` / `distribucion.md`)
- [x] **[REQ-DIS-01] Generación de tracking:** Creación de registro de despacho con código `TRK-YYYYMMDD-XXXX` y estado `PEDIDO_CONFIRMADO` (`estadoInicial: 'PREPARANDO_PEDIDO'`) tras pago.
- [x] **[REQ-DIS-02] Datos de entrega:** Persistencia en SQLite de destinatario, dirección, ciudad, teléfono y notas.
- [x] **[REQ-DIS-03] Validación de dirección:** Rechazo con HTTP 400 ante dirección incompleta o fuera de cobertura antes del pago.
- [x] **[REQ-DIS-04] Fases secuenciales:** `PEDIDO_CONFIRMADO` -> `EN_PREPARACION` -> `EN_CAMINO` -> `ENTREGADO`.
- [x] **[REQ-DIS-05] Actualización operativa:** Registro de timestamp, punto de control/ubicación y notificación al cliente.
- [x] **[REQ-DIS-06] Transiciones inválidas:** Rechazo de saltos de fase ilegítimos con HTTP 400 `"Transición de estado logística inválida"`.
- [x] **[REQ-DIS-07] Rastreo público:** Consulta por código de tracking sin exponer datos sensibles personales.
- [x] **[REQ-DIS-08] Rastreo privado autenticado:** Despliegue completo con componentes, dirección y comprobante.
- [x] **[REQ-DIS-09] Tracking inexistente:** Manejo de error descriptivo HTTP 404 `"El número de guía no fue encontrado. Verifica el código e intenta nuevamente"`.

### Módulo: Clientes, Mis Pedidos y Direcciones (`SPEC-008`)
- [x] **[REQ-CLI-01] y [REQ-CLI-02] Mis Pedidos:** Historial cronológico con número de orden, fecha, total, píldora de estado y enlace a tracking.
- [x] **[REQ-CLI-03] Detalle de pedido:** Desglose de componentes de hardware, comprobante y dirección.
- [x] **[REQ-CLI-04] y [REQ-CLI-05] Cancelación elegible:** Cancelación permitida en `PEDIDO_CONFIRMADO` o `EN_PREPARACION` con reintegro automático de stock a SQLite y asiento `ENTRADA` en Kardex.
- [x] **[REQ-CLI-06] Bloqueo de cancelación en camino:** Prohibición de cancelar en estado `EN_CAMINO` o `ENTREGADO` con HTTP 400 `"El pedido ya se encuentra en ruta de entrega y no puede ser cancelado directamente"`.
- [x] **[REQ-CLI-07] Libreta de direcciones:** Guardado en SQLite de direcciones con alias (`Casa`, `Oficina`, etc.).
- [x] **[REQ-CLI-08] Autocarga en checkout:** Selector de direcciones guardadas y precarga automática en checkout.

### Módulo: Empresa y Dashboard Operativo (`SPEC-009`)
- [x] **[REQ-ADM-01] y [REQ-ADM-02] KPIs en tiempo real:** Tarjetas ejecutivas en `/admin` (ingresos acumulados, ventas del mes, pedidos totales vs pendientes, productos, stock crítico).
- [x] **[REQ-ADM-03] y [REQ-ADM-04] Gestión operativa de pedidos:** Tabla paginada de ventas/despachos con actualización de fases sincronizadas con tracking.
- [x] **[REQ-ADM-05] Alertas de reabastecimiento:** Sección destacada con variantes `<= 3` unidades o bajo umbral y acceso a Kardex.
- [x] **[REQ-ADM-15] Celda limpia en pedidos cancelados:** En `/admin/pedidos`, si el pedido está cancelado (`estadoLogistica === 'CANCELADO'` o `estadoPago === 'cancelado'`), la columna `Avanzar fase` renderiza un guion `-` sin inputs ni botones.

### Diseño e Interfaz UX Transversal (`SPEC-010`)
- [x] **[REQ-UI-01] Escala visual +14%:** `html { font-size: 114%; }`, `--ui-scale: 1.14` y `--max-width: 1460px` en `frontend/src/assets/styles.css`.
- [x] **[REQ-UI-02] / [REQ-ECO-01] Catálogo 3 productos por fila:** `.product-grid` con `grid-template-columns: repeat(3, minmax(0, 1fr))` en escritorio.
- [x] **[REQ-UI-03] y [REQ-UI-04] Selects personalizados:** `appearance: none`, borde `#D1D5DB`, radio `12px`, flecha SVG integrada y estados `:hover`/`:focus` en azul primario `#2563EB`.
- [x] **[REQ-UI-05] Botones redondeados estilo píldora:** `border-radius: 9999px` en todos los botones.
- [x] **[REQ-UI-06] Botones de advertencia/peligro en rojo:** `.btn-danger` y `.btn-danger-link` con fondo `#DC2626`, hover `#B91C1C` y texto blanco `#FFFFFF`.
- [x] **[REQ-UI-07] a [REQ-UI-09] Modal de confirmación en acciones decisivas:** `ConfirmModal.vue` + `useUiStore().confirm(...)` integrado en `CartView.vue`, `CheckoutView.vue`, `OrdersView.vue`, `AdminView.vue` y `CompareView.vue`. Diálogo sobrio y limpio sin insignias o cápsulas redundantes (`REQ-UI-08`).
- [x] **[REQ-UI-10] Ampliación barra lateral de filtros (+12%):** `.catalog-layout` con `292px` en desktop y `246px` en responsive, previniendo corte de texto en categorías con `text-overflow: ellipsis` en `.select`.
- [x] **[REQ-UI-11] Diseño Full-Width fluido al 100%:** `--max-width: 100%` en `:root`, con cabecera (`.site-header`, `.header-inner`) y contenido principal (`.container`, `.app-main`) abarcando el 100% del ancho de pantalla con padding lateral adaptativo de respiración (`padding: 0 var(--space-8)` en desktop, `var(--space-6)` en tablet y `var(--space-4)` en móvil).
- [x] **[REQ-UI-12] Side Drawer Deslizable de Carrito:** Componente `CartDrawer.vue` teletransportado a `body`, overlay translúcido con cierre al clic externo o tecla Escape, animación lateral fluida (`transform: translateX(100%)`), listado de ítems con miniaturas, cantidades, precio unitario y total en `Bs.`, y botón CTA directo hacia `/carrito`. Integrado en `AppHeader.vue`.
- [x] **[REQ-UI-13] Botón Directo de Compra en Tarjetas de Catálogo:** En `ProductCard.vue`, botón directo `.product-add-btn` con icono local `cart-add`, permitiendo añadir la variante disponible directamente a la cesta sin obligar a abrir la vista de detalle. Estado deshabilitado reactivo cuando no hay stock o está en proceso de adición.
- [x] **[REQ-UI-14] Integración de Iconografía SVG Local:** Componente `AppIcon.vue` que utiliza la colección SVG local en `frontend/src/assets/icons/` (`icon-shopping-cart.svg`, `icon-shopping-cart-add.svg`, `icon-truck-side.svg`, `icon-sign-in.svg`, `icon-sign-out.svg`, `icon-star.svg`, `icon-trash.svg`, etc.) mediante máscaras CSS `mask-image` y `currentColor`, garantizando herencia dinámica de color y simetría visual.
- [x] **[REQ-UI-18] Contención de Imágenes en Miniatura `.cart-thumb` (/carrito):** Reglas anti-desbordamiento aplicadas de forma global en `frontend/src/assets/styles.css` y localmente en `<style scoped>` de `frontend/src/views/CartView.vue` (`.cart-thumb { overflow: hidden; }` y `.cart-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }`), garantizando que las fotos de producto en la cesta se escalen uniformemente y sin desbordar el contenedor.
- [x] **[REQ-UI-19] Contención de Imágenes en ProductDetailView.vue:** Reglas anti-desbordamiento aplicadas en `frontend/src/assets/styles.css` y en `<style scoped>` de `frontend/src/views/ProductDetailView.vue`: contenedor principal `.detail-main-image` con `overflow: hidden`, `padding: var(--space-2)` y regla `.detail-main-image img` con `width: 100%`, `height: 100%`, `object-fit: contain`, `display: block`. Galería inferior `.detail-thumbs` con `overflow-x: auto` y miniaturas `.thumb` con `overflow: hidden`, `flex-shrink: 0` y regla `.thumb img` con `width: 100%`, `height: 100%`, `object-fit: contain`, `display: block`.

### Módulo: Soporte, Reclamos y Solicitudes de Ayuda (`SPEC-011`)
- [x] **[REQ-SOP-01] Formulario de ayuda y reclamos:** Formulario accesible para invitados y clientes (nombre, contacto celular o correo, tipo de solicitud, pedido opcional, descripción).
- [x] **[REQ-SOP-02] Generación de ticket:** Código único `TKT-YYYYMMDD-XXXX`, fecha/hora, estado inicial `PENDIENTE` en SQLite.
- [x] **[REQ-SOP-03] Validación de contacto:** Rechazo con HTTP 400 si no se proporciona al menos un medio válido (correo válido o celular >= 7 dígitos) o descripción vacía.
- [x] **[REQ-SOP-04] Panel de Mesa de Ayuda:** Personal con función `soporte` o `admin` lista tickets cronológicamente.
- [x] **[REQ-SOP-05] Toma de caso:** Acción "Tomar caso" cambia estado a `EN_ATENCION` y asigna al empleado responsable.
- [x] **[REQ-SOP-06] Resolución y cierre:** Bitácora de solución registrada y ticket marcado como `RESUELTO`.
- [x] **[REQ-SOP-07] Restricción de modificación entre agentes:** Casos asignados son de solo lectura para otros agentes (bloqueo con HTTP 403, excepto admin).

### Módulo: Control de Empleados, Roles Múltiples y Conmutador (`SPEC-012`)
- [x] **[REQ-EMP-01] y [REQ-EMP-02] Separación estricta de funciones:** `vendedor` (solo catálogo/productos), `soporte` (solo reclamos/ayuda), `operaciones` (solo logística/almacén/despachos) con rechazo HTTP 403 exacto (`"Esta operación requiere la función activa correspondiente"`) ante cruce de permisos.
- [x] **[REQ-EMP-03] y [REQ-EMP-04] Gestión de usuarios y roles múltiples:** Admin gestiona personal (`POST/PUT/DELETE /api/admin/usuarios`) con asignación de uno o múltiples roles simultáneos en SQLite.
- [x] **[REQ-EMP-05], [REQ-EMP-06] y [REQ-EMP-07] Conmutador de función activa:** Selector para alternar función activa cuando tiene > 1 rol (`POST /api/auth/cambiar-funcion`, reemite token y actualiza contexto de sesión sin mezcla de privilegios) y permanece oculto si tiene rol único.
- [x] **[REQ-EMP-08], [REQ-EMP-09] y [REQ-EMP-10] Desacoplamiento total del portal corporativo:** Personal (`isStaff`) no visualiza elementos de tienda (carrito, checkout, retail search, categorías) y es redirigido a `/admin` si intenta acceder a rutas de cliente (`/`, `/carrito`, `/checkout`, `/comparar`, `/producto/:slug`).

### Módulo: Portal Corporativo Modular, Subpáginas y CRUD de Personal (`SPEC-013`)
- [x] **[REQ-ADM-06] Descomposición modular:** Subpáginas independientes registradas en router bajo `/admin/*` (`resumen`, `productos`, `pedidos`, `inventario`, `soporte`, `personal`, `auditoria`) con componentes dedicados en `frontend/src/views/admin/`.
- [x] **[REQ-ADM-07] Layout corporativo y sidebar fijo:** `AdminView.vue` actúa como layout contenedor persistente con barra superior y barra lateral fija de `220px`.
- [x] **[REQ-ADM-08] y [REQ-ADM-09] Menú dinámico y conmutador reactivo:** Renderizado condicional de enlaces según función activa (`vendedor`: Resumen/Productos; `operaciones`: Resumen/Pedidos/Inventario; `soporte`: Resumen/Soporte; `admin`: acceso integral). Conmutador de función activa actualiza reactivamente el menú y redirige de inmediato sin recargar la página.
- [x] **[REQ-ADM-10] Tabla de personal y exclusividad staff:** En `/admin/personal` exclusiva para admin con tabla de usuarios empleados, roles/funciones, estado y botones de acción. Se audita y garantiza que los clientes/compradores no aparecen bajo ninguna circunstancia (filtro `[Op.in]: ['admin', 'empleado', 'vendedor', 'soporte', 'operaciones']` en backend y filtro secundario en frontend).
- [x] **[REQ-ADM-11] Creación de nuevo empleado:** Formulario con selección múltiple de roles y contraseñas cifradas con bcrypt en SQLite.
- [x] **[REQ-ADM-12] Modificación atómica y confirmación:** Edición de roles y estado activo con confirmación modal y persistencia atómica en SQLite.
- [x] **[REQ-ADM-13] Protección estricta 403:** Endpoints `/api/admin/usuarios` protegidos en backend con `requireActiveFunction('admin')` y ruta `/admin/personal` protegida en router con `requireAdmin`.
- [x] **[REQ-ADM-14] Alineación estandarizada de botones de acción:** `.table-actions-grid` con `grid-auto-columns: minmax(110px, 1fr)` y botones con `min-width: 110px` y texto centrado, garantizando simetría perfecta horizontal y vertical en las tablas corporativas.

### Módulo: Alta de Productos por Vendedor y Subida de Imágenes (`SPEC-014`)
- [x] **[REQ-PROD-01] Permisos de Creación de Productos:** Empleados con función activa de `vendedor` y `admin` tienen permisos plenos para dar de alta productos en `/admin/productos` y `POST /api/productos`.
- [x] **[REQ-PROD-02] Publicación Inmediata en Catálogo SQLite:** Registro en base de datos local SQLite y publicación inmediata en el catálogo público con variantes, precios y especificaciones técnicas.
- [x] **[REQ-PROD-03] Aislamiento y Denegación Estricta:** Solicitudes de creación de producto por usuarios con función activa distinta a `vendedor` o `admin` (ej. `soporte`, `operaciones`, `cliente`) son rechazadas con HTTP 403 y mensaje exacto: `"Esta operación requiere la función activa de Vendedor o Admin"`. Peticiones no autenticadas rechazadas con HTTP 401.
- [x] **[REQ-PROD-04] Selector de Archivo Local y Preview:** `<input type="file" accept="image/png,image/jpeg,image/webp">` con previsualización inmediata en miniatura antes de guardar y estilos CSS dedicados (`.product-image-preview`, `.admin-product-thumb`).
- [x] **[REQ-PROD-05] Carga y Almacenamiento Base64/Data URI:** Almacenamiento serializado y persistente de imágenes válidas (PNG, WEBP, JPEG) vinculado directamente al campo `imagen` e `imagenPrincipal`.
- [x] **[REQ-PROD-06] Soporte para URL Externa o Imagen por Defecto:** Soporte para ingresar una URL externa directa o dar de alta sin imagen física manteniendo compatibilidad con la visualización del catálogo.
- [x] **[REQ-PROD-07] Validación Estricta de Formato y Límite de 5 MB:** Rechazo inmediato en cliente y servidor con HTTP 400 y mensaje de error exacto ante archivos no válidos o mayores a 5 MB: `"El formato debe ser PNG, JPEG o WEBP y no superar los 5 MB"`.

### Módulo: Moneda Oficial Bs., Categoría Accesorios y Dashboard Analítico (`SPEC-015`)
- [x] **[REQ-MON-01] Moneda oficial Boliviano (Bs. / BOB):** Configuración unificada en backend con `env.currency = 'BOB'`, modelos `Checkout`, `Transaccion`, `Recibo` con default `BOB`, función `formatearMonto` formateando montos con prefijo `Bs.`, y utilitario frontend `formatPrice` formateando con `Bs. ${n.toLocaleString('es-BO', ...)}` en toda la plataforma. Eliminadas referencias de divisas no oficiales.
- [x] **[REQ-CAT-15] Categoría permanente Accesorios:** Registrada en SQLite con slug `'accesorios'` y orden 9, hook `afterBulkSync` para DBs existentes, integrada en seed de productos de hardware, y disponible en selectores de vendedor, menú superior y filtros de catálogo.
- [x] **[REQ-DSH-01] Gráfico analítico multiserie y Carrusel Ampliado:** Componente interactivo `AnalyticsChart.vue` con SVG nativo, trazado con polylines/polygons, líneas guía y tooltips. En [`AdminResumenView.vue`](file:///home/crismar/University/sis324/BytePro/frontend/src/views/admin/AdminResumenView.vue), las gráficas se presentan en un carrusel navegable con slide ampliado a `max-width: 1060px` y altura efectiva renderizada de `~280px - 320px` (viewBox `640x220`, `max-height: 340px`), garantizando alta legibilidad en etiquetas de ejes (12px), flechas laterales anterior/siguiente y botones-pestaña para alternar entre Ventas, Ingresos y Demanda.
- [x] **[REQ-DSH-02] Conmutador reactivo Día, Mes y Año:** Selector dinámico en `/admin/resumen` que reconsulta `GET /api/admin/analitica?granularidad=dia|mes|anio`, normaliza tildes/sinónimos y redibuja reactivamente las series para el mes actual, año actual o histórico anual.
- [x] **[REQ-DSH-03] Indicadores de Top Productos y Demanda por Categoría:** Cálculo cuantitativo y porcentual en backend con endpoints de ranking top 10 productos más vendidos y distribución porcentual de unidades y recaudación por categoría de hardware con barras visuales.
- [x] **[REQ-DSH-04] Estado limpio sin ventas:** Renderizado exacto del mensaje `"Sin datos de ventas en este período"` ante períodos sin ventas registradas, preservando la estructura del gráfico y las tablas sin errores de renderizado.

### Módulo: Comparador con Compra, Comunicados, Ajustes y Retiro en Tienda (`SPEC-016`)
- [x] **[REQ-CMP-01] Botón de adición al carrito en Comparador:** Botón interactivo en cada columna de producto en `CompareView.vue` para agregar directamente componentes comparados con stock e integración con `useCartStore`.
- [x] **[REQ-COM-01] Tablón de comunicados internos:** Sección `/admin/comunicados` visible para todos los empleados staff (`vendedor`, `soporte`, `operaciones`, `admin`) con registro en router corporativo.
- [x] **[REQ-COM-02] Publicación y persistencia de comunicados:** Redacción y alta por `admin` con título, contenido, niveles de prioridad (`Informativo`, `Importante`, `Urgente`) y autor en SQLite.
- [x] **[REQ-COM-03] Modo solo lectura y denegación 403:** Empleados operativos en solo lectura; intentos de creación/modificación/eliminación denegados con HTTP 403. Clientes denegados con 403.
- [x] **[REQ-AJU-01] Ajustes de empresa exclusivo admin:** Subpágina `/admin/ajustes` accesible únicamente para admin (HTTP 403 para otros roles).
- [x] **[REQ-AJU-02] Directorio de Proveedores en SQLite:** CRUD completo en SQLite con campos obligatorios: Razón Social, Dirección, Teléfono y Correo.
- [x] **[REQ-AJU-03] Sucursales Físicas de BytePro en SQLite:** Puntos oficiales habilitados para retiro en tienda con nombre, ciudad, dirección, teléfono y horarios.
- [x] **[REQ-RET-01] Opción Retiro en Tienda en Checkout:** Selector con sucursales activas en `CheckoutView.vue`.
- [x] **[REQ-RET-02] Descuentos escalonados por retiro:** 7% si subtotal >= 500 Bs y 5% si subtotal < 500 Bs aplicados automáticamente antes de impuestos en backend (`cobroService.js`).
- [x] **[REQ-RET-03] Parámetros configurables en Ajustes de Empresa:** Porcentajes y umbral editables por admin y persistidos en SQLite vía `PUT /api/admin/ajustes`.
- [x] **[REQ-RET-04] Transparencia promocional:** Línea informativa *"Descuento retiro en tienda (-X%)"* en desglose de checkout y recibo oficial.

### Módulo: Navegación Retail, Iconografía y Protección de Seguimiento (`SPEC-010` / `SPEC-007`)
- [x] **[REQ-NAV-01 / REQ-UI-17] Retiro de "Empresa" en navbar de retail:** Enlace a `/empresa/login` eliminado del navbar público de compras en `AppHeader.vue`.
- [x] **[REQ-NAV-02 / REQ-UI-14] Nuevos iconos SVG en navbar:** Iconos `transfer` para Comparador, `help` para Ayuda y Reclamos, y `cube` para Mis pedidos integrados en `AppIcon.vue` y `AppHeader.vue`.
- [x] **[REQ-NAV-03 / REQ-UI-16] Redirección inteligente de logo BytePro:** Enlace de la marca conduce a catálogo "Todos" (`name: 'catalog'`) si el cliente está autenticado, a `/admin` si es personal staff, y a landing (`/`) si es invitado no autenticado.
- [x] **[REQ-NAV-04 / REQ-DIS-10] Seguimiento con sesión obligatoria:** Rutas `/seguimiento/:codigo?` y `/tracking/:codigo?` protegidas con `meta: { requiresAuth: true }`, redirigiendo usuarios sin sesión a `/login?redirect=/seguimiento`.
- [x] **[REQ-NAV-05 / REQ-UI-15] Menú activo permanentemente coloreado:** Estilos `.header-link.router-link-active`, `.header-link.active`, `.category-link.active`, `.category-link.router-link-active` coloreados persistentemente con `var(--color-primary-dark)` y fondo `var(--color-primary-soft)`.

### Landing Page: Categorías Destacadas, Iconografía y Franja Interactiva (`FIX LANDING`)
- [x] **Cuatro Categorías Destacadas en Orden Fijo:** [`LandingView.vue`](file:///home/crismar/University/sis324/BytePro/frontend/src/views/LandingView.vue) presenta las 4 categorías clave: 1) Procesadores, 2) Tarjetas Gráficas, 3) Memorias RAM, y 4) Accesorios, vinculadas dinámicamente al catálogo filtrado.
- [x] **Iconos por Defecto y Fondo Revelado en `:hover`:** En reposo, se exhibe el icono centrado en tarjeta limpia (`.landing-category-icon-wrap`). Al hacer hover, se revela suavemente el fondo temático (`.landing-category-bg` de `opacity: 0` a `1` con animación de escala).
- [x] **Franja de Beneficios con Micro-interacciones:** La franja institucional (`.landing-brands-row`) incorpora chips interactivos (`.landing-brand-pill`) con elevación `translateY(-4px)`, sombra `0 12px 26px rgba(...)`, borde primario suave y puntos de estado reactivos.

### Logo Oficial BytePro (`icon-bytepro.png`)
- [x] **[REQ-LOG-01] Imagen de logo oficial:** `frontend/src/assets/icons/icon-bytepro.png` presente y legible en assets.
- [x] **[REQ-LOG-02] Cabecera Principal:** Reemplazo de isotipo de texto "BP" por `icon-bytepro.png` en `AppHeader.vue`.
- [x] **[REQ-LOG-03] Landing Page:** Reemplazo del texto "BP" por `icon-bytepro.png` en cabecera y pie de página en `LandingView.vue`.
- [x] **[REQ-LOG-04] Vistas de Acceso/Login:** Inclusión de logo oficial en `LoginView.vue`, `CompanyLoginView.vue` y `RegisterView.vue`.
- [x] **[REQ-LOG-05] Estilos y Proporcionalidad:** Dimensionamiento proporcional, nítido y responsivo sin distorsión visual (`.brand-logo`, `.footer-logo`, `.auth-logo`).

### Edición de Productos — Variantes, Múltiples Imágenes y Auto-scroll (`SPEC-014` Ampliado)
- [x] **[REQ-PROD-08] Galería y Múltiples Imágenes:** Formulario `AdminProductosView.vue` admite subida de múltiples archivos locales (`<input type="file" multiple>`) y adición de enlaces/URLs externas, visualización en miniatura con cuadrícula `.gallery-preview-grid`, indicador visual de portada principal (`.gallery-badge-cover`) y botones individuales de eliminación y selección de imagen principal (`quitarImagenDeGaleria`, `establecerPrincipal`). Backend almacena y serializa colecciones de imágenes en SQLite.
- [x] **[REQ-PROD-09] Variantes de Especificaciones en Creación y Edición:** En `AdminProductosView.vue`, el bloque de variantes permanece accesible tanto en creación como en edición (sin bloqueo por `productoEditando`), permitiendo añadir variantes con nombre, SKU, precio y stock. Sincronización completa en `PUT /api/productos/:id` con actualización de stock e historial en `Kardex`.
- [x] **[REQ-PROD-10] Auto-scroll Suave al Editar:** Al hacer clic en "Editar" en la tabla de productos, se ejecuta `formProductoRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })` con `nextTick`, desplazando la vista suavemente hacia el encabezado del formulario `#form-producto`.

### Fix de Pantallas en Blanco en `/admin` y Subpáginas Modulares
- [x] **[FIX-ADM-01] Subruta raíz de `/admin`:** En `frontend/src/router/index.js`, la subruta vacía (`path: ''`, `name: 'admin'`) monta explícitamente `AdminResumenView.vue` en el `<RouterView />` de `AdminView.vue`, eliminando la pantalla en blanco al acceder a `/admin`.
- [x] **[FIX-ADM-02] Directorio y Subrutas Modulares:** Las 9 subpáginas modulares (`resumen`, `productos`, `pedidos`, `inventario`, `soporte`, `personal`, `auditoria`, `comunicados`, `ajustes`) disponen de componente físico y mapeo en el router.
- [x] **[FIX-ADM-03] Resolución de TDZ (ReferenceError) en `AdminProductosView.vue`:** Función `crearVariante(precio = 0)` desacoplada del objeto `nuevoProd`, admitiendo parámetro `precio` y evitando el acceso prematuro a `nuevoProd?.precioBase` durante la inicialización del componente.
- [x] **[FIX-ADM-04] Evaluación de Runtime Libre de Errores:** Simulación en sandbox Node/VM del setup de `AdminProductosView.vue` garantizando inicialización limpia y retorno esperado de objetos de variante sin excepciones.
- [x] **[FIX-ADM-05] Conmutación Contextual de Rol:** En `AppHeader.vue` y `AdminView.vue`, `onCambiarFuncion` redirige al usuario a la vista autorizada correspondiente a su función activa (`vendedor` -> `admin-productos`, `operaciones` -> `admin-pedidos`, `soporte` -> `admin-soporte`, `admin` -> `admin-resumen`), evitando desalineaciones y bloqueos de router.

### Bootstrap Automático Limpio para Render (`backend/src/bootstrap.js`)
- [x] **[BOOT-01] Creación de Administrador Inicial:** Creación del usuario único `admin@bytepro.com` con hash bcrypt de `Admin1234`, roles múltiples `['admin', 'vendedor', 'soporte', 'operaciones']`, activo por defecto, y su correspondiente perfil en `Empleado` (`Administrador General de Sistemas`). Exención de creación si ya existe algún usuario con rol `admin`.
- [x] **[BOOT-02] Categorías Oficiales Base con Atributos:** Registro automático mediante `findOrCreate` de las 9 categorías oficiales de hardware (`procesadores`, `tarjetas-graficas`, `placas-base`, `memoria-ram`, `almacenamiento`, `fuentes`, `gabinetes`, `refrigeracion`, `accesorios`) preservando orden y sus atributos técnicos requeridos.
- [x] **[BOOT-03] Configuración de Empresa:** Registro inicial en `ConfiguracionEmpresa` con los valores por defecto requeridos (`descuentoRetiroAlto: 7`, `descuentoRetiroBajo: 5`, `umbralDescuentoRetiro: 500`, `moneda: 'BOB'`).
- [x] **[BOOT-04] Catálogo y Operaciones Limpias:** Garantía estricta de 0 productos en catálogo, 0 clientes registrados y 0 transacciones comerciales (0 ventas, 0 ítems de carrito y 0 recibos emitidos), permitiendo que la instancia en Render comience completamente limpia para la creación de inventario.
- [x] **[BOOT-05] Idempotencia Rigurosa:** Múltiples ejecuciones consecutivas del módulo `bootstrap()` no generan registros duplicados de administrador, categorías ni configuración.
- [x] **[BOOT-06] Integración Full-Stack y CORS Flexible:** Integración de `await bootstrap()` en `server.js` tras `sequelize.sync()`. En `app.js`, servicio de `frontend/dist` con fallback SPA `index.html` para peticiones no-API. En `env.js`, soporte de `corsOrigin: process.env.CORS_ORIGIN || '*'` con manejo flexible de credenciales en `app.js`.

### Módulo: Migración a Supabase (PostgreSQL) y Sincronización en Tiempo Real (`SPEC-017`)
- [x] **[REQ-SUP-01] Soporte Dual de Conexión (PostgreSQL / SQLite):** Inicialización dinámica de Sequelize con dialecto `'postgres'`, dependencias `pg` y `pg-hstore`, pool `{ max: 10, min: 0, acquire: 30000, idle: 10000 }` y SSL `{ require: true, rejectUnauthorized: false }` cuando exista `DATABASE_URL` / `SUPABASE_DB_URL`. Fallback transparente a SQLite local (`dbStorage`) ante ausencia de URL o cuando se fuerce `DB_STORAGE` en pruebas (`NODE_ENV=test`).
- [x] **[REQ-SUP-02] Migración de Esquema Multi-Dialecto sin Acoplamiento:** Inspección agnóstica de columnas en `ensureColumns()` mediante `queryInterface.describeTable(tableName)`, eliminando consultas directas a `PRAGMA table_info` de SQLite y convirtiendo automáticamente definiciones `DATETIME` a `TIMESTAMP WITH TIME ZONE` bajo dialecto postgres.
- [x] **[REQ-SUP-03] Script `supabase_realtime.sql` y Publicación en PostgreSQL:** Script idempotente en raíz del proyecto con `REPLICA IDENTITY FULL`, `ENABLE ROW LEVEL SECURITY`, políticas RLS de lectura `bytepro_realtime_read` para roles web `anon` y `authenticated`, concesión de permisos `SELECT` y adición a la publicación `supabase_realtime` sobre las 15 tablas críticas. Integración idempotente en `backend/src/bootstrap.js` mediante `configurarRealtimePostgres()`.
- [x] **[REQ-SUP-04] Hub de Eventos Sequelize, SSE y Configuración Pública:** Implementación de `backend/src/services/realtimeHub.js` con hooks globales de Sequelize (`afterCreate`, `afterUpdate`, `afterDestroy`, `afterBulk*`) y exposición de endpoints:
  1. `GET /api/config/public`: Devuelve `{ supabaseUrl, supabaseAnonKey, dialect, realtimeEnabled: true }`.
  2. `GET /api/realtime/stream`: Canal SSE (`text/event-stream`) con heartbeat cada 25s, reintento (`retry: 3000`) y emisión estructurada de eventos JSON `{ table, action, id, timestamp }`.
- [x] **[REQ-SUP-05] Cliente de Tiempo Real Dual con Debounce de 150ms:** Servicio `frontend/src/services/realtime.js` integrando `@supabase/supabase-js` para escuchar `postgres_changes` en canal `bytepro-realtime` y conexión paralela con `EventSource('/api/realtime/stream')` para entornos locales. Función `subscribeToTables(tables, callback)` con *debounce* de `150ms` para amortiguar ráfagas transaccionales y limpieza con `unsubscribe()`.
- [x] **[REQ-SUP-06] Sincronización Silenciosa de Catálogo y Carrito:** Store `frontend/src/store/catalog.js` implementa `refreshSilently()` para actualizar inventario, productos, facetas y categorías en segundo plano sin activar `loading = true` (evitando parpadeos en interfaz). Store `useCartStore` actualiza en vivo límites de stock y precios con `fetchCart()`.
- [x] **[REQ-SUP-07] Suscripciones en Vivo en Vistas de Cliente:**
  - `ProductDetailView.vue`: recarga silenciosa de producto, variantes, stock y reseñas (`['productos', 'variantes', 'inventarios', 'resenas']`).
  - `CheckoutView.vue`: actualización en vivo de sucursales y descuentos de retiro (`['sucursales', 'configuraciones_empresa', 'productos', 'variantes', 'inventarios']`) preservando datos ingresados en el formulario.
  - `OrdersView.vue`: actualización automática de pedidos y estados de recibo/despacho (`['ventas', 'despachos', 'recibos']`).
  - `TrackingView.vue`: avance en vivo de la barra de seguimiento logístico (`['ventas', 'despachos']`).
  - `SupportView.vue`: actualización de solicitudes de mesa de ayuda (`['reclamos']`).
- [x] **[REQ-SUP-08] Sincronización en Vivo en el Portal Corporativo (`/admin/*`):** Suscripciones dedicadas en las 8 subvistas de empleados/administración (`AdminResumenView`, `AdminProductosView`, `AdminPedidosView`, `AdminInventarioView`, `AdminSoporteView`, `AdminComunicadosView`, `AdminAjustesView`, `AdminAuditoriaView`) refrescando métricas, pedidos, catálogo, inventario y reclamos en tiempo real con limpieza limpia en `onUnmounted`.

### Módulo: Optimización de Imágenes, Evidencias en Distribución e Historial (`SPEC-018`)
- [x] **[REQ-IMG-01 y REQ-IMG-02] Compresión Frontend Canvas y Validación Backend:** Utilidad `frontend/src/utils/imageCompressor.js` con compresión dinámica en Canvas a un máximo de 1280px y factor de calidad 0.8 preservando aspect ratio, integración en `AdminProductosView.vue` y `AdminPedidosView.vue`. Validación estricta en `backend/src/utils/imagePayload.js` (`normalizarFoto`/`normalizarFotos`) con límite real de 5 MB, verificación de firmas mágicas binarias (JPEG, PNG, WEBP) y rechazo HTTP 400 con mensaje exacto `'Formato o tamaño de imagen no admitido'`.
- [x] **[REQ-OPR-01 a REQ-OPR-04] Fotografías de Evidencia por Etapa y Control RBAC de Operador:** Endpoints de despacho (`POST /api/distribucion/despachos/:idOrCodigo/estado` y `PUT /api/admin/pedidos/:id/estado`) permiten adjuntar hasta 5 fotos de evidencia por cambio de fase (`PREPARANDO`, `EN_TRANSITO`, `EN_TIENDA`, `ENTREGADO`). Middleware `requireDispatchOperator` autoriza a `admin` y empleados con función activa `operaciones`, y rechaza estrictamente con HTTP 403 y mensaje exacto `'Esta operación requiere la función activa de Operaciones o Admin'` a clientes y vendedores.
- [x] **[REQ-HIS-01 y REQ-HIS-02] Historial Inmutable y Compatibilidad Regresiva:** Historial de despacho almacena eventos inmutables estructurados con `{ estado, timestamp, ubicacion, nota, operador, fotos }`. Columna `fotos: JSON` agregada en modelo y tabla `despachos`. Normalización hacia atrás en `distribucionService.js` (`normalizarFotosEvento`, `normalizarHistorial`) asignando `fotos: []` a registros legados sin fotos.
- [x] **[REQ-VIS-01 a REQ-VIS-03] Visualización de Evidencias en Tracking, Soporte y Administración:** Renderizado de galería de fotos con lightbox/modal a pantalla completa en `TrackingView.vue` para clientes y consulta pública. Inspección de historial con fotos y nota del operador en `AdminSoporteView.vue` para pedidos vinculados a reclamos. Selector de archivos, vista previa y visor de historial en `AdminPedidosView.vue`.

### Módulo: Sistema Integral de Notificaciones por Correo Electrónico (`SPEC-019`)
- [x] **[REQ-EML-01 y REQ-EML-02] Recuperación de Contraseña Exclusiva para Clientes:** Endpoints `POST /api/auth/recuperar-password` y `POST /api/auth/restablecer-password`. Genera código numérico temporal de 6 dígitos con hash SHA-256 en `resetPasswordToken` y vigencia de 15 minutos en `resetPasswordExpires` únicamente para cuentas con rol `cliente`. Responde de forma genérica (HTTP 200) ante cuentas inexistentes o de empleados impidiendo enumeración. Al restablecer con código válido, actualiza `passwordHash` con bcrypt, limpia tokens de reseteo y desbloquea la cuenta; ante código erróneo o expirado responde HTTP 400.
- [x] **[REQ-EML-03] Interfaz de Recuperación de Contraseña en Frontend:** Ruta `/recuperar-contrasena` (`ForgotPasswordView.vue`) con flujo guiado de dos pasos (solicitud de correo + validación de código de 6 dígitos con temporizador de 15 minutos y nueva contraseña) y enlace visible `"¿Olvidaste tu contraseña?"` en `LoginView.vue`.
- [x] **[REQ-EML-04] Comprobante Digital de Compra en HTML:** `emailService.enviarRecibo` genera correo HTML completo con número de recibo, tabla de ítems (producto, variante, SKU, cantidad, precio, subtotal), resumen financiero en `Bs.`, datos de entrega (sucursal o domicilio) y guía logística `TRK-...` con botón interactivo de seguimiento.
- [x] **[REQ-EML-05] Filtro Selectivo de Notificaciones de Envío:** `emailService.enviarActualizacionEnvio` emite correos **únicamente** ante estados `EN_CAMINO` y `ENTREGADO`, retornando `{ omitido: true, razon: 'Estado no requiere notificación' }` para `PEDIDO_CONFIRMADO`, `PREPARANDO_PEDIDO` y `EN_PREPARACION`.
- [x] **[REQ-EML-06] Aviso de Resolución de Reclamos:** Al resolver un caso (`POST /api/soporte/reclamos/:id/resolver`), `soporteService.resolverCaso` despacha automáticamente `emailService.enviarResolucionReclamo` al correo del ticket con código `TKT-...`, tipo de solicitud, solución redactada y fecha de resolución.
- [x] **[REQ-EML-07] Transporte Dual SMTP / Simulación Resiliente:** Soporte `nodemailer` configurable mediante variables de entorno (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) con modo de simulación transparente ante ausencia de SMTP o `NODE_ENV=test`, y manejo no bloqueante de errores de red.

### Módulo: Adaptabilidad Móvil y Menús Desplegables (`SPEC-020`)
- [x] **[REQ-MOB-01] Ocultamiento Responsive (`<= 767px`):** Reglas en `frontend/src/assets/styles.css` bajo `@media (max-width: 767px)` ocultan `.header-actions`, `.category-bar`, `.search-bar`, `.role-switcher-header` y `.admin-sidebar`, y hacen visible `.mobile-header-actions` con el botón `.mobile-menu-toggle` y el acceso directo al carrito (`.mobile-cart-btn`).
- [x] **[REQ-MOB-02 y REQ-MOB-03] Menú Desplegable Móvil Interactivo (`AppHeader.vue`):** Botón hamburguesa `.mobile-menu-toggle` con `aria-expanded`, `aria-controls="mobile-nav-menu"` e intercambio dinámico a icono de cierre (`X`). Panel `.mobile-nav-menu.mobile-nav-panel` con enlaces completos (`Catálogo`, `Ayuda y Reclamos`, `Seguimiento de envío`, `Comparar`, `Mis pedidos`, `Ingresar`/`Salir`), con cierre automático al navegar (`watch(() => route.fullPath)`), al hacer clic en `.mobile-nav-backdrop` o al presionar `Escape`.
- [x] **[REQ-MOB-04] Selector Móvil de Módulos Corporativos (`AdminView.vue`):** Contenedor `.admin-mobile-nav` visible en `<= 767px` con `<select id="admin-mobile-module">` poblado dinámicamente (`modulosDisponibles`) según la función activa del usuario y redirección inmediata mediante `irAModulo()`.
- [x] **[REQ-MOB-05] Estilizado Táctil Accesible BytePro:** Enlaces `.mobile-nav-link` con `min-height: 44px` (WCAG táctil), `border-radius`, fondo limpio `#ffffff` en `.mobile-nav-menu` y resalte activo de marca, además de botones `.mobile-menu-toggle` y `.mobile-nav-close` de `44px x 44px`.

### Módulo: Estado "En Espera de Comprobación" para Pagos QR / Bancarios y Visualización Real del Cliente (`SPEC-026`)
- [x] **[REQ-PAG-QR-01] Estado inicial EN_ESPERA_COMPROBACION y retención de recibo:** Al pagar con método `transferencia` (QR bancario), el despacho se crea en estado inicial `EN_ESPERA_COMPROBACION`, la venta se retiene en `pendiente`, se almacena obligatoriamente `referenciaComprobante` (4 a 120 caracteres) y se suspende la emisión del recibo digital hasta la verificación comercial.
- [x] **[REQ-PAG-QR-02] Compatibilidad con flujo directo de tarjeta:** Pagos con `tarjeta` confirman de inmediato el pedido (`PEDIDO_CONFIRMADO`), venta en `pagada`, recibo generado al instante y `requiereVerificacion: false`.
- [x] **[REQ-PAG-QR-03] RBAC en verificación manual:** Endpoint `PATCH /api/admin/pedidos/:ventaId/verificar-comprobante` protegido con doble capa (middleware `requireActiveFunction('ventas', 'vendedor', 'admin')` y servicio `cobroService.verificarComprobanteManual`), denegando con HTTP 401 sin token y HTTP 403 a cliente, operaciones y soporte.
- [x] **[REQ-PAG-QR-04] Transición a PEDIDO_CONFIRMADO, recibo y auditoría:** La verificación manual exitosa por personal comercial transiciona el despacho a `PEDIDO_CONFIRMADO`, venta a `pagada`, genera el `Recibo` oficial con numeración y cliente, añade hito al historial de tracking con operador y nota, y registra evento de auditoría `comprobante_qr_verificado`.
- [x] **[REQ-PAG-QR-05 y REQ-PAG-QR-06] Nombre real del cliente y alertas frontend:** `GET /api/admin/pedidos` retorna el nombre real del cliente/destinatario (`cliente.nombre`, `usuario.nombre`), email y `referenciaComprobante` erradicando cadenas genéricas. Integración en `AdminPedidosView.vue` (botón de verificación condicional por rol), `OrdersView.vue` (alerta de comprobante en revisión) y `TrackingView.vue` (alerta informativa y badge).

### Módulo: Ocultamiento de Carrito Móvil para Usuarios Empresariales / Staff (`SPEC-027`)
- [x] **[REQ-MOB-STAFF-01] Ocultamiento de .mobile-cart-btn para personal corporativo:** En `AppHeader.vue`, el botón de carrito móvil `.mobile-cart-btn` en `.mobile-header-actions` está condicionado a `v-if="!auth.isStaff"`, evitando que administradores o empleados (`vendedor`, `soporte`, `operaciones`) visualicen el botón en dispositivos móviles (`<= 767px`).
- [x] **[REQ-MOB-STAFF-02] Bloqueo de montaje de CartDrawer y guarda defensiva:** El componente `<CartDrawer>` cuenta con directiva `v-if="!auth.isStaff"` en el template y la función `abrirCarrito()` contiene guarda defensiva temprana `if (auth.isStaff) return;`, impidiendo que el panel de carrito se monte o invoque para usuarios de empresa.
- [x] **[REQ-MOB-STAFF-03] Preservación completa para clientes e invitados:** Para usuarios con `auth.isStaff === false` (clientes autenticados o invitados), `.mobile-cart-btn` permanece completamente visible, funcional, con su aria-label y contador reactivo `cart.count`.
- [x] **[REQ-MOB-STAFF-04] Alineación y estabilidad visual:** En `styles.css`, `.mobile-header-actions` mantiene `margin-left: auto;` y `gap: var(--space-2)`, asegurando que al ocultar el botón de carrito, el botón de menú `.mobile-menu-toggle` quede limpiamente alineado al extremo derecho de la cabecera sin saltos ni desbordamientos.

### Persistencia y Usuarios en SQLite
- [x] **Verificación directa SQLite:** Comprobación directa contra `backend/data/bytepro.sqlite` con driver `sqlite3`: `usuarios`, `clientes`, `empleados`, contraseñas bcrypt y roles se almacenan y consultan directamente del archivo local.

---

## 2. Resultados de Pruebas Automatizadas (`.tmp/`)

Ejecución del runner:
```bash
node .tmp/run-all-tests.js
```

- **1. Pruebas Unitarias (`.tmp/tests/unit.test.js`):** 4/4 pasaron (Hash bcrypt, validación de inputs, JWT, sanitización de búsquedas).
- **2. Pruebas de Integración EARS (SPEC-001 a SPEC-004) (`.tmp/tests/ears_integration.test.js`):** 18/18 pasaron (Seguridad, Mensaje unificado 'Usuario o contraseña incorrecta' REQ-SEC-06 ante cuenta inexistente, contraseña errónea y cliente en login corporativo, Catálogo, Filtros, Variantes, Comparador, Reseñas, Carrito/Stock).
- **3. Pruebas de Cobros EARS (SPEC-005) (`.tmp/tests/cobros_ears.test.js`):** 8/8 pasaron (Métodos de pago, Luhn, CVV/Expiry, Idempotencia, Bloqueo 10 min, Recibo, Despacho, Auditoría de discrepancias).
- **4. Pruebas de Almacén, Kardex y Persistencia SQLite (SPEC-006) (`.tmp/tests/almacen_kardex_ears.test.js`):** 8/8 pasaron (Persistencia directa SQLite, Kardex inmutable, Entradas/Salidas, Bloqueo 10 min, Descuento definitivo, Liberación, Stock crítico, Rechazo stock negativo 400).
- **5. Pruebas de Distribución, Clientes y Dashboard Empresa (SPEC-007 a SPEC-009) (`.tmp/tests/distribucion_clientes_admin_ears.test.js`):** 12/12 pasaron (Guías `TRK-YYYYMMDD-XXXX`, validación de dirección/cobertura 400, flujo secuencial de 4 etapas y rechazo de saltos inválidos 400, tracking público vs privado y 404, Mis Pedidos, cancelación con reintegro a SQLite/Kardex y bloqueo en ruta 400, libreta de direcciones y precarga en checkout, KPIs admin, gestión de pedidos y alertas de stock, y celda limpia con guion `-` para pedidos cancelados en `AdminPedidosView.vue` REQ-ADM-15).
- **6. Pruebas de Diseño e Interfaz UX Transversal (SPEC-010) (`.tmp/tests/ui_ux_ears.test.js`):** 13/13 pasaron (Escala +14%, grilla de 3 columnas, `<select>` personalizados + `:hover`/`:focus`, botones pill `9999px`, botones rojos `#DC2626`/`#B91C1C`, `ConfirmModal.vue` limpio y sobrio en acciones decisivas sin insignias decorativas REQ-UI-08, barra lateral de filtros ampliada a `292px` REQ-UI-10, diseño full-width 100% fluido REQ-UI-11, side drawer deslizable de carrito con total en Bs. y enlace directo a `/carrito` REQ-UI-12, botón rápido de adición en tarjetas de producto REQ-UI-13, integración de iconografía SVG local mediante `AppIcon.vue` REQ-UI-14, contención de imágenes en miniatura `.cart-thumb` en CartView y styles.css REQ-UI-18, y contención de imagen principal y miniaturas en ProductDetailView.vue REQ-UI-19).
- **7. Pruebas de Soporte, Roles Múltiples y Control de Empleados (SPEC-011 y SPEC-012) (`.tmp/tests/soporte_empleados_ears.test.js`):** 8/8 pasaron (Generación de ticket `TKT-YYYYMMDD-XXXX`, validación de contacto/descripción 400, tomar caso `EN_ATENCION`, resolver ticket `RESUELTO`, bloqueo 403 entre agentes no asignados, aislamiento estricto de funciones con 403 exacto, roles múltiples en SQLite, conmutador de función activa y desacoplamiento de portal con redirección a `/admin`).
- **8. Pruebas de Portal Modular, CRUD de Personal y Alineación de Acciones (SPEC-013 y REQ-ADM-14) (`.tmp/tests/admin_modular_personal_ears.test.js`):** 8/8 pasaron (Descomposición en subpáginas modulares `/admin/*`, layout corporativo con sidebar de 220px, menú dinámico condicionado por función activa con conmutador reactivo y redirección instantánea, tabla de personal con badges y estado, alineación estandarizada en cuadrícula `.table-actions-grid` con `min-width: 110px`, creación de empleado con roles múltiples y bcrypt en SQLite, modificación atómica de personal con confirmación modal, y denegación estricta HTTP 403 a no-admin en API y router).
- **9. Pruebas de Productos, Vendedor y Carga de Imágenes (SPEC-014) (`.tmp/tests/productos_imagenes_ears.test.js`):** 7/7 pasaron (Permisos plenos para `vendedor` y `admin` con HTTP 201, publicación inmediata en SQLite y catálogo público, rechazo HTTP 403 exacto `"Esta operación requiere la función activa de Vendedor o Admin"` para otras funciones, selector de archivo file input con accept y previsualización local, almacenamiento Base64/Data URI para PNG/WEBP/JPEG en `imagenPrincipal`/`imagen`, soporte de URL externa y null default, rechazo HTTP 400 exacto `"El formato debe ser PNG, JPEG o WEBP y no superar los 5 MB"` ante formatos no admitidos o archivos > 5 MB).
- **10. Pruebas de Seguridad y Bloqueo por Intentos Fallidos (SPEC-001 REQ-SEC-10 y REQ-SEC-11) (`.tmp/tests/seguridad_bloqueo_ears.test.js`):** 4/4 pasaron (Rate limiting progresivo para clientes por ciclos de 8 fallos con escala {30s, 1m, 5m, 10m, 1h, 24h} con HTTP 429 y mensaje unificado 'Usuario o contraseña incorrecta', penalización para empleados no-admin por ciclos de 5 fallos con escala {1m, 5m, bloqueo definitivo de cuenta con HTTP 403 y desbloqueo manual por admin}, exención estricta al rol `admin` con 401 unificado preservando disponibilidad ante múltiples fallos, y cuenta regresiva dinámica en frontend con fallback unificado y deshabilitación reactiva de formulario).
- **11. Pruebas de Moneda Bs., Accesorios y Dashboard Analítico (SPEC-015) (`.tmp/tests/dashboard_analitico_moneda_accesorios_ears.test.js`):** 5/5 pasaron (Moneda oficial Bs./BOB en backend y frontend, categoría Accesorios en SQLite y catálogo, endpoint analítico multiserie para Ventas, Ingresos y Demanda con granularidad Día/Mes/Año, Top Productos y Demanda por Categoría con porcentajes y recaudación en Bs., y estado limpio ante ausencia de ventas sin errores de renderizado).
- **12. Pruebas de Comparador, Comunicados, Ajustes y Retiro en Tienda (SPEC-016) (`.tmp/tests/spec016_ears.test.js`):** 10/10 pasaron (Botón rápido de compra en Comparador REQ-CMP-01, Tablón de comunicados en /admin/comunicados REQ-COM-01 a REQ-COM-03 con RBAC en SQLite, Ajustes de empresa exclusivo admin con Proveedores y Sucursales REQ-AJU-01 a REQ-AJU-03, y Retiro en tienda con descuentos escalonados 7% y 5% configurables en checkout y recibo REQ-RET-01 a REQ-RET-04).
- **13. Pruebas de Navbar Retail, Iconos, Redirección de Logo y Seguimiento Autenticado (`.tmp/tests/navbar_tracking_ux.test.js`):** 5/5 pasaron (Retiro de enlace Empresa del navbar de retail REQ-NAV-01/REQ-UI-17, Integración de iconos transfer, help y cube en AppIcon y AppHeader REQ-NAV-02/REQ-UI-14, Redirección inteligente de logo BytePro a catálogo Todos si está logueado REQ-NAV-03/REQ-UI-16, Exigencia de sesión obligatoria para /seguimiento con requiresAuth: true REQ-NAV-04/REQ-DIS-10, y Estado activo coloreado y destacado de menú persistente REQ-NAV-05/REQ-UI-15).
- **14. Pruebas de Logo Oficial BytePro `icon-bytepro` (`.tmp/tests/logo_oficial.test.js`):** 5/5 pasaron (Existencia de archivo `icon-bytepro.png`, uso uniforme en `AppHeader.vue` reemplazando texto plano "BP", uso en `LandingView.vue`, integración en `LoginView.vue` y `CompanyLoginView.vue`, y estilos CSS responsivos y proporcionales).
- **15. Pruebas de Edición de Productos, Múltiples Imágenes, Variantes y Auto-scroll (SPEC-014) (`.tmp/tests/spec014_multimedia_variantes_scroll.test.js`):** 5/5 pasaron (Soporte frontend de selección múltiple y galería de fotos REQ-PROD-08, persistencia y actualización API de múltiples imágenes en SQLite REQ-PROD-08, adición y configuración de variantes en edición REQ-PROD-09, sincronización backend de variantes con stock y Kardex en PUT /api/productos/:id REQ-PROD-09, y auto-scroll suave hacia el formulario al presionar Editar REQ-PROD-10).
- **16. Pruebas de Fix Pantallas en Blanco en `/admin` y Subpáginas Modulares (`.tmp/tests/admin_pantallas_blanco_fix.test.js`):** 5/5 pasaron (Subruta raíz de /admin monta explícitamente AdminResumenView FIX-ADM-01, existencia física y mapeo de las 9 subpáginas modulares FIX-ADM-02, ausencia de ReferenceError/TDZ en crearVariante FIX-ADM-03, evaluación en sandbox Node/VM sin excepciones FIX-ADM-04, y redirección contextual por función activa en AppHeader y AdminView FIX-ADM-05).
- **17. Pruebas de Bootstrap Automático Limpio para Render (`.tmp/tests/render_bootstrap_clean.test.js`):** 6/6 pasaron (Creación de admin inicial con bcrypt y empleado BOOT-01, 9 categorías oficiales con atributos BOOT-02, configuración de empresa con descuentos 7%/5% y moneda BOB BOOT-03, estado limpio con 0 productos/clientes/ventas BOOT-04, idempotencia rigurosa ante múltiples llamadas BOOT-05, e integración en server.js, app.js y env.js BOOT-06).
- **18. Pruebas de Migración a Supabase (PostgreSQL) y Sincronización en Tiempo Real (SPEC-017) (`.tmp/tests/supabase_realtime_migration.test.js`):** 6/6 pasaron (Soporte PostgreSQL/SSL y fallback SQLite REQ-SUP-01, esquema agnóstico describeTable sin PRAGMA REQ-SUP-02, script SQL y publicación supabase_realtime REQ-SUP-03, endpoints /api/config/public y SSE /api/realtime/stream con hooks Sequelize REQ-SUP-04, cliente realtime.js con debounce 150ms y catalogStore.refreshSilently() REQ-SUP-05/06, y suscripciones en App.vue, 5 vistas de cliente y 8 subvistas de /admin/* REQ-SUP-07/08).
- **19. Pruebas de Optimización de Imágenes, Evidencias en Distribución e Historial (SPEC-018) (`.tmp/tests/spec018_imagenes_evidencias_distribucion.test.js`):** 5/5 pasaron (Compresión canvas 1280px con factor 0.8 en frontend y validación 5MB/mágica en backend con 400 REQ-IMG-01/02, avance de estado con fotos en operador y restricción estricta 403 a cliente/vendedor REQ-OPR-01 a REQ-OPR-04, historial inmutable con estructura normalizada y columna fotos en despachos REQ-HIS-01/02, visor modal/lightbox en TrackingView, e inspección en AdminSoporteView y AdminPedidosView REQ-VIS-01 a REQ-VIS-03).
- **20. Pruebas de Sistema Integral de Notificaciones por Correo Electrónico (SPEC-019) (`.tmp/tests/spec019_emails_notificaciones.test.js`):** 6/6 pasaron (Recuperación de contraseña exclusiva para clientes con código de 6 dígitos SHA-256 y expiración 15m REQ-EML-01/02, ruta /recuperar-contrasena y enlace en LoginView REQ-EML-03, comprobante HTML con ítems/guía TRK en enviarRecibo REQ-EML-04, restricción selectiva EN_CAMINO/ENTREGADO en enviarActualizacionEnvio REQ-EML-05, emisión de resolución de reclamo REQ-EML-06, y transporte dual nodemailer/simulación resiliente REQ-EML-07).
- **21. Pruebas de Adaptabilidad Móvil y Menús Desplegables (SPEC-020) (`.tmp/tests/spec020_navegacion_movil_desplegables.test.js`):** 5/5 pasaron (Reglas `@media (max-width: 767px)` ocultando `.header-actions` y `.admin-sidebar` y mostrando `.mobile-header-actions` REQ-MOB-01, botón hamburguesa `.mobile-menu-toggle` con `aria-expanded`, panel `.mobile-nav-panel` y enlaces completos REQ-MOB-02, cierre automático al navegar/backdrop/Escape REQ-MOB-03, selector `.admin-mobile-nav` en `AdminView.vue` filtrado por función activa REQ-MOB-04, y `.mobile-nav-link` con `min-height: 44px`, bordes redondeados y resalte activo REQ-MOB-05).
- **22. Pruebas de Estado En Espera de Comprobación QR y Nombre de Cliente (SPEC-026) (`.tmp/tests/spec026_estado_espera_qr_nombre_cliente.test.js`):** 5/5 pasaron (Estado inicial EN_ESPERA_COMPROBACION y retención de venta/recibo REQ-PAG-QR-01, compatibilidad de flujo directo por tarjeta REQ-PAG-QR-02, control estricto RBAC 401/403 en verificación manual REQ-PAG-QR-03, verificación manual con transición a PEDIDO_CONFIRMADO, venta pagada, recibo digital oficial y auditoría REQ-PAG-QR-04, y nombre real del comprador en pedidos de administración y alertas frontend REQ-PAG-QR-05/06).
- **23. Pruebas de Ocultamiento de Carrito Móvil para Personal Staff (SPEC-027) (`.tmp/tests/spec027_carrito_movil_staff_fix.test.js`):** 4/4 pasaron (Ocultamiento de .mobile-cart-btn con v-if="!auth.isStaff" REQ-MOB-STAFF-01, bloqueo de montaje de CartDrawer y guarda temprana en abrirCarrito() REQ-MOB-STAFF-02, preservación completa para clientes e invitados REQ-MOB-STAFF-03, y alineación flexbox margin-left: auto en cabecera móvil REQ-MOB-STAFF-04).
- **Compilación de Frontend Vue 3:** `npm run build` en `frontend/` compiló sin errores en 2.21s (`219 módulos transformados`, 0 errores).
- **Total:** **23 / 23 suites, 161 / 161 pruebas superadas (100% éxito)**.

---

## 3. Auditoría de Arquitectura y Restricciones
- **Arquitectura:** Estricto cumplimiento del patrón MVC en backend (`models/`, `views` en frontend, `controllers/`, `services/`, `routes/`, `middlewares/`).
- **Restricciones de entorno:** Todas las dependencias son locales al proyecto (`package.json` en `backend/` y `frontend/`), sin modificaciones al sistema operativo ni paquetes globales instalados. Base de datos 100% local en archivo SQLite.
