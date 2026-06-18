import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { B } from '../brand'
import { hp, fp } from '../scale'
import { useViewport } from '../hooks/useViewport'
import { isCompact, isNarrow } from '../responsive'

type Mode = 'alpha' | 'numeric'

type Props = {
  value: string
  onChange: (val: string) => void
  maxLength?: number
  mode?: Mode
}

/** Pastel palette — soft, readable keys */
const P = {
  dock: '#F0E8FF',
  keyCream: '#FFF8E7',
  keyPink: '#FFD6E8',
  keyYellow: '#FFF3B0',
  keyBlue: '#D6EFFF',
  keyDelete: '#FFC4D0',
  border: '#C4B5D8',
  text: '#3D3560',
  modeBtn: '#E8D4FF',
} as const

const ROWS_ALPHA = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
]

const ROWS_NUM = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
]

const KEY_CYCLE = [P.keyCream, P.keyPink, P.keyBlue, P.keyYellow] as const

function keyBg(row: number, col: number) {
  return KEY_CYCLE[(row + col) % KEY_CYCLE.length]
}

export default function VirtualKeyboard({ value, onChange, maxLength = 100, mode = 'alpha' }: Props) {
  const [currentMode, setCurrentMode] = useState<Mode>(mode)
  const { width } = useViewport()
  const compact = isCompact(width)
  const narrow = isNarrow(width)

  useEffect(() => {
    setCurrentMode(mode)
  }, [mode])

  const press = (key: string) => {
    if (key === '⌫') onChange(value.slice(0, -1))
    else if (key === 'ESPAÇO') {
      if (value.length < maxLength) onChange(value + ' ')
    } else if (key && value.length < maxLength) onChange(value + key)
  }

  const keyStyle = [
    styles.key,
    narrow && styles.keyNarrow,
    compact && styles.keyCompact,
  ]
  const keyTextStyle = [
    styles.keyText,
    compact && styles.keyTextCompact,
  ]

  if (currentMode === 'numeric') {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        {ROWS_NUM.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key, ki) => (
              <TouchableOpacity
                key={ki}
                style={[
                  ...keyStyle,
                  styles.keyNumeric,
                  narrow && styles.keyNumericNarrow,
                  compact && styles.keyNumericCompact,
                  !key && styles.keyEmpty,
                  key === '0' && { backgroundColor: P.keyYellow },
                  key === '⌫' && styles.keyDelete,
                ]}
                onPress={() => press(key)}
                disabled={!key}
                activeOpacity={0.7}
              >
                <Text style={[...keyTextStyle, key === '⌫' && styles.keyDeleteText]}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {mode === 'alpha' && (
          <TouchableOpacity style={styles.modeBtn} onPress={() => setCurrentMode('alpha')} activeOpacity={0.7}>
            <Text style={styles.modeBtnText}>ABC</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {ROWS_ALPHA.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((key, ki) => (
            <TouchableOpacity
              key={ki}
              style={[...keyStyle, { backgroundColor: keyBg(ri, ki) }]}
              onPress={() => press(key)}
              activeOpacity={0.7}
            >
              <Text style={keyTextStyle}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <View style={styles.row}>
        <TouchableOpacity
          style={[...keyStyle, styles.keySpace, { backgroundColor: P.keyYellow }]}
          onPress={() => press('ESPAÇO')}
          activeOpacity={0.7}
        >
          <Text style={keyTextStyle}>ESPAÇO</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[...keyStyle, styles.keyDelete]}
          onPress={() => press('⌫')}
          activeOpacity={0.7}
        >
          <Text style={styles.keyDeleteText}>⌫</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.modeBtn} onPress={() => setCurrentMode('numeric')} activeOpacity={0.7}>
        <Text style={styles.modeBtnText}>123</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: P.dock,
    paddingTop: hp(1),
    paddingBottom: hp(0.8),
    paddingHorizontal: 8,
    borderTopWidth: 3,
    borderTopColor: P.keyPink,
  },
  containerCompact: {
    paddingTop: hp(0.6),
    paddingBottom: hp(0.5),
    paddingHorizontal: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'center', marginBottom: hp(0.7) },
  key: {
    flex: 1,
    flexBasis: 0,
    borderWidth: 2,
    borderColor: P.border,
    borderRadius: 10,
    minWidth: fp(4.8),
    maxWidth: fp(8),
    height: hp(5.2),
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  keyNarrow: {
    minWidth: fp(4.2),
    maxWidth: fp(7),
    marginHorizontal: 1,
  },
  keyCompact: {
    minWidth: fp(3.8),
    maxWidth: fp(6.5),
    height: hp(4.6),
    borderRadius: 8,
  },
  keyNumeric: {
    flex: 1,
    flexBasis: 0,
    minWidth: fp(14),
    maxWidth: fp(22),
    height: hp(6.2),
    marginHorizontal: fp(1.5),
    backgroundColor: P.keyCream,
  },
  keyNumericNarrow: {
    minWidth: fp(12),
    maxWidth: fp(20),
    marginHorizontal: fp(1),
  },
  keyNumericCompact: {
    minWidth: fp(10),
    maxWidth: fp(18),
    height: hp(5.4),
  },
  keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keySpace: { flex: 2, marginHorizontal: 4, maxWidth: undefined },
  keyDelete: { flex: 1, marginHorizontal: 4, backgroundColor: P.keyDelete, maxWidth: undefined },
  keyText: { color: P.text, fontFamily: B.font, fontSize: fp(2.5), fontWeight: B.fontWeight, letterSpacing: 0.5, textTransform: 'uppercase' },
  keyTextCompact: { fontSize: fp(2.1), letterSpacing: 0 },
  keyDeleteText: { color: P.text, fontFamily: B.font, fontSize: fp(2.5), fontWeight: B.fontWeight, letterSpacing: 1, textTransform: 'uppercase' },
  modeBtn: {
    backgroundColor: P.modeBtn,
    marginHorizontal: fp(4),
    marginTop: hp(0.2),
    paddingVertical: hp(0.9),
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: P.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  modeBtnText: { color: P.text, fontFamily: B.font, fontWeight: B.fontWeight, fontSize: fp(2.2), letterSpacing: 2, textTransform: 'uppercase' },
})
