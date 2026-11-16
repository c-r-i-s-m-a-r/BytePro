# Especificación EARS: Simulador de Setup con Productos Reales y Adición Directa al Carrito, e Imágenes Reales en Tarjeta Insignia con Fallback Visual

- **Módulo**: E-commerce / Landing Page (`requirements/ecomerce.md`, `requirements/ventas.md`)
- **Estado**: Borrador (Pendiente de aprobación)
- **Autor**: `especificador`
- **Código**: `SPEC-022-simulador-productos-reales-carrito-imagenes`
- **Referencias**:
  - `SPEC-004-ventas-carrito-sesion.md`
  - `SPEC-010-interfaz-diseno-ux.md`
  - `SPEC-021-landing-page-rediseño-interactivo.md`

---

## 1. Simulador "Arma tu Setup" Vinculado a Productos Reales de la Tienda

- **[REQ-SET-01] Acción (Obtención de Productos Reales del Catálogo):**  
  El simulador interactivo de la Landing Page DEBE cargar y utilizar el catálogo de productos reales existentes en la tienda (`catalogStore.items` o llamada a `/api/productos`):
  1. Agrupar los productos por sus categorías reales: **Procesadores** (`procesadores`), **Tarjetas Gráficas** (`tarjetas-graficas`), **Memorias RAM** (`memoria-ram` o `memorias`), y **Almacenamiento** (`almacenamiento`).
  2. Mapear cada componente con su `id`, `nombre`, `precio` real en Bolivianos (`Bs.`), `imagenPrincipal` y la variante por defecto disponible para compra (`varianteId`).
  3. Si la base de datos se encuentra temporalmente sin productos cargados, el sistema DEBE disponer de una lista de contingencia (*fallback*) para no interrumpir la experiencia visual del visitante.

- **[REQ-SET-02] Acción (Selección Inteligente por Presupuesto y Propósito):**  
  Cuando el usuario elija su propósito (*Gaming*, *Render/3D*, *Oficina/Estudio*) y mueva el slider de presupuesto, el simulador DEBE seleccionar de entre los productos reales del catálogo el mejor componente disponible para cada categoría dentro del monto proporcional asignado, calculando el total exacto de la suma de los productos reales.

---

## 2. Adición Directa al Carrito desde el Simulador

- **[REQ-SET-03] Evento (Botón "Agregar Setup al Carrito" y Apertura del Drawer):**  
  En lugar del enlace de navegación "Ver componentes en el catálogo", la tarjeta de sugerencia del simulador DEBE proveer un botón directo de acción:
  1. Texto claro e interactivo: **"Agregar setup al carrito"** (o *"Agregando setup..."* durante la carga).
  2. Al presionar el botón, el sistema DEBE iterar los componentes reales sugeridos (CPU, GPU, RAM, Almacenamiento) y agregarlos secuencialmente o en lote al carrito del usuario mediante `cartStore.add(varianteId, 1)`.
  3. Tras completarse la adición, el sistema DEBE desplegar de inmediato la barra lateral emergente del carrito (`uiStore.openCartDrawer()`), notificando al usuario con un mensaje de éxito: *"Setup agregado al carrito correctamente"*.
  4. SI alguno de los componentes no cuenta con stock o variante disponible, ENTONCES el sistema DEBE agregar los componentes disponibles e informar mediante un aviso discreto los ítems omitidos.

---

## 3. Tarjeta Insignia del Hero (`landing-feature-card`) con Imagen Real del Producto y Fallback Visual

- **[REQ-SET-04] Acción (Despliegue Prioritario de Imagen Real del Producto):**  
  En la tarjeta destacada del Hero (`landing-feature-card`):
  1. El sistema DEBE buscar en el catálogo de productos de la tienda el producto real correspondiente al preset activo (o producto insignia de la categoría).
  2. **SI el producto cuenta con imagen real** (`imagenPrincipal`, `imagen` o primera imagen de `imagenes` no nula y válida): el contenedor `.landing-feature-media` DEBE renderizar dicha fotografía real del componente (`<img class="landing-feature-photo" :src="producto.imagenPrincipal" :alt="producto.nombre" />`) con ajuste de contención nítido (`object-fit: contain`).
  3. **SI el producto NO tiene imagen** (o aún no ha cargado): el sistema DEBE mostrar como respaldo seguro la figura / icono temático que le es pertinente (ej. `icon-grafica.png` para Gaming, `icon-procesador.png` para Creación/Render, `icon-memoria.png` para Oficina).
