-- ═══════════════════════════════════════════════════════════════════════════
-- VANDERALE — LEMBRA?  ·  Esquema Supabase
-- ═══════════════════════════════════════════════════════════════════════════
-- Como usar:
--   1. Crie um projeto em https://supabase.com (plano gratuito é suficiente).
--   2. Abra o SQL Editor do projeto e cole TODO este arquivo de uma vez.
--   3. Rode. Ele cria as tabelas, as políticas de segurança (RLS) e as
--      funções (RPC) que o app usa para ler/escrever dados.
--   4. Depois de rodar, vá em Authentication → Users → Add user e crie o
--      usuário admin (ver instruções no final deste arquivo).
--
-- Filosofia de segurança adotada aqui:
--   • O app público (qualquer visitante, sem login) NUNCA lê/escreve direto
--     nas tabelas — ele só pode chamar funções RPC específicas, criadas
--     abaixo, que fazem exatamente as operações que o jogo precisa
--     (cadastrar, salvar partida, resgatar prêmio, etc), com validações.
--   • O dashboard admin loga com Supabase Auth (e-mail/senha) e, autenticado,
--     tem acesso de leitura/escrita completo às tabelas — é assim que o
--     painel consegue listar tudo, editar prêmios e exportar dados.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Tabelas ──────────────────────────────────────────────────────────────

create table if not exists public.config (
  id               int primary key default 1,
  pontos_por_par   int  not null default 100,
  tempo_maximo     int  not null default 120,
  bonus_tempo      int  not null default 200,
  preview_time     int  not null default 5,
  tempo_informativo int not null default 8,
  constraint config_singleton check (id = 1)
);

create table if not exists public.sessoes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  data_inicio timestamptz not null default now(),
  data_fim    timestamptz
);

create table if not exists public.cadastros (
  id                 uuid primary key default gen_random_uuid(),
  nome               text not null,
  telefone           text not null,
  data_nascimento    text not null default '',
  data_cadastro      timestamptz not null default now(),
  aceitou_lgpd       boolean not null default false,
  data_aceite_lgpd   timestamptz
);
create index if not exists cadastros_telefone_idx on public.cadastros (telefone);

create table if not exists public.partidas (
  id          uuid primary key default gen_random_uuid(),
  cadastro_id uuid not null references public.cadastros(id) on delete cascade,
  sessao_id   uuid not null references public.sessoes(id) on delete cascade,
  pontuacao   int  not null check (pontuacao >= 0),
  tempo       int  not null check (tempo >= 0),
  pares       int  not null check (pares between 0 and 6),
  data        timestamptz not null default now()
);
create index if not exists partidas_sessao_idx on public.partidas (sessao_id);
create index if not exists partidas_cadastro_idx on public.partidas (cadastro_id);

create table if not exists public.premios (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  descricao text not null default '',
  faixa_min int  not null default 0,
  faixa_max int  not null default 9999,
  estoque   int  not null default 0 check (estoque >= 0)
);

create table if not exists public.resgates (
  id          uuid primary key default gen_random_uuid(),
  cadastro_id uuid not null references public.cadastros(id) on delete cascade,
  partida_id  uuid not null references public.partidas(id) on delete cascade,
  premio_id   uuid not null references public.premios(id),
  premio_nome text not null,
  pontuacao   int  not null,
  data        timestamptz not null default now(),
  status      text not null default 'pendente' check (status in ('pendente', 'resgatado'))
);

-- ─── Seed inicial (idempotente) ───────────────────────────────────────────

insert into public.config (id) values (1) on conflict (id) do nothing;

insert into public.premios (nome, descricao, faixa_min, faixa_max, estoque)
select * from (values
  ('Drink Grátis',     'Um drink da casa por conta do Vanderale',          0,   349,  50),
  ('Petisco Especial', 'Petisco da casa + drink',                          350, 549,  30),
  ('🏆 PRÊMIO OURO',   'Prêmio especial VANDERALE — fale com o atendente!', 550, 9999, 10)
) as seed(nome, descricao, faixa_min, faixa_max, estoque)
where not exists (select 1 from public.premios);

-- ─── RLS: bloqueia tudo por padrão, libera explicitamente abaixo ──────────

alter table public.config    enable row level security;
alter table public.sessoes   enable row level security;
alter table public.cadastros enable row level security;
alter table public.partidas  enable row level security;
alter table public.premios   enable row level security;
alter table public.resgates  enable row level security;

-- Leitura pública (sem dado pessoal) — necessário para o jogo funcionar sem login
create policy "config: leitura pública" on public.config for select using (true);
create policy "premios: leitura pública" on public.premios for select using (true);

-- Admin autenticado (login feito no /admin) tem acesso total a tudo
create policy "admin: tudo em config"    on public.config    for all using (auth.role() = 'authenticated');
create policy "admin: tudo em sessoes"   on public.sessoes   for all using (auth.role() = 'authenticated');
create policy "admin: tudo em cadastros" on public.cadastros for all using (auth.role() = 'authenticated');
create policy "admin: tudo em partidas"  on public.partidas  for all using (auth.role() = 'authenticated');
create policy "admin: tudo em premios"   on public.premios   for all using (auth.role() = 'authenticated');
create policy "admin: tudo em resgates"  on public.resgates  for all using (auth.role() = 'authenticated');

-- Nenhuma policy "anon" foi criada para cadastros/sessoes/partidas/resgates de
-- propósito — visitantes sem login só acessam essas tabelas através das
-- funções RPC abaixo (security definer), nunca direto.

-- ═══════════════════════════════════════════════════════════════════════════
-- RPC — funções que o jogo (visitante, sem login) chama
-- ═══════════════════════════════════════════════════════════════════════════

-- Retorna a sessão ativa (cria uma se não existir nenhuma em aberto).
create or replace function public.sessao_ativa()
returns public.sessoes
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.sessoes;
begin
  select * into s from public.sessoes where data_fim is null order by data_inicio desc limit 1;
  if s.id is null then
    insert into public.sessoes (nome) values ('Ranking ' || to_char(now(), 'DD/MM/YYYY HH24:MI'))
    returning * into s;
  end if;
  return s;
end;
$$;
grant execute on function public.sessao_ativa() to anon, authenticated;

-- Busca um cadastro pelo telefone (login do visitante). Retorna NULL se não achar.
create or replace function public.buscar_cadastro_por_telefone(p_telefone text)
returns public.cadastros
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.cadastros;
begin
  select * into c from public.cadastros where telefone = p_telefone limit 1;
  if not found then
    return null;
  end if;
  return c;
end;
$$;
grant execute on function public.buscar_cadastro_por_telefone(text) to anon, authenticated;

-- Cria um novo cadastro (tela de cadastro do visitante).
create or replace function public.cadastrar(
  p_nome text,
  p_telefone text,
  p_data_nascimento text,
  p_aceitou_lgpd boolean
)
returns public.cadastros
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.cadastros;
begin
  insert into public.cadastros (nome, telefone, data_nascimento, aceitou_lgpd, data_aceite_lgpd)
  values (p_nome, p_telefone, p_data_nascimento, p_aceitou_lgpd, case when p_aceitou_lgpd then now() else null end)
  returning * into c;
  return c;
end;
$$;
grant execute on function public.cadastrar(text, text, text, boolean) to anon, authenticated;

-- Salva o resultado de uma partida, limitando a pontuação ao máximo
-- matematicamente possível (config) para reduzir manipulação client-side.
create or replace function public.salvar_partida(
  p_cadastro_id uuid,
  p_sessao_id uuid,
  p_pontuacao int,
  p_tempo int,
  p_pares int
)
returns public.partidas
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.config;
  max_possivel int;
  p public.partidas;
begin
  select * into cfg from public.config where id = 1;
  max_possivel := cfg.pontos_por_par * 6 + cfg.bonus_tempo;

  insert into public.partidas (cadastro_id, sessao_id, pontuacao, tempo, pares)
  values (
    p_cadastro_id,
    p_sessao_id,
    least(greatest(p_pontuacao, 0), max_possivel),
    greatest(p_tempo, 0),
    least(greatest(p_pares, 0), 6)
  )
  returning * into p;
  return p;
end;
$$;
grant execute on function public.salvar_partida(uuid, uuid, int, int, int) to anon, authenticated;

-- Ranking (top N) da sessão ativa — só nome + pontuação, sem telefone (LGPD).
create or replace function public.ranking_sessao_ativa(p_top int default 5)
returns table (nome text, pontuacao int, tempo int, pares int, cadastro_id uuid)
language sql
security definer
set search_path = public
as $$
  with ativa as (select id from public.sessoes where data_fim is null order by data_inicio desc limit 1),
  melhores as (
    select p.cadastro_id, max(p.pontuacao) as pontuacao
    from public.partidas p, ativa
    where p.sessao_id = ativa.id
    group by p.cadastro_id
  )
  select c.nome, m.pontuacao,
         (select tempo  from public.partidas pp where pp.cadastro_id = m.cadastro_id and pp.pontuacao = m.pontuacao order by pp.data desc limit 1),
         (select pares  from public.partidas pp where pp.cadastro_id = m.cadastro_id and pp.pontuacao = m.pontuacao order by pp.data desc limit 1),
         m.cadastro_id
  from melhores m
  join public.cadastros c on c.id = m.cadastro_id
  order by m.pontuacao desc
  limit p_top;
$$;
grant execute on function public.ranking_sessao_ativa(int) to anon, authenticated;

-- Posição de um cadastro específico no ranking da sessão ativa (tela de premiação).
create or replace function public.posicao_no_ranking(p_cadastro_id uuid)
returns int
language sql
security definer
set search_path = public
as $$
  with ativa as (select id from public.sessoes where data_fim is null order by data_inicio desc limit 1),
  melhores as (
    select p.cadastro_id, max(p.pontuacao) as pontuacao
    from public.partidas p, ativa
    where p.sessao_id = ativa.id
    group by p.cadastro_id
  ),
  ranked as (
    select cadastro_id, row_number() over (order by pontuacao desc) as pos
    from melhores
  )
  select pos from ranked where cadastro_id = p_cadastro_id;
$$;
grant execute on function public.posicao_no_ranking(uuid) to anon, authenticated;

-- Resolve o prêmio de uma partida: verifica se o cadastro já resgatou antes,
-- acha a faixa correspondente, decrementa o estoque de forma atômica e
-- registra o resgate — tudo em UMA transação, para não haver corrida entre
-- visitantes diferentes terminando o jogo ao mesmo tempo.
create or replace function public.resolver_premio(
  p_cadastro_id uuid,
  p_partida_id uuid,
  p_pontuacao int
)
returns table (premio_id uuid, premio_nome text, premio_descricao text, ja_participou boolean, sem_estoque boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  ja boolean;
  alvo public.premios;
begin
  select exists(select 1 from public.resgates r where r.cadastro_id = p_cadastro_id) into ja;
  if ja then
    return query select null::uuid, null::text, null::text, true, false;
    return;
  end if;

  select * into alvo from public.premios
  where p_pontuacao >= faixa_min and p_pontuacao <= faixa_max
  order by faixa_min desc
  limit 1;

  if alvo.id is null then
    return query select null::uuid, null::text, null::text, false, false;
    return;
  end if;

  update public.premios set estoque = estoque - 1
  where id = alvo.id and estoque > 0
  returning * into alvo;

  if alvo.id is null then
    return query select null::uuid, null::text, null::text, false, true;
    return;
  end if;

  insert into public.resgates (cadastro_id, partida_id, premio_id, premio_nome, pontuacao)
  values (p_cadastro_id, p_partida_id, alvo.id, alvo.nome, p_pontuacao);

  return query select alvo.id, alvo.nome, alvo.descricao, false, false;
end;
$$;
grant execute on function public.resolver_premio(uuid, uuid, int) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- Depois de rodar este script:
--
-- 1. Vá em Authentication → Users → Add user e crie o usuário do admin, ex:
--      e-mail:  admin@vanderale.local
--      senha:   (escolha uma senha forte — é essa senha que abre o /admin)
--    Marque "Auto Confirm User" para não precisar confirmar por e-mail.
--
-- 2. Em Project Settings → API Keys, copie:
--      Project URL                          → EXPO_PUBLIC_SUPABASE_URL
--      Publishable key (ou, em projetos      → EXPO_PUBLIC_SUPABASE_ANON_KEY
--      mais antigos, "anon public" na aba
--      "Legacy API Keys")
--    e coloque essas duas variáveis no .env (local) e nas Environment
--    Variables do projeto na Vercel (produção).
-- ═══════════════════════════════════════════════════════════════════════════
