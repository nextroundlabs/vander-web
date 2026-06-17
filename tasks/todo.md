# Migração: totem único → web pública (QR code) + dashboard separado

## Contexto
O jogo era pensado para um totem físico único, com dados no AsyncStorage
(local ao dispositivo). A nova necessidade: visitantes acessam o jogo pelo
próprio celular via QR code espalhado pelo evento, e o dashboard de
configuração precisa virar uma rota separada (`/admin`) protegida por senha,
sem nenhum atalho escondido dentro do jogo público.

Isso exigiu duas mudanças, não só uma: (1) separar as rotas/telas, e (2) dar
ao app um backend compartilhado — sem isso, ranking e estoque de prêmios não
seriam reais entre visitantes diferentes.

## Plano

- [x] Mapear todos os pontos onde as telas acessam dados (`src/db/storage.ts`
      é o único ponto de acesso — boa notícia, isolou o impacto).
- [x] Desenhar o esquema do banco (Supabase/Postgres) com RLS: leitura
      pública só do necessário (config, prêmios, ranking agregado sem
      telefone), tudo o resto via funções RPC com `security definer`, nunca
      acesso direto às tabelas para quem não está logado como admin.
- [x] Reescrever `src/db/storage.ts` para chamar o Supabase em vez do
      AsyncStorage, mantendo os mesmos nomes de função usados pelas telas.
- [x] Resolver o problema de id: telas construíam `Cadastro`/`Partida` com
      `Date.now().toString()` como id local; agora o banco gera uuids reais,
      então `saveCadastro`/`savePartida` passaram a RETORNAR o registro salvo,
      e as telas usam esse retorno (senão as foreign keys de partidas/resgates
      quebrariam).
- [x] Substituir a sequência racy "ler prêmios → checar estoque → decrementar
      → salvar resgate" (seria insegura com múltiplos visitantes simultâneos)
      por uma única função/RPC atômica (`resolverPremio` / `resolver_premio`).
- [x] Extrair a tela de senha (`PinScreen`) de dentro de `DashboardScreen`
      para `AdminLoginScreen`, validada via Supabase Auth (antes era um PIN
      de 4 dígitos comparado no cliente).
- [x] Remover totalmente o gatilho de 5 toques no canto da `IdleScreen`.
- [x] Separar `App.tsx` em `GameApp.tsx` (fluxo público) e `AdminApp.tsx`
      (login + dashboard), com um roteador mínimo na raiz decidindo por
      `window.location.pathname` (`/admin` vs. tudo o mais).
- [x] Configurar `.env.example`, `vercel.json` (build + SPA fallback) e
      atualizar o README com o passo a passo de deploy.

## Pendente (depende de ambiente com internet, fora do sandbox)

- [ ] Rodar `npm install` e `npm run web` localmente para validar a build —
      não foi possível testar aqui porque este ambiente não tem acesso à rede.
- [ ] Criar o projeto Supabase, rodar `supabase/schema.sql`, criar o usuário
      admin.
- [ ] Criar o projeto na Vercel, configurar as env vars, fazer o primeiro deploy.
- [ ] Testar o fluxo ponta a ponta com 2+ dispositivos simultâneos (ranking e
      estoque de prêmios precisam refletir em todos).
- [ ] Gerar o QR code apontando para a URL pública (nunca para `/admin`).

## Review

A mudança de "totem único offline" para "multi-acesso online" não é só uma
questão de rota — é uma mudança de modelo de dados. O ponto mais arriscado
não era a senha do admin, era o estoque de prêmios sendo decrementado sem
nenhuma transação compartilhada entre visitantes diferentes; isso foi
resolvido com uma função Postgres atômica em vez de lógica no cliente.
