-- Habilitar realtime para notificaciones admin en pagos y estudiantes
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;

-- REPLICA IDENTITY FULL para que los UPDATE entreguen valores previos (detectar status -> paid)
ALTER TABLE public.payments REPLICA IDENTITY FULL;
