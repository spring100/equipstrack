DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'equipment') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'maintenance_orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_orders;
  END IF;
END $$;