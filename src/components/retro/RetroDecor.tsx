import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { R } from '../../theme'
import { fp } from '../../scale'

/** Elementos decorativos nos cantos — estrelas, raios, flores */
export default function RetroDecor() {
  return (
    <>
      <Text style={[styles.corner, styles.tl]} pointerEvents="none">✦</Text>
      <Text style={[styles.corner, styles.tr]} pointerEvents="none">⚡</Text>
      <Text style={[styles.corner, styles.bl]} pointerEvents="none">✿</Text>
      <Text style={[styles.corner, styles.br]} pointerEvents="none">★</Text>
      <View style={styles.lineTop} pointerEvents="none" />
      <View style={styles.lineBottom} pointerEvents="none" />
    </>
  )
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    fontSize: fp(4),
    color: R.yellow,
    zIndex: 2,
    opacity: 0.85,
  },
  tl: { top: 18, left: 18 },
  tr: { top: 18, right: 18, color: R.pink },
  bl: { bottom: 18, left: 18, color: R.pink },
  br: { bottom: 18, right: 18 },
  lineTop: {
    position: 'absolute',
    top: 42,
    left: 40,
    right: 40,
    height: 3,
    backgroundColor: R.yellow,
    opacity: 0.35,
    zIndex: 1,
  },
  lineBottom: {
    position: 'absolute',
    bottom: 42,
    left: 40,
    right: 40,
    height: 3,
    backgroundColor: R.pink,
    opacity: 0.35,
    zIndex: 1,
  },
})
