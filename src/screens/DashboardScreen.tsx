import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, Platform,
} from 'react-native'
import { C, R } from '../theme'
import { B } from '../brand'
import { wp, hp, fp } from '../scale'
import { useViewport } from '../hooks/useViewport'
import { isCompact, isNarrow } from '../responsive'
import { RetroBackground } from '../components/retro'
import {
  getPartidasComCadastro, getCadastros, getPremios, savePremios,
  getConfig, saveConfig, exportCSV, getResgates,
  saveCadastro, savePartida, saveResgate,
  getSessoes, novaSessao, getRankingDaSessao,
  dataHoraLocal, dataParaArquivo,
} from '../db/storage'
import { signOutAdmin } from '../lib/adminAuth'
import { Cadastro, Partida, Premio, Configuracao, Resgate, Sessao } from '../types'

type Tab = 'ranking' | 'premios' | 'resgates' | 'dados' | 'config'

type Props = {
  /** Chamado ao sair do dashboard (depois do logout) — volta para a tela de senha. */
  onClose: () => void
}

export default function DashboardScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('ranking')
  const [horaAtual, setHoraAtual] = useState(() => dataHoraLocal())
  const { width } = useViewport()
  const compact = isCompact(width)
  const narrow = isNarrow(width)

  useEffect(() => {
    const iv = setInterval(() => setHoraAtual(dataHoraLocal()), 10000)
    return () => clearInterval(iv)
  }, [])
  const [partidas, setPartidas] = useState<(ReturnType<typeof getPartidasComCadastro> extends Promise<infer T> ? T : never)>([])
  const [premios,  setPremios]  = useState<Premio[]>([])
  const [resgates, setResgates] = useState<Resgate[]>([])
  const [config,   setConfig]   = useState<Configuracao | null>(null)
  const [sessoes,  setSessoes]  = useState<Sessao[]>([])
  const [sessaoVista, setSessaoVista] = useState<string | null>(null)   // null = ativa
  const [rankHistorico, setRankHistorico] = useState<(Partida & { nome: string })[]>([])

  const load = useCallback(async () => {
    const [pts, pr, rsg, cfg, sess] = await Promise.all([
      getPartidasComCadastro(), getPremios(), getResgates(), getConfig(), getSessoes(),
    ])
    setPartidas(pts.sort((a, b) => b.pontuacao - a.pontuacao))
    setPremios(pr)
    setResgates(rsg)
    setConfig(cfg)
    setSessoes(sess.slice().reverse())  // mais recente primeiro
  }, [])

  useEffect(() => { load() }, [load])

  const handleLogout = async () => {
    await signOutAdmin()
    onClose()
  }

  const notify = (msg: string) => {
    if (Platform.OS === 'web') (window as any).alert(msg)
    else Alert.alert('Salvo!', msg)
  }

  const handleSaveConfig = async () => {
    if (!config) return
    await saveConfig(config)
    notify('Configurações atualizadas.')
  }

  const handleSavePremios = async () => {
    // savePremios reconcilia a lista (insere/atualiza/exclui) e retorna o
    // estado real do banco, com os ids definitivos — precisamos guardar esse
    // retorno, senão prêmios recém-criados ficariam com o id "fake" local e
        // seriam duplicados se a pessoa salvar de novo sem recarregar a página.
    const salvos = await savePremios(premios)
    setPremios(salvos)
    notify('Prêmios atualizados.')
  }

  const handleExport = async () => {
    const csv = await exportCSV()
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vanderale-${new Date().toISOString().slice(0,10)}.csv`
      a.click()
    } else {
      Alert.alert('CSV', csv.slice(0, 300) + '\n...')
    }
  }

  // ── Export / Import JSON por entidade ─────────────────────────────────────
  const downloadJSON = (filename: string, data: unknown) => {
    if (Platform.OS !== 'web') { notify('Export JSON só disponível no web.'); return }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJSON = (onLoad: (data: unknown) => void) => {
    if (Platform.OS !== 'web') { notify('Import JSON só disponível no web.'); return }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = ev => {
        try {
          const parsed = JSON.parse(ev.target?.result as string)
          onLoad(parsed)
        } catch { notify('JSON inválido.') }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleNovoRanking = () => {
    const doReset = async () => {
      await novaSessao()
      await load()
      setSessaoVista(null)
      notify('Novo ranking iniciado!')
    }
    if (Platform.OS === 'web') {
      if ((window as any).confirm('Iniciar novo ranking? O ranking atual será arquivado.')) doReset()
    } else {
      Alert.alert('Novo Ranking', 'O ranking atual será arquivado e um novo será iniciado.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: doReset },
      ])
    }
  }

  const handleVerSessao = async (sessaoId: string) => {
    const rank = await getRankingDaSessao(sessaoId, 9999)
    setRankHistorico(rank)
    setSessaoVista(sessaoId)
  }

  const stamp = () => dataParaArquivo()
  const handleExportCadastros = async () => downloadJSON(`cadastros_${stamp()}.json`, await getCadastros())
  const handleExportPartidas  = async () => downloadJSON(`partidas_${stamp()}.json`,  await getPartidasComCadastro())
  const handleExportResgates  = async () => downloadJSON(`resgates_${stamp()}.json`,  await getResgates())
  const handleExportPremios   = async () => downloadJSON(`premios_${stamp()}.json`,   await getPremios())
  const handleExportConfig    = async () => downloadJSON(`config_${stamp()}.json`,    await getConfig())

  const handleImportCadastros = () => importJSON(async data => {
    for (const c of data as Cadastro[]) await saveCadastro(c)
    await load(); notify(`${(data as Cadastro[]).length} cadastros importados.`)
  })
  const handleImportPartidas = () => importJSON(async data => {
    for (const p of data as Partida[]) await savePartida(p)
    await load(); notify(`${(data as Partida[]).length} partidas importadas.`)
  })
  const handleImportResgates = () => importJSON(async data => {
    for (const r of data as Resgate[]) await saveResgate(r)
    await load(); notify(`${(data as Resgate[]).length} resgates importados.`)
  })
  const handleImportPremios = () => importJSON(async data => {
    await savePremios(data as Premio[])
    await load(); notify('Prêmios importados.')
  })

  return (
    <RetroBackground decor={false}>
    <View style={styles.container}>
      <View style={[styles.topBar, compact && styles.topBarCompact]}>
        <Text style={[styles.topTitle, compact && styles.topTitleCompact]}>DASHBOARD</Text>
        {!compact && <Text style={styles.topClock}>🕐 {horaAtual}</Text>}
        <TouchableOpacity onPress={handleLogout} hitSlop={12}>
          <Text style={styles.closeBtn}>✕ SAIR</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabs}
      >
        {(['ranking','premios','resgates','dados','config'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive, narrow && styles.tabNarrow]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive, narrow && styles.tabTextNarrow]}>
              {t === 'ranking' ? 'RANKING' : t === 'premios' ? 'PRÊMIOS' : t === 'resgates' ? 'RESGATES' : t === 'dados' ? 'DADOS' : 'CONFIG'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} contentContainerStyle={[styles.contentInner, compact && styles.contentInnerCompact]}>
        {tab === 'ranking' && (
          <>
            {/* ── Sessão sendo exibida ── */}
            {sessaoVista ? (
              <>
                <View style={styles.sectionHeader}>
                  <TouchableOpacity onPress={() => setSessaoVista(null)}>
                    <Text style={styles.exportBtn}>← VOLTAR</Text>
                  </TouchableOpacity>
                  <Text style={styles.sessaoNome}>
                    {sessoes.find(s => s.id === sessaoVista)?.nome}
                  </Text>
                </View>
                {rankHistorico.length === 0
                  ? <Text style={styles.emptyText}>Sem partidas nesta sessão.</Text>
                  : rankHistorico.map((p, i) => (
                    <View key={p.id} style={styles.rankRow}>
                      <Text style={[styles.rankPos, i < 3 && { color: R.yellow }]}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}
                      </Text>
                      <View style={styles.rankInfo}>
                        <Text style={styles.rankName}>{p.nome}</Text>
                        <Text style={styles.rankSub}>{p.pares}/6 pares · {p.tempo}s</Text>
                      </View>
                      <Text style={styles.rankScore}>{p.pontuacao}</Text>
                    </View>
                  ))
                }
              </>
            ) : (
              <>
                {/* ── Ranking ativo ── */}
                <View style={[styles.sectionHeader, narrow && styles.sectionHeaderStack]}>
                  <Text style={[styles.sectionTitle, styles.sectionTitleInline]}>
                    RANKING ATUAL ({partidas.filter(p => {
                      const ativa = sessoes.find(s => !s.dataFim)
                      return ativa ? p.sessaoId === ativa.id : true
                    }).length} partidas)
                  </Text>
                  <View style={[styles.sectionActions, narrow && styles.sectionActionsWrap]}>
                    <TouchableOpacity onPress={handleExport}>
                      <Text style={styles.exportBtn}>↓ CSV</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleNovoRanking}>
                      <Text style={[styles.exportBtn, { color: C.warning }]}>⟳ NOVO</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {partidas.filter(p => {
                  const ativa = sessoes.find(s => !s.dataFim)
                  return ativa ? p.sessaoId === ativa.id : true
                }).length === 0
                  ? <Text style={styles.emptyText}>Nenhum jogo registrado ainda.</Text>
                  : partidas.filter(p => {
                      const ativa = sessoes.find(s => !s.dataFim)
                      return ativa ? p.sessaoId === ativa.id : true
                    }).slice(0, 50).map((p, i) => (
                    <View key={p.id} style={styles.rankRow}>
                      <Text style={[styles.rankPos, i < 3 && { color: R.yellow }]}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}
                      </Text>
                      <View style={styles.rankInfo}>
                        <Text style={styles.rankName}>{p.nome}</Text>
                        <Text style={styles.rankSub}>{p.pares}/6 pares · {p.tempo}s · {new Date(p.data).toLocaleDateString('pt-BR')}</Text>
                      </View>
                      <Text style={styles.rankScore}>{p.pontuacao}</Text>
                    </View>
                  ))
                }

                {/* ── Rankings históricos ── */}
                {sessoes.filter(s => s.dataFim).length > 0 && (
                  <>
                    <View style={[styles.cfgDivider, { marginTop: 24 }]} />
                    <Text style={styles.sectionTitle}>RANKINGS ANTERIORES</Text>
                    {sessoes.filter(s => s.dataFim).map(s => (
                      <TouchableOpacity
                        key={s.id}
                        style={styles.sessaoRow}
                        onPress={() => handleVerSessao(s.id)}
                      >
                        <View style={styles.rankInfo}>
                          <Text style={styles.rankName}>{s.nome}</Text>
                          <Text style={styles.rankSub}>
                            {new Date(s.dataInicio).toLocaleString('pt-BR')} →{' '}
                            {new Date(s.dataFim!).toLocaleString('pt-BR')}
                          </Text>
                        </View>
                        <Text style={styles.exportBtn}>ver →</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}

        {tab === 'resgates' && (
          <>
            <Text style={styles.sectionTitle}>RESGATES ({resgates.length})</Text>
            {resgates.length === 0 && (
              <Text style={styles.emptyText}>Nenhum prêmio resgatado ainda.</Text>
            )}
            {resgates.slice().reverse().map(r => (
              <View key={r.id} style={styles.rankRow}>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankName}>{r.premioNome}</Text>
                  <Text style={styles.rankSub}>{r.pontuacao} pts · {new Date(r.data).toLocaleString('pt-BR')}</Text>
                </View>
                <View style={[styles.statusBadge, r.status === 'resgatado' && styles.statusDone]}>
                  <Text style={styles.statusText}>{r.status.toUpperCase()}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {tab === 'premios' && (
          <>
            {/* cabeçalho com botão + */}
            <View style={[styles.premiosHeader, narrow && styles.premiosHeaderStack]}>
              <Text style={[styles.sectionTitle, styles.sectionTitleInline]}>FAIXAS DE PRÊMIOS</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => {
                  const novo = {
                    id: Date.now().toString(),
                    nome: 'Novo Prêmio',
                    descricao: 'Descrição do prêmio',
                    faixaMin: 0,
                    faixaMax: 9999,
                    estoque: 10,
                  }
                  setPremios([...premios, novo])
                }}
              >
                <Text style={styles.addBtnText}>＋ ADICIONAR</Text>
              </TouchableOpacity>
            </View>

            {premios.map((pr, i) => (
              <View key={pr.id} style={styles.premioRow}>
                {/* header do card: número + botão excluir */}
                <View style={[styles.premioCardHeader, narrow && styles.premioCardHeaderStack]}>
                  <Text style={styles.premioCardNum}>PRÊMIO {i + 1}</Text>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => {
                      const doDelete = () => setPremios(prev => prev.filter((_, idx) => idx !== i))
                      if (Platform.OS === 'web') {
                        // Alert.alert não suporta callbacks no web — usa confirm nativo do browser
                        if ((window as any).confirm(`Remover "${pr.nome}"?`)) doDelete()
                      } else {
                        Alert.alert('Excluir prêmio', `Remover "${pr.nome}"?`, [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Excluir', style: 'destructive', onPress: doDelete },
                        ])
                      }
                    }}
                  >
                    <Text style={styles.deleteBtnText}>✕ EXCLUIR</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.premioInputRow}>
                  <Text style={styles.premioLabel}>NOME</Text>
                  <TextInput
                    style={styles.premioInput}
                    value={pr.nome}
                    onChangeText={v => {
                      const next = [...premios]; next[i] = { ...next[i], nome: v }; setPremios(next)
                    }}
                    placeholderTextColor={C.textDim}
                  />
                </View>
                <View style={styles.premioInputRow}>
                  <Text style={styles.premioLabel}>DESCRIÇÃO</Text>
                  <TextInput
                    style={styles.premioInput}
                    value={pr.descricao}
                    onChangeText={v => {
                      const next = [...premios]; next[i] = { ...next[i], descricao: v }; setPremios(next)
                    }}
                    placeholderTextColor={C.textDim}
                  />
                </View>
                <View style={[styles.premioRangeRow, narrow && styles.premioRangeRowStack]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.premioLabel}>MIN PTS</Text>
                    <TextInput
                      style={styles.premioInputSmall}
                      value={String(pr.faixaMin)}
                      keyboardType="numeric"
                      onChangeText={v => {
                        const next = [...premios]; next[i] = { ...next[i], faixaMin: parseInt(v) || 0 }; setPremios(next)
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.premioLabel}>MAX PTS</Text>
                    <TextInput
                      style={styles.premioInputSmall}
                      value={String(pr.faixaMax)}
                      keyboardType="numeric"
                      onChangeText={v => {
                        const next = [...premios]; next[i] = { ...next[i], faixaMax: parseInt(v) || 9999 }; setPremios(next)
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.premioLabel}>ESTOQUE</Text>
                    <TextInput
                      style={styles.premioInputSmall}
                      value={String(pr.estoque)}
                      keyboardType="numeric"
                      onChangeText={v => {
                        const next = [...premios]; next[i] = { ...next[i], estoque: parseInt(v) || 0 }; setPremios(next)
                      }}
                    />
                  </View>
                </View>
              </View>
            ))}

            {premios.length === 0 && (
              <Text style={styles.emptyText}>Nenhum prêmio cadastrado. Clique em + ADICIONAR.</Text>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSavePremios}>
              <Text style={styles.saveBtnText}>SALVAR PRÊMIOS</Text>
            </TouchableOpacity>
          </>
        )}

        {tab === 'dados' && (
          <>
            <Text style={styles.sectionTitle}>EXPORTAR JSON</Text>
            <Text style={styles.dadosNote}>Baixa o arquivo para visualizar ou editar fora do app.</Text>

            {[
              { label: '📋  cadastros.json',  onPress: handleExportCadastros },
              { label: '🎮  partidas.json',   onPress: handleExportPartidas  },
              { label: '🎁  resgates.json',   onPress: handleExportResgates  },
              { label: '🏆  premios.json',    onPress: handleExportPremios   },
              { label: '⚙️   config.json',    onPress: handleExportConfig    },
            ].map(item => (
              <TouchableOpacity key={item.label} style={styles.dadosBtn} onPress={item.onPress}>
                <Text style={styles.dadosBtnText}>{item.label}</Text>
                <Text style={styles.dadosBtnIcon}>↓</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.cfgDivider} />
            <Text style={styles.sectionTitle}>IMPORTAR JSON</Text>
            <Text style={styles.dadosNote}>Seleciona um arquivo .json para restaurar os dados. Os registros existentes são mantidos.</Text>

            {[
              { label: '📋  cadastros.json',  onPress: handleImportCadastros },
              { label: '🎮  partidas.json',   onPress: handleImportPartidas  },
              { label: '🎁  resgates.json',   onPress: handleImportResgates  },
              { label: '🏆  premios.json',    onPress: handleImportPremios   },
            ].map(item => (
              <TouchableOpacity key={item.label} style={[styles.dadosBtn, styles.dadosBtnImport]} onPress={item.onPress}>
                <Text style={styles.dadosBtnText}>{item.label}</Text>
                <Text style={styles.dadosBtnIcon}>↑</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.cfgDivider} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleExport}>
              <Text style={styles.saveBtnText}>↓ EXPORTAR TUDO EM CSV</Text>
            </TouchableOpacity>
          </>
        )}

        {tab === 'config' && config && (
          <>
            <Text style={styles.sectionTitle}>CONFIGURAÇÕES DO JOGO</Text>

            <View style={styles.cfgRow}>
              <Text style={styles.cfgLabel}>Pontos por par encontrado</Text>
              <TextInput
                style={styles.cfgInput}
                value={String(config.pontosPorPar)}
                keyboardType="numeric"
                onChangeText={v => setConfig({ ...config, pontosPorPar: parseInt(v) || 100 })}
              />
            </View>
            <View style={styles.cfgRow}>
              <Text style={styles.cfgLabel}>Tempo máximo (segundos)</Text>
              <TextInput
                style={styles.cfgInput}
                value={String(config.tempoMaximo)}
                keyboardType="numeric"
                onChangeText={v => setConfig({ ...config, tempoMaximo: parseInt(v) || 120 })}
              />
            </View>
            <View style={styles.cfgRow}>
              <Text style={styles.cfgLabel}>Preview inicial das cartas (segundos)</Text>
              <TextInput
                style={styles.cfgInput}
                value={String(config.previewTime ?? 5)}
                keyboardType="numeric"
                onChangeText={v => setConfig({ ...config, previewTime: parseInt(v) || 5 })}
              />
            </View>
            <View style={styles.cfgRow}>
              <Text style={styles.cfgLabel}>Bônus máximo de tempo</Text>
              <TextInput
                style={styles.cfgInput}
                value={String(config.bonusTempo)}
                keyboardType="numeric"
                onChangeText={v => setConfig({ ...config, bonusTempo: parseInt(v) || 200 })}
              />
            </View>
            <View style={styles.cfgRow}>
              <Text style={styles.cfgLabel}>Tempo do pop-up informativo (segundos)</Text>
              <TextInput
                style={styles.cfgInput}
                value={String(config.tempoInformativo ?? 8)}
                keyboardType="numeric"
                onChangeText={v => setConfig({ ...config, tempoInformativo: parseInt(v) || 8 })}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveConfig}>
              <Text style={styles.saveBtnText}>SALVAR CONFIGURAÇÕES</Text>
            </TouchableOpacity>

            <View style={styles.cfgDivider} />
            <Text style={styles.cfgNote}>
              Score máximo possível: {config.pontosPorPar * 6 + config.bonusTempo} pts
              {'\n'}(6 pares × {config.pontosPorPar} + bônus tempo {config.bonusTempo})
            </Text>
          </>
        )}
      </ScrollView>
    </View>
    </RetroBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.6),
    borderBottomWidth: 4,
    borderBottomColor: R.pink,
    backgroundColor: R.navy,
    gap: wp(2),
  },
  topBarCompact: {
    paddingVertical: hp(1.2),
  },
  topTitle: { color: R.yellow, fontFamily: B.font, fontWeight: B.fontWeight, fontSize: fp(2.6), letterSpacing: 4, textTransform: 'uppercase', flexShrink: 0 },
  topTitleCompact: { fontSize: fp(2.2), letterSpacing: 2 },
  topClock: { color: R.cream, fontFamily: B.font, fontSize: fp(2.2), letterSpacing: 1, flex: 1, textAlign: 'center', textTransform: 'uppercase' },
  closeBtn: { color: R.pink, fontFamily: B.font, fontSize: fp(2), letterSpacing: 1, textTransform: 'uppercase', minHeight: 44, textAlignVertical: 'center' },

  tabsScroll: { flexGrow: 0, borderBottomWidth: 3, borderBottomColor: R.navy, backgroundColor: R.navyDeep },
  tabs: { flexDirection: 'row', minWidth: '100%' },
  tab: { flex: 1, minWidth: wp(22), paddingVertical: hp(1.4), paddingHorizontal: wp(2), alignItems: 'center', justifyContent: 'center' },
  tabNarrow: { minWidth: wp(28), paddingVertical: hp(1.6) },
  tabActive: { borderBottomWidth: 4, borderBottomColor: R.yellow },
  tabText: { color: R.cream, fontFamily: B.font, fontSize: fp(1.8), letterSpacing: 1, textTransform: 'uppercase', opacity: 0.65, textAlign: 'center' },
  tabTextNarrow: { fontSize: fp(1.6), letterSpacing: 0.5 },
  tabTextActive: { color: R.yellow, opacity: 1 },

  content: { flex: 1 },
  contentInner: { padding: wp(4), paddingBottom: hp(4) },
  contentInnerCompact: { padding: wp(3) },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(1.6), gap: wp(2) },
  sectionHeaderStack: { flexDirection: 'column', alignItems: 'flex-start' },
  sectionActions: { flexDirection: 'row', gap: 12, flexShrink: 0 },
  sectionActionsWrap: { flexWrap: 'wrap' },
  sectionTitle: { color: R.cream, fontFamily: B.font, fontWeight: B.fontWeight, fontSize: fp(2), letterSpacing: 2, textTransform: 'uppercase', marginBottom: hp(1.6) },
  sectionTitleInline: { marginBottom: 0, flex: 1 },
  exportBtn: { color: R.yellow, fontFamily: B.font, fontSize: fp(1.9), letterSpacing: 1, textTransform: 'uppercase', minHeight: 44, textAlignVertical: 'center' },

  emptyText: { color: R.cream, fontFamily: B.font, fontSize: fp(2), textAlign: 'center', marginTop: hp(3), letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.8 },
  rankRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: hp(1.2),
    borderBottomWidth: 2, borderBottomColor: R.navy,
    backgroundColor: R.cream, borderRadius: 10, marginBottom: 6, paddingHorizontal: wp(2.5),
  },
  rankPos: { color: R.navy, fontFamily: B.font, fontSize: fp(2.2), minWidth: wp(8), fontWeight: B.fontWeight },
  rankInfo: { flex: 1, minWidth: 0 },
  rankName: { color: R.navy, fontFamily: B.font, fontWeight: B.fontWeightMedium, fontSize: fp(2) },
  rankSub: { color: R.navy, fontFamily: B.font, fontSize: fp(1.6), marginTop: 2, opacity: 0.75 },
  rankScore: { color: R.pink, fontFamily: B.font, fontWeight: B.fontWeight, fontSize: fp(2.4), flexShrink: 0 },

  premiosHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: hp(1.6), gap: wp(2) },
  premiosHeaderStack: { flexDirection: 'column', alignItems: 'stretch' },
  addBtn: {
    backgroundColor: R.yellow, paddingHorizontal: wp(3), paddingVertical: hp(1),
    borderRadius: 10, borderWidth: 3, borderColor: R.navy, minHeight: 44, justifyContent: 'center',
  },
  addBtnText: { color: R.navy, fontFamily: B.font, fontWeight: B.fontWeight, fontSize: fp(2), letterSpacing: 1, textAlign: 'center' },

  premioRow: {
    borderWidth: 3, borderColor: R.navy, padding: wp(3.5), marginBottom: hp(1.6),
    backgroundColor: R.cream, borderRadius: 12,
  },
  premioCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: hp(1.2), paddingBottom: hp(1), borderBottomWidth: 2, borderBottomColor: R.navy, gap: wp(2),
  },
  premioCardHeaderStack: { flexDirection: 'column', alignItems: 'stretch' },
  premioCardNum: { color: R.pink, fontFamily: B.font, fontWeight: B.fontWeight, fontSize: fp(1.7), letterSpacing: 2 },
  deleteBtn: { borderWidth: 2, borderColor: R.coral, paddingHorizontal: wp(2.5), paddingVertical: hp(0.6), borderRadius: 8, minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  deleteBtnText: { color: R.coral, fontFamily: B.font, fontWeight: B.fontWeightMedium, fontSize: fp(1.7), letterSpacing: 1 },
  premioInputRow: { marginBottom: hp(1) },
  premioLabel: { color: R.navy, fontFamily: B.font, fontSize: fp(1.6), letterSpacing: 1, marginBottom: 4, fontWeight: B.fontWeightMedium },
  premioInput: {
    backgroundColor: R.cream, color: R.navy, fontFamily: B.font,
    fontSize: fp(2), padding: hp(1), borderWidth: 2, borderColor: R.navy, borderRadius: 8,
    letterSpacing: 0.5, textTransform: 'uppercase', minHeight: 44,
  },
  premioRangeRow: { flexDirection: 'row', gap: 8 },
  premioRangeRowStack: { flexDirection: 'column' },
  premioInputSmall: {
    backgroundColor: R.cream, color: R.navy, fontFamily: B.font,
    fontSize: fp(2), padding: hp(1), borderWidth: 2, borderColor: R.navy, borderRadius: 8,
    letterSpacing: 0.5, textTransform: 'uppercase', minHeight: 44,
  },

  saveBtn: {
    backgroundColor: R.yellow, padding: hp(1.8), alignItems: 'center', marginTop: hp(1),
    borderWidth: 3, borderColor: R.navy, borderRadius: 12, minHeight: 48, justifyContent: 'center',
  },
  saveBtnText: { color: R.navy, fontFamily: B.font, fontWeight: B.fontWeight, fontSize: fp(2.2), letterSpacing: 2 },

  cfgRow: { marginBottom: hp(2) },
  cfgLabel: { color: R.cream, fontFamily: B.font, fontSize: fp(1.7), letterSpacing: 1, marginBottom: hp(0.6) },
  cfgInput: {
    backgroundColor: R.cream, color: R.navy, fontFamily: B.font,
    fontSize: fp(2.4), padding: hp(1.2), borderWidth: 2, borderColor: R.navy, borderRadius: 8,
    letterSpacing: 0.5, textTransform: 'uppercase', minHeight: 44,
  },
  cfgDivider: { height: 2, backgroundColor: R.pink, marginVertical: hp(2), opacity: 0.5 },
  cfgNote: { color: R.cream, fontFamily: B.font, fontSize: fp(2.2), lineHeight: fp(3) },

  statusBadge: { borderWidth: 2, borderColor: R.yellow, paddingHorizontal: wp(2), paddingVertical: hp(0.5), borderRadius: 8, flexShrink: 0 },
  statusDone: { borderColor: R.green },
  statusText: { color: R.yellow, fontFamily: B.font, fontSize: fp(1.4), letterSpacing: 1 },

  sessaoRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: hp(1.2),
    borderBottomWidth: 2, borderBottomColor: R.navy, backgroundColor: R.cream,
    borderRadius: 10, marginBottom: 6, paddingHorizontal: wp(2.5), gap: wp(2),
  },
  sessaoNome: { color: R.pink, fontFamily: B.font, fontWeight: B.fontWeight, fontSize: fp(1.9), letterSpacing: 1, flex: 1, textAlign: 'right' },

  dadosNote: { color: R.cream, fontFamily: B.font, fontSize: fp(1.7), marginBottom: hp(1.4), lineHeight: fp(2.6), letterSpacing: 0.5, textTransform: 'uppercase' },
  dadosBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 3, borderColor: R.yellow, backgroundColor: R.navyDeep,
    paddingVertical: hp(1.4), paddingHorizontal: wp(3.5), marginBottom: hp(0.8), borderRadius: 12, minHeight: 48,
  },
  dadosBtnImport: { borderColor: R.pink },
  dadosBtnText: { color: R.cream, fontFamily: B.font, fontSize: fp(2), flex: 1 },
  dadosBtnIcon: { color: R.yellow, fontFamily: B.font, fontWeight: B.fontWeight, fontSize: fp(2.6) },
})
