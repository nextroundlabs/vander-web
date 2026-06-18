import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView } from 'react-native'
import { R } from '../../theme'
import { B } from '../../brand'
import { fp, wp, hp } from '../../scale'
import { useViewport } from '../../hooks/useViewport'
import RetroTitle from './RetroTitle'
import RetroButton from './RetroButton'

const MODAL_MAX_WIDTH = 780

type Props = {
  visible: boolean
  title: string
  children?: React.ReactNode
  onClose: () => void
  confirmLabel?: string
  onConfirm?: () => void
  closeLabel?: string
  scrollable?: boolean
  borderColor?: string
  /** Single-line title without RetroTitle shadow layers — for long legal copy */
  flatTitle?: boolean
}

/** Modal estilo cartaz sobreposto */
export default function RetroModal({
  visible,
  title,
  children,
  onClose,
  confirmLabel,
  onConfirm,
  closeLabel = 'FECHAR',
  scrollable = false,
  borderColor = R.navy,
  flatTitle = false,
}: Props) {
  const { width } = useViewport()
  const boxMaxWidth = Math.min(MODAL_MAX_WIDTH, width - wp(10))

  const body = scrollable ? (
    <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.body}>{children}</View>
  )

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.box, { borderColor, maxWidth: boxMaxWidth }]} onPress={e => e.stopPropagation()}>
          <TouchableOpacity style={styles.closeX} onPress={onClose} hitSlop={12} accessibilityLabel="Fechar">
            <Text style={styles.closeXText}>✕</Text>
          </TouchableOpacity>
          {flatTitle ? (
            <Text style={styles.flatTitle}>{title}</Text>
          ) : (
            <RetroTitle size="sm">{title}</RetroTitle>
          )}
          {body}
          <View style={styles.actions}>
            {confirmLabel && onConfirm && (
              <RetroButton label={confirmLabel} onPress={onConfirm} style={{ flex: 1 }} />
            )}
            <RetroButton
              label={closeLabel}
              onPress={onClose}
              variant="dark"
              style={{ flex: 1, marginLeft: confirmLabel && onConfirm ? 8 : 0 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5,5,5,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(5),
  },
  box: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: R.cream,
    borderWidth: 5,
    borderRadius: 20,
    padding: wp(5),
    shadowColor: R.coral,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 12,
  },
  closeX: {
    position: 'absolute',
    top: hp(1),
    right: wp(3),
    zIndex: 2,
    padding: wp(1),
  },
  closeXText: {
    color: R.navy,
    fontFamily: B.font,
    fontSize: fp(3),
    lineHeight: fp(3.2),
  },
  flatTitle: {
    fontFamily: B.font,
    fontWeight: B.fontWeight,
    fontSize: fp(2.8),
    color: R.navy,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: hp(0.5),
    paddingHorizontal: wp(6),
  },
  body: { marginVertical: hp(2) },
  scrollBody: { maxHeight: hp(42), marginVertical: hp(1.5) },
  scrollContent: { paddingRight: wp(1) },
  actions: { flexDirection: 'row', marginTop: hp(1) },
})
