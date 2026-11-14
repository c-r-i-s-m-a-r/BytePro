import { createClient } from '@supabase/supabase-js';
import api from './api';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const SSE_URL = `${String(API_BASE).replace(/\/$/, '')}/realtime/stream`;
const DEBOUNCE_MS = 150;
const RECONNECT_MS = 3000;

let supabase = null;
let canal = null;
let eventSource = null;
let reconnectTimer = null;
let inicializado = false;
let inicializando = null;
let secuencia = 0;

const suscriptores = new Map();

function normalizarAccion(eventType) {
  const mapa = { INSERT: 'create', UPDATE: 'update', DELETE: 'destroy' };
  return mapa[String(eventType || '').toUpperCase()] || String(eventType || '').toLowerCase();
}

function despachar(table, action, id) {
  if (!table) return;

  suscriptores.forEach((suscriptor) => {
    if (!suscriptor.tables.has(table)) return;

    if (suscriptor.timer) clearTimeout(suscriptor.timer);
    suscriptor.timer = setTimeout(() => {
      suscriptor.timer = null;
      try {
        suscriptor.callback({ table, action, id });
      } catch (err) {
        // Un callback de vista no debe romper el resto de suscripciones.
      }
    }, DEBOUNCE_MS);
  });
}

function programarReconexion() {
  if (reconnectTimer || !inicializado) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    conectarSse();
  }, RECONNECT_MS);
}

function conectarSse() {
  if (!inicializado) return;

  if (eventSource) {
    try {
      eventSource.close();
    } catch (err) {
      // sin acción
    }
    eventSource = null;
  }

  try {
    eventSource = new EventSource(SSE_URL);
  } catch (err) {
    programarReconexion();
    return;
  }

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data && data.table) {
        despachar(data.table, data.action, data.id);
      }
    } catch (err) {
      // Ignora heartbeats o mensajes no JSON.
    }
  };

  eventSource.onerror = () => {
    if (eventSource) {
      try {
        eventSource.close();
      } catch (err) {
        // sin acción
      }
      eventSource = null;
    }
    programarReconexion();
  };
}

async function obtenerConfiguracion() {
  const urlEnv = import.meta.env.VITE_SUPABASE_URL;
  const keyEnv = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (urlEnv && keyEnv) {
    return { supabaseUrl: urlEnv, supabaseAnonKey: keyEnv };
  }

  try {
    const { data } = await api.get('/config/public');
    return data || {};
  } catch (err) {
    return {};
  }
}

export async function initRealtime() {
  if (inicializado) return;
  if (inicializando) return inicializando;

  inicializando = (async () => {
    const config = await obtenerConfiguracion();
    inicializado = true;

    if (config.supabaseUrl && config.supabaseAnonKey) {
      try {
        supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
        canal = supabase
          .channel('bytepro-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public' },
            (payload) => {
              despachar(
                payload?.table,
                normalizarAccion(payload?.eventType),
                payload?.new?.id ?? payload?.old?.id ?? null
              );
            }
          )
          .subscribe();
      } catch (err) {
        supabase = null;
        canal = null;
      }
    }

    conectarSse();
  })();

  try {
    await inicializando;
  } finally {
    inicializando = null;
  }
}

export function subscribeToTables(tables, callback) {
  const id = ++secuencia;
  const normalizadas = new Set((tables || []).filter(Boolean));

  suscriptores.set(id, {
    tables: normalizadas,
    callback,
    timer: null,
  });

  return function unsubscribe() {
    const suscriptor = suscriptores.get(id);
    if (!suscriptor) return;
    if (suscriptor.timer) clearTimeout(suscriptor.timer);
    suscriptores.delete(id);
  };
}

export function disconnectRealtime() {
  inicializado = false;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  suscriptores.forEach((suscriptor) => {
    if (suscriptor.timer) clearTimeout(suscriptor.timer);
  });
  suscriptores.clear();

  if (canal) {
    try {
      canal.unsubscribe();
    } catch (err) {
      // sin acción
    }
    canal = null;
  }

  if (supabase) {
    try {
      if (typeof supabase.removeAllChannels === 'function') {
        supabase.removeAllChannels();
      }
    } catch (err) {
      // sin acción
    }
    supabase = null;
  }

  if (eventSource) {
    try {
      eventSource.close();
    } catch (err) {
      // sin acción
    }
    eventSource = null;
  }
}
