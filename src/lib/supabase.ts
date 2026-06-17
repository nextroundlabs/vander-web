import { createClient } from '@supabase/supabase-js'

// Variáveis com prefixo EXPO_PUBLIC_ são embutidas no bundle pelo Expo em
// tempo de build — funcionam tanto em `expo start --web` (lendo do .env
// local) quanto no build de produção (lendo das Environment Variables
// configuradas no projeto da Vercel). Nunca colocar aqui a service_role key,
// só a "anon public" — ela é segura para expor no cliente, pois todo o
// controle de acesso real está nas policies de RLS e nas funções RPC do
// supabase/schema.sql.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  // Não lança erro para não derrubar o app inteiro — as telas tratam falhas
  // de rede/config individualmente — mas avisa alto no console, porque sem
  // isso nada de dados vai funcionar.
  // eslint-disable-next-line no-console
  console.error(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY não configuradas. ' +
    'Veja o README para o passo a passo de configuração do .env.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Mantém a sessão do admin entre recarregamentos da página /admin.
    persistSession: true,
    autoRefreshToken: true,
  },
})
