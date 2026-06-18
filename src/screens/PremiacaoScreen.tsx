import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  ScrollView,
  Platform,
} from 'react-native'
import { R } from '../theme'
import { B } from '../brand'
import { wp, hp, fp } from '../scale'
import { Cadastro, Partida, Premio } from '../types'
import { getPosicaoNoRanking, resolverPremio } from '../db/storage'
import { BG_JOGO } from '../gameAssets'
import { RetroButton, RetroPanel, RetroDecor } from '../components/retro'
import { handLabel, serifSubDark } from '../retro/styles'
import { useViewport } from '../hooks/useViewport'
import { isCompact } from '../responsive'
import CoverBackground from '../components/CoverBackground'

type Props = { cadastro: Cadastro; partida: Partida; onPlayAgain: () => void; onHome: () => void }

function StatCard({ label, value, bg }: { label: string; value: string; bg: string }) {
  return (
    <View style={[s.statCard, { backgroundColor: bg }]}>
      <Text style={s.statCardLabel}>{label}</Text>
      <Text style={s.statCardValue}>{value}</Text>
    </View>
  )
}

function AchievementContent({
  loading,
  jaParticipou,
  premio,
  semEstoque,
}: {
  loading: boolean
  jaParticipou: boolean
  premio: Premio | null
  semEstoque: boolean
}) {
  if (loading) {
    return <Text style={s.loadingTxt}>Preparando o desafio...</Text>
  }

  return (
    <>
      <Text style={s.achievementIcon}>
        {jaParticipou ? '🏅' : premio ? '🎁' : semEstoque ? '😅' : '⭐'}
      </Text>

      <Text style={s.achievementTitle}>Parabéns!</Text>

      <Text style={[serifSubDark, s.achievementLead]}>
        Seu resultado foi registrado com sucesso.
      </Text>

      {jaParticipou ? (
        <View style={s.achievementExtra}>
          <Text style={s.achievementHighlight}>Prêmio já resgatado</Text>
          <Text style={[serifSubDark, s.achievementDetail]}>
            Você já recebeu seu prêmio anteriormente, mas sua pontuação foi atualizada no ranking.
          </Text>
        </View>
      ) : premio ? (
        <View style={s.achievementExtra}>
          <Text style={s.achievementHighlight}>{premio.nome}</Text>
          <Text style={[serifSubDark, s.achievementDetail]}>{premio.descricao}</Text>
          <Text style={[handLabel, s.handHint]}>Apresente esta tela ao atendente</Text>
        </View>
      ) : (
        <View style={s.achievementExtra}>
          <Text style={s.achievementHighlight}>
            {semEstoque ? 'Estoque esgotado!' : 'Boa tentativa!'}
          </Text>
          <Text style={[serifSubDark, s.achievementDetail]}>
            {semEstoque
              ? 'Todos os prêmios foram distribuídos.'
              : 'Continue jogando para ganhar!'}
          </Text>
        </View>
      )}
    </>
  )
}

export default function PremiacaoScreen({ cadastro, partida, onPlayAgain: _onPlayAgain, onHome }: Props) {
  const [premio, setPremio] = useState<Premio | null>(null)
  const [semEstoque, setSemEstoque] = useState(false)
  const [jaParticipou, setJaParticipou] = useState(false)
  const [ranking, setRanking] = useState(0)
  const [loading, setLoading] = useState(true)
  const { width } = useViewport()
  const compact = isCompact(width)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.92)).current

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const pos = await getPosicaoNoRanking(cadastro.id)
      setRanking(pos)
    } catch (err) {
      console.error('[PremiacaoScreen] erro ao buscar ranking:', err)
      setRanking(1) // fallback
    }

    try {
      const resultado = await resolverPremio(cadastro.id, partida.id, partida.pontuacao)
      setJaParticipou(resultado.jaParticipou)
      setPremio(resultado.premio)
      setSemEstoque(resultado.semEstoque)
    } catch (err) {
      console.error('[PremiacaoScreen] erro ao resolver premio:', err)
      // fallback: mostra tela sem prêmio em vez de travar
    }

    setLoading(false)
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, useNativeDriver: false }),
    ]).start()
  }

  return (
    <CoverBackground source={BG_JOGO}>
      <View style={s.overlay} pointerEvents="none" />

      {/* ── Compact header — logo only ─────────────────────────────── */}
      <View style={s.header}>
        <View style={s.miniLogoBox}>
          {B.logoLines.map((line, i) => (
            <Text key={i} style={s.miniLogoLine}>{line}</Text>
          ))}
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Main title ───────────────────────────────────────────── */}
        <View style={s.titleSection}>
          <RetroDecor />
          <View style={s.titleStars}>
            <Text style={s.titleStar}>★</Text>
            <Text style={s.titleStarAlt}>✦</Text>
            <Text style={s.titleStar}>★</Text>
          </View>
          <Text style={[s.mainTitle, compact && s.mainTitleCompact]}>Desafio concluído!</Text>
          <Text style={s.titleSub}>Você acertou todos os pares!</Text>
        </View>

        {/* ── Achievement card ─────────────────────────────────────── */}
        <Animated.View style={[s.achievementWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <RetroPanel style={s.achievementPanel}>
            <AchievementContent
              loading={loading}
              jaParticipou={jaParticipou}
              premio={premio}
              semEstoque={semEstoque}
            />
          </RetroPanel>
        </Animated.View>

        {/* ── Result summary ───────────────────────────────────────── */}
        <View style={[s.statsRow, compact && s.statsRowCompact]}>
          <StatCard label="PONTOS" value={String(partida.pontuacao)} bg={R.yellow} />
          <StatCard label="RANKING" value={`${ranking}º`} bg={R.pink} />
          <StatCard label="PARES" value={`${partida.pares}/6`} bg={R.cream} />
        </View>

        {/* ── Share card ───────────────────────────────────────────── */}
        <RetroPanel variant="navy" style={s.sharePanel}>
          <Text style={s.shareTitle}>COMPARTILHE!</Text>
          <Text style={s.shareMsg}>Tire uma foto com seu prêmio e marque a gente!</Text>
          <Text style={s.shareHandle}>{B.handleInstagram}</Text>
        </RetroPanel>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <Text style={s.footerText}>
          Obrigado por jogar o Desafio da Memória do {B.nomeBa}!
        </Text>
      </ScrollView>

      {/* ── Single action ──────────────────────────────────────────── */}
      <View style={s.actions}>
        <RetroButton
          label="Início"
          onPress={onHome}
          variant="dark"
          style={s.homeBtn}
          textStyle={s.homeBtnText}
        />
      </View>
    </CoverBackground>
  )
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5,5,5,0.55)',
  },

  header: {
    paddingVertical: hp(0.8),
    paddingHorizontal: fp(1.5),
    zIndex: 2,
  },
  miniLogoBox: {
    borderWidth: 3,
    borderColor: R.pink,
    backgroundColor: R.yellow,
    paddingHorizontal: fp(1.2),
    paddingVertical: fp(0.4),
    alignSelf: 'flex-start',
    alignItems: 'center',
  },
  miniLogoLine: {
    fontFamily: B.font,
    fontWeight: B.fontWeight,
    fontSize: fp(2.9),
    color: R.cream,
    letterSpacing: 1,
    lineHeight: fp(3.7),
    textTransform: 'uppercase',
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(2),
    gap: hp(1.6),
  },

  titleSection: {
    alignItems: 'center',
    paddingVertical: hp(1.4),
    paddingHorizontal: fp(2),
    position: 'relative',
    minHeight: hp(16),
    justifyContent: 'center',
  },
  titleStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: fp(2.4),
    marginBottom: hp(0.8),
  },
  titleStar: { color: R.yellow, fontSize: fp(3.4) },
  titleStarAlt: { color: R.pink, fontSize: fp(3.8) },
  mainTitle: {
    fontFamily: B.font,
    fontWeight: B.fontWeight,
    fontSize: fp(6),
    color: R.cream,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: fp(7.2),
  },
  mainTitleCompact: {
    fontSize: fp(4.8),
    lineHeight: fp(5.8),
  },
  titleSub: {
    fontFamily: B.font,
    fontSize: fp(2.9),
    color: R.cream,
    letterSpacing: 0.5,
    marginTop: hp(1),
    textAlign: 'center',
    textTransform: 'uppercase',
    lineHeight: fp(3.6),
  },

  achievementWrap: { width: '100%' },
  achievementPanel: {
    alignItems: 'center',
    paddingVertical: hp(2.6),
    paddingHorizontal: wp(3),
    gap: hp(1),
  },
  achievementIcon: { fontSize: fp(12), marginBottom: hp(0.5) },
  achievementTitle: {
    fontFamily: B.font,
    fontWeight: B.fontWeight,
    fontSize: fp(4.2),
    color: R.navy,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: fp(5),
  },
  achievementLead: {
    textAlign: 'center',
    marginTop: hp(0.5),
    fontSize: fp(2.6),
    lineHeight: fp(3.8),
  },
  achievementExtra: {
    width: '100%',
    alignItems: 'center',
    marginTop: hp(0.8),
    paddingTop: hp(1.2),
    borderTopWidth: 3,
    borderTopColor: R.navy,
    gap: hp(0.6),
  },
  achievementHighlight: {
    fontFamily: B.font,
    fontWeight: B.fontWeight,
    fontSize: fp(3.6),
    color: R.navy,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  achievementDetail: {
    textAlign: 'center',
    fontSize: fp(2.6),
    lineHeight: fp(3.6),
    paddingHorizontal: wp(2),
  },
  handHint: { marginTop: hp(0.5), textAlign: 'center', fontSize: fp(2.9) },
  loadingTxt: {
    color: R.navy,
    fontFamily: B.font,
    fontSize: fp(3.6),
    textAlign: 'center',
    paddingVertical: hp(2.4),
  },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    justifyContent: 'center',
  },
  statsRowCompact: {
    gap: wp(1.5),
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '28%',
    minWidth: wp(26),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.4),
    paddingHorizontal: wp(2),
    borderWidth: 4,
    borderColor: R.navy,
    borderRadius: 12,
    ...Platform.select({
      web: { boxShadow: `4px 4px 0 ${R.navy}` } as object,
      default: {
        shadowColor: R.navy,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
      },
    }),
  },
  statCardLabel: {
    fontFamily: B.font,
    fontSize: fp(2.4),
    color: R.navy,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: hp(0.4),
  },
  statCardValue: {
    fontFamily: B.font,
    fontWeight: B.fontWeight,
    fontSize: fp(5),
    color: R.navy,
    textTransform: 'uppercase',
  },

  sharePanel: {
    alignItems: 'center',
    paddingVertical: hp(2),
    gap: hp(0.5),
  },
  shareTitle: {
    fontFamily: B.font,
    fontWeight: B.fontWeight,
    fontSize: fp(3.1),
    color: R.yellow,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  shareMsg: {
    fontFamily: B.font,
    fontSize: fp(2.6),
    color: R.cream,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: fp(3.8),
    paddingHorizontal: wp(2),
  },
  shareHandle: {
    fontFamily: B.font,
    fontWeight: B.fontWeight,
    fontSize: fp(4.1),
    color: R.pink,
    letterSpacing: 2,
    marginTop: hp(0.5),
  },

  footerText: {
    fontFamily: B.font,
    fontSize: fp(2.4),
    color: R.cream,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: fp(3.6),
    paddingHorizontal: wp(2),
    opacity: 0.9,
  },

  actions: {
    paddingHorizontal: wp(4),
    paddingTop: hp(0.8),
    paddingBottom: hp(1.8),
    backgroundColor: 'rgba(5,5,5,0.65)',
    zIndex: 2,
  },
  homeBtn: {
    width: '100%',
    borderColor: R.cream,
    ...Platform.select({
      web: { boxShadow: `5px 5px 0 ${R.pink}` } as object,
      default: {
        shadowColor: R.pink,
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 6,
      },
    }),
  },
  homeBtnText: {
    fontSize: fp(3.6),
    letterSpacing: 4,
  },
})
