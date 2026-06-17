import React from 'react'
import { Modal, View, StyleSheet, Platform, Pressable } from 'react-native'

type Props = {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

const blurBackdrop = Platform.select({
  web: {
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  } as Record<string, string>,
  default: {},
})

/** Full-screen overlay with blurred/semi-transparent backdrop; welcome screen stays visible underneath. */
export default function BlurModal({ visible, onClose, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={[styles.backdrop, blurBackdrop]} onPress={onClose} accessibilityRole="button" />
        <View style={styles.content} pointerEvents="box-none">
          {children}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 5, 5, 0.48)',
  },
  content: {
    ...StyleSheet.absoluteFill,
    flex: 1,
  },
})
