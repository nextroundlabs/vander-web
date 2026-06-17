import React, { useRef, useEffect } from 'react'
import { TouchableOpacity, Animated, StyleSheet, Image } from 'react-native'
import { R } from '../theme'
import { CARD_BACK } from '../gameAssets'

export type CardData = {
  id: number
  pairId: number
  label: string
  image: any   // require() da frente desta carta específica
  popup: any   // require() do pop-up ao acertar o par
}

type Props = {
  card: CardData
  isFlipped: boolean
  isMatched: boolean
  onPress: () => void
  cardWidth: number
  cardHeight: number
}

export default function MemoryCard({ card, isFlipped, isMatched, onPress, cardWidth, cardHeight }: Props) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isFlipped || isMatched ? 1 : 0,
      friction: 8,
      tension: 50,
      useNativeDriver: false,
    }).start()
  }, [isFlipped, isMatched])

  const frontRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] })
  const backRotate  = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg',   '180deg'] })
  const frontOpacity = anim.interpolate({ inputRange: [0, 0.45, 0.55, 1], outputRange: [0, 0, 1, 1] })
  const backOpacity  = anim.interpolate({ inputRange: [0, 0.45, 0.55, 1], outputRange: [1, 1, 0, 0] })

  const size = { width: cardWidth, height: cardHeight, margin: 4 }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isFlipped || isMatched}
      activeOpacity={0.9}
      style={[styles.container, size]}
    >
      {/* ── VERSO: imagem do verso padrão ────────────────────────── */}
      <Animated.View
        style={[styles.face, { transform: [{ rotateY: backRotate }], opacity: backOpacity,
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}
      >
        <Image source={CARD_BACK} style={styles.img} resizeMode="cover" />
      </Animated.View>

      {/* ── FRENTE: imagem específica do par ─────────────────────── */}
      <Animated.View
        style={[styles.face, { transform: [{ rotateY: frontRotate }], opacity: frontOpacity }]}
      >
        <Image source={card.image} style={styles.img} resizeMode="cover" />
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  face: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 6,
    borderWidth: 3,
    borderColor: R.pink,
  },
  img: {
    width: '100%',
    height: '100%',
  },
})
