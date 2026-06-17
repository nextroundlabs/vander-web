import React from 'react'
import { View, StyleSheet, ViewStyle, Platform } from 'react-native'
import { R } from '../../theme'
import RetroDecor from './RetroDecor'

type Props = {
  children: React.ReactNode
  style?: ViewStyle
  decor?: boolean
}

/** Fundo escuro com textura simulada e moldura rosa */
export default function RetroBackground({ children, style, decor = true }: Props) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.texture} pointerEvents="none" />
      <View style={styles.vignette} pointerEvents="none" />
      {decor && <RetroDecor />}
      <View style={styles.frame}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: R.dark,
  },
  texture: {
    ...StyleSheet.absoluteFill,
    backgroundColor: R.navyDeep,
    opacity: 0.55,
    ...Platform.select({
      web: {
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(240,79,131,0.12) 0%, transparent 45%),
          radial-gradient(circle at 80% 70%, rgba(253,191,30,0.08) 0%, transparent 40%),
          repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 8px)
        `,
      } as any,
      default: {},
    }),
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...Platform.select({
      web: {
        boxShadow: 'inset 0 0 120px rgba(0,0,0,0.65)',
      } as any,
      default: {},
    }),
  },
  frame: {
    flex: 1,
    margin: 8,
    borderWidth: 5,
    borderColor: R.pink,
    borderRadius: 20,
    overflow: 'hidden',
  },
})
