# Coordinación y Estado del Agente Implementador

## Rol
- Implementar el código de producción de las especificaciones EARS aprobadas en `.specs/requirements/`.
- Respetar arquitectura **MVC**, backend **JavaScript** y frontend **Vue.js**.
- Persistir la información en **Supabase PostgreSQL** cuando `DATABASE_URL`/`SUPABASE_DB_URL` esté definida, con fallback controlado a **SQLite** local (`backend/data/bytepro.sqlite`) para desarrollo y pruebas aisladas.
- No instalar dependencias globales ni modificar el sistema operativo; no escribir ni ejecutar pruebas (delegadas exclusivamente a `revisor`).

## Estado actual (2026-11-14)
Implementación completa en producción para **SPEC-001** a **SPEC-018**.

### Backend (`backend/`)
- Node.js + Express + Sequelize + SQLite (`backend/data/bytepro.sqlite`).
- Migración automática sin pérdida de datos en `models/index.js` (`afterBulkSync`) para garantizar las columnas de `despachos`, `checkouts` y la tabla `direcciones` en el archivo SQLite existente.
- Modelos: `Usuario`, `Cliente`, `Empleado`, `Direccion`, `Producto`, `Categoria`, `Variante`, `Inventario`, `Carrito`, `CarritoItem`, `Resena`, `Venta`, `VentaItem`, `Checkout`, `CheckoutItem`, `BloqueoStock`, `Transaccion`, `Recibo`, `Despacho`, `EventoAuditoria`, `Kardex`.
- **Distribución y Tracking (SPEC-007)**:
  - Servicio `distribucionService.js`, controlador `distribucionController.js` y rutas `/api/distribucion/*` (y alias `/api/tracking/:codigo`).
  - Generación inmediata de registro en `Despacho` al confirmar pago en `cobroService.js` con código único `TRK-YYYYMMDD-XXXX` (`codigoSeguimiento` / `trackingCode` / `numeroGuia`) y estado inicial `PEDIDO_CONFIRMADO` (`estadoInicial: 'PREPARANDO_PEDIDO'`).
  - Persistencia en SQLite (`checkouts` y `despachos`) de `nombreDestinatario`, `direccion`, `ciudad`, `telefono` y `notas`.
  - Validación previa al pago (`REQ-DIS-03`): rechaza con HTTP `400` si faltan campos obligatorios o si la ciudad está fuera de `CIUDADES_COBERTURA` (`La Paz`, `El Alto`, `Cochabamba`, `Santa Cruz`, `Sucre`, `Oruro`, `Potosí`, `Tarija`, `Trinidad`, `Cobija`, etc.).
  - Ciclo de vida secuencial en 4 fases (`PEDIDO_CONFIRMADO` → `EN_PREPARACION` → `EN_CAMINO` → `ENTREGADO`) vía `PATCH /api/distribucion/despachos/:idOrCodigo/estado` (y `/api/admin/pedidos/:ventaId/estado`). Registra timestamp, ubicación/punto de control e historial en SQLite, y notifica por email simulado.
  - Rechazo de saltos de fase inválidos con HTTP `400` y mensaje exacto `"Transición de estado logística inválida"`.
  - Seguimiento público (`GET /api/distribucion/tracking/:codigo` sin token) que oculta datos personales sensibles, y seguimiento privado autenticado (con token Bearer) que despliega componentes adquiridos, dirección completa y comprobante.
  - Código inexistente retorna HTTP `404` con mensaje exacto: `"El número de guía no fue encontrado. Verifica el código e intenta nuevamente"`.
- **Clientes, Mis Pedidos y Libreta de Direcciones (SPEC-008)**:
  - Servicio `clienteService.js`, controlador `clienteController.js` y rutas `/api/clientes/*` (y alias `/api/pedidos`, `/api/direcciones`).
  - `GET /api/clientes/pedidos`: historial cronológico para usuarios con rol `cliente`, incluyendo `numeroPedido`, `fecha`, `total`, `pildora` (`Pagado`, `En preparación`, `En camino`, `Entregado`, `Cancelado`), `codigoSeguimiento` y `puedeCancelar`.
  - `GET /api/clientes/pedidos/:ventaId`: desglose completo de ítems (imágenes, variantes, SKU, cantidades, subtotales), método de pago, dirección de despacho y comprobante.
  - `POST /api/clientes/pedidos/:ventaId/cancelar` (también `PATCH` y `/api/cobros/ventas/:ventaId/cancelar`): permite cancelar en `PEDIDO_CONFIRMADO` o `EN_PREPARACION`, actualizando la venta y el despacho a `CANCELADO` y reintegrando el stock físico en `Inventario` + asiento `ENTRADA` en `Kardex`.
  - Bloqueo de cancelación cuando el pedido está en `EN_CAMINO` o `ENTREGADO` con HTTP `400` y mensaje exacto: `"El pedido ya se encuentra en ruta de entrega y no puede ser cancelado directamente"`.
  - CRUD de libreta de direcciones en SQLite (`GET/POST/PUT/DELETE /api/clientes/direcciones`) con `etiqueta` (`Casa`, `Oficina`), `nombreDestinatario`, `calle`, `ciudad`, `telefono`, `referencias` y `predeterminada`. Autocarga en `POST /api/cobros/checkout`.
- **Empresa y Dashboard Operativo (SPEC-009)**:
  - `GET /api/admin/resumen` (y `/api/admin/metricas`, `/api/admin/dashboard`): KPIs calculados reactivamente desde SQLite (`ingresosAcumulados`, `ventasMes`, `pedidosRealizados`, `pedidosPendientesDespacho`, `productos`, `variantes`, `stockBajo`, `alertasReabastecimiento`).
  - `GET /api/admin/pedidos` (y `/api/admin/ventas`): tabla paginada con ID de pedido, cliente, fecha/hora, monto total, `estadoPago` y `estadoLogistica`.
  - `PATCH /api/admin/pedidos/:ventaId/estado` (y `/api/admin/despachos/:id/estado`): transición de fase logística sincronizada con la vista de tracking.
  - `GET /api/admin/alertas-stock`: variantes con stock disponible `<= 3` o bajo su umbral configurado.

### Frontend (`frontend/`)
- Nuevas vistas:
  - `TrackingView.vue` (`/seguimiento/:codigo?` y `/tracking/:codigo?`): buscador de guía, barra de progreso, línea de tiempo de 4 etapas con indicadores de 14px, vista pública protegida y vista privada autenticada con componentes, dirección y enlace a recibo.
  - `OrdersView.vue` (`/mis-pedidos`, `/cuenta/pedidos`, `/direcciones`): listado de pedidos con píldoras de estado, panel desplegable de detalle, botón de cancelación con reintegro de stock y gestión de libreta de direcciones.
- Vistas actualizadas:
  - `CheckoutView.vue`: selector rápido de direcciones guardadas en tarjetas/radio, formulario de datos de entrega y enlace directo al tracking tras confirmar el pago.
  - `AdminView.vue`: barra lateral fija de 220px, tarjetas KPI de 26px, sección destacada de "Alertas de Reabastecimiento" con acceso directo al Kardex y tabla paginada de gestión operativa de pedidos y despachos.
- **Diseño e Interfaz UX Transversal (SPEC-010)**:
  - `frontend/src/assets/styles.css`:
    - `REQ-UI-01`: Escala global incrementada un 14% (`html { font-size: 114%; }`, `--ui-scale: 1.14`, `--max-width: 1460px`, espaciados y alturas proporcionales).
    - `REQ-UI-02` / `REQ-ECO-01`: Cuadrícula de productos en catálogo de 3 tarjetas por fila en escritorio (`.product-grid` y `.loading-grid` con `grid-template-columns: repeat(3, minmax(0, 1fr))`).
    - `REQ-UI-03` y `REQ-UI-04`: Elementos `<select>` (`.select`, `.select-inline`, `select`) con `appearance: none`, borde `#D1D5DB`, radio `12px`, ícono chevron SVG integrado, fondo `#FFFFFF`, y realce `:hover`/`:focus` con borde `#2563EB` y anillo de foco suave (`box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18)`).
    - `REQ-UI-05`: Botones redondeados tipo píldora (`border-radius: 9999px`) en `button`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-tertiary`, `.btn-danger`, `.btn-danger-link`, `.btn-sm`, `.compare-toggle` y `.page-btn`.
    - `REQ-UI-06`: Botones de advertencia/peligro/destructivos (`.btn-danger`, `.btn-danger-link`) en color rojo `#DC2626` con hover `#B91C1C` y texto blanco `#FFFFFF`.
  - `REQ-UI-07` a `REQ-UI-09`:
    - Nuevo componente reutilizable `frontend/src/components/ConfirmModal.vue` montado en `App.vue` y gestionado mediante `useUiStore().confirm(...)` en `frontend/src/store/ui.js`.
    - Confirmación modal obligatoria integrada en: eliminar ítem del carrito y vaciar carrito (`CartView.vue`), confirmar pago de orden (`CheckoutView.vue`), cancelar pedido y eliminar dirección (`OrdersView.vue`), cambio de estado logístico y registro de movimientos/bajas/ajustes de stock (`AdminView.vue`), y vaciar comparador (`CompareView.vue`).

## Cobertura EARS
- **SPEC-001 a SPEC-006**: implementados y validados.
- **SPEC-007**: `REQ-DIS-01` a `REQ-DIS-09` implementados.
- **SPEC-008**: `REQ-CLI-01` a `REQ-CLI-08` implementados.
- **SPEC-009**: `REQ-ADM-01` a `REQ-ADM-05` implementados.
- **SPEC-010**: `REQ-UI-01` a `REQ-UI-09` implementados.
- **Ajuste SPEC-010 (REQ-UI-10)**: Ampliación de la barra lateral de filtros en +12% (`.catalog-layout` de 260px a 292px en desktop y de 220px a 246px en breakpoint responsivo; control anti-desbordamiento con `text-overflow: ellipsis; overflow: hidden; white-space: nowrap;` en `.select`).
- **Ajuste SPEC-010 (REQ-UI-11)**: Actualización a diseño Full-Width 100% fluido (`--max-width: 100%;` / `width: 100%;` en `.container`, `.app-main`, `.site-header`, `.header-inner` y `.category-bar-inner`) con padding lateral de respiración `padding: 0 var(--space-8);`.
- **Soporte, Reclamos y Ayuda (SPEC-011)**:
  - Modelo `Reclamo` persistido en SQLite con código `TKT-YYYYMMDD-XXXX`, nombre, contacto (email/celular), tipo de solicitud, pedido opcional, descripción, estado (`PENDIENTE`, `EN_ATENCION`, `RESUELTO`), empleado asignado y solución.
  - Endpoints públicos y protegidos `/api/soporte/*` (`/reclamos`, `/ayuda`, `/reclamos/:idOrCodigo/tomar`, `/reclamos/:idOrCodigo/resolver`).
  - Vista cliente `SupportView.vue` (`/ayuda`, `/reclamos`, `/soporte`) y sección administrativa en `AdminView.vue`.
- **Control de Empleados, Roles Múltiples y Desacoplamiento (SPEC-012)**:
  - Restricción estricta 403 con mensaje `"Esta operación requiere la función activa correspondiente"` implementada mediante `requireActiveFunction` en `backend/src/middlewares/rbac.js`.
  - Roles múltiples persistidos en SQLite (`usuarios.roles` JSON y `usuarios.funcion_activa`).
  - Endpoint `POST /api/auth/cambiar-funcion` y conmutador visual integrado en `AppHeader.vue` y `AdminView.vue`.
  - Desacoplamiento portal vs tienda: elementos de compra ocultos para staff en `AppHeader.vue` y `AppFooter.vue`, y redirección obligatoria en `router/index.js` desde rutas cliente (`/`, `/carrito`, `/checkout`, `/comparar`, etc.) hacia `/admin`.
- **Portal Corporativo Modular y Gestión de Personal (SPEC-013)**:
  - Descomposición de `/admin` en subpáginas y rutas hijas independientes (`/admin/resumen`, `/admin/productos`, `/admin/pedidos`, `/admin/inventario`, `/admin/soporte`, `/admin/personal`, `/admin/auditoria`).
  - Menú lateral dinámico y reactivo según la función activa (`vendedor`: Resumen y Productos; `operaciones`: Resumen, Pedidos e Inventario; `soporte`: Resumen y Soporte; `admin`: acceso integral).
  - Actualización reactiva instantánea del menú y redirección automática al cambiar de función sin recargar la página.
  - Módulo CRUD de Personal (`/admin/personal` y `/api/admin/usuarios` con protección estricta 403 para no admin), enfocado única y exclusivamente en empleados del personal corporativo (`vendedor`, `soporte`, `operaciones`, `admin`), excluyendo clientes y compradores de la tabla y del formulario de alta.
  - Ajuste `REQ-ADM-14`: Alineación uniforme con cuadrícula `.table-actions-grid` (`grid-auto-columns: minmax(110px, 1fr)`) para garantizar simetría horizontal y vertical de los botones de acciones en tablas administrativas.

## Cobertura EARS
- **SPEC-001 a SPEC-006**: implementados y validados.
- **SPEC-007**: `REQ-DIS-01` a `REQ-DIS-09` implementados.
- **SPEC-008**: `REQ-CLI-01` a `REQ-CLI-08` implementados.
- **SPEC-009**: `REQ-ADM-01` a `REQ-ADM-05` implementados.
- **SPEC-010**: `REQ-UI-01` a `REQ-UI-14` implementados.
- **Logo Oficial BytePro**: Integración de `icon-bytepro.png` en `AppHeader.vue`, `LandingView.vue`, `AppFooter.vue`, `LoginView.vue`, `CompanyLoginView.vue` y `RegisterView.vue`.
- **SPEC-011**: `REQ-SOP-01` a `REQ-SOP-07` implementados.
- **SPEC-012**: `REQ-EMP-01` a `REQ-EMP-10` implementados.
- **SPEC-013**: `REQ-ADM-06` a `REQ-ADM-13` implementados.
- **SPEC-014**: `REQ-PROD-01` a `REQ-PROD-10` implementados (Alta por Vendedor, Galería multi-imagen `REQ-PROD-08`, Variantes dinámicas en edición `REQ-PROD-09`, Auto-scroll suave hacia el formulario `REQ-PROD-10`).
- **Fix de Estabilidad /admin**: Resolución de ReferenceError TDZ en `crearVariante()` de `AdminProductosView.vue`, asignación de componente directo en ruta hija vacía de `/admin` en `router/index.js` y redirección contextual por rol en `AppHeader.vue`.
- **Fix Visual /carrito**: Corrección de desbordamiento de imágenes en `CartView.vue` y `styles.css` mediante `overflow: hidden` en `.cart-thumb` y regla `.cart-thumb img` (`width: 100%; height: 100%; object-fit: cover; display: block;`).
- **Bootstrap Automático para Despliegue en Render**: Creación de `backend/src/bootstrap.js` (admin inicial único, 9 categorías base y configuración de empresa por defecto sin datos operativos), integración en `server.js` tras `sync()`, servicio de `frontend/dist` en `app.js` y CORS configurable en `env.js`.
- **Fix Visual Detalle de Producto**: Corrección de desbordamiento de imágenes en `ProductDetailView.vue` y `styles.css` mediante `overflow: hidden`, `position: relative` y `padding` en `.detail-main-image`, `flex-shrink: 0` y `overflow: hidden` en `.thumb`, scroll horizontal en `.detail-thumbs` y reglas `.detail-main-image img`, `.thumb img` con `object-fit: contain`.
- **SPEC-015**: `REQ-MON-01`, `REQ-CAT-15`, `REQ-DSH-01` a `REQ-DSH-04` implementados (moneda BOB, categoría Accesorios y dashboard analítico Día/Mes/Año con Top Productos/Categorías).
- **SPEC-016**: `REQ-CMP-01`, `REQ-COM-01` a `REQ-COM-03`, `REQ-AJU-01` a `REQ-AJU-03` y `REQ-RET-01` a `REQ-RET-04` implementados (compra rápida en comparador, comunicados internos, proveedores/sucursales y retiro en tienda con descuentos escalonados).

### Migración a Supabase y Tiempo Real (SPEC-017)
- **REQ-SUP-01 / REQ-SUP-02 — Persistencia dual PostgreSQL/SQLite**:
  - Dependencias `pg` y `pg-hstore` añadidas a `backend/package.json`; `@supabase/supabase-js` añadida a `frontend/package.json`.
  - `backend/src/config/env.js`: nuevas variables `databaseUrl`, `supabaseUrl`, `supabaseAnonKey` y `dbSsl`.
  - `backend/src/config/database.js`: instancia Sequelize con dialecto `postgres` (pool `max: 10, min: 0, acquire: 30000, idle: 10000` y SSL `require: true, rejectUnauthorized: false` salvo `localhost`/`127.0.0.1` o `DB_SSL=false`) cuando existe `DATABASE_URL`/`SUPABASE_DB_URL`; fallback SQLite si no hay URL o si `NODE_ENV=test` fuerza `DB_STORAGE`.
  - `backend/src/models/index.js`: `ensureColumns()` usa `describeTable()` y convierte `DATETIME` a `TIMESTAMP WITH TIME ZONE` en PostgreSQL.
  - `backend/.env.example` documenta `DATABASE_URL`, `SUPABASE_DB_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `DB_SSL`.
- **REQ-SUP-03 — Publicación Realtime**:
  - `supabase_realtime.sql` (raíz) habilita `REPLICA IDENTITY FULL`, añade las tablas críticas a la publicación `supabase_realtime` de forma idempotente y crea políticas RLS de lectura para `anon`/`authenticated`.
  - `backend/src/bootstrap.js` aplica la misma configuración en PostgreSQL con `try/catch` por sentencia y sin afectar el arranque en SQLite.
- **REQ-SUP-04 — Hub backend y endpoints**:
  - `backend/src/services/realtimeHub.js`: clientes SSE, heartbeat de 25 s, emisión `{ table, action, id, timestamp }` y hooks globales `afterCreate`, `afterUpdate`, `afterDestroy`, `afterBulkCreate`, `afterBulkUpdate` y `afterBulkDestroy` (respetando `afterCommit` cuando existe transacción).
  - `GET /api/config/public` devuelve `{ supabaseUrl, supabaseAnonKey, dialect, realtimeEnabled: true }`.
  - `GET /api/realtime/stream` expone `text/event-stream` con `Cache-Control: no-cache`, `Connection: keep-alive` y heartbeat.
- **REQ-SUP-05 a REQ-SUP-08 — Cliente reactivo**:
  - `frontend/src/services/realtime.js`: configuración desde `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` o `/api/config/public`, canal `bytepro-realtime` con `postgres_changes` (`event: '*'`, `schema: 'public'`), `EventSource('/api/realtime/stream')` en paralelo con reconexión automática, `subscribeToTables(tables, callback)` con debounce de 150 ms y `disconnectRealtime()`.
  - `catalog.refreshSilently()` refresca productos, categorías, precios y stock sin activar `loading`; `cart.fetchCart()` alias de `fetch()`; `checkout.refrescarSesionSilenciosa()` actualiza la sesión sin perder el formulario.
  - `App.vue` inicializa el servicio y suscribe `productos`, `variantes`, `inventarios`, `categorias` y `resenas`.
  - Suscripciones con limpieza en `onUnmounted`: `ProductDetailView`, `CheckoutView`, `OrdersView`, `TrackingView`, `SupportView`, `AdminResumenView`, `AdminProductosView`, `AdminPedidosView`, `AdminInventarioView`, `AdminSoporteView`, `AdminComunicadosView`, `AdminAjustesView` y `AdminAuditoriaView`.
  - Las tablas reales `venta_items` y `configuracion_empresa` se cubren junto a los alias conceptuales `lineas_venta` y `configuraciones_empresa` para compatibilidad con la especificación.

### Optimización de Imágenes, Evidencias de Despacho e Historial (SPEC-018)
- **REQ-IMG-01 — Compresión en cliente**:
  - Nuevo `frontend/src/utils/imageCompressor.js`: redimensiona proporcionalmente a 1280 px de lado mayor, exporta JPEG con calidad 0.8 (reducción progresiva hasta 0.5 si supera ~300 KB), acepta JPEG/PNG/WEBP de hasta 20 MB y devuelve DataURL optimizada.
  - Integrado en `AdminProductosView.vue` (galería del catálogo) y en el modal de evidencias de `AdminPedidosView.vue`.
- **REQ-IMG-02 — Validación backend**:
  - Nuevo `backend/src/utils/imagePayload.js`: valida DataURL/URL, MIME permitido (`image/png`, `image/jpeg`, `image/jpg`, `image/webp`), tamaño ≤5 MB y firma binaria JPEG/PNG/WEBP. Rechaza con HTTP `400` y mensaje exacto `"Formato o tamaño de imagen no admitido"`.
- **REQ-OPR-01 a REQ-OPR-04 — Evidencias por etapa**:
  - `Despacho` incorpora `fotos` (`DataTypes.JSON`); `models/index.js` migra la columna como `JSONB` en PostgreSQL y `TEXT` en SQLite.
  - `distribucionService.actualizarEstadoDespacho()` acepta `fotos`, las valida con `normalizarFotos`, las persiste en `evento.fotos` y las acumula en `despacho.fotos`.
  - Nuevo middleware `requireDispatchOperator` con mensaje exacto `"Esta operación requiere la función activa de Operaciones o Admin"` aplicado a las rutas de cambio de estado en `adminRoutes.js` y `distribucionRoutes.js`.
  - `adminController.actualizarEstadoPedido` y `distribucionController.actualizarEstado` propagan `fotos`, `foto`, `evidencias` o `evidencia` desde `req.body`.
- **REQ-HIS-01 / REQ-HIS-02 — Historial íntegro y compatible**:
  - `normalizarHistorial()` garantiza `fotos: []` y `operador` en cada evento, con fallback para registros previos y evento inicial.
  - `serializarDespacho()` expone `fotos` y `evidencias` generales (derivadas también del historial) en modo público y privado; `construirEtapas()` incluye fotos/operador por hito.
- **REQ-VIS-01 a REQ-VIS-03 — Visualización y tiempo real**:
  - `TrackingView.vue`: galería de miniaturas por evento del historial y lightbox ampliado.
  - `AdminPedidosView.vue`: modal de avance con ubicación, nota, carga múltiple de fotos comprimidas, preview/eliminación y envío `{ estado, ubicacion, nota, fotos }`; modal de historial con fotos y lightbox por pedido.
  - `AdminSoporteView.vue`: botón "Ver historial y fotos" en el detalle del ticket que resuelve el despacho por `TRK-*` o por los dígitos de `PED-XXXX`, muestra la línea de tiempo con evidencias y se refresca por Realtime (`reclamos`, `despachos`, `ventas`).
  - `styles.css`: estilos compartidos para `modal-card-lg`, `evidence-grid`, `evidence-thumb`, `dispatch-timeline` y `lightbox-image`.
- **Verificación**: `node --check` sobre los archivos backend modificados y `npm --prefix frontend run build` (Vite) ejecutados sin errores.

### Ampliación SPEC-018: Mobile, Notas por Punto y Estado "Sin imágenes" (REQ-OPR-02, REQ-OPR-05, REQ-VIS-04)
- **REQ-OPR-02 — Galería y cámara en vivo**:
  - `AdminPedidosView.vue` incorpora dos controles duales: **"Subir de galería"** (`<input type="file" accept="image/*" multiple>`) y **"Tomar foto"** (`<input type="file" accept="image/*" capture="environment">`).
  - Ambos inputs se disparan mediante botones y comparten `onFotosSeleccionadas()`, por lo que todas las imágenes pasan por `imageCompressor.js`, se previsualizan y pueden eliminarse antes de confirmar.
- **REQ-OPR-05 — Notas adicionales por punto**:
  - El modal de avance usa el campo **"Notas o comentarios adicionales del proceso"** (`modalAvance.nota`) con ejemplos de uso y lo envía como `nota` al backend.
- **REQ-VIS-04 — Detalle del hito, notas y estado vacío**:
  - `TrackingView.vue`, `AdminPedidosView.vue` y `AdminSoporteView.vue` muestran la nota del hito en un bloque destacado `.dispatch-note`.
  - Si el hito tiene fotos, se despliega la galería con lightbox; si no tiene, se muestra explícitamente el indicador **"Sin imágenes"** (`.evidence-empty`).
- **Backend**:
  - `normalizarHistorial()` garantiza `nota: ev.nota || null` y `fotos: []` por evento, aceptando retrocompatiblemente `fotos`, `evidencias`, `foto` o `evidencia`.
  - `actualizarEstadoDespacho()` persiste `nota` y `fotos` en cada evento y `serializarDespacho()` los expone en modo público y privado.
- **Estilos**: nuevas reglas `.evidence-upload-actions`, `.evidence-file-input`, `.evidence-empty`, `.dispatch-note` y `.dispatch-note-label` en `styles.css`.
- **Verificación**: `node --check backend/src/services/distribucionService.js` y `npm --prefix frontend run build` ejecutados sin errores.

### Fix de Seguridad: Mensaje Unificado de Autenticación (REQ-SEC-06)
- **`backend/src/services/authService.js`**: los cuatro rechazos de credenciales (email/password faltantes, cuenta inexistente, contraseña incorrecta de admin y fallo general) ahora lanzan `AppError('Usuario o contraseña incorrecta', 401)`.
- **`backend/src/controllers/authController.js`**: el rechazo de clientes en `loginEmpresa` usa el mismo mensaje exacto.
- **`frontend/src/views/LoginView.vue`** y **`CompanyLoginView.vue`**: se conserva el mensaje devuelto por el backend (`auth.error`) y el fallback local es `"Usuario o contraseña incorrecta"`.
- **Verificación**: `node --check backend/src/services/authService.js backend/src/controllers/authController.js` y `npm --prefix frontend run build` ejecutados sin errores.

### Ajuste Visual de Botones
- **`frontend/src/assets/styles.css`**:
  - `.btn`: `padding: 10px 24px;`, `min-height: 48px; height: auto;`, `line-height: 1.25;`, `box-sizing: border-box;` y `font-size: 0.925rem;`.
  - `.btn-sm`: `padding: 8px 18px;`, `min-height: 38px; height: auto;`, `font-size: 0.825rem;` y `line-height: 1.2;`.
  - `.btn-tertiary`: `min-height: 44px; height: auto;` y `padding: 8px 22px;`.
  - `.btn-danger-link`: `padding: 7px 20px;` y `font-size: 0.85rem;`.
  - `.table-actions-grid`: `grid-auto-columns: minmax(120px, 1fr);` y `.table-actions-grid .btn` con `min-width: 120px; padding: 7px 14px;`.
  - `.compare-toggle`: `min-height: 40px; height: auto; padding: 8px 16px; font-size: 0.835rem;`.
  - Se eliminaron las alturas rígidas (`height: 50px/40px/44px`) para evitar que textos largos, iconos o saltos de línea toquen los bordes.
- **Verificación**: `npm --prefix frontend run build` ejecutado sin errores.

### SPEC-019: Sistema Integral de Notificaciones por Correo Electrónico
- **Dependencias y configuración (REQ-EML-07)**:
  - Instalado `nodemailer` en `backend/package.json`.
  - `backend/src/config/env.js` expone `smtpHost`, `smtpPort`, `smtpUser`, `smtpPass`, `smtpFrom` y `appUrl`.
  - `backend/.env.example` documenta `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` y `APP_URL`.
- **Persistencia del código de reseteo (REQ-EML-01, REQ-EML-02)**:
  - `models/Usuario.js`: campos `resetPasswordToken` (`STRING(128)`) y `resetPasswordExpires` (`DATE`).
  - `models/index.js`: `ensureColumns('usuarios', ...)` agrega `reset_password_token` y `reset_password_expires` (convertidos a `TIMESTAMP WITH TIME ZONE` en PostgreSQL).
- **Servicio de correo dual (`emailService.js`)**:
  - Transporte `nodemailer` perezoso cuando existen `SMTP_HOST` y `SMTP_USER`; en `NODE_ENV=test` o sin credenciales opera en simulación con log en consola y retorno `{ enviado: true, simulado: true, tipo, destino, fecha }`.
  - Los fallos SMTP se capturan y se devuelven como `{ enviado: false, ... }`, sin propagar excepciones a pagos, logística ni soporte.
  - `enviarCodigoRecuperacion`: plantilla corporativa con código de 6 dígitos destacado, vigencia de 15 minutos y enlace a `/recuperar-contrasena`.
  - `enviarRecibo`: tabla de ítems (producto, variante, SKU, cantidad, precio y subtotal), desglose (subtotal, descuento por retiro, IVA y total BOB), información de entrega (sucursal o domicilio) y guía `TRK-...` con enlace a `/seguimiento/:codigo`.
  - `enviarActualizacionEnvio`: solo despacha para `EN_CAMINO` y `ENTREGADO`; cualquier otro estado retorna `{ omitido: true, razon: 'Estado no requiere notificación' }`.
  - `enviarResolucionReclamo`: correo al email del ticket con código `TKT-...`, tipo, pedido asociado, solución y fecha de resolución.
- **Lógica de reseteo (`authService.js`, `authController.js`, `authRoutes.js`)**:
  - `solicitarRecuperacionPassword(email)` normaliza el correo, exige rol `cliente` y responde siempre con el mensaje genérico para impedir enumeración.
  - Genera un código con `crypto.randomInt(100000, 999999)`, guarda su hash SHA-256 y expiración a 15 minutos, y envía el correo.
  - `restablecerPasswordConCodigo()` valida mínimo 8 caracteres, vigencia y hash (comparación `timingSafeEqual`); actualiza `passwordHash` con bcrypt y limpia token, expiración, `intentosFallidos` y `bloqueadoHasta`.
  - Endpoints públicos: `POST /api/auth/recuperar-password` y `POST /api/auth/restablecer-password`.
- **Integración logística y soporte (REQ-EML-05, REQ-EML-06)**:
  - `distribucionService.actualizarEstadoDespacho()` solo invoca la notificación de envío para `EN_CAMINO`/`ENTREGADO` y le pasa la nota del operador.
  - `soporteService.resolverCaso()` envía la resolución al correo del ticket tras guardar el estado `RESUELTO`, sin bloquear la respuesta si el correo falla.
- **Frontend (REQ-EML-03)**:
  - `LoginView.vue` incluye el enlace **"¿Olvidaste tu contraseña?"** y muestra el mensaje de éxito al volver con `?recuperado=1`.
  - Nueva vista `ForgotPasswordView.vue` en `/recuperar-contrasena` (`guestOnly`): paso 1 correo; paso 2 código de 6 dígitos, nueva contraseña y confirmación, cuenta regresiva de 15 minutos y opción de reenviar código. Al completar redirige a `/login`.
  - `styles.css` agrega `.auth-forgot`, `.field-success`, `.recovery-countdown` y `.recovery-countdown-expired`.
- **Verificación**: `node --check` sobre todos los archivos backend modificados y `npm --prefix frontend run build` ejecutados sin errores.

### SPEC-020: Adaptabilidad Móvil y Menús Desplegables
- **REQ-MOB-01 — Ocultamiento en mobile**:
  - `AppHeader.vue` incorpora `.mobile-header-actions` con el carrito directo (`.mobile-cart-btn` con badge) y el botón hamburguesa `.mobile-menu-toggle`.
  - La media query `max-width: 767px` oculta `.search-bar`, `.role-switcher-header`, `.header-actions` y `.category-bar`, preservando únicamente logo, carrito y menú.
  - `AdminView.vue` oculta `.admin-sidebar` en mobile y muestra el selector `.admin-mobile-nav`.
- **REQ-MOB-02 — Menú desplegable interactivo**:
  - Panel `.mobile-nav-menu.mobile-nav-panel` con enlaces táctiles e iconos SVG: Catálogo, Ayuda y Reclamos, Seguimiento de envío, Comparar (con badge), Mis pedidos (si autenticado), nombre del usuario y acción Ingresar/Salir.
  - Para staff incluye acceso al Panel y `<select>` de función activa cuando hay múltiples roles.
  - El botón cambia entre icono hamburguesa y `X` según `menuAbierto`, con `aria-label`, `aria-expanded` y `aria-controls`.
- **REQ-MOB-03 — Cierre automático**:
  - Cada enlace ejecuta `cerrarMenu()` y el `watch` de `route.fullPath` también cierra el panel.
  - Backdrop `.mobile-nav-backdrop` y tecla `Escape` cierran el menú; el listener se registra en `onMounted` y se elimina en `onBeforeUnmount`.
- **REQ-MOB-04 — Navegación corporativa móvil**:
  - `AdminView.vue` agrega `.admin-mobile-nav` con `<select class="select select-block">` que lista los módulos autorizados según `esAdmin`, `puedeVendedor`, `puedeOperaciones` y `puedeSoporte`.
  - `moduloActual` refleja la ruta activa (mapeando `admin` a `admin-resumen`) e `irAModulo()` redirige de inmediato.
- **REQ-MOB-05 — Estilos**:
  - Nuevas reglas en `styles.css`: `.mobile-header-actions`, `.mobile-menu-toggle`, `.mobile-nav-backdrop`, `.mobile-nav-menu`, `.mobile-nav-panel`, `.mobile-nav-link`, `.mobile-nav-field`, `.mobile-nav-footer`, `.mobile-nav-user`, `.admin-mobile-nav` y `.select-block`.
  - Enlaces con `min-height: 44px`, padding táctil, bordes redondeados, fondo `#FFFFFF` y resalte `var(--color-primary-soft)`/`var(--color-primary-dark)` en estado activo.
- **Verificación**: `npm --prefix frontend run build` ejecutado sin errores.

### SPEC-021: Rediseño Interactivo y Minimalista de la Landing Page
- **Estilo visual (Retail Minimalista Moderno)**:
  - `LandingView.vue` define variables locales `--lp-bg: #f8fafc`, `--lp-surface: #ffffff`, `--lp-border: #e2e8f0`, `--lp-accent: #2563eb` y sombras suaves.
  - Tipografía Inter heredada, tarjetas blancas con bordes `#E2E8F0`, radios de 12–26 px y acentos azules.
- **REQ-LND-01 — Hero con selector de presets**:
  - Tres pestañas redondeadas (`role="tab"`, `aria-selected`): **Gaming Ultra**, **Creación de Contenido** y **Oficina & Productividad**.
  - Cada preset define etiqueta, categoría, nombre, especificación destacada, precio en Bs., descripción, tres puntos clave, icono PNG e id de categoría del catálogo.
- **REQ-LND-02 — Conmutación reactiva**:
  - `presetActivoId` (ref) + `presetActivo` (computed) alimentan la tarjeta insignia.
  - `<Transition name="preset-swap" mode="out-in">` aplica fade y desplazamiento suave al cambiar de preset.
  - `presetLink` (computed) actualiza el destino del CTA **Explorar configuración** y **Ver en catálogo** con `query.categoria`.
- **REQ-LND-03 — Simulador “Arma tu setup” en 3 pasos**:
  - Paso 1: botones táctiles Gaming, Render/3D y Oficina/Estudio con `aria-pressed`.
  - Paso 2: slider nativo `min=2500`, `max=25000`, `step=250` con relleno degradado y monto en tiempo real (`Intl.NumberFormat('es-BO')` → `Bs. 2.500`).
  - Paso 3: tarjeta de sugerencia con CPU, GPU, RAM, almacenamiento, precio unitario, total estimado y saldo para placa/fuente/gabinete/periféricos.
  - Botón **Ver componentes en el catálogo** con categoría pre-filtrada según el propósito.
- **REQ-LND-04 — Cálculo 100% reactivo**:
  - `sugerencia` (computed) reparte el presupuesto con porcentajes por propósito (`REPARTO`) y elige el componente más alto que entra en cada asignación (`mejorComponente`), sin peticiones de red.
  - Catálogos locales `COMPONENTES` ordenados por precio ascendente; si ningún componente entra en la asignación se usa el más económico.
- **REQ-LND-05 — Categorías con micro-animaciones**:
  - Tarjetas blancas con `translateY(-4px)` al hover y `box-shadow: 0 12px 24px -4px rgba(37, 99, 235, 0.08)`.
  - Icono con `scale(1.08)` en el contenedor y `scale(1.06)` en la imagen; enlace directo a `catalog?categoria=<slug>`.
- **REQ-LND-06 — Franja de 4 beneficios**:
  - Retiro en tienda con descuento (7% ≥ Bs. 500 y 5% < Bs. 500), garantía oficial, envíos asegurados y precios en Bs., cada uno con icono SVG inline.
- **Verificación**: `npm --prefix frontend run build` ejecutado sin errores (LandingView ≈ 34.8 kB) y `git diff --check` sin observaciones.

### SPEC-022: Simulador con Productos Reales, Carrito Directo y Fotos en la Tarjeta Insignia
- **REQ-SET-01 — Obtención de productos reales**:
  - `LandingView.vue` carga `/api/productos` al montar (`limit: 24`, `orden: 'precio_asc'`) y recorre todas las páginas para reunir el catálogo completo.
  - `productosReales` agrupa por `categoria.slug`: `procesadores` (CPU), `tarjetas-graficas`/`tarjetas-grafica` (GPU), `memoria-ram`/`memorias`/`memoria` (RAM) y `almacenamiento`.
  - Cada componente se normaliza con `varianteId` (`variantes.find(v => v.disponible) || variantes[0]`), nombre, precio real de la variante, imagen y bandera `disponible`.
  - Si la API falla o una categoría no tiene productos, `listaComponentes()` recurre a `COMPONENTES` (contingencia local) sin romper la experiencia.
- **REQ-SET-02 — Selección inteligente con precios reales**:
  - `sugerencia` reparte el presupuesto con `REPARTO` y usa `mejorComponente()` sobre las listas reales ordenadas por precio; el total es la suma exacta de los precios reales.
  - Validado contra los 25 productos del catálogo actual: 0 combinaciones exceden el presupuesto y las 4 categorías resuelven con variante comprable.
- **REQ-SET-03 — Agregar setup al carrito**:
  - El enlace anterior se sustituyó por el botón **Agregar setup al carrito** (con `AppIcon` `cart-add`, spinner y texto **Agregando setup...** mientras procesa).
  - `agregarSetupAlCarrito()` itera `sugerencia.agregables` y ejecuta `cart.add(varianteId, 1, { silencioso: true })`; al terminar abre `ui.openCartDrawer()` y muestra `ui.success('Setup completo agregado al carrito')`.
  - Los componentes sin stock o sin variante se omiten y se informan con `ui.warning('Componentes omitidos: ...')`; también se muestran en la tarjeta como aviso discreto.
  - `cart.add` acepta un tercer parámetro opcional `{ silencioso }` para evitar toasts duplicados por cada componente; las llamadas existentes conservan su comportamiento.
- **REQ-SET-04 — Foto real en la tarjeta insignia**:
  - `buscarProductoPreset()` busca por categoría y claves del preset: RTX 4090/4080/4070 para Gaming, Ryzen 7/9 o i7/i9 para Creación y Vengeance/Fury/DDR5 para Oficina.
  - `insignia` reemplaza nombre, categoría, precio y especificación con los datos reales (derivados de `especificaciones`: VRAM + tipo de memoria, núcleos/hilos, capacidad/tipo/velocidad).
  - Si `imagenPrincipal`, `imagen`, `imagenes[0]` o la imagen de la variante existe, se renderiza `<img class="landing-feature-photo">` con `width/height: 100%` y `object-fit: contain`; si no, se mantiene el icono temático (`iconGrafica`, `iconProcesador`, `iconMemoria`).
- **Verificación**: `npm --prefix frontend run build` sin errores (LandingView ≈ 40.0 kB) y `git diff --check` sin observaciones.

### SPEC-023: Ocultamiento de la Barra de Navegación en Vista Móvil de la Landing Page
- **REQ-LND-MOB-01 — Navegación oculta en móviles**:
  - En `@media (max-width: 767px)` se declara `.landing-nav { display: none; }`, por lo que enlaces como Productos, Arma tu setup, Categorías, Envíos y Ayuda no se renderizan visualmente en teléfonos.
  - Se eliminaron las reglas previas de `order: 3`, `flex-basis: 100%` y `overflow-x: auto`, que provocaban una segunda fila con scroll horizontal.
- **REQ-LND-MOB-02 — Cabecera bipolar en una sola fila**:
  - `.landing-header-inner` usa `flex-direction: row`, `flex-wrap: nowrap`, `justify-content: space-between`, `align-items: center`, `gap: 10px`, `min-height: 64px` y `padding: 10px 0`.
  - `.landing-brand` queda con `flex: 0 0 auto` a la izquierda y `.landing-header-actions` con `flex: 0 0 auto; margin-left: auto` a la derecha.
- **REQ-LND-MOB-03 / REQ-LND-MOB-04 — Acciones de invitados y autenticados**:
  - `.landing-header-actions` mantiene `display: flex`, `gap: 10px` y `white-space: nowrap`; los botones "Iniciar sesión" y "Crear cuenta" (o "Mi cuenta" / "Panel corporativo" según `auth.isAuthenticated` / `auth.isStaff`) no se parten en varias líneas.
  - Se compactaron tamaños en móvil (logo 30 px, marca 0.98 rem, enlaces 0.82 rem, botón primario `padding: 9px 14px`) para evitar desbordes en pantallas angostas.
- **REQ-LND-MOB-05 — Preservación en tablet y escritorio**:
  - Las reglas móviles viven solo dentro de `@media (max-width: 767px)`; desde 768 px se conservan `.landing-nav` con `display: flex` y todos sus enlaces.
  - El ajuste de branding móvil se limitó a `.landing-header .landing-brand` y `.landing-header .landing-brand-logo` para no alterar el logo del footer.
- **Verificación**: `npm --prefix frontend run build` sin errores (LandingView ≈ 40.0 kB) y `git diff --check` sin observaciones.

### SPEC-024: Corrección de Desbordamiento y Eliminación de Scroll Horizontal en Vista Móvil
- **REQ-MOB-FIX-01 — Contención absoluta del viewport**:
  - `.landing-page` y `.landing-main` declaran `width: 100%`, `max-width: 100vw`, `overflow-x: hidden`, `box-sizing: border-box`.
  - Se añade `overflow-x: clip` como declaración posterior: los navegadores modernos la aplican y no crean un contenedor de scroll, preservando el `position: sticky` de `.landing-header`; los antiguos conservan el fallback `hidden`.
  - `.landing-page *`, `.landing-page *::before` y `.landing-page *::after` usan `box-sizing: border-box` (scoped al componente).
- **REQ-MOB-FIX-02 — Reseteo de `min-width: 0`**:
  - En `@media (max-width: 767px)` se aplica `min-width: 0; max-width: 100%; box-sizing: border-box` a los hijos de todos los contenedores flex/grid de la landing (header, hero, presets, trust, feature, section-head, builder, steps, purpose, slider, suggestion, categorías, beneficios, CTA y footer).
  - Con ello los textos largos y botones se comprimen en lugar de forzar el ancho `min-content`.
- **REQ-MOB-FIX-03 — Cabecera auto-ajustable (320–480 px)**:
  - `.landing-container`: `padding: 0 14px`, `width/max-width: 100%`, `box-sizing: border-box`.
  - `.landing-header-inner`: `row / nowrap / space-between / center`, `gap: 8px`, `min-height: 56px`, `padding: 8px 0`.
  - Branding: logo 26×26 px, `font-size: 0.90rem`, `gap: 6px`; acciones con `gap: 6px`; enlaces `0.78rem` y `padding: 6px 8px`; botón primario `0.78rem`, `padding: 6px 12px`, `border-radius: 10px`.
  - Nuevo `@media (max-width: 340px)` con padding 10 px, logo 22 px, marca 0.82 rem y acciones 0.70 rem para que "Iniciar sesión" + "Crear cuenta" quepan en 320 px sin desbordar.
- **REQ-MOB-FIX-04 — Presets apilados**:
  - `.landing-preset-tabs` pasa a `display: grid; grid-template-columns: 1fr; width/max-width: 100%; padding: 4px; gap: 4px; border-radius: 14px`.
  - `.landing-preset-tab` ocupa `width: 100%`, con `min-width: 0`, `text-align: center`, `justify-content: center`, `padding: 9px 12px`, `font-size: 0.78rem`, `white-space: normal` y `word-break: break-word`.
- **REQ-MOB-FIX-05 — Botones y pilares de confianza al 100%**:
  - `.landing-hero-actions` y `.landing-cta-actions` se vuelven columna al 100% con `gap: 10px`; sus botones primarios y secundarios usan `width: 100%`, `justify-content: center` y `text-align: center`.
  - `.landing-trust-inline` pasa a columna con `gap: 8px` y `align-items: flex-start`.
  - Ajustes adicionales de contención: `.landing-step` (padding 16 px, radio 16 px), `.landing-slider-scale` (0.70 rem), `.landing-suggestion` (padding 16 px, radio 16 px), `.landing-suggestion-name` (`overflow-wrap: anywhere`, `word-break: break-word`, `min-width: 0`) y `.landing-cta` (padding 32 px 16 px, radio 20 px).
- **Verificación**: `npm --prefix frontend run build` sin errores (LandingView ≈ 40.0 kB, CSS de la vista generado en `dist/assets/LandingView-*.css`) y `git diff --check` sin observaciones.

### SPEC-025: Adaptación Móvil del Catálogo (Una Columna + Panel de Filtros Compacto)
- **REQ-CAT-MOB-01 — Cards a una columna**:
  - En `frontend/src/assets/styles.css`, dentro de `@media (max-width: 767px)`, `.product-grid` y `.loading-grid` usan `grid-template-columns: 1fr; gap: var(--space-4); width: 100%`.
  - Se sustituyó la regla previa de 2 columnas que apretaba las tarjetas en pantallas de 320–414 px.
- **REQ-CAT-MOB-02 — Panel de filtros compacto y plegable**:
  - `.filters-panel`: `padding: var(--space-3) var(--space-4)`, `border-radius: var(--radius-lg)` y `margin-bottom: var(--space-4)`.
  - `.filter-group`: `padding: var(--space-2) 0`; `.filters-panel .select` e `.filters-panel .input`: `height: 38px; font-size: 13px`.
  - `FilterSidebar.vue` incorpora el estado reactivo `filtrosVisiblesMovil = ref(false)` y un botón acordeón en `.filters-header` con texto **"Filtros (N activos)"**, `aria-expanded` y `aria-controls="filters-body"`.
  - El contador `filtrosActivos` (computed) suma búsqueda, categoría, marca, precio mín/máx y atributos con valor; el botón **Limpiar** se conserva cuando `catalog.hayFiltrosActivos`.
  - El cuerpo `.filters-body` se oculta en móvil con `.filters-body--collapsed` cuando el acordeón está cerrado; en escritorio la clase no tiene efecto y el panel permanece siempre visible. El chevron rota 180° al abrir.
- **REQ-CAT-MOB-03 — Toolbar sin desbordes**:
  - `.catalog-toolbar`: `flex-direction: column; align-items: stretch; gap: var(--space-2)`.
  - `.toolbar-controls`: `display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); width: 100%`; sus `<label>` se ocultan en móvil.
  - `.toolbar-controls .select-inline`: `min-width: 0; width: 100%; height: 40px; font-size: 13px`, anulando el `min-width: 190px` base.
- **REQ-CAT-MOB-04 — Acciones de tarjeta**:
  - `.product-card` con `padding: var(--space-4)` y `.product-media` con `height: 200px`.
  - `.product-actions` en flex con wrap y `gap: var(--space-2)`; `.product-add-btn` ocupa `flex: 1 1 100%; min-height: 42px`.
  - `.btn-secondary` y `.compare-toggle` comparten la fila inferior con `flex: 1 1 calc(50% - 6px)`, centrados y con `min-height: 38px`.
- **REQ-CAT-MOB-05 — Sin scroll horizontal**:
  - Con la cuadrícula a 1 columna, los selects sin ancho mínimo y el panel compacto, ningún bloque excede el `100%` del contenedor en 320–767 px.
- **Verificación**: `npm --prefix frontend run build` sin errores (CSS global y `CatalogView` con las nuevas reglas) y `git diff --check` sin observaciones.
