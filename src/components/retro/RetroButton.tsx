import React, { useRef } from 'react'
import { TouchableOpacity, Text, Animated, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native'
import { R } from '../../theme'
import { S } from '../../retro/styles'

type Variant = 'primary' | 'secondary' | 'dark'

type Props = {
  label: string
  onPress: () => void
  variant?: Variant
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

const VARIANTS: Record<Variant, ViewStyle> = {
  primary: S.btnPrimary,
  secondary: S.btnSecondary,
  dark: S.btnDark,
}

export default function RetroButton({
  label, onPress, variant = 'primary', disabled, loading, style, textStyle,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current

  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 6 }).start()
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start()

  const textColor = variant === 'dark' ? S.btnTextLight : S.btnText

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        style={[VARIANTS[variant], disabled && styles.disabled]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        activeOpacity={0.92}
        accessibilityRole="button"
      >
        {loading
          ? <ActivityIndicator color={R.navy} />
          : <Text style={[textColor, textStyle]}>{label}</Text>
        }
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.4 },
})
