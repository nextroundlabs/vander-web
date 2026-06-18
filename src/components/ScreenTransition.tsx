import React, { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, ViewStyle } from 'react-native'

export const SCREEN_TRANSITION_DURATION = 300
export const SCREEN_TRANSITION_SLIDE = 16

type Props = {
  screenKey: string
  style?: ViewStyle | ViewStyle[]
  children: React.ReactNode
}

/** Subtle fade + upward slide when `screenKey` changes. Opacity/transform only for native driver. */
export default function ScreenTransition({ screenKey, style, children }: Props) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(SCREEN_TRANSITION_SLIDE)).current

  useEffect(() => {
    opacity.setValue(0)
    translateY.setValue(SCREEN_TRANSITION_SLIDE)

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: SCREEN_TRANSITION_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: SCREEN_TRANSITION_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
  }, [screenKey, opacity, translateY])

  return (
    <Animated.View
      style={[styles.container, style, { opacity, transform: [{ translateY }] }]}
    >
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
})
