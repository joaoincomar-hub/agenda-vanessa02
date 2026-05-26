-- Rode este arquivo no SQL Editor do Supabase antes de publicar o app.
-- E-mail autorizado como admin da Vanessa.

create table if not exists public.app_admins (
  email text primary key,
  created_at timestamptz default now()
);

insert into public.app_admins (email)
values ('vanessarorigterapias@gmail.com')
on conflict (email) do nothing;

create table if not exists public.clientes (
  id text primary key,
  nome text not null,
  celular text,
  cpf text,
  aniversario text,
  email text,
  fotourl text,
  prontuario text,
  prontuarioarquivourl text,
  created_at timestamptz default now()
);

create table if not exists public.servicos (
  id text primary key,
  nome text not null,
  preco text not null,
  duracaominutos integer default 30,
  created_at timestamptz default now()
);

create table if not exists public.agendamentos (
  id text primary key,
  cliente jsonb not null,
  servico jsonb not null,
  duracaominutos integer default 30,
  dataiso text not null,
  horario text not null,
  observacao text,
  encaixe boolean default false,
  status text default 'Agendado',
  confirmado boolean default false,
  presente boolean default false,
  cancelado_em timestamptz,
  cancelamento_motivo text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.bloqueios (
  id text primary key,
  dataiso text not null,
  horario text not null,
  horariofim text,
  motivo text,
  created_at timestamptz default now()
);

create table if not exists public.backups (
  id text primary key,
  geradoem text,
  dados jsonb not null,
  created_at timestamptz default now()
);

create table if not exists public.audit_log (
  id bigserial primary key,
  tabela text not null,
  registro_id text,
  acao text not null,
  email text,
  dados jsonb,
  created_at timestamptz default now()
);

alter table public.clientes add column if not exists nome text;
alter table public.clientes add column if not exists celular text;
alter table public.clientes add column if not exists cpf text;
alter table public.clientes add column if not exists aniversario text;
alter table public.clientes add column if not exists email text;
alter table public.clientes add column if not exists fotourl text;
alter table public.clientes add column if not exists prontuario text;
alter table public.clientes add column if not exists prontuarioarquivourl text;

alter table public.servicos add column if not exists nome text;
alter table public.servicos add column if not exists preco text;
alter table public.servicos add column if not exists duracaominutos integer default 30;

alter table public.agendamentos add column if not exists cliente jsonb;
alter table public.agendamentos add column if not exists servico jsonb;
alter table public.agendamentos add column if not exists duracaominutos integer default 30;
alter table public.agendamentos add column if not exists dataiso text;
alter table public.agendamentos add column if not exists horario text;
alter table public.agendamentos add column if not exists observacao text;
alter table public.agendamentos add column if not exists encaixe boolean default false;
alter table public.agendamentos add column if not exists status text default 'Agendado';
alter table public.agendamentos add column if not exists confirmado boolean default false;
alter table public.agendamentos add column if not exists presente boolean default false;
alter table public.agendamentos add column if not exists cancelado_em timestamptz;
alter table public.agendamentos add column if not exists cancelamento_motivo text;
alter table public.agendamentos add column if not exists updated_at timestamptz default now();

alter table public.bloqueios add column if not exists dataiso text;
alter table public.bloqueios add column if not exists horario text;
alter table public.bloqueios add column if not exists horariofim text;
alter table public.bloqueios add column if not exists motivo text;

alter table public.backups add column if not exists geradoem text;
alter table public.backups add column if not exists dados jsonb;

drop index if exists public.clientes_email_unico;

alter table public.servicos
  drop constraint if exists servicos_duracao_valida;

alter table public.servicos
  add constraint servicos_duracao_valida
  check (duracaominutos in (30, 45, 60, 75, 90, 120));

alter table public.agendamentos
  drop constraint if exists agendamentos_status_valido;

alter table public.agendamentos
  add constraint agendamentos_status_valido
  check (status in ('Agendado', 'Cancelado'));

alter table public.agendamentos
  drop constraint if exists agendamentos_duracao_valida;

alter table public.agendamentos
  add constraint agendamentos_duracao_valida
  check (duracaominutos in (30, 45, 60, 75, 90, 120));

create unique index if not exists agendamentos_horario_ativo_unico
on public.agendamentos (dataiso, horario)
where status <> 'Cancelado';

create unique index if not exists bloqueios_horario_unico
on public.bloqueios (dataiso, horario);

create index if not exists bloqueios_data_intervalo_idx
on public.bloqueios (dataiso, horario, horariofim);

create index if not exists clientes_busca_idx
on public.clientes (lower(nome), lower(email));

create index if not exists agendamentos_data_idx
on public.agendamentos (dataiso, horario, status);

create or replace function public.horario_para_minutos(horario_text text)
returns integer
language sql
immutable
as $$
  select split_part(horario_text, ':', 1)::integer * 60
       + split_part(horario_text, ':', 2)::integer;
$$;

create or replace function public.validar_agendamento_horario()
returns trigger
language plpgsql
as $$
declare
  inicio_novo integer;
  fim_novo integer;
  duracao_nova integer;
begin
  if new.status = 'Cancelado' then
    return new;
  end if;

  inicio_novo := public.horario_para_minutos(new.horario);
  duracao_nova := coalesce(new.duracaominutos, 30);
  fim_novo := inicio_novo + duracao_nova;

  if inicio_novo < public.horario_para_minutos('07:00')
     or fim_novo > public.horario_para_minutos('20:00') then
    raise exception 'Horario fora do expediente da agenda';
  end if;

  if exists (
    select 1
    from public.agendamentos a
    where a.dataiso = new.dataiso
      and a.status <> 'Cancelado'
      and a.id <> new.id
      and inicio_novo < public.horario_para_minutos(a.horario) + coalesce(a.duracaominutos, 30)
      and public.horario_para_minutos(a.horario) < fim_novo
  ) then
    raise exception 'Horario sobrepoe outro agendamento';
  end if;

  if exists (
    select 1
    from public.bloqueios b
    where b.dataiso = new.dataiso
      and inicio_novo < public.horario_para_minutos(b.horario) + 30
      and public.horario_para_minutos(b.horario) < fim_novo
  ) then
    raise exception 'Horario bloqueado';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_agendamento_horario_trigger on public.agendamentos;
create trigger validar_agendamento_horario_trigger
before insert or update on public.agendamentos
for each row execute function public.validar_agendamento_horario();

create or replace function public.validar_bloqueio_horario()
returns trigger
language plpgsql
as $$
declare
  inicio_bloqueio integer;
  fim_bloqueio integer;
begin
  inicio_bloqueio := public.horario_para_minutos(new.horario);
  fim_bloqueio := coalesce(public.horario_para_minutos(new.horariofim), inicio_bloqueio + 30);

  if fim_bloqueio <= inicio_bloqueio then
    raise exception 'Fim do bloqueio deve ser depois do inicio';
  end if;

  if inicio_bloqueio < public.horario_para_minutos('07:00')
     or fim_bloqueio > public.horario_para_minutos('20:00') then
    raise exception 'Bloqueio fora do expediente da agenda';
  end if;

  if exists (
    select 1
    from public.bloqueios b
    where b.dataiso = new.dataiso
      and b.id <> new.id
      and inicio_bloqueio < coalesce(public.horario_para_minutos(b.horariofim), public.horario_para_minutos(b.horario) + 30)
      and public.horario_para_minutos(b.horario) < fim_bloqueio
  ) then
    raise exception 'Bloqueio sobrepoe outro bloqueio';
  end if;

  if exists (
    select 1
    from public.agendamentos a
    where a.dataiso = new.dataiso
      and a.status <> 'Cancelado'
      and inicio_bloqueio < public.horario_para_minutos(a.horario) + coalesce(a.duracaominutos, 30)
      and public.horario_para_minutos(a.horario) < fim_bloqueio
  ) then
    raise exception 'Bloqueio sobrepoe agendamento';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_bloqueio_horario_trigger on public.bloqueios;
create trigger validar_bloqueio_horario_trigger
before insert or update on public.bloqueios
for each row execute function public.validar_bloqueio_horario();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();

  if new.status = 'Cancelado' and old.status is distinct from 'Cancelado' then
    new.cancelado_em = now();
  end if;

  return new;
end;
$$;

drop trigger if exists agendamentos_set_updated_at on public.agendamentos;
create trigger agendamentos_set_updated_at
before update on public.agendamentos
for each row execute function public.set_updated_at();

create or replace function public.audit_agendamentos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (tabela, registro_id, acao, email, dados)
  values (
    'agendamentos',
    coalesce(new.id, old.id),
    tg_op,
    auth.email(),
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_agendamentos_trigger on public.agendamentos;
create trigger audit_agendamentos_trigger
after insert or update or delete on public.agendamentos
for each row execute function public.audit_agendamentos();

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins
    where lower(email) = lower(auth.email())
  );
$$;

create or replace function public.proteger_prontuario_cliente()
returns trigger
language plpgsql
as $$
begin
  if public.is_app_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(new.prontuario, '') <> ''
      or coalesce(new.prontuarioarquivourl, '') <> '' then
      raise exception 'Somente Vanessa pode editar o prontuario do cliente.';
    end if;

    return new;
  end if;

  if coalesce(new.prontuario, '') is distinct from coalesce(old.prontuario, '')
    or coalesce(new.prontuarioarquivourl, '') is distinct from coalesce(old.prontuarioarquivourl, '') then
    raise exception 'Somente Vanessa pode editar o prontuario do cliente.';
  end if;

  return new;
end;
$$;

drop trigger if exists clientes_proteger_prontuario on public.clientes;
create trigger clientes_proteger_prontuario
before insert or update on public.clientes
for each row
execute function public.proteger_prontuario_cliente();

alter table public.clientes enable row level security;
alter table public.servicos enable row level security;
alter table public.agendamentos enable row level security;
alter table public.bloqueios enable row level security;
alter table public.backups enable row level security;
alter table public.audit_log enable row level security;

alter table public.clientes replica identity full;
alter table public.servicos replica identity full;
alter table public.agendamentos replica identity full;
alter table public.bloqueios replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'clientes'
    ) then
      alter publication supabase_realtime add table public.clientes;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'servicos'
    ) then
      alter publication supabase_realtime add table public.servicos;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'agendamentos'
    ) then
      alter publication supabase_realtime add table public.agendamentos;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bloqueios'
    ) then
      alter publication supabase_realtime add table public.bloqueios;
    end if;
  end if;
end $$;

drop policy if exists "admins gerenciam clientes" on public.clientes;
create policy "admins gerenciam clientes"
on public.clientes
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "cliente ve proprio cadastro" on public.clientes;
create policy "cliente ve proprio cadastro"
on public.clientes
for select
to authenticated
using (lower(email) = lower(auth.email()) or public.is_app_admin());

drop policy if exists "cliente cria proprio cadastro" on public.clientes;
create policy "cliente cria proprio cadastro"
on public.clientes
for insert
to anon, authenticated
with check (
  public.is_app_admin()
  or auth.role() = 'anon'
  or lower(coalesce(email, '')) = lower(coalesce(auth.email(), ''))
);

drop policy if exists "visitante atualiza cadastro publico" on public.clientes;
create policy "visitante atualiza cadastro publico"
on public.clientes
for update
to anon, authenticated
using (public.is_app_admin() or lower(coalesce(email, '')) = lower(coalesce(auth.email(), '')))
with check (public.is_app_admin() or lower(coalesce(email, '')) = lower(coalesce(auth.email(), '')));

drop policy if exists "servicos visiveis para logados" on public.servicos;
create policy "servicos visiveis para logados"
on public.servicos
for select
to anon, authenticated
using (true);

drop policy if exists "admins gerenciam servicos" on public.servicos;
create policy "admins gerenciam servicos"
on public.servicos
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "admins gerenciam agendamentos" on public.agendamentos;
create policy "admins gerenciam agendamentos"
on public.agendamentos
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "cliente cria proprio agendamento" on public.agendamentos;
create policy "cliente cria proprio agendamento"
on public.agendamentos
for insert
to anon, authenticated
with check (
  public.is_app_admin()
  or auth.role() = 'anon'
  or lower(coalesce(cliente->>'email', '')) = lower(coalesce(auth.email(), ''))
);

drop policy if exists "cliente ve proprio agendamento" on public.agendamentos;
create policy "cliente ve proprio agendamento"
on public.agendamentos
for select
to anon, authenticated
using (
  public.is_app_admin()
  or auth.role() = 'anon'
  or lower(coalesce(cliente->>'email', '')) = lower(coalesce(auth.email(), ''))
);

drop policy if exists "cliente atualiza proprio agendamento" on public.agendamentos;
create policy "cliente atualiza proprio agendamento"
on public.agendamentos
for update
to authenticated
using (
  public.is_app_admin()
  or lower(coalesce(cliente->>'email', '')) = lower(coalesce(auth.email(), ''))
)
with check (
  public.is_app_admin()
  or lower(coalesce(cliente->>'email', '')) = lower(coalesce(auth.email(), ''))
);

drop policy if exists "bloqueios visiveis para logados" on public.bloqueios;
create policy "bloqueios visiveis para logados"
on public.bloqueios
for select
to anon, authenticated
using (true);

drop policy if exists "admins gerenciam bloqueios" on public.bloqueios;
create policy "admins gerenciam bloqueios"
on public.bloqueios
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "admins gerenciam backups" on public.backups;
create policy "admins gerenciam backups"
on public.backups
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "admins veem auditoria" on public.audit_log;
create policy "admins veem auditoria"
on public.audit_log
for select
to authenticated
using (public.is_app_admin());
