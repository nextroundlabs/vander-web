import React, { useEffect, useState } from 'react'
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  View,
} from 'react-native'
import { B } from '../brand'
import { R } from '../theme'
import { fp } from '../scale'
import { getRanking } from '../db/storage'
import { Partida } from '../types'
import { BG_RANKING } from '../gameAssets'
import { RetroDecor } from '../components/retro'
import { useViewport } from '../hooks/useViewport'

const IMG_W = 1080
const IMG_H = 1920

/** Design coords (1080×1920) — cream row area only, excluding pink rank column */
const TABLE_TOP_Y = 970
const ROW_HEIGHT = 77
const ROW_GAP = 23
const TABLE_LEFT = 268
const TABLE_WIDTH = 598
const NAME_LEFT_PADDING = 22
const SCORE_RIGHT_PADDING = 16

function useCoverTransform() {
  const { width: sw, height: sh } = useViewport()
  const scale = Math.max(sw / IMG_W, sh / IMG_H)
  const offsetX = (sw - IMG_W * scale) / 2
  const offsetY = (sh - IMG_H * scale) / 2
  return { scale, offsetX, offsetY }
}

type Props = { onStart: () => void }

export default function IdleScreen({ onStart }: Props) {
  const [topPlayers, setTopPlayers] = useState<(Partida & { nome: string })[]>([])
  const { scale, offsetX, offsetY } = useCoverTransform()

  useEffect(() => {
    loadRanking()
    const iv = setInterval(loadRanking, 8000)
    return () => clearInterval(iv)
  }, [])

  const loadRanking = async () => {
    setTopPlayers(await getRanking(5))
  }

  const fmt = (nome: string) => {
    const p = nome.split(' ')
    return (p[0] + (p[1] ? ' ' + p[1][0] + '.' : '')).toUpperCase()
  }

  const tableStyle = {
    left: TABLE_LEFT * scale + offsetX,
    top: TABLE_TOP_Y * scale + offsetY,
    width: TABLE_WIDTH * scale,
    gap: ROW_GAP * scale,
  }
  const rowHeight = ROW_HEIGHT * scale

  return (
    <ImageBackground source={BG_RANKING} style={s.root} resizeMode="cover">
      <RetroDecor />

      <TouchableOpacity style={s.startZone} onPress={onStart} activeOpacity={1} accessibilityLabel="Iniciar jogo" />

      <View pointerEvents="none" style={[s.tableOverlay, tableStyle]}>
        {Array.from({ length: 5 }).map((_, i) => {
          const player = topPlayers[i]
          return (
            <View key={i} style={[s.row, { height: rowHeight }]}>
              {player ? (
                <>
                  <Text
                    numberOfLines={1}
                    style={[s.rankName, { paddingLeft: NAME_LEFT_PADDING * scale }]}
                  >
                    {fmt(player.nome)}
                  </Text>
                  <Text style={[s.rankScore, { paddingRight: SCORE_RIGHT_PADDING * scale }]}>
                    {player.pontuacao}
                  </Text>
                </>
              ) : null}
            </View>
          )
        })}
      </View>
    </ImageBackground>
  )
}

const s = StyleSheet.create({
  root: { flex: 1 },
  startZone: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  tableOverlay: {
    position: 'absolute',
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankName: {
    flex: 1,
    fontFamily: B.font,
    fontWeight: B.fontWeight,
    fontSize: fp(3.8),
    color: R.navy,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  rankScore: {
    fontFamily: B.font,
    fontWeight: B.fontWeight,
    fontSize: fp(4.5),
    color: R.navy,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'right',
    includeFontPadding: false,
  },
})
