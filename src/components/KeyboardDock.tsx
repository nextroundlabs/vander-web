import React from 'react'
import { View, StyleSheet } from 'react-native'
import { hp } from '../scale'

/** Bottom area reserved for the fixed VirtualKeyboard + action button. */
export const KEYBOARD_DOCK_PADDING = hp(44)

type Props = { children: React.ReactNode }

export default function KeyboardDock({ children }: Props) {
  return <View style={styles.dock}>{children}</View>
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
})
