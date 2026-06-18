import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useViewport } from '../hooks/useViewport'
import { isCompact } from '../responsive'

/** Reserva inferior para teclado virtual + botão de ação (valor estático legado). */
export const KEYBOARD_DOCK_PADDING = 320

/** Padding dinâmico conforme altura da tela — preferir em ScrollViews. */
export function useKeyboardDockPadding(mode: 'alpha' | 'numeric' = 'alpha') {
  const { width, height } = useViewport()
  const compact = isCompact(width)
  const base = mode === 'numeric' ? height * 0.38 : height * 0.44
  if (height < 640) return base * 0.92
  if (compact) return base * 0.96
  return base
}

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
