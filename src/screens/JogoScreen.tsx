import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image, ImageBackground } from 'react-native'
import { C, R } from '../theme'
import { B } from '../brand'
import { hp, fp, wp } from '../scale'
import MemoryCard, { CardData } from '../components/MemoryCard'
import { Cadastro, Partida, Configuracao } from '../types'
import { getConfig, savePartida, getSessaoAtiva } from '../db/storage'
import { BG_JOGO, CARD_ASSETS } from '../gameAssets'
import { serifSub, retroButtonText } from '../retro/styles'
import { useViewport } from '../hooks/useViewport'

// Cada entrada gera 2 cartas: card1 e card2 têm imagens diferentes mas mesmo pairId
const PAIR_DATA = [
  { pairId: 1, ...CARD_ASSETS.batataFrita   },
  { pairId: 2, ...CARD_ASSETS.lasanha        },
  { pairId: 3, ...CARD_ASSETS.massasFrescas  },
  { pairId: 4, ...CARD_ASSETS.paixaoArdente  },
  { pairId: 5, ...CARD_ASSETS.tempura        },
  { pairId: 6, ...CARD_ASSETS.vanderale      },
]

function buildCards(): CardData[] {
  const doubled = PAIR_DATA.flatMap(p => [
    { id: 0, pairId: p.pairId, label: p.label, image: p.card1, popup: p.popup },
    { id: 0, pairId: p.pairId, label: p.label, image: p.card2, popup: p.popup },
  ])
  for (let i = doubled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [doubled[i], doubled[j]] = [doubled[j], doubled[i]]
  }
  return doubled.map((c, i) => ({ ...c, id: i }))
}

type Phase = 'preview' | 'playing'

type Props = {
  cadastro: Cadastro
  onFinish: (partida: Partida) => void
}

export default function JogoScreen({ cadastro, onFinish }: Props) {
  const [cards]   = useState<CardData[]>(() => buildCards())
  const [flipped, setFlipped]   = useState<number[]>([])
  const [matched, setMatched]   = useState<number[]>([])
  const [config,  setConfig]    = useState<Configuracao | null>(null)
  const [timeLeft, setTimeLeft] = useState(120)
  const [locked,  setLocked]    = useState(false)

  // ── Preview ──────────────────────────────────────────────────────
  const [phase, setPhase]               = useState<Phase>('preview')
  const [previewCount, setPreviewCount] = useState(5)

  // ── Score / streak ───────────────────────────────────────────────
  const scoreRef   = useRef(0)
  const streakRef  = useRef(0)          // acertos consecutivos
  const [scoreDisplay, setScoreDisplay] = useState(0)
  const [streakDisplay, setStreakDisplay] = useState(0)

  const matchedRef  = useRef<number[]>([])
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const configRef   = useRef<Configuracao | null>(null)
  const timeLeftRef = useRef(120)
  const finishedRef = useRef(false)

  const scoreAnim  = useRef(new Animated.Value(1)).current
  const streakAnim = useRef(new Animated.Value(1)).current

  // ── Carregar config ──────────────────────────────────────────────
  useEffect(() => {
    getConfig().then(cfg => {
      setConfig(cfg)
      configRef.current = cfg
      setTimeLeft(cfg.tempoMaximo)
      timeLeftRef.current = cfg.tempoMaximo
      setPreviewCount(cfg.previewTime)
    })
  }, [])

  // ── Fase de preview: mostrar cartas por N segundos ───────────────
  useEffect(() => {
    if (!config || phase !== 'preview') return
    const total = config.previewTime
    setPreviewCount(total)

    const iv = setInterval(() => {
      setPreviewCount(prev => {
        if (prev <= 1) {
          clearInterval(iv)
          setPhase('playing')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [config, phase])

  // ── Timer principal: só corre na fase de jogo ────────────────────
  const finish = useCallback((finalScore: number, pairs: number, elapsed: number) => {
    if (finishedRef.current) return
    finishedRef.current = true
    clearInterval(timerRef.current!)
    getSessaoAtiva().then(sessao => {
      const partidaLocal: Partida = {
        id: Date.now().toString(),
        cadastroId: cadastro.id,
        sessaoId: sessao.id,
        pontuacao: finalScore,
        pares: pairs,
        tempo: elapsed,
        data: new Date().toISOString(),
      }
      // savePartida agora retorna a partida com o id REAL do banco — é esse
      // id que precisa seguir para a tela de premiação (resgates referenciam
      // partidas por id, e o id local Date.now() não existe no banco).
      savePartida(partidaLocal).then(salva => onFinish(salva))
    })
  }, [cadastro, onFinish])

  useEffect(() => {
    if (phase !== 'playing' || !config) return
    timerRef.current = setInterval(() => {
      if (isPausedRef.current) return   // congelado durante pop-up
      timeLeftRef.current -= 1
      setTimeLeft(timeLeftRef.current)
      if (timeLeftRef.current <= 0) {
        finish(scoreRef.current, matchedRef.current.length / 2, configRef.current?.tempoMaximo ?? 120)
      }
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase, config])

  // ── Pop-up de par acertado ───────────────────────────────────────
  const [popupImage, setPopupImage] = useState<any>(null)
  const popupOpacity   = useRef(new Animated.Value(0)).current
  const popupOpenRef   = useRef(false)
  const isPausedRef    = useRef(false)
  const popupTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  // função a executar após fechar o último pop-up (ex: finish ao completar todos os pares)
  const pendingFinishRef = useRef<(() => void) | null>(null)

  const closePopup = useCallback(() => {
    if (popupTimerRef.current) { clearTimeout(popupTimerRef.current); popupTimerRef.current = null }
    Animated.timing(popupOpacity, { toValue: 0, duration: 300, useNativeDriver: false }).start(() => {
      setPopupImage(null)
      popupOpenRef.current = false
      isPausedRef.current  = false
      if (pendingFinishRef.current) {
        const fn = pendingFinishRef.current
        pendingFinishRef.current = null
        fn()
      }
    })
  }, [])

  const showPopup = (img: any) => {
    if (popupTimerRef.current) { clearTimeout(popupTimerRef.current); popupTimerRef.current = null }
    setPopupImage(img)
    popupOpenRef.current = true
    isPausedRef.current  = true
    popupOpacity.setValue(0)
    Animated.timing(popupOpacity, { toValue: 1, duration: 200, useNativeDriver: false }).start()
    const tempo = (configRef.current?.tempoInformativo ?? 8) * 1000
    popupTimerRef.current = setTimeout(closePopup, tempo)
  }

  // ── Overlay de COMBO ─────────────────────────────────────────────
  const [comboVisible, setComboVisible] = useState(false)
  const [comboCount, setComboCount]     = useState(0)
  const [comboBonus, setComboBonus]     = useState(0)
  const comboScale   = useRef(new Animated.Value(0)).current
  const comboOpacity = useRef(new Animated.Value(0)).current
  const comboShake   = useRef(new Animated.Value(0)).current

  const showCombo = (streak: number, bonus: number) => {
    setComboCount(streak)
    setComboBonus(bonus)
    setComboVisible(true)
    comboScale.setValue(0)
    comboOpacity.setValue(0)
    comboShake.setValue(0)

    Animated.sequence([
      // entrada: escala + fade in
      Animated.parallel([
        Animated.spring(comboScale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: false }),
        Animated.timing(comboOpacity, { toValue: 1, duration: 150, useNativeDriver: false }),
      ]),
      // shake lateral
      Animated.sequence([
        Animated.timing(comboShake, { toValue: 12,  duration: 60,  useNativeDriver: false }),
        Animated.timing(comboShake, { toValue: -12, duration: 60,  useNativeDriver: false }),
        Animated.timing(comboShake, { toValue: 8,   duration: 50,  useNativeDriver: false }),
        Animated.timing(comboShake, { toValue: -8,  duration: 50,  useNativeDriver: false }),
        Animated.timing(comboShake, { toValue: 0,   duration: 40,  useNativeDriver: false }),
      ]),
      // pausa visível
      Animated.delay(500),
      // saída: fade out
      Animated.timing(comboOpacity, { toValue: 0, duration: 250, useNativeDriver: false }),
    ]).start(() => setComboVisible(false))
  }

  // ── Animações do header ───────────────────────────────────────────
  const popAnim = (anim: Animated.Value) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1.5, duration: 120, useNativeDriver: false }),
      Animated.timing(anim, { toValue: 1,   duration: 180, useNativeDriver: false }),
    ]).start()
  }

  // ── Lógica de clique nas cartas ──────────────────────────────────
  const handleCardPress = (cardId: number) => {
    if (phase !== 'playing' || locked || finishedRef.current || popupOpenRef.current) return
    if (flipped.includes(cardId) || matchedRef.current.includes(cardId)) return
    if (flipped.length >= 2) return

    const newFlipped = [...flipped, cardId]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setLocked(true)
      const cardA = cards[newFlipped[0]]
      const cardB = cards[newFlipped[1]]

      if (cardA.pairId === cardB.pairId) {
        // ✅ Acerto — base + bônus flat de +50 por streak acumulado
        const basePts  = configRef.current?.pontosPorPar ?? 100
        const bonus    = streakRef.current * 50            // +50 por cada acerto consecutivo anterior
        const pts      = basePts + bonus

        streakRef.current++
        setStreakDisplay(streakRef.current)
        popAnim(streakAnim)

        // mostra overlay só a partir do 2º acerto consecutivo
        if (streakRef.current > 1) showCombo(streakRef.current, bonus)

        scoreRef.current += pts
        setScoreDisplay(scoreRef.current)
        popAnim(scoreAnim)

        const newMatched = [...matchedRef.current, newFlipped[0], newFlipped[1]]
        matchedRef.current = newMatched
        setMatched(newMatched)
        setFlipped([])
        setLocked(false)

        // mostra pop-up da carta acertada
        showPopup(cardA.popup)

        if (newMatched.length === cards.length) {
          const cfg = configRef.current
          const timeBonus = cfg ? Math.round((timeLeftRef.current / cfg.tempoMaximo) * cfg.bonusTempo) : 0
          scoreRef.current += timeBonus
          setScoreDisplay(scoreRef.current)
          const elapsed = cfg ? cfg.tempoMaximo - timeLeftRef.current : 0
          const finalScore = scoreRef.current
          const finalPairs = newMatched.length / 2
          // aguarda o pop-up fechar antes de finalizar
          pendingFinishRef.current = () => finish(finalScore, finalPairs, elapsed)
        }
      } else {
        // ❌ Erro — zera streak
        streakRef.current = 0
        setStreakDisplay(0)
        setTimeout(() => { setFlipped([]); setLocked(false) }, 900)
      }
    }
  }

  // ── Layout ───────────────────────────────────────────────────────
  const { width: sw, height: sh } = useViewport()
  // Em telas estreitas (celulares) usamos 3 colunas para cartas maiores.
  // Em telas mais largas (tablets, desktop) mantemos 4 colunas originais.
  const COLS       = sw < 600 ? 3 : 4
  const ROWS       = sw < 600 ? 4 : 3
  const CARD_MARGIN = sw < 600 ? 6 : 4
  const GRID_PAD   = 8
  // Reduz header/footer em telas pequenas para dar mais espaço às cartas
  const hScale     = sw < 600 ? 0.75 : 1
  const HEADER_H   = hp(11) * hScale
  const TITLE_H    = hp(11) * hScale
  const FOOTER_H   = hp(10) * hScale
  const availW     = sw - GRID_PAD * 2 - CARD_MARGIN * 2 * COLS
  const availH     = sh - HEADER_H - TITLE_H - FOOTER_H - GRID_PAD * 2 - CARD_MARGIN * 2 * ROWS
  const cardW      = Math.min(availW / COLS, (availH / ROWS) * 0.72)
  const cardH      = cardW / 0.72

  const rows: (typeof cards)[] = []
  for (let i = 0; i < cards.length; i += COLS) rows.push(cards.slice(i, i + COLS))

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')

  const comboLabel = streakDisplay > 1 ? `×${streakDisplay}` : streakDisplay === 1 ? '×1' : '—'

  // Na preview, todas as cartas ficam "flipped" (mostrando a frente)
  const allIds = cards.map(c => c.id)

  return (
    <ImageBackground source={BG_JOGO} style={styles.container} resizeMode="cover">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <View style={styles.miniLogoBox}>
            {B.logoLines.map((line, i) => (
              <Text key={i} style={styles.miniLogoLine}>{line}</Text>
            ))}
          </View>
        </View>

        <View style={styles.headerDivV} />

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>PONTOS</Text>
            <Animated.Text style={[styles.statValue, { transform: [{ scale: scoreAnim }] }]}>
              {scoreDisplay}
            </Animated.Text>
          </View>

          <View style={styles.statSep}>
            <Text style={styles.headerBolt}>⚡</Text>
          </View>

          <View style={styles.statCol}>
            <Text style={styles.statLabel}>COMBO</Text>
            <Animated.Text style={[styles.statValue, { transform: [{ scale: streakAnim }] }]}>
              {comboLabel}
            </Animated.Text>
          </View>

          <View style={styles.statSep}>
            <Text style={styles.headerBolt}>⚡</Text>
          </View>

          <View style={styles.statCol}>
            <Text style={styles.statLabel}>PARES</Text>
            <Text style={styles.statValue}>{matched.length}/{cards.length}</Text>
          </View>

          <View style={styles.statCol}>
            <Text style={styles.statLabel}>TEMPO</Text>
            <Text style={styles.statValue}>{mm}:{ss}</Text>
          </View>
        </View>
      </View>

      {/* ── TÍTULO ─────────────────────────────────────────────────── */}
      <View style={styles.titleSection}>
        {phase === 'preview' ? (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.titleBolt}>👀</Text>
              <Text style={[styles.titleText, { color: C.warning }]}>MEMORIZE AS CARTAS!</Text>
              <Text style={styles.titleBolt}>👀</Text>
            </View>
            <View style={styles.previewCountRow}>
              <Text style={styles.previewCountText}>{previewCount}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.titleBolt}>⚡</Text>
              <Text style={styles.titleText}>ENCONTRE OS PARES!</Text>
              <Text style={styles.titleBolt}>⚡</Text>
            </View>
            <Text style={styles.titleSub}>DIAS DA SEMANA  •  PRATOS DO DIA  •  E UMA CARTA ESPECIAL</Text>
          </>
        )}
      </View>

      {/* ── GRID (cartas intactas — só moldura retro) ──────────────── */}
      <View style={styles.gridFrame}>
        <View style={styles.grid}>
        {rows.map((row, ri) => (
          <View key={ri} style={styles.gridRow}>
            {row.map(card => (
              <MemoryCard
                key={card.id}
                card={card}
                cardWidth={cardW}
                cardHeight={cardH}
                // Preview: todos abertos; jogo: só os que foram clicados/acertados
                isFlipped={phase === 'preview' ? true : flipped.includes(card.id)}
                isMatched={matched.includes(card.id)}
                onPress={() => handleCardPress(card.id)}
              />
            ))}
          </View>
        ))}
        </View>
      </View>

      {/* ── POP-UP DE PAR ACERTADO ─────────────────────────────────── */}
      {popupImage && (
        <Animated.View style={[styles.popupOverlay, { opacity: popupOpacity }]}>
          <TouchableOpacity style={styles.popupTouchable} onPress={closePopup} activeOpacity={0.95}>
            <Image source={popupImage} style={styles.popupImage} resizeMode="contain" />
            <View style={styles.popupHint}>
              <Text style={styles.popupHintText}>TOQUE PARA CONTINUAR</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── OVERLAY COMBO ──────────────────────────────────────────── */}
      {comboVisible && (
        <Animated.View
          pointerEvents="none"
          style={[styles.comboOverlay, {
            opacity: comboOpacity,
            transform: [{ scale: comboScale }, { translateX: comboShake }],
          }]}
        >
          <Text style={styles.comboFire}>🔥</Text>
          <Text style={styles.comboTitle}>COMBO!</Text>
          <Text style={styles.comboCount}>×{comboCount}</Text>
          <Text style={styles.comboBonus}>+{comboBonus} PTS BÔNUS</Text>
          <Text style={styles.comboFire}>🔥</Text>
        </Animated.View>
      )}

      {/* ── RODAPÉ ─────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        {phase === 'preview' ? (
          <Text style={styles.footerPreviewText}>
            As cartas vão virar em <Text style={styles.footerPreviewHighlight}>{previewCount}s</Text>… prepare-se!
          </Text>
        ) : (
          <>
            <View style={styles.footerRow}>
              <Text style={styles.dicaLabel}>DICA</Text>
              <Text style={styles.footerBolt}>⚡</Text>
              {streakDisplay > 1 && (
                <Text style={styles.comboMsg}>🔥 COMBO ×{streakDisplay}!</Text>
              )}
            </View>
            <Text style={styles.footerText}>
              ACERTE OS PARES PARA REVELAR INFORMAÇÕES{'\n'}SOBRE NOSSOS PRATOS E O VANDERALE!
            </Text>
          </>
        )}
        <Text style={styles.hopIcon}>🌿</Text>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: R.dark },

  header: {
    height: hp(11),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: fp(2),
    paddingVertical: fp(0.5),
  },
  logoWrap: {
    paddingRight: fp(0.5),
  },
  miniLogoBox: {
    borderWidth: 3,
    borderColor: R.pink,
    backgroundColor: R.yellow,
    paddingHorizontal: fp(1.2),
    paddingVertical: fp(0.5),
    alignItems: 'center',
  },
  miniLogoLine: {
    fontFamily: B.font,
    fontWeight: B.fontWeight,
    fontSize: fp(2.4),
    color: R.cream,
    letterSpacing: 1,
    lineHeight: fp(3.1),
    textTransform: 'uppercase',
  },
  headerDivV: {
    width: 3,
    height: hp(7),
    backgroundColor: R.yellow,
    marginHorizontal: fp(1.5),
    opacity: 0.9,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statSep: {
    width: fp(2.6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: R.cream,
    fontFamily: B.font,
    fontSize: fp(2.4),
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  statValue: {
    color: R.yellow,
    fontFamily: B.font,
    fontSize: fp(4.2),
    marginTop: fp(0.2),
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  headerBolt: {
    color: R.pink,
    fontSize: fp(3.2),
    lineHeight: fp(3.6),
  },

  titleSection: {
    height: hp(11),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: fp(2),
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: fp(1) },
  titleBolt: { color: R.yellow, fontSize: fp(3.6) },
  titleText: {
    fontFamily: B.font, fontSize: fp(4.8),
    color: R.cream, letterSpacing: 2, textTransform: 'uppercase',
    textShadowColor: R.coral, textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0,
  },
  titleSub: { ...serifSub, fontSize: fp(2.4), letterSpacing: 0.5, marginTop: fp(0.6) },

  previewCountRow: { marginTop: fp(0.6) },
  previewCountText: {
    fontFamily: B.font, fontSize: fp(6),
    color: R.yellow, textTransform: 'uppercase',
    textShadowColor: R.coral, textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0,
  },

  gridFrame: {
    flex: 1,
    marginHorizontal: wp(2),
    marginVertical: hp(0.5),
    borderRadius: 16,
    backgroundColor: 'rgba(5,5,5,0.45)',
    padding: 6,
  },
  grid: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  gridRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 4 },

  footer: {
    height: hp(10),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: fp(3),
  },
  footerPreviewText: { ...serifSub, fontSize: fp(3), letterSpacing: 1 },
  footerPreviewHighlight: { fontFamily: B.font, fontSize: fp(3), color: R.yellow, letterSpacing: 1, textTransform: 'uppercase' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: fp(1) },
  dicaLabel: { ...retroButtonText, fontSize: fp(2.9), color: R.yellow, letterSpacing: 3 },
  footerBolt: { color: R.pink, fontSize: fp(3) },
  comboMsg: { fontFamily: B.font, fontSize: fp(3.4), color: R.yellow, letterSpacing: 1, textTransform: 'uppercase' },
  footerText: { ...serifSub, fontSize: fp(2.3), letterSpacing: 0.5, marginTop: fp(0.4) },
  hopIcon: { fontSize: fp(3.6), opacity: 0.8, marginTop: fp(0.3) },

  popupOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,5,5,0.82)',
    zIndex: 98,
  },
  popupTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupImage: { width: '70%', height: '80%' },
  popupHint: {
    marginTop: fp(2),
    borderWidth: 4,
    borderColor: R.navy,
    backgroundColor: R.cream,
    paddingHorizontal: fp(3),
    paddingVertical: fp(0.8),
    borderRadius: 12,
  },
  popupHintText: { ...retroButtonText, fontSize: fp(2.4) },

  comboOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,5,5,0.65)',
    zIndex: 99,
  },
  comboFire:  { fontSize: fp(12), lineHeight: fp(14) },
  comboTitle: {
    fontFamily: B.font, fontSize: fp(16),
    color: R.yellow, letterSpacing: 6, textTransform: 'uppercase',
    textShadowColor: R.coral, textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 0,
  },
  comboCount: {
    fontFamily: B.font, fontSize: fp(22),
    color: R.cream, letterSpacing: 4, textTransform: 'uppercase',
    textShadowColor: R.pink, textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0,
    lineHeight: fp(24),
  },
  comboBonus: {
    ...retroButtonText,
    fontSize: fp(6),
    letterSpacing: 3,
    marginTop: fp(1),
    backgroundColor: R.yellow,
    borderWidth: 3,
    borderColor: R.navy,
    paddingHorizontal: fp(3),
    paddingVertical: fp(1),
  },
})
