export type Screen =
  | 'idle'
  | 'login'
  | 'cadastro'
  | 'jogo'
  | 'premiacao'

// ─── Cadastro: identidade do jogador ─────────────────────────────────────────
export type Cadastro = {
  id: string
  nome: string
  telefone: string
  dataNascimento: string
  dataCadastro: string
  aceitouLGPD: boolean
  dataAceiteLGPD: string
}

// ─── Sessao: agrupa partidas de um período (ex: um dia do evento) ────────────
export type Sessao = {
  id: string
  nome: string        // ex: "Ranking 08/06"
  dataInicio: string
  dataFim?: string    // undefined = sessão ativa
}

// ─── Partida: resultado de uma sessão de jogo ─────────────────────────────────
export type Partida = {
  id: string
  cadastroId: string
  sessaoId: string    // qual ranking pertence
  pontuacao: number
  tempo: number       // segundos gastos
  pares: number       // pares acertados (0–6)
  data: string        // ISO string
}

// ─── Premio: faixa de prêmio configurada no painel ───────────────────────────
export type Premio = {
  id: string
  nome: string
  descricao: string
  faixaMin: number
  faixaMax: number
  estoque: number
}

// ─── Resgate: tracking de prêmio desbloqueado por uma partida ────────────────
export type Resgate = {
  id: string
  cadastroId: string
  partidaId: string
  premioId: string
  premioNome: string
  pontuacao: number
  data: string        // ISO string
  status: 'pendente' | 'resgatado'
}

// ─── Configuracao: parâmetros do jogo ────────────────────────────────────────
// pinAdmin foi removido: o acesso ao /admin agora é validado no servidor via
// Supabase Auth (e-mail/senha), não por um PIN guardado em config.
export type Configuracao = {
  pontosPorPar: number
  tempoMaximo: number
  bonusTempo: number
  previewTime: number
  tempoInformativo: number
}

// ─── Resultado de resolverPremio: o que a tela de premiação precisa exibir ──
export type ResultadoPremio = {
  premio: Premio | null
  jaParticipou: boolean
  semEstoque: boolean
}
