# SPEC-026: Estado "En Espera de Comprobación" para Pagos QR / Transferencia y Visualización Real del Nombre del Cliente en Pedidos y Despachos

## 1. Contexto y Justificación
Actualmente en **BytePro**:
1. Todos los pagos, incluidos los realizados mediante transferencia bancaria o código QR (`transferencia`), son asumidos inmediatamente como aprobados con el estado logístico inicial `PEDIDO_CONFIRMADO`, omitiendo la verificación humana del comprobante de depósito y exponiendo a la empresa a despachar mercadería sin respaldo bancario efectivo.
   - El usuario solicita que toda venta cuyo método de pago sea QR / transferencia bancaria ingrese primero a un estado previo: **`EN_ESPERA_COMPROBACION`**.
   - Una vez que un empleado con rol de **ventas** o un **administrador** revise y coteje manualmente el número de comprobante / referencia bancaria, el pedido debe transicionar al estado **`PEDIDO_CONFIRMADO`** para continuar su flujo logístico normal.
2. En las tablas y registros del portal corporativo ([AdminPedidosView.vue](file:///home/crismar/University/sis324/BytePro/frontend/src/views/admin/AdminPedidosView.vue) y servicios de despacho), la columna de cliente mostraba de forma fija el texto genérico `'Cliente'`, debido a que el backend serializaba la propiedad como `cliente` mientras la vista intentaba consumir `p.usuario.nombre`. Es mandatorio que se visualice el nombre y apellido real del comprador en todos los listados de pedidos y despachos.

---

## 2. Requerimientos Funcionales en Sintaxis EARS

### REQ-PAG-QR-01: Estado Inicial para Pagos QR / Transferencia Bancaria
- **Tipo**: Regla de negocio / Basado en método de pago.
- **Enunciado**: Cuando un cliente procese el pago de su orden seleccionando el método de pago por transferencia o código QR (`metodo === 'transferencia'`), el sistema **debe** registrar la transacción con estado `pendiente` (o `en_espera_comprobacion`), la venta con estado `pendiente` y el despacho con estado logístico inicial **`EN_ESPERA_COMPROBACION`**, almacenando de forma obligatoria el número de comprobante o referencia bancaria provisto por el usuario.

### REQ-PAG-QR-02: Preservación de Confirmación Automática para Tarjeta y Pasarela
- **Tipo**: Regla de preservación.
- **Enunciado**: Cuando el pago sea procesado mediante tarjeta de crédito/débito (`tarjeta`) o pasarela tokenizada (`pasarela`) con respuesta aprobada del procesador, el sistema **debe** continuar asignando directamente el estado **`PEDIDO_CONFIRMADO`** al despacho y `pagada` a la venta.

### REQ-PAG-QR-03: Verificación Manual Exclusiva por Personal de Ventas o Administrador
- **Tipo**: Regla de autorización RBAC / Transición de Estado.
- **Enunciado**: Mientras un pedido permanezca en estado logístico `EN_ESPERA_COMPROBACION`, el sistema **debe** permitir únicamente a usuarios con función activa de **`ventas`** o **`admin`** ejecutar la acción de verificación manual del comprobante bancario a través del endpoint `PATCH /api/admin/pedidos/:id/verificar-comprobante` (o acción directa de confirmación), promoviendo la orden al estado **`PEDIDO_CONFIRMADO`** y la venta al estado **`pagada`**. Si un operador de distribución intenta verificar el pago, el sistema debe denegar la operación con error HTTP 403.

### REQ-PAG-QR-04: Trazabilidad, Auditoría y Sincronización en Tiempo Real
- **Tipo**: Basado en eventos.
- **Enunciado**: Al momento en que el comprobante sea verificado manualmente, el sistema **debe**:
  1. Registrar en el historial del despacho el hito de verificación con estado `PEDIDO_CONFIRMADO`, ubicación de origen, notas del operador y nombre completo del empleado responsable.
  2. Generar el recibo oficial de venta digital con su respectivo número de comprobante.
  3. Registrar el evento en auditoría (`comprobante_qr_verificado`).
  4. Emitir el evento de sincronización en tiempo real vía SSE / Supabase Realtime para actualizar instantáneamente las vistas del cliente y de los operadores.

### REQ-PAG-QR-05: Visualización Completa del Nombre del Cliente en Registros de Pedidos y Despachos
- **Tipo**: Regla de interfaz corporativa.
- **Enunciado**: En todos los listados y registros de pedidos y despachos del portal corporativo (`/admin/pedidos`, `/admin/resumen`, `/admin/inventario`), el sistema **debe** mostrar el nombre real del cliente (`p.cliente?.nombre || p.usuario?.nombre || p.despacho?.nombreDestinatario`), su correo electrónico y el número de referencia del comprobante cuando corresponda, erradicando cualquier texto genérico `'Cliente'`.

### REQ-PAG-QR-06: Feedback y Estado en Vistas del Cliente
- **Tipo**: Estado de visualización para el cliente.
- **Enunciado**: Mientras el pedido se encuentre en estado `EN_ESPERA_COMPROBACION`, las vistas del cliente ([OrdersView.vue](file:///home/crismar/University/sis324/BytePro/frontend/src/views/OrdersView.vue) y [TrackingView.vue](file:///home/crismar/University/sis324/BytePro/frontend/src/views/TrackingView.vue)) **deben** desplegar una insignia o indicador informativo *"En espera de comprobación"*, comunicando que el comprobante está en revisión por el equipo comercial de BytePro y que el pedido será confirmado a la brevedad.

---

## 3. Matriz de Estados y Transiciones

| Estado Actual | Siguiente Estado Válido | Roles Autorizados | Efecto en Inventario / Kardex |
| :--- | :--- | :--- | :--- |
| **`EN_ESPERA_COMPROBACION`** | **`PEDIDO_CONFIRMADO`** | `ventas`, `admin` | Reserva activa confirmada, generación de recibo oficial |
| **`EN_ESPERA_COMPROBACION`** | **`CANCELADO`** | `ventas`, `admin` | Liberación de stock y anulación de reserva |
| **`PEDIDO_CONFIRMADO`** | **`EN_PREPARACION`** | `operaciones`, `admin` | Preparación en almacén y salida por despacho |
| **`EN_PREPARACION`** | **`EN_CAMINO`** | `operaciones`, `admin` | En tránsito a destino / sucursal |
| **`EN_CAMINO`** | **`ENTREGADO`** | `operaciones`, `admin` | Entrega final al cliente |

---

## 4. Criterios de Aceptación y Pruebas

1. **Compra con QR / Transferencia Bancaria**:
   - Al completar el checkout seleccionando `transferencia`, el despacho queda en `EN_ESPERA_COMPROBACION`.
   - La orden no puede pasar directamente a `EN_PREPARACION` hasta que sea confirmada por ventas o admin.
2. **Compra con Tarjeta**:
   - Al completar el checkout con `tarjeta`, el despacho queda inmediatamente en `PEDIDO_CONFIRMADO`.
3. **Verificación Manual en Portal Corporativo**:
   - El vendedor o administrador ve el pedido con badge de "En espera de comprobación" y el número de comprobante ingresado.
   - Dispone de un botón "Verificar comprobante". Al presionarlo, el pedido pasa a `PEDIDO_CONFIRMADO` y la venta a `pagada`.
   - Un operador de almacén o transporte no puede ejecutar esta verificación (recibe 403).
4. **Nombre del Cliente en Registros**:
   - En `/admin/pedidos`, la columna "Cliente" muestra el nombre y apellido del cliente real registrado (ej. "Juan Pérez") y su correo, nunca el texto 'Cliente'.
5. **Compilación y Tests**:
   - `npm --prefix frontend run build` limpio sin errores.
   - Suite de pruebas de integración en `.tmp/` validando cada requerimiento EARS de SPEC-026.
