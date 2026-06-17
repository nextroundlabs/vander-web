# VANDERALE — LEMBRA? 🃏

Jogo da memória promocional do bar **Vanderale** (São Paulo, SP), acessado pelos
visitantes através de QR codes espalhados pelo local do evento — cada um abre
o jogo no próprio celular do visitante.

---

## Sobre o projeto

O visitante escaneia um QR code no evento, cai direto na tela de espera do
jogo, cadastra nome e telefone (ou faz login se já jogou antes), e joga o
**Jogo da Memória** com cartas temáticas do bar. Ao final, recebe uma
pontuação e pode desbloquear prêmios reais (drinks, petiscos, prêmio
especial), com estoque controlado e compartilhado entre todos os jogadores.

A configuração do jogo (pontuação, tempo, prêmios) é feita por um dashboard
administrativo, em uma **URL separada e protegida por senha** — não há mais
nenhum atalho escondido dentro do jogo público.

---

## Duas URLs, dois mundos

| URL | Quem acessa | O que tem |
|---|---|---|
| `/` | Qualquer visitante (via QR code) | Idle → Login/Cadastro → Jogo → Premiação |
| `/admin` | Só quem tem a senha | Login admin → Dashboard (ranking, prêmios, config, export) |

Tecnicamente são dois "apps" React separados (`src/GameApp.tsx` e
`src/AdminApp.tsx`) que nunca se misturam — o `App.tsx` na raiz só decide,
pela URL, qual dos dois montar. Isso significa que não existe nenhum caminho
dentro do jogo público que leve ao dashboard.

---

## Funcionalidades

| Tela | Descrição |
|---|---|
| **Idle** | Tela de espera animada com ranking em tempo real (compartilhado entre todos) e CTA pulsante |
| **Login** | Cadastro ou login por telefone |
| **Cadastro** | Registro de nome completo, data de nascimento e aceite LGPD |
| **Jogo** | Grade 4×3 (12 cartas, 6 pares) com fase de preview e sistema de combo |
| **Premiação** | Ticket-style com prêmio desbloqueado, posição no ranking e compartilhamento social |
| **Admin Login** | Tela de senha (`/admin`), validada no servidor |
| **Dashboard Admin** | Ranking, prêmios/estoque, resgates, import/export de dados e configurações do jogo |

### Mecânicas do jogo
- **Fase preview:** todas as cartas são reveladas por N segundos antes de começar (configurável no painel)
- **Streak bonus:** +50 pts por cada acerto consecutivo além do primeiro
- **Pontuação base:** configurável via painel admin
- **Prêmios por faixa de pontos:** drink grátis / petisco especial / prêmio ouro — estoque é real e compartilhado, decrementado de forma atômica no servidor

### Acesso ao painel admin
Acesse `https://seu-dominio.vercel.app/admin` e digite a senha do admin
(criada no Supabase Auth — veja "Deploy" abaixo). Não é mais um PIN de 4
dígitos: como a página tem URL pública, a senha é validada no servidor, então
pode (e deve) ser forte.

---

## Stack

| Tecnologia | Papel |
|---|---|
| React Native + Expo SDK 56 | App (web via `react-native-web`) |
| TypeScript | Tipagem |
| Supabase (Postgres + Auth) | Banco de dados compartilhado, API e autenticação do admin |
| Vercel | Hospedagem do front-end web |

> Antes, o app era 100% offline com dados no `AsyncStorage` do dispositivo —
> isso funcionava com **um totem único**. Como agora cada visitante acessa
> pelo próprio celular, os dados (cadastros, ranking, estoque de prêmios,
> configuração) precisam ser **compartilhados entre todos os acessos**, por
> isso a camada de dados (`src/db/storage.ts`) foi migrada para o Supabase.
> O app continua funcionando, mas agora depende de internet — sem conexão,
> o jogo não consegue cadastrar, salvar partidas nem calcular prêmios.

---

## Estrutura do projeto

```
vanderale/
├── App.tsx                        # Roteador: decide GameApp ou AdminApp pela URL
├── supabase/
│   └── schema.sql                 # Tabelas, RLS e funções (RPC) do banco — rodar no Supabase
├── src/
│   ├── GameApp.tsx                 # Fluxo público (idle → login → jogo → premiação)
│   ├── AdminApp.tsx                # Fluxo admin (login → dashboard)
│   ├── lib/
│   │   ├── supabase.ts             # Cliente Supabase (lê EXPO_PUBLIC_SUPABASE_*)
│   │   └── adminAuth.ts            # signInAdmin / signOutAdmin (Supabase Auth)
│   ├── scale.ts                    # Utilitários responsivos: wp(), hp(), fp()
│   ├── theme.ts                    # Paleta de cores
│   ├── types.ts                    # Tipos TypeScript
│   ├── db/
│   │   └── storage.ts              # Funções de dados — agora chamam o Supabase, não o AsyncStorage
│   ├── components/
│   │   ├── MemoryCard.tsx          # Carta com animação de flip
│   │   └── VirtualKeyboard.tsx     # Teclado QWERTY / numérico on-screen
│   └── screens/
│       ├── IdleScreen.tsx          # Tela de espera + ranking (sem nenhum atalho de admin)
│       ├── LoginScreen.tsx         # Login por telefone
│       ├── CadastroScreen.tsx      # Cadastro de nome
│       ├── JogoScreen.tsx          # Jogo da memória
│       ├── PremiacaoScreen.tsx     # Resultado + prêmio
│       ├── AdminLoginScreen.tsx    # Tela de senha do /admin
│       └── DashboardScreen.tsx     # Painel admin (sem o PIN embutido de antes)
└── tasks/
    ├── todo.md                    # Histórico de tarefas
    └── lessons.md                 # Lições aprendidas
```

---

## Como rodar localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado
- Um projeto Supabase já criado e configurado (ver "Deploy" abaixo) — o jogo
  não funciona sem isso, mesmo localmente, porque os dados não são mais
  locais

### Instalação

```bash
npm install
cp .env.example .env
# edite o .env com a URL e a anon key do seu projeto Supabase
```

### Web (preview no navegador)

```bash
npm run web
```

Acesse **http://localhost:8081** para o jogo e **http://localhost:8081/admin** para o painel.

Para simular o totem (1080×1920) no Chrome:
1. Abra o DevTools → **F12**
2. Ative o modo responsivo → **Ctrl+Shift+M**
3. Adicione um dispositivo customizado: **1080 × 1920**, DPR 1
4. Selecione o dispositivo na lista

### Android

```bash
npm run android
```

> Apps nativos sempre abrem o fluxo público (`GameApp`) — o `/admin` é uma
> rota só da versão web.

---

## Deploy em produção (Supabase + Vercel)

### 1. Banco de dados (Supabase)

1. Crie uma conta e um projeto em [supabase.com](https://supabase.com) (plano gratuito).
2. Abra **SQL Editor**, cole todo o conteúdo de `supabase/schema.sql` e execute.
3. Vá em **Authentication → Users**, clique em **Add user → Create new user** e crie o usuário do admin:
   - E-mail: `admin@vanderale.local` (tem que ser exatamente esse — é o valor de `ADMIN_EMAIL` em `src/lib/adminAuth.ts`)
   - Senha: escolha uma senha forte — é ela que abre o `/admin`
   - Marque **Auto Confirm User**
4. Vá em **Project Settings → API Keys** e copie:
   - **Project URL**
   - A chave pública do projeto — a Supabase está migrando a nomenclatura:
     em projetos novos ela aparece como **Publishable key** (`sb_publishable_...`)
     na aba "API Keys"; em projetos mais antigos, como **anon public** na aba
     "Legacy API Keys". As duas funcionam da mesma forma para este app — é
     só o nome que mudou.

### 2. Front-end (Vercel)

1. Suba este repositório no GitHub (se ainda não estiver).
2. Em [vercel.com](https://vercel.com), **Add New → Project**, importe o repositório.
3. Em **Settings → Environment Variables**, adicione:
   - `EXPO_PUBLIC_SUPABASE_URL` = a Project URL copiada acima
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = a Publishable key (ou anon key) copiada acima
4. O `vercel.json` já configura o build (`npx expo export -p web`, saída em
   `dist/`) e o fallback de rotas para SPA — não precisa mexer nas
   configurações de build na UI. Essa receita foi confirmada contra a
   documentação oficial da Expo para deploy na Vercel (válida para o SDK 56).
5. Deploy. A URL pública (`/`) é o link para o QR code do evento; `/admin` é
   o painel.

### 3. Gerar o QR code

Gere o QR code apontando para a URL pública do projeto na Vercel (ex.:
`https://vanderale.vercel.app`) — qualquer gerador de QR code gratuito serve.
**Nunca** aponte um QR code para `/admin`.

---

## Configurações do painel admin

| Campo | Padrão | Descrição |
|---|---|---|
| Pontos por par | 100 | Pontuação base ao acertar um par |
| Tempo máximo | 120s | Tempo limite da partida |
| Bônus de tempo | 200 | Pontos extras por terminar antes do limite |
| Tempo de preview | 5s | Segundos com cartas abertas no início |

A senha do admin não é mais um campo de configuração — ela é gerenciada pelo
Supabase Auth (veja "Deploy" acima). Para trocá-la, vá em Supabase →
Authentication → Users → selecione o usuário admin → "Send password reset"
ou edite diretamente.

---

## Exportar dados

No painel admin, aba **DADOS**, há um botão para exportar todos os jogadores
em formato **CSV** com: Nome, Telefone, Pontuação, Pares, Tempo e Data. Como
os dados de cada visitante incluem telefone (dado pessoal — LGPD), trate esse
arquivo com cuidado depois de exportado.

---

## Evento

| | |
|---|---|
| **Local** | Vanderale Bar — São Paulo, SP |
| **Acesso** | QR codes espalhados pelo local, abrindo no celular do próprio visitante |
| **Modo** | Online — requer internet (Supabase como banco compartilhado) |
