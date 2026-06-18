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
import { getRanking } from '../db/storage'
import { Partida } from '../types'
import { BG_RANKING, RANK_TABLE } from '../gameAssets'
import { RetroDecor } from '../components/retro'
import { designRect } from '../designCanvas'
import { useCoverTransform } from '../hooks/useCoverTransform'
import CoverBackground from '../components/CoverBackground'



/** Posição da tabela no canvas bg-ranking (1080×1920) */

const TABLE_SCREEN_LEFT = 144

const TABLE_SCREEN_TOP = 945

const TABLE_SCREEN_W = 792

const TABLE_SCREEN_H = 520



/** Layout interno de rank_table.png (792×520) — coluna rosa + faixas bege */

const DATA_LEFT = 154

const BORDER_INSET = 10

const NAME_PAD_L = 16

const SCORE_PAD_R = 20

const NAME_FONT = 34

const SCORE_FONT = 32



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



  const tableFrame = designRect(

    TABLE_SCREEN_LEFT,

    TABLE_SCREEN_TOP,

    TABLE_SCREEN_W,

    TABLE_SCREEN_H,

    scale,

    offsetX,

    offsetY,

  )

  const rowsInset = {

    paddingTop: BORDER_INSET * scale,

    paddingBottom: BORDER_INSET * scale,

    paddingLeft: DATA_LEFT * scale,

    paddingRight: SCORE_PAD_R * scale,

  }

  const namePad = NAME_PAD_L * scale

  const nameSize = NAME_FONT * scale

  const scoreSize = SCORE_FONT * scale



  return (
    <CoverBackground source={BG_RANKING}>
      <RetroDecor />

      <TouchableOpacity style={s.startZone} onPress={onStart} activeOpacity={1} accessibilityLabel="Iniciar jogo" />

      <View pointerEvents="none" style={[s.tableFrame, tableFrame]}>
        <ImageBackground source={RANK_TABLE} style={s.tableBg} resizeMode="stretch">
          <View style={[s.rows, rowsInset]}>
            {Array.from({ length: 5 }).map((_, i) => {
              const player = topPlayers[i]
              return (
                <View key={i} style={s.row}>
                  {player ? (
                    <>
                      <Text
                        numberOfLines={1}
                        style={[s.rankName, { paddingLeft: namePad, fontSize: nameSize, lineHeight: nameSize * 1.05 }]}
                      >
                        {fmt(player.nome)}
                      </Text>
                      <Text style={[s.rankScore, { fontSize: scoreSize, lineHeight: scoreSize * 1.05 }]}>
                        {player.pontuacao}
                      </Text>
                    </>
                  ) : null}
                </View>
              )
            })}
          </View>
        </ImageBackground>
      </View>
    </CoverBackground>
  )
}



const s = StyleSheet.create({
  startZone: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  tableFrame: {

    position: 'absolute',

    overflow: 'hidden',

  },

  tableBg: {

    flex: 1,

    width: '100%',

    height: '100%',

  },

  rows: {

    flex: 1,

    flexDirection: 'column',

  },

  row: {

    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

  },

  rankName: {

    flex: 1,

    fontFamily: B.font,

    fontWeight: B.fontWeight,

    color: R.navy,

    letterSpacing: 0.5,

    textTransform: 'uppercase',

    includeFontPadding: false,

  },

  rankScore: {

    fontFamily: B.font,

    fontWeight: B.fontWeight,

    color: R.navy,

    letterSpacing: 0.5,

    textTransform: 'uppercase',

    textAlign: 'right',

    includeFontPadding: false,

    flexShrink: 0,

  },

})

