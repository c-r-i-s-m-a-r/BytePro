-- =====================================================================
-- BytePro - Configuración de Supabase Realtime (SPEC-017 / REQ-SUP-03)
-- ---------------------------------------------------------------------
-- Script idempotente para ejecutar en el SQL Editor de Supabase.
-- 1) Habilita REPLICA IDENTITY FULL en las tablas críticas.
-- 2) Añade cada tabla a la publicación "supabase_realtime".
-- 3) Crea políticas RLS de lectura para que anon/authenticated reciban
--    eventos postgres_changes desde @supabase/supabase-js.
-- =====================================================================

DO $$
DECLARE
  tabla text;
  tablas text[] := ARRAY[
    'productos',
    'variantes',
    'inventarios',
    'categorias',
    'resenas',
    'ventas',
    'lineas_venta',
    'venta_items',
    'despachos',
    'recibos',
    'transacciones',
    'kardex',
    'sucursales',
    'configuraciones_empresa',
    'configuracion_empresa',
    'proveedores',
    'comunicados',
    'reclamos'
  ];
BEGIN
  FOREACH tabla IN ARRAY tablas LOOP
    IF to_regclass(format('public.%I', tabla)) IS NOT NULL THEN
      -- Replica completa para que UPDATE/DELETE incluyan la fila anterior.
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', tabla);

      -- Lectura para Realtime (RLS) y privilegios de los roles web.
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabla);
      EXECUTE format('DROP POLICY IF EXISTS bytepro_realtime_read ON public.%I', tabla);
      EXECUTE format(
        'CREATE POLICY bytepro_realtime_read ON public.%I FOR SELECT TO anon, authenticated USING (true)',
        tabla
      );
      EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', tabla);

      -- Publicación Realtime: añadir solo si aún no es miembro.
      IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
      ) AND NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables pt
        WHERE pt.pubname = 'supabase_realtime'
          AND pt.schemaname = 'public'
          AND pt.tablename = tabla
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tabla);
      END IF;
    END IF;
  END LOOP;
END
$$;
