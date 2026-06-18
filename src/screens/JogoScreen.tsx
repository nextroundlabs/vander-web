import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native'
import { C, R } from '../theme'
import { B } from '../brand'
import MemoryCard, { CardData, CARD_ASPECT } from '../components/MemoryCard'
import { Cadastro, Partida, Configuracao } from '../types'
import { getConfig, savePartida, getSessaoAtiva } from '../db/storage'
import { BG_JOGO, CARD_ASSETS } from '../gameAssets'
import { serifSub, retroButtonText } from '../retro/styles'
import { isCompact, isNarrow } from '../responsive'
import { designRect } from '../designCanvas'
import { useScale } from '../hooks/useScale'
import { useCoverTransform } from '../hooks/useCoverTransform'
import CoverBackground from '../components/CoverBackground'

/** Regiões do HUD no canvas bg-jogo (1080×1920) */
const HUD_LEFT = 32
const HUD_TOP = 56
const HUD_W = 1016
const HUD_H = 152

const TITLE_LEFT = 40
const TITLE_TOP = 200
const TITLE_W = 1000
const TITLE_H = 164

const GRID_LEFT = 24
const GRID_TOP = 368
const GRID_W = 1032
const GRID_H = 1288

const FOOTER_LEFT = 48
const FOOTER_TOP = 1672
const FOOTER_W = 984
const FOOTER_H = 248

/** Pop-up ao acertar par — imagem centralizada (canvas 1080×1920) */
const POPUP_IMG_W = 960
const POPUP_IMG_H = 1280

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

    // Partida local usada como fallback se o banco falhar ou demorar demais
    const fallback: Partida = {
      id: Date.now().toString(),
      cadastroId: cadastro.id,
      sessaoId: '',
      pontuacao: finalScore,
      pares: pairs,
      tempo: elapsed,
      data: new Date().toISOString(),
    }

    // Timeout de segurança: se o Supabase demorar > 8s em rede ruim,
    // avança para a premiação com os dados locais para não travar o jogo.
    const safetyTimer = setTimeout(() => {
      console.error('[JogoScreen] timeout ao salvar — avançando com dados locais')
      onFinish(fallback)
    }, 8000)

    getSessaoAtiva()
      .then(sessao => savePartida({ ...fallback, sessaoId: sessao.id }))
      .then(salva => {
        clearTimeout(safetyTimer)
        onFinish(salva)
      })
      .catch(err => {
        clearTimeout(safetyTimer)
        console.error('[JogoScreen] erro ao salvar partida:', err)
        onFinish(fallback) // avança mesmo com erro — melhor do que travar
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

  // ── Layout (cover + designRect — alinhado ao bg 1080×1920) ───────
  const { scale, offsetX, offsetY, sw, sh } = useCoverTransform()
  const { fp } = useScale()
  const narrow = isNarrow(sw)
  const compact = isCompact(sw)

  const headerFrame = useMemo(
    () => ({ position: 'absolute' as const, ...designRect(HUD_LEFT, HUD_TOP, HUD_W, HUD_H, scale, offsetX, offsetY) }),
    [scale, offsetX, offsetY],
  )
  const titleFrame = useMemo(
    () => ({ position: 'absolute' as const, ...designRect(TITLE_LEFT, TITLE_TOP, TITLE_W, TITLE_H, scale, offsetX, offsetY) }),
    [scale, offsetX, offsetY],
  )
  const gridFrame = useMemo(
    () => ({ position: 'absolute' as const, ...designRect(GRID_LEFT, GRID_TOP, GRID_W, GRID_H, scale, offsetX, offsetY) }),
    [scale, offsetX, offsetY],
  )
  const footerFrame = useMemo(
    () => ({ position: 'absolute' as const, ...designRect(FOOTER_LEFT, FOOTER_TOP, FOOTER_W, FOOTER_H, scale, offsetX, offsetY) }),
    [scale, offsetX, offsetY],
  )

  const COLS = narrow ? 3 : 4
  const ROWS = narrow ? 4 : 3
  const cardGap = (narrow ? 4 : 5) * scale
  const gridPad = 4 * scale

  const gridInnerW = GRID_W * scale - gridPad * 2
  const gridInnerH = GRID_H * scale - gridPad * 2
  const maxCardW = (gridInnerW - cardGap * COLS) / COLS
  const maxCardH = (gridInnerH - cardGap * ROWS) / ROWS
  // Cartas devem caber nas células em largura E altura (aspect ratio fixo).
  const cardW = Math.min(maxCardW, maxCardH * CARD_ASPECT)
  const cardH = cardW / CARD_ASPECT

  const rows: (typeof cards)[] = []
  for (let i = 0; i < cards.length; i += COLS) rows.push(cards.slice(i, i + COLS))

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')

  const comboLabel = streakDisplay > 1 ? `×${streakDisplay}` : streakDisplay === 1 ? '×1' : '—'

  const fs = (designPx: number) => designPx * scale
  const statLabelSize = fs(compact ? 22 : narrow ? 24 : 29)
  const statValueSize = fs(compact ? 34 : narrow ? 38 : 48)
  const titleSize = fs(compact ? 38 : narrow ? 43 : 55)
  const titleSubSize = fs(26)
  const footerDicaSize = fs(compact ? 26 : 31)
  const footerTextSize = fs(compact ? 22 : 25)
  const logoLineSize = fs(narrow ? 19 : 26)
  const logoLineHeight = fs(narrow ? 24 : 33)
  const boltSize = fs(narrow ? 26 : 33)

  const popupImgW = POPUP_IMG_W * scale
  const popupImgH = Math.min(POPUP_IMG_H * scale, sh * 0.68)

  return (
    <CoverBackground source={BG_JOGO}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={[styles.header, headerFrame]}>
        {!narrow && (
          <>
            <View style={styles.logoWrap}>
              <View style={[styles.miniLogoBox, { paddingHorizontal: fs(10), paddingVertical: fs(4), borderWidth: 2 * scale }]}>
                {B.logoLines.map((line, i) => (
                  <Text
                    key={i}
                    style={[styles.miniLogoLine, { fontSize: logoLineSize, lineHeight: logoLineHeight }]}
                  >
                    {line}
                  </Text>
                ))}
              </View>
            </View>
            <View style={[styles.headerDivV, { width: 2 * scale, height: HUD_H * scale * 0.65, marginHorizontal: fs(8) }]} />
          </>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>PONTOS</Text>
            <Animated.Text style={[styles.statValue, { fontSize: statValueSize }, { transform: [{ scale: scoreAnim }] }]}>
              {scoreDisplay}
            </Animated.Text>
          </View>

          {!narrow && (
            <View style={styles.statSep}>
              <Text style={[styles.headerBolt, { fontSize: boltSize }]}>⚡</Text>
            </View>
          )}

          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>COMBO</Text>
            <Animated.Text style={[styles.statValue, { fontSize: statValueSize }, { transform: [{ scale: streakAnim }] }]}>
              {comboLabel}
            </Animated.Text>
          </View>

          {!narrow && (
            <View style={styles.statSep}>
              <Text style={[styles.headerBolt, { fontSize: boltSize }]}>⚡</Text>
            </View>
          )}

          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>PARES</Text>
            <Text style={[styles.statValue, { fontSize: statValueSize }]}>{matched.length}/{cards.length}</Text>
          </View>

          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>TEMPO</Text>
            <Text style={[styles.statValue, { fontSize: statValueSize }]}>{mm}:{ss}</Text>
          </View>
        </View>
      </View>

      {/* ── TÍTULO ─────────────────────────────────────────────────── */}
      <View style={[styles.titleSection, titleFrame]}>
        {phase === 'preview' ? (
          <>
            <View style={styles.titleRow}>
              <Text style={[styles.titleBolt, { fontSize: boltSize }]}>👀</Text>
              <Text style={[styles.titleText, { fontSize: titleSize, color: C.warning }]}>MEMORIZE AS CARTAS!</Text>
              <Text style={[styles.titleBolt, { fontSize: boltSize }]}>👀</Text>
            </View>
            <View style={styles.previewCountRow}>
              <Text style={[styles.previewCountText, { fontSize: fs(68) }]}>{previewCount}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.titleRow}>
              <Text style={[styles.titleBolt, { fontSize: boltSize }]}>⚡</Text>
              <Text style={[styles.titleText, { fontSize: titleSize }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                ENCONTRE OS PARES!
              </Text>
              <Text style={[styles.titleBolt, { fontSize: boltSize }]}>⚡</Text>
            </View>
            {!narrow && (
              <Text style={[styles.titleSub, { fontSize: titleSubSize, marginTop: fs(6) }]} numberOfLines={2}>
                DIAS DA SEMANA  •  PRATOS DO DIA  •  E UMA CARTA ESPECIAL
              </Text>
            )}
          </>
        )}
      </View>

      {/* ── GRID ───────────────────────────────────────────────────── */}
      <View style={[styles.gridFrame, gridFrame, { borderRadius: 14 * scale, padding: gridPad }]}>
        <View style={styles.grid}>
          {rows.map((row, ri) => (
            <View key={ri} style={styles.gridRow}>
              {row.map(card => (
                <MemoryCard
                  key={card.id}
                  card={card}
                  cardWidth={cardW}
                  cardHeight={cardH}
                  gap={cardGap}
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
            <View style={styles.popupContent}>
              <Image
                source={popupImage}
                style={{ width: popupImgW, height: popupImgH }}
                resizeMode="contain"
              />
              <View style={[styles.popupHint, { marginTop: fs(16), borderWidth: 4 * scale, paddingHorizontal: fp(3.5), paddingVertical: fp(1), borderRadius: 12 * scale }]}>
                <Text style={[styles.popupHintText, { fontSize: fs(26) }]}>TOQUE PARA CONTINUAR</Text>
              </View>
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
          <Text style={[styles.comboFire, { fontSize: fs(115), lineHeight: fs(132) }]}>🔥</Text>
          <Text style={[styles.comboTitle, { fontSize: fs(154) }]}>COMBO!</Text>
          <Text style={[styles.comboCount, { fontSize: fs(211), lineHeight: fs(228) }]}>×{comboCount}</Text>
          <Text style={[styles.comboBonus, { fontSize: fs(58), marginTop: fs(8), paddingHorizontal: fs(20), paddingVertical: fs(6), borderWidth: 3 * scale }]}>
            +{comboBonus} PTS BÔNUS
          </Text>
          <Text style={[styles.comboFire, { fontSize: fs(115), lineHeight: fs(132) }]}>🔥</Text>
        </Animated.View>
      )}

      {/* ── RODAPÉ ─────────────────────────────────────────────────── */}
      <View style={[styles.footer, footerFrame]}>
        {phase === 'preview' ? (
          <Text style={[styles.footerPreviewText, { fontSize: fs(31) }]}>
            As cartas vão virar em <Text style={[styles.footerPreviewHighlight, { fontSize: fs(31) }]}>{previewCount}s</Text>… prepare-se!
          </Text>
        ) : (
          <>
            <View style={styles.footerRow}>
              <Text style={[styles.dicaLabel, { fontSize: footerDicaSize }]}>DICA</Text>
              <Text style={[styles.footerBolt, { fontSize: fs(29) }]}>⚡</Text>
              {streakDisplay > 1 && (
                <Text style={[styles.comboMsg, { fontSize: fs(34) }]}>🔥 COMBO ×{streakDisplay}!</Text>
              )}
            </View>
            <Text style={[styles.footerText, { fontSize: footerTextSize, marginTop: fs(4), lineHeight: footerTextSize * 1.35 }]}>
              {narrow
                ? 'ACERTE OS PARES PARA REVELAR INFORMAÇÕES SOBRE NOSSOS PRATOS!'
                : 'ACERTE OS PARES PARA REVELAR INFORMAÇÕES\nSOBRE NOSSOS PRATOS E O VANDERALE!'}
            </Text>
          </>
        )}
        <Text style={[styles.hopIcon, { fontSize: fs(34), marginTop: fs(4) }]}>🌿</Text>
      </View>
    </CoverBackground>
  )
}

const styles = StyleSheet.create({

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoWrap: {
    flexShrink: 0,
  },
  miniLogoBox: {
    borderColor: R.pink,
    backgroundColor: R.yellow,
    alignItems: 'center',
  },
  miniLogoLine: {
    fontFamily: B.font,
    fontWeight: B.fontWeight,
    color: R.cream,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerDivV: {
    backgroundColor: R.yellow,
    opacity: 0.9,
    flexShrink: 0,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  statSep: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 20,
  },
  statLabel: {
    color: R.cream,
    fontFamily: B.font,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  statValue: {
    color: R.yellow,
    fontFamily: B.font,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  headerBolt: {
    color: R.pink,
  },

  titleSection: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  titleBolt: { color: R.yellow, flexShrink: 0 },
  titleText: {
    flex: 1,
    fontFamily: B.font,
    color: R.cream,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textShadowColor: R.coral,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    textAlign: 'center',
  },
  titleSub: { ...serifSub, letterSpacing: 0.5, textAlign: 'center', paddingHorizontal: 8 },

  previewCountRow: {},
  previewCountText: {
    fontFamily: B.font,
    color: R.yellow,
    textTransform: 'uppercase',
    textShadowColor: R.coral,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    textAlign: 'center',
  },

  gridFrame: {
    backgroundColor: 'rgba(5,5,5,0.45)',
    overflow: 'hidden',
  },
  grid: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridRow: { flexDirection: 'row', justifyContent: 'center' },

  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  footerPreviewText: { ...serifSub, letterSpacing: 1, textAlign: 'center' },
  footerPreviewHighlight: { fontFamily: B.font, color: R.yellow, letterSpacing: 1, textTransform: 'uppercase' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dicaLabel: { ...retroButtonText, color: R.yellow, letterSpacing: 2 },
  footerBolt: { color: R.pink },
  comboMsg: { fontFamily: B.font, color: R.yellow, letterSpacing: 1, textTransform: 'uppercase' },
  footerText: { ...serifSub, letterSpacing: 0.5, textAlign: 'center', paddingHorizontal: 8 },
  hopIcon: { opacity: 0.8 },

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
  popupContent: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '96%',
  },
  popupHint: {
    borderColor: R.navy,
    backgroundColor: R.cream,
  },
  popupHintText: { ...retroButtonText },

  comboOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,5,5,0.65)',
    zIndex: 99,
  },
  comboFire: {},
  comboTitle: {
    fontFamily: B.font,
    color: R.yellow,
    letterSpacing: 6,
    textTransform: 'uppercase',
    textShadowColor: R.coral,
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
  },
  comboCount: {
    fontFamily: B.font,
    color: R.cream,
    letterSpacing: 4,
    textTransform: 'uppercase',
    textShadowColor: R.pink,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  comboBonus: {
    ...retroButtonText,
    letterSpacing: 3,
    backgroundColor: R.yellow,
    borderColor: R.navy,
  },
})
