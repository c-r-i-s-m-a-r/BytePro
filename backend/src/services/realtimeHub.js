const HEARTBEAT_MS = 25000;

const clientesSse = new Set();

function nombreTabla(modeloOInstancia) {
  if (!modeloOInstancia) return null;
  if (typeof modeloOInstancia === 'string') return modeloOInstancia;

  if (typeof modeloOInstancia.tableName === 'string') {
    return modeloOInstancia.tableName;
  }

  if (typeof modeloOInstancia.getTableName === 'function') {
    const nombre = modeloOInstancia.getTableName();
    if (typeof nombre === 'string') return nombre;
    if (nombre && typeof nombre.tableName === 'string') return nombre.tableName;
  }

  const constructor = modeloOInstancia.constructor;
  if (constructor && constructor !== Object && constructor !== Function && constructor !== String) {
    return nombreTabla(constructor);
  }

  return null;
}

function normalizarPayload(payload = {}) {
  if (payload === null || typeof payload !== 'object') {
    return { id: null };
  }

  if (payload.id !== undefined) {
    return { ...payload, id: payload.id };
  }

  if (payload.instance && payload.instance.id !== undefined) {
    return { ...payload, id: payload.instance.id };
  }

  if (Array.isArray(payload.instances) && payload.instances[0]) {
    return { ...payload, id: payload.instances[0].id ?? null };
  }

  return { ...payload, id: null };
}

function emitTableChange(table, action, payload = {}) {
  if (!table) return null;

  const normalizado = normalizarPayload(payload);
  const evento = {
    table,
    action,
    id: normalizado.id ?? null,
    timestamp: new Date().toISOString(),
  };
  const mensaje = `data: ${JSON.stringify(evento)}\n\n`;

  for (const cliente of clientesSse) {
    try {
      cliente.write(mensaje);
    } catch (err) {
      clientesSse.delete(cliente);
    }
  }

  return evento;
}

function subscribeSse(req, res) {
  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  res.write('retry: 3000\n\n');
  res.write(
    `data: ${JSON.stringify({
      table: null,
      action: 'connected',
      id: null,
      timestamp: new Date().toISOString(),
    })}\n\n`
  );

  clientesSse.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}\n\n`);
    } catch (err) {
      clearInterval(heartbeat);
      clientesSse.delete(res);
    }
  }, HEARTBEAT_MS);

  const limpiar = () => {
    clearInterval(heartbeat);
    clientesSse.delete(res);
  };

  req.on('close', limpiar);
  res.on('close', limpiar);
  res.on('error', limpiar);
  res.on('finish', limpiar);

  return res;
}

function ejecutarTrasCommit(options, callback) {
  try {
    if (
      options &&
      options.transaction &&
      typeof options.transaction.afterCommit === 'function'
    ) {
      options.transaction.afterCommit(callback);
      return;
    }
  } catch (err) {
    // Si la transacción ya no admite callbacks, emitimos de inmediato.
  }
  callback();
}

function registerSequelizeHooks(sequelize) {
  if (!sequelize || sequelize.__byteproRealtimeHooks) return;

  Object.defineProperty(sequelize, '__byteproRealtimeHooks', {
    value: true,
    enumerable: false,
    configurable: false,
  });

  const hookSimple = (action) => (instance, options = {}) => {
    const table = nombreTabla(instance);
    const id = instance && instance.id !== undefined ? instance.id : null;
    ejecutarTrasCommit(options, () =>
      emitTableChange(table, action, { id, instance })
    );
  };

  sequelize.addHook('afterCreate', hookSimple('create'));
  sequelize.addHook('afterUpdate', hookSimple('update'));
  sequelize.addHook('afterDestroy', hookSimple('destroy'));

  sequelize.addHook('afterBulkCreate', (instances, options = {}) => {
    const table = nombreTabla(options.model || (instances && instances[0]));
    const ids = Array.isArray(instances) ? instances.map((item) => item.id) : [];
    ejecutarTrasCommit(options, () =>
      emitTableChange(table, 'create', { id: ids[0] ?? null, ids, instances })
    );
  });

  sequelize.addHook('afterBulkUpdate', (options = {}) => {
    const table = nombreTabla(options.model);
    ejecutarTrasCommit(options, () =>
      emitTableChange(table, 'update', { id: options.where?.id ?? null })
    );
  });

  sequelize.addHook('afterBulkDestroy', (options = {}) => {
    const table = nombreTabla(options.model);
    ejecutarTrasCommit(options, () =>
      emitTableChange(table, 'destroy', { id: options.where?.id ?? null })
    );
  });
}

module.exports = {
  emitTableChange,
  subscribeSse,
  registerSequelizeHooks,
};
