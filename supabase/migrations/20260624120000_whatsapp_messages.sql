-- Trazabilidad e idempotencia de mensajes enviados via WhatsApp Business Cloud API
create table if not exists public.whatsapp_messages (
  id           uuid primary key default gen_random_uuid(),
  to_phone     text not null,                 -- destino normalizado (57XXXXXXXXXX)
  template     text not null,                 -- nombre de plantilla aprobada en Meta
  wamid        text,                          -- message id devuelto por Meta
  status       text not null default 'sent',  -- sent | delivered | read | failed
  entity_type  text,                          -- enrollment | payment | student | session
  entity_id    uuid,
  error        text,
  payload      jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Idempotencia: un envío por (entity_id, template). entity_id NULL no aplica (alertas internas).
create unique index if not exists whatsapp_messages_entity_template_uniq
  on public.whatsapp_messages (entity_id, template)
  where entity_id is not null;

create index if not exists whatsapp_messages_wamid_idx on public.whatsapp_messages (wamid);
create index if not exists whatsapp_messages_created_at_idx on public.whatsapp_messages (created_at desc);

-- Solo se escribe/lee desde el server (service_role). RLS on, sin políticas públicas.
alter table public.whatsapp_messages enable row level security;
