import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { S } from '../../retro/styles'

type Props = {
  children: React.ReactNode
  variant?: 'cream' | 'navy'
  style?: ViewStyle
}

export default function RetroPanel({ children, variant = 'cream', style }: Props) {
  return (
    <View style={[variant === 'cream' ? S.panelCream : S.panelNavy, style]}>
      {children}
    </View>
  )
}
