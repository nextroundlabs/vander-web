import { supabase } from '../lib/supabase'
import { Cadastro, Partida, Premio, Resgate, Sessao, Configuracao, ResultadoPremio } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Esta versão troca o AsyncStorage (dados isolados por dispositivo) por
// Supabase (banco compartilhado na nuvem) — necessário porque agora vários
// visitantes acessam o jogo pelos próprios celulares via QR code, e todos
// precisam ver o MESMO ranking e o MESMO estoque de prêmios.
//
// As funções exportadas têm os mesmos nomes/formatos de antes para que as
// telas (IdleScreen, LoginScreen, CadastroScreen, JogoScreen, PremiacaoScreen,
// DashboardScreen) precisassem de pouquíssimas mudanças. As exceções estão
// documentadas em cada função.
//
// Tabelas e regras de acesso completas em supabase/schema.sql.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Utilitário de data/hora local ───────────────────────────────────────────
export function dataHoraLocal(date: Date = new Date()): string {
  const d = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const t = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${d} - ${t}`
}

export function dataParaArquivo(date: Date = new Date()): string {
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yy}-${mm}-${dd}_${hh}-${mi}`
}

// ─── Default — usado apenas se a tabela config falhar ao carregar ───────────
export const DEFAULT_CONFIG: Configuracao = {
  pontosPorPar: 100,
  tempoMaximo: 120,
  bonusTempo: 200,
  previewTime: 5,
  tempoInformativo: 8,
}

function fail(label: string, error: unknown): never {
  // eslint-disable-next-line no-console
  console.error(`[storage] ${label}:`, error)
  throw error
}

// ─── Mapeadores snake_case (Postgres) ⇄ camelCase (app) ──────────────────────
function toCadastro(row: any): Cadastro {
  return {
    id: row.id,
    nome: row.nome,
    telefone: row.telefone,
    dataNascimento: row.data_nascimento ?? '',
    dataCadastro: row.data_cadastro,
    aceitouLGPD: row.aceitou_lgpd,
    dataAceiteLGPD: row.data_aceite_lgpd ?? '',
  }
}

function toSessao(row: any): Sessao {
  return {
    id: row.id,
    nome: row.nome,
    dataInicio: row.data_inicio,
    dataFim: row.data_fim ?? undefined,
  }
}

function toPartida(row: any): Partida {
  return {
    id: row.id,
    cadastroId: row.cadastro_id,
    sessaoId: row.sessao_id,
    pontuacao: row.pontuacao,
    tempo: row.tempo,
    pares: row.pares,
    data: row.data,
  }
}

function toPremio(row: any): Premio {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao,
    faixaMin: row.faixa_min,
    faixaMax: row.faixa_max,
    estoque: row.estoque,
  }
}

function toResgate(row: any): Resgate {
  return {
    id: row.id,
    cadastroId: row.cadastro_id,
    partidaId: row.partida_id,
    premioId: row.premio_id,
    premioNome: row.premio_nome,
    pontuacao: row.pontuacao,
    data: row.data,
    status: row.status,
  }
}

function toConfig(row: any): Configuracao {
  return {
    pontosPorPar: row.pontos_por_par,
    tempoMaximo: row.tempo_maximo,
    bonusTempo: row.bonus_tempo,
    previewTime: row.preview_time,
    tempoInformativo: row.tempo_informativo,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CADASTROS
// ─────────────────────────────────────────────────────────────────────────────

/** Lista completa — área admin (dados pessoais: telefone). Exige login. */
export async function getCadastros(): Promise<Cadastro[]> {
  const { data, error } = await supabase.from('cadastros').select('*').order('data_cadastro', { ascending: true })
  if (error) fail('getCadastros', error)
  return (data ?? []).map(toCadastro)
}

/**
 * Cria um cadastro novo. Diferente da versão antiga (AsyncStorage), agora
 * RETORNA o cadastro salvo — porque o id real vem do banco (uuid), não do
 * `Date.now()` que a tela gera localmente. As telas precisam usar o cadastro
 * retornado aqui (e não o objeto que elas mesmas montaram) a partir de agora.
 */
export async function saveCadastro(cadastro: Cadastro): Promise<Cadastro> {
  const { data, error } = await supabase.rpc('cadastrar', {
    p_nome: cadastro.nome,
    p_telefone: cadastro.telefone,
    p_data_nascimento: cadastro.dataNascimento,
    p_aceitou_lgpd: cadastro.aceitouLGPD,
  })
  if (error) fail('saveCadastro', error)
  return toCadastro(data)
}

/** Login do visitante pelo telefone — chamada pública, sem login. */
export async function getCadastroByTelefone(telefone: string): Promise<Cadastro | null> {
  const { data, error } = await supabase.rpc('buscar_cadastro_por_telefone', { p_telefone: telefone })
  if (error) fail('getCadastroByTelefone', error)
  return data ? toCadastro(data) : null
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSÕES
// ─────────────────────────────────────────────────────────────────────────────

/** Lista completa — área admin. Exige login. */
export async function getSessoes(): Promise<Sessao[]> {
  const { data, error } = await supabase.from('sessoes').select('*').order('data_inicio', { ascending: true })
  if (error) fail('getSessoes', error)
  return (data ?? []).map(toSessao)
}

/** Sessão ativa (cria automaticamente se não existir). Chamada pública. */
export async function getSessaoAtiva(): Promise<Sessao> {
  const { data, error } = await supabase.rpc('sessao_ativa')
  if (error) fail('getSessaoAtiva', error)
  return toSessao(data)
}

/** Fecha a sessão ativa e abre uma nova. Ação do admin — exige login. */
export async function novaSessao(nome?: string): Promise<Sessao> {
  const agora = new Date().toISOString()
  const { error: closeErr } = await supabase.from('sessoes').update({ data_fim: agora }).is('data_fim', null)
  if (closeErr) fail('novaSessao (fechar)', closeErr)

  const nomeFinal = nome ?? `Ranking ${dataHoraLocal()}`
  const { data, error } = await supabase.from('sessoes').insert({ nome: nomeFinal }).select().single()
  if (error) fail('novaSessao (criar)', error)
  return toSessao(data)
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTIDAS
// ─────────────────────────────────────────────────────────────────────────────

/** Lista completa (sem nome do jogador) — uso interno. */
export async function getPartidas(): Promise<Partida[]> {
  const { data, error } = await supabase.from('partidas').select('*').order('data', { ascending: true })
  if (error) fail('getPartidas', error)
  return (data ?? []).map(toPartida)
}

/**
 * Salva o resultado de uma partida. Assim como saveCadastro, agora RETORNA a
 * partida salva (com o id real do banco) — use esse retorno para chamar
 * onFinish(), não o objeto local construído com Date.now().
 */
export async function savePartida(partida: Partida): Promise<Partida> {
  const { data, error } = await supabase.rpc('salvar_partida', {
    p_cadastro_id: partida.cadastroId,
    p_sessao_id: partida.sessaoId,
    p_pontuacao: partida.pontuacao,
    p_tempo: partida.tempo,
    p_pares: partida.pares,
  })
  if (error) fail('savePartida', error)
  return toPartida(data)
}

/** Partidas com o nome do jogador já resolvido — área admin. Exige login. */
export async function getPartidasComCadastro(): Promise<(Partida & { nome: string })[]> {
  const { data, error } = await supabase
    .from('partidas')
    .select('*, cadastros(nome)')
    .order('data', { ascending: true })
  if (error) fail('getPartidasComCadastro', error)
  return (data ?? []).map((row: any) => ({ ...toPartida(row), nome: row.cadastros?.nome ?? '???' }))
}

function melhorPorCadastro(partidas: (Partida & { nome: string })[]): (Partida & { nome: string })[] {
  const melhor: Record<string, Partida & { nome: string }> = {}
  for (const p of partidas) {
    if (!melhor[p.cadastroId] || p.pontuacao > melhor[p.cadastroId].pontuacao) melhor[p.cadastroId] = p
  }
  return Object.values(melhor).sort((a, b) => b.pontuacao - a.pontuacao)
}

/** Ranking (top N) de uma sessão específica — área admin. Exige login. */
export async function getRankingDaSessao(sessaoId: string, top = 5): Promise<(Partida & { nome: string })[]> {
  const { data, error } = await supabase
    .from('partidas')
    .select('*, cadastros(nome)')
    .eq('sessao_id', sessaoId)
    .order('data', { ascending: true })
  if (error) fail('getRankingDaSessao', error)
  const todas = (data ?? []).map((row: any) => ({ ...toPartida(row), nome: row.cadastros?.nome ?? '???' }))
  return melhorPorCadastro(todas).slice(0, top)
}

/**
 * Ranking (top N) da sessão ativa — chamada PÚBLICA (tela idle, sem login).
 * Só retorna nome + pontuação: nunca expõe telefone, por causa da LGPD.
 */
export async function getRanking(top = 5): Promise<(Partida & { nome: string })[]> {
  const { data, error } = await supabase.rpc('ranking_sessao_ativa', { p_top: top })
  if (error) fail('getRanking', error)
  return (data ?? []).map((row: any) => ({
    id: '',
    cadastroId: row.cadastro_id,
    sessaoId: '',
    pontuacao: row.pontuacao,
    tempo: row.tempo ?? 0,
    pares: row.pares ?? 0,
    data: '',
    nome: row.nome,
  }))
}

/**
 * Posição de um cadastro no ranking da sessão ativa — chamada pública.
 * Substitui o antigo padrão de buscar getRanking(9999) inteiro só para achar
 * o índice de um jogador (isso exporia a lista completa para qualquer
 * visitante). Retorna 1 se, por algum motivo, a posição não for encontrada.
 */
export async function getPosicaoNoRanking(cadastroId: string): Promise<number> {
  const { data, error } = await supabase.rpc('posicao_no_ranking', { p_cadastro_id: cadastroId })
  if (error) fail('getPosicaoNoRanking', error)
  return typeof data === 'number' ? data : 1
}

// ─────────────────────────────────────────────────────────────────────────────
// PRÊMIOS
// ─────────────────────────────────────────────────────────────────────────────

/** Leitura pública (necessária para a tela de premiação calcular a faixa). */
export async function getPremios(): Promise<Premio[]> {
  const { data, error } = await supabase.from('premios').select('*').order('faixa_min', { ascending: true })
  if (error) fail('getPremios', error)
  return (data ?? []).map(toPremio)
}

/**
 * Substitui a lista inteira de prêmios — ação do admin, exige login.
 * Como agora os ids são uuids reais do banco (e não mais `Date.now()`),
 * a função reconcilia a lista recebida com o que já existe: atualiza quem já
 * tem id no banco, insere quem é novo (id local "fake" do botão +ADICIONAR)
 * e remove quem não está mais na lista (prêmios excluídos na tela).
 */
export async function savePremios(premios: Premio[]): Promise<Premio[]> {
  const existentes = await getPremios()
  const existentesIds = new Set(existentes.map(p => p.id))

  const paraAtualizar = premios.filter(p => existentesIds.has(p.id))
  const paraInserir = premios.filter(p => !existentesIds.has(p.id))
  const idsRecebidos = new Set(premios.map(p => p.id))
  const paraExcluir = existentes.filter(p => !idsRecebidos.has(p.id)).map(p => p.id)

  for (const p of paraAtualizar) {
    const { error } = await supabase
      .from('premios')
      .update({ nome: p.nome, descricao: p.descricao, faixa_min: p.faixaMin, faixa_max: p.faixaMax, estoque: p.estoque })
      .eq('id', p.id)
    if (error) fail('savePremios (atualizar)', error)
  }

  if (paraInserir.length > 0) {
    const { error } = await supabase.from('premios').insert(
      paraInserir.map(p => ({ nome: p.nome, descricao: p.descricao, faixa_min: p.faixaMin, faixa_max: p.faixaMax, estoque: p.estoque }))
    )
    if (error) fail('savePremios (inserir)', error)
  }

  if (paraExcluir.length > 0) {
    const { error } = await supabase.from('premios').delete().in('id', paraExcluir)
    if (error) fail('savePremios (excluir)', error)
  }

  return getPremios()
}

// ─────────────────────────────────────────────────────────────────────────────
// RESGATES
// ─────────────────────────────────────────────────────────────────────────────

/** Lista completa — área admin. Exige login. */
export async function getResgates(): Promise<Resgate[]> {
  const { data, error } = await supabase.from('resgates').select('*').order('data', { ascending: true })
  if (error) fail('getResgates', error)
  return (data ?? []).map(toResgate)
}

/** Inserção direta — usada hoje apenas pela importação de JSON no admin. */
export async function saveResgate(resgate: Resgate): Promise<void> {
  const { error } = await supabase.from('resgates').insert({
    cadastro_id: resgate.cadastroId,
    partida_id: resgate.partidaId,
    premio_id: resgate.premioId,
    premio_nome: resgate.premioNome,
    pontuacao: resgate.pontuacao,
    status: resgate.status,
  })
  if (error) fail('saveResgate', error)
}

/**
 * Resolve o prêmio de uma partida em UMA operação atômica no servidor:
 * decide se o cadastro já resgatou antes, acha a faixa de pontuação, baixa o
 * estoque e registra o resgate — tudo numa transação só, para não dar
 * condição de corrida quando vários visitantes terminam o jogo ao mesmo
 * tempo (substitui o antigo getPremios + decrementEstoque + saveResgate
 * encadeados, que eram seguros num totem único mas não em multi-usuário).
 */
export async function resolverPremio(cadastroId: string, partidaId: string, pontuacao: number): Promise<ResultadoPremio> {
  const { data, error } = await supabase.rpc('resolver_premio', {
    p_cadastro_id: cadastroId,
    p_partida_id: partidaId,
    p_pontuacao: pontuacao,
  })
  if (error) fail('resolverPremio', error)
  const row = data?.[0]
  if (!row) return { premio: null, jaParticipou: false, semEstoque: false }
  return {
    premio: row.premio_id
      ? { id: row.premio_id, nome: row.premio_nome, descricao: row.premio_descricao, faixaMin: 0, faixaMax: 0, estoque: 0 }
      : null,
    jaParticipou: row.ja_participou,
    semEstoque: row.sem_estoque,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

/** Leitura pública — o jogo precisa disso para saber pontuação, tempo, etc. */
export async function getConfig(): Promise<Configuracao> {
  const { data, error } = await supabase.from('config').select('*').eq('id', 1).single()
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[storage] getConfig (usando default):', error)
    return DEFAULT_CONFIG
  }
  return toConfig(data)
}

/** Ação do admin — exige login. */
export async function saveConfig(config: Configuracao): Promise<void> {
  const { error } = await supabase
    .from('config')
    .update({
      pontos_por_par: config.pontosPorPar,
      tempo_maximo: config.tempoMaximo,
      bonus_tempo: config.bonusTempo,
      preview_time: config.previewTime,
      tempo_informativo: config.tempoInformativo,
    })
    .eq('id', 1)
  if (error) fail('saveConfig', error)
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT CSV — junta todas as tabelas (área admin)
// ─────────────────────────────────────────────────────────────────────────────
export async function exportCSV(): Promise<string> {
  const [partidas, cadastros, resgates, sessoes] = await Promise.all([
    getPartidasComCadastro(), getCadastros(), getResgates(), getSessoes(),
  ])
  const cadMap = Object.fromEntries(cadastros.map(c => [c.id, c]))
  const resMap: Record<string, Resgate> = {}
  for (const r of resgates) resMap[r.partidaId] = r
  const sessaoMap = Object.fromEntries(sessoes.map(s => [s.id, s.nome]))

  const header = 'Sessão,Nome,Telefone,Data Nascimento,Pontuação,Pares,Tempo(s),Data,Prêmio,Status Resgate,Aceite LGPD,Data Aceite LGPD'
  const rows = partidas
    .sort((a, b) => b.pontuacao - a.pontuacao)
    .map(p => {
      const c = cadMap[p.cadastroId]
      const r = resMap[p.id]
      return [
        `"${sessaoMap[p.sessaoId] ?? p.sessaoId}"`,
        `"${c?.nome ?? ''}"`,
        `"${c?.telefone ?? ''}"`,
        `"${c?.dataNascimento ?? ''}"`,
        p.pontuacao,
        p.pares,
        p.tempo,
        `"${new Date(p.data).toLocaleString('pt-BR')}"`,
        `"${r?.premioNome ?? ''}"`,
        `"${r?.status ?? ''}"`,
        c?.aceitouLGPD ? 'sim' : 'não',
        `"${c?.dataAceiteLGPD ? new Date(c.dataAceiteLGPD).toLocaleString('pt-BR') : ''}"`,
      ].join(',')
    })
  return [header, ...rows].join('\n')
}
