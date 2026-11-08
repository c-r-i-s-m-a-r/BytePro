async function enviarRecibo({ recibo, usuario }) {
  const destino = (recibo && recibo.clienteEmail) || (usuario && usuario.email) || null;

  console.log(
    `[email] Simulación local: recibo ${recibo ? recibo.numero : 'N/D'} enviado a ${destino || 'sin destinatario'}`
  );

  return {
    enviado: true,
    simulado: true,
    destino,
    fecha: new Date().toISOString(),
  };
}

async function enviarActualizacionEnvio({ despacho, venta, usuario, estado, ubicacion }) {
  const destino = (usuario && usuario.email) || null;
  const guia = despacho ? despacho.codigoSeguimiento : 'N/D';
  const fase = estado || (despacho ? despacho.estado : 'N/D');

  console.log(
    `[email] Simulación local: actualización de envío ${guia} (${fase}) para pedido #${
      venta ? venta.id : despacho ? despacho.ventaId : 'N/D'
    } enviada a ${destino || 'cliente'}`
  );

  return {
    enviado: true,
    simulado: true,
    tipo: 'actualizacion_envio',
    guia,
    estado: fase,
    ubicacion: ubicacion || (despacho ? despacho.ubicacionActual : null) || null,
    destino,
    fecha: new Date().toISOString(),
  };
}

module.exports = { enviarRecibo, enviarActualizacionEnvio };
