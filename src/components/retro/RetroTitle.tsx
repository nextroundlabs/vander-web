import React from 'react'
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native'
import { R } from '../../theme'
import { B } from '../../brand'
import { fp } from '../../scale'

type Props = {
  children: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  style?: ViewStyle
  light?: boolean
}

const SIZES = { sm: fp(3.5), md: fp(5), lg: fp(7), xl: fp(9) }

/** Título retro com sombra deslocada em camadas (estilo pôster) */
export default function RetroTitle({ children, size = 'lg', style, light }: Props) {
  const fontSize = SIZES[size]
  const fill = light ? R.cream : R.navy
  const shadowStyle: TextStyle = {
    fontSize,
    fontFamily: B.font,
    fontWeight: B.fontWeight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  }

  return (
    <View style={[styles.wrap, style]}>
      <Text style={[shadowStyle, styles.shadow, { fontSize }]} accessibilityElementsHidden importantForAccessibility="no">
        {children}
      </Text>
      <Text style={[shadowStyle, styles.outline, { fontSize, color: fill }]} accessibilityElementsHidden importantForAccessibility="no">
        {children}
      </Text>
      <Text style={[shadowStyle, styles.main, { fontSize, color: fill }]}>
        {children}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  shadow: {
    position: 'absolute',
    color: R.coral,
    top: 5,
    left: 5,
  },
  outline: {
    position: 'absolute',
    top: 0,
    left: 0,
    textShadowColor: R.yellow,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  main: {
    textAlign: 'center',
  },
})
