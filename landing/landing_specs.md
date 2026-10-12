# BytePro Landing — Mini Specs (ecommerce tecnológico)

> Ubicación: `landing/` — no interfiere con `frontend/` ni `backend/`.
> Stack: HTML + CSS + JS vanilla, sin CDN ni npm (cumple restricción de `specs.md`: todo local, no modificar el OS).

## 1. Objetivo

Landing pública de **BytePro, ecommerce de productos tecnológicos** que convierte visitantes en
cuentas de cliente, mostrando el catálogo y usando la **seguridad como diferencial de confianza**.

## 2. Audiencia

- Compradores tech (estudiantes, devs, oficinas) que buscan precio, garantía y soporte.
- Usuarios que desconfían de tiendas nuevas → se les demuestra seguridad verificable.

## 3. Propuesta de valor

> "Compra tecnología con checkout rápido, garantía real y seguridad verificable:
> sesiones protegidas, roles controlados y datos cifrados."

## 4. Mapa visual (estructura en `index.html`)

| # | Sección | Contenido |
|---|---|---|
| 0 | Progress bar + Navbar sticky blur | Logo BP, links, CTA Entrar / Ver demo, pill estado API |
| 1 | Hero split | Título + typing rotador, 2 CTA, badges, contadores, mockup dashboard con parallax + blobs |
| 2 | Marquee confianza | Cinta infinita: envío seguro, pago protegido, garantía, soporte |
| 3 | Ventajas ecommerce | 6 cards: catálogo curado, ofertas, checkout rápido, seguimiento, garantía/devolución, soporte |
| 4 | Seguridad (foco) | 6 cards mapeadas al backend real: login+validación, RBAC, hash scrypt + Bearer 24h, protección datos, CRUD admin auditado, Modo Demo |
| 5 | Cómo funciona | 3 pasos con línea conectora animada |
| 6 | Catálogo destacado | 4 productos estáticos con toast demo (sin backend) |
| 7 | Opiniones + stats | 3 testimonios + counters |
| 8 | FAQ acordeón | 5 preguntas de seguridad |
| 9 | CTA final | Crear cuenta / Probar demo |
| 10 | Footer | Links, estado `/api/health` con fallback, créditos |

## 5. Ventajas y beneficios (copy oficial como ecommerce)

### Ventajas ecommerce
1. **Catálogo tech curado** — laptops, periféricos y componentes verificados, sin relleno.
2. **Ofertas y precios claros** — sin costos ocultos, con garantía incluida.
3. **Compra en minutos** — registro simple, login persistente, checkout guiado.
4. **Seguimiento y soporte** — sabes dónde está tu pedido y quién te ayuda.
5. **Garantía y devolución** — 30 días de devolución, 12 meses de garantía.
6. **Soporte experto** — ayuda real de gente técnica, no bots.

### Beneficios de confianza / seguridad (diferencial, basado en backend real)
1. **Acceso protegido** — login usuario+contraseña con validación viva (3+ user, 8+ pass con letra/número/símbolo).
2. **Roles controlados** — `admin` gestiona, `customer` compra; guardas de ruta y de UI bloquean `/#/admin` con 403.
3. **Sesiones seguras** — token Bearer 64 chars, vigencia 24h, logout invalida en servidor, persistencia validada con `/api/auth/me`.
4. **Datos cifrados** — passwords con hash `scrypt` (werkzeug), nunca en claro; SQLite con unicidad de usuario/email.
5. **Admin auditado** — CRUD completo, sin auto-borrado de `admin`, toggle activo/inactivo en 1 clic.
6. **Pruébalo sin backend** — Modo Demo Local en `localStorage` con los mismos flujos.

## 6. Guía visual light

- Fondo: `#ffffff` / `#f8fafc` · Tinta: `#0f172a` · Muted: `#64748b`
- Marca: `--primary: #0284c7` · `--accent: #38bdf8` · `--success: #10b981`
- Radio 12–16px, sombras suaves, tipografía del sistema (igual que frontend).
- Contrasta a propósito con el tema dark del app (`frontend/styles.css`) → landing clara que invita, app oscura que opera.
- Iconos SVG inline, sin imágenes externas.

## 7. Animaciones en todo el DOM (no solo hover de cajas)

CSS (`styles.css`) + JS vanilla (`app.js`), sin librerías:

- Reveal on-scroll con `IntersectionObserver` (`fade-up`, stagger por `data-delay`).
- Navbar: blur + shrink + barra de progreso de scroll.
- Hero: typing rotador, blobs flotantes, grid animado, parallax con mouse en mockup.
- Botones magnéticos + ripple en clic.
- Counters animados al entrar en viewport.
- Tilt 3D + spotlight que sigue el cursor en cards de seguridad.
- Marquee infinito, línea de pasos que se dibuja, FAQ acordeón animado, toast, back-to-top.
- Respeta `prefers-reduced-motion`.

## 8. Integración

- CTA `Entrar a la tienda` → `../frontend/#/login` · `Crear cuenta` → `../frontend/#/register`.
- Pill de estado: `fetch(/api/health)` con fallback a `../frontend` demo; nunca rompe la landing si no hay backend.
- No duplica auth ni carrito: el catálogo de la landing es escaparate estático.

## 9. Responsive / a11y / performance

- Mobile-first, grid → 1 columna bajo 900px, menú hamburguesa.
- Semántica `header/main/section/footer`, focos visibles, contraste AA, `alt` y `aria-*` en controles.
- Meta < 60KB CSS+JS, sin requests externos, carga instantánea con `python -m http.server`.

## 10. Cómo servir y verificar

```bash
cd landing
python3 -m http.server 8080
# abrir http://localhost:8080
```

Checklist: hero visible en light · scroll muestra reveals · counters suben · tilt/spotlight en seguridad ·
FAQ abre/cierra · toast al añadir · sin errores en consola · funciona sin backend.

## 11. No-alcance

Sin carrito real, sin pagos, sin auth real en la landing. La tienda funcional vive en `frontend/` + `backend/`.
