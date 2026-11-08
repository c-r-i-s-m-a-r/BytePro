const { EventoAuditoria } = require('../models');

async function registrar({
  tipo,
  severidad = 'info',
  mensaje,
  ventaId = null,
  transaccionId = null,
  usuarioId = null,
  payload = null,
  transaction = null,
}) {
  const evento = await EventoAuditoria.create(
    {
      tipo,
      severidad,
      mensaje,
      ventaId,
      transaccionId,
      usuarioId,
      payload,
    },
    { transaction }
  );

  if (severidad === 'critica') {
    console.warn(`[auditoria] CRITICO: ${mensaje}`);
  }

  return evento;
}

module.exports = { registrar };
