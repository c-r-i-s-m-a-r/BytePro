const nodemailer = require('nodemailer');
const env = require('../config/env');

const ESTADOS_NOTIFICABLES = new Set(['EN_CAMINO', 'ENTREGADO']);

let transporte = null;

function escaparHtml(valor) {
  return String(valor === null || valor === undefined ? '' : valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatearBs(valor) {
  return `Bs. ${Number(valor || 0).toFixed(2)}`;
}

function formatearFecha(valor) {
  const fecha = valor ? new Date(valor) : new Date();
  if (Number.isNaN(fecha.getTime())) return 'N/D';
  try {
    return fecha.toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' });
  } catch (err) {
    return fecha.toISOString();
  }
}

function normalizarItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items === 'string' && items.trim()) {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }
  return [];
}

function obtenerTransporte() {
  if (env.nodeEnv === 'test') return null;
  if (!env.smtpHost || !env.smtpUser) return null;
  if (transporte) return transporte;

  transporte = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporte;
}

/**
 * REQ-EML-07: envío dual. Con SMTP configurado usa nodemailer; sin
 * credenciales o en NODE_ENV=test registra la salida en consola. Ningún
 * fallo de red se propaga para no bloquear pagos, logística ni soporte.
 */
async function enviar({ tipo, destino, asunto, html, texto }) {
  const fecha = new Date().toISOString();

  if (!destino) {
    console.warn(`[email] ${tipo}: sin destinatario, se omite el envío`);
    return {
      enviado: false,
      simulado: true,
      tipo,
      destino: null,
      fecha,
      razon: 'Sin destinatario',
    };
  }

  const transport = obtenerTransporte();

  if (!transport) {
    console.log(`[email] Simulación local (${tipo}) -> ${destino}: ${asunto}`);
    return { enviado: true, simulado: true, tipo, destino, fecha };
  }

  try {
    await transport.sendMail({
      from: env.smtpFrom,
      to: destino,
      subject: asunto,
      html,
      text: texto || undefined,
    });
    return { enviado: true, simulado: false, tipo, destino, fecha };
  } catch (err) {
    console.error(`[email] Error al enviar ${tipo} a ${destino}: ${err.message}`);
    return {
      enviado: false,
      simulado: false,
      tipo,
      destino,
      fecha,
      error: err.message,
    };
  }
}

function construirHtml(titulo, contenido) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escaparHtml(titulo)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background:#0f766e;padding:22px 28px;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.02em;">BytePro Hardware</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#0f172a;">${escaparHtml(
                titulo
              )}</h1>
              ${contenido}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
              Este mensaje fue generado automáticamente por BytePro. No respondas a este correo.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function botonHtml(texto, url) {
  return `<p style="margin:24px 0 8px;">
    <a href="${escaparHtml(url)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:9999px;">${escaparHtml(
      texto
    )}</a>
  </p>`;
}

async function enviarCodigoRecuperacion({ usuario, codigo, expiraMinutos = 15 }) {
  const destino = usuario && usuario.email ? usuario.email : null;
  const nombre = (usuario && usuario.nombre) || 'cliente';
  const urlRecuperacion = `${env.appUrl}/recuperar-contrasena`;

  const html = construirHtml(
    'Recuperación de contraseña',
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.55;">Hola ${escaparHtml(nombre)},</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">
       Recibimos una solicitud para restablecer la contraseña de tu cuenta BytePro. Usa el siguiente código temporal:
     </p>
     <div style="margin:20px 0;padding:20px;text-align:center;background:#ecfdf5;border:1px dashed #0f766e;border-radius:12px;">
       <span style="display:block;font-size:34px;letter-spacing:10px;font-weight:700;color:#0f766e;">${escaparHtml(
         codigo
       )}</span>
     </div>
     <p style="margin:0 0 12px;font-size:15px;line-height:1.55;">
       El código es válido durante <strong>${escaparHtml(expiraMinutos)} minutos</strong>.
     </p>
     <p style="margin:0 0 12px;font-size:15px;line-height:1.55;">
       Ingresa a la pantalla de recuperación, escribe el código y define tu nueva contraseña.
     </p>
     ${botonHtml('Restablecer contraseña', urlRecuperacion)}
     <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#6b7280;">
       Si no solicitaste este cambio, ignora este correo. Tu contraseña actual seguirá siendo válida.
     </p>`
  );

  return enviar({
    tipo: 'codigo_recuperacion',
    destino,
    asunto: 'Código de recuperación de contraseña - BytePro',
    html,
    texto: `Tu código de recuperación BytePro es ${codigo}. Es válido por ${expiraMinutos} minutos.`,
  });
}

async function obtenerDespachoVenta(ventaId) {
  if (!ventaId) return null;
  try {
    const { Despacho } = require('../models');
    return await Despacho.findOne({ where: { ventaId } });
  } catch (err) {
    return null;
  }
}

async function obtenerCheckoutVenta(ventaId) {
  if (!ventaId) return null;
  try {
    const { Checkout } = require('../models');
    return await Checkout.findOne({ where: { ventaId } });
  } catch (err) {
    return null;
  }
}

function filasItemsHtml(items) {
  const lista = normalizarItems(items);
  if (!lista.length) {
    return '<tr><td colspan="5" style="padding:12px;text-align:center;color:#6b7280;">Sin ítems registrados</td></tr>';
  }

  return lista
    .map((item) => {
      const nombre = item.nombreProducto || 'Producto';
      const variante = item.nombreVariante ? ` (${item.nombreVariante})` : '';
      return `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;">
          ${escaparHtml(nombre)}${escaparHtml(variante)}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#4b5563;">${escaparHtml(
          item.sku || 'N/D'
        )}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;">${escaparHtml(
          item.cantidad || 0
        )}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;">${escaparHtml(
          formatearBs(item.precioUnitario)
        )}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;font-weight:600;">${escaparHtml(
          formatearBs(item.subtotal)
        )}</td>
      </tr>`;
    })
    .join('');
}

async function enviarRecibo({ recibo, usuario }) {
  if (!recibo) {
    return { enviado: false, simulado: true, tipo: 'recibo', destino: null, razon: 'Sin recibo' };
  }

  const destino = recibo.clienteEmail || (usuario && usuario.email) || null;
  const despacho = await obtenerDespachoVenta(recibo.ventaId);
  const checkout = await obtenerCheckoutVenta(recibo.ventaId);
  const guia = despacho ? despacho.codigoSeguimiento : null;
  const items = normalizarItems(recibo.items);

  const esSucursal = (recibo.metodoEntrega || 'domicilio') === 'sucursal';
  const entregaHtml = esSucursal
    ? `<p style="margin:0 0 6px;font-size:14px;"><strong>Método de entrega:</strong> Retiro en sucursal física</p>
       <p style="margin:0 0 6px;font-size:14px;"><strong>Sucursal:</strong> ${escaparHtml(
         recibo.sucursalNombre || 'N/D'
       )}</p>
       <p style="margin:0 0 6px;font-size:14px;"><strong>Dirección:</strong> ${escaparHtml(
         recibo.sucursalDireccion || 'N/D'
       )}</p>
       <p style="margin:0 0 6px;font-size:14px;"><strong>Horarios:</strong> ${escaparHtml(
         recibo.sucursalHorarios || 'N/D'
       )}</p>`
    : `<p style="margin:0 0 6px;font-size:14px;"><strong>Método de entrega:</strong> Envío a domicilio</p>
       <p style="margin:0 0 6px;font-size:14px;"><strong>Destinatario:</strong> ${escaparHtml(
         (checkout && checkout.nombreDestinatario) ||
           recibo.clienteNombre ||
           (usuario && usuario.nombre) ||
           'Cliente BytePro'
       )}</p>
       <p style="margin:0 0 6px;font-size:14px;"><strong>Dirección:</strong> ${escaparHtml(
         (checkout && checkout.direccion) || 'N/D'
       )}</p>
       <p style="margin:0 0 6px;font-size:14px;"><strong>Ciudad:</strong> ${escaparHtml(
         (checkout && checkout.ciudad) || 'N/D'
       )}</p>
       <p style="margin:0 0 6px;font-size:14px;"><strong>Teléfono:</strong> ${escaparHtml(
         (checkout && checkout.telefono) || 'N/D'
       )}</p>`;

  const guiaHtml = guia
    ? `<p style="margin:14px 0 6px;font-size:14px;"><strong>Guía logística:</strong> ${escaparHtml(guia)}</p>
       ${botonHtml('Seguir mi envío', `${env.appUrl}/seguimiento/${encodeURIComponent(guia)}`)}`
    : '';

  const html = construirHtml(
    `Comprobante de compra ${recibo.numero || ''}`.trim(),
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.55;">
       ¡Gracias por tu compra! Este es el comprobante digital de tu pedido.
     </p>
     <p style="margin:0 0 4px;font-size:14px;"><strong>Número de recibo:</strong> ${escaparHtml(
       recibo.numero || 'N/D'
     )}</p>
     <p style="margin:0 0 16px;font-size:14px;"><strong>Fecha:</strong> ${escaparHtml(
       formatearFecha(recibo.fecha || recibo.createdAt)
     )}</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 18px;">
       <thead>
         <tr style="background:#f3f4f6;">
           <th align="left" style="padding:10px 8px;font-size:12px;text-transform:uppercase;color:#4b5563;">Producto</th>
           <th align="left" style="padding:10px 8px;font-size:12px;text-transform:uppercase;color:#4b5563;">SKU</th>
           <th align="center" style="padding:10px 8px;font-size:12px;text-transform:uppercase;color:#4b5563;">Cant.</th>
           <th align="right" style="padding:10px 8px;font-size:12px;text-transform:uppercase;color:#4b5563;">Precio</th>
           <th align="right" style="padding:10px 8px;font-size:12px;text-transform:uppercase;color:#4b5563;">Subtotal</th>
         </tr>
       </thead>
       <tbody>
         ${filasItemsHtml(items)}
       </tbody>
     </table>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
       <tr>
         <td style="padding:4px 0;font-size:14px;color:#4b5563;">Subtotal</td>
         <td align="right" style="padding:4px 0;font-size:14px;">${escaparHtml(formatearBs(recibo.subtotal))}</td>
       </tr>
       <tr>
         <td style="padding:4px 0;font-size:14px;color:#4b5563;">Descuento por retiro</td>
         <td align="right" style="padding:4px 0;font-size:14px;">- ${escaparHtml(
           formatearBs(recibo.descuentoRetiro)
         )}</td>
       </tr>
       <tr>
         <td style="padding:4px 0;font-size:14px;color:#4b5563;">IVA 13%</td>
         <td align="right" style="padding:4px 0;font-size:14px;">${escaparHtml(formatearBs(recibo.impuestos))}</td>
       </tr>
       <tr>
         <td style="padding:10px 0 0;font-size:16px;font-weight:700;border-top:1px solid #e5e7eb;">Total (BOB)</td>
         <td align="right" style="padding:10px 0 0;font-size:16px;font-weight:700;border-top:1px solid #e5e7eb;">${escaparHtml(
           formatearBs(recibo.total)
         )}</td>
       </tr>
     </table>
     <h2 style="margin:0 0 8px;font-size:15px;color:#0f172a;">Información de entrega</h2>
     ${entregaHtml}
     ${guiaHtml}`
  );

  return enviar({
    tipo: 'recibo',
    destino,
    asunto: `Comprobante de compra ${recibo.numero || ''} - BytePro`.trim(),
    html,
    texto: `Comprobante ${recibo.numero || 'N/D'} por un total de ${formatearBs(recibo.total)}.`,
  });
}

async function enviarActualizacionEnvio({ despacho, venta, usuario, estado, ubicacion, nota }) {
  const fase = String(estado || (despacho && despacho.estado) || '')
    .trim()
    .toUpperCase();

  // REQ-EML-05: únicamente EN_CAMINO y ENTREGADO generan correo.
  if (!ESTADOS_NOTIFICABLES.has(fase)) {
    return { omitido: true, razon: 'Estado no requiere notificación' };
  }

  const destino = (usuario && usuario.email) || null;
  const guia = despacho ? despacho.codigoSeguimiento : null;
  const ventaId = (venta && venta.id) || (despacho && despacho.ventaId) || null;
  const numeroPedido = ventaId ? `PED-${String(ventaId).padStart(4, '0')}` : null;
  const ubicacionFinal =
    ubicacion || (despacho && despacho.ubicacionActual) || 'Centro de Distribución BytePro';
  const notaFinal = nota || (despacho && despacho.nota) || null;

  const titulo =
    fase === 'EN_CAMINO' ? 'Tu pedido está en camino' : 'Tu pedido fue entregado';
  const mensaje =
    fase === 'EN_CAMINO'
      ? 'Tu paquete salió del centro de distribución y se encuentra en ruta con el transportista.'
      : 'Confirmamos que tu paquete fue entregado exitosamente en el destino acordado.';

  const urlSeguimiento = guia
    ? `${env.appUrl}/seguimiento/${encodeURIComponent(guia)}`
    : `${env.appUrl}/seguimiento`;

  const html = construirHtml(
    titulo,
    `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;">${escaparHtml(mensaje)}</p>
     ${numeroPedido ? `<p style="margin:0 0 6px;font-size:14px;"><strong>Pedido:</strong> ${escaparHtml(numeroPedido)}</p>` : ''}
     ${guia ? `<p style="margin:0 0 6px;font-size:14px;"><strong>Guía logística:</strong> ${escaparHtml(guia)}</p>` : ''}
     <p style="margin:0 0 6px;font-size:14px;"><strong>Ubicación:</strong> ${escaparHtml(ubicacionFinal)}</p>
     ${notaFinal ? `<p style="margin:0 0 6px;font-size:14px;"><strong>Nota del operador:</strong> ${escaparHtml(notaFinal)}</p>` : ''}
     ${botonHtml('Ver seguimiento en tiempo real', urlSeguimiento)}`
  );

  return enviar({
    tipo: 'actualizacion_envio',
    destino,
    asunto: `${titulo} - ${guia || numeroPedido || 'BytePro'}`,
    html,
    texto: `${titulo}. ${mensaje} Ubicación: ${ubicacionFinal}.`,
  });
}

async function enviarResolucionReclamo({ reclamo, solucion, usuario }) {
  const destino =
    (reclamo && reclamo.email) || (usuario && usuario.email) || null;
  const codigoTicket = (reclamo && reclamo.codigoTicket) || 'TKT-N/D';
  const tipo = (reclamo && reclamo.tipoSolicitud) || 'N/D';
  const numeroPedido = (reclamo && reclamo.numeroPedido) || null;
  const solucionFinal = solucion || (reclamo && reclamo.solucion) || '';
  const fechaResolucion = (reclamo && reclamo.fechaResolucion) || new Date();

  const html = construirHtml(
    `Resolución del ticket ${codigoTicket}`,
    `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;">
       Tu caso de soporte fue atendido y marcado como resuelto.
     </p>
     <p style="margin:0 0 6px;font-size:14px;"><strong>Código de ticket:</strong> ${escaparHtml(
       codigoTicket
     )}</p>
     <p style="margin:0 0 6px;font-size:14px;"><strong>Tipo de solicitud:</strong> ${escaparHtml(tipo)}</p>
     ${numeroPedido ? `<p style="margin:0 0 6px;font-size:14px;"><strong>Pedido asociado:</strong> ${escaparHtml(numeroPedido)}</p>` : ''}
     <p style="margin:0 0 6px;font-size:14px;"><strong>Fecha de resolución:</strong> ${escaparHtml(
       formatearFecha(fechaResolucion)
     )}</p>
     <div style="margin:16px 0 0;padding:16px;background:#f9fafb;border-left:3px solid #0f766e;border-radius:8px;">
       <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#0f766e;font-weight:700;">Solución</p>
       <p style="margin:0;font-size:14px;line-height:1.55;white-space:pre-line;">${escaparHtml(solucionFinal)}</p>
     </div>
     <p style="margin:18px 0 0;font-size:13px;line-height:1.5;color:#6b7280;">
       Si necesitas asistencia adicional, puedes crear un nuevo ticket desde el centro de soporte.
     </p>`
  );

  return enviar({
    tipo: 'resolucion_reclamo',
    destino,
    asunto: `Resolución del ticket ${codigoTicket} - BytePro`,
    html,
    texto: `Tu ticket ${codigoTicket} fue resuelto. Solución: ${solucionFinal}`,
  });
}

module.exports = {
  enviarCodigoRecuperacion,
  enviarRecibo,
  enviarActualizacionEnvio,
  enviarResolucionReclamo,
};
