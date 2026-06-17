import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { R } from '../../theme'
import { B } from '../../brand'
import { fp, hp } from '../../scale'
import RetroTitle from './RetroTitle'
import RetroBackground from './RetroBackground'

const MESSAGES = [
  'Preparando o desafio',
  'Embaralhando as cartas',
  'Aquecendo a chapa',
  'Chamando o garçom',
]

type Props = { message?: string }

export default function RetroLoading({ message }: Props) {
  const [idx, setIdx] = useState(0)
  const [dots, setDots] = useState('')
  const spin = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400)
    const iv2 = setInterval(() => setIdx(i => (i + 1) % MESSAGES.length), 2800)
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start()
    return () => { clearInterval(iv); clearInterval(iv2) }
  }, [])

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
  const msg = message ?? MESSAGES[idx]

  return (
    <RetroBackground decor>
      <View style={styles.center}>
        <RetroTitle size="md">Aguarde</RetroTitle>
        <Animated.Text style={[styles.card, { transform: [{ rotateY: rotate }] }]}>🃏</Animated.Text>
        <Text style={styles.msg}>{msg}{dots}</Text>
        <Text style={styles.hand}>~ quase lá ~</Text>
      </View>
    </RetroBackground>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { fontSize: fp(12), marginVertical: hp(3) },
  msg: {
    fontFamily: B.font,
    fontSize: fp(2.5),
    color: R.cream,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: hp(1),
  },
  hand: {
    fontFamily: B.font,
    fontSize: fp(3),
    color: R.pink,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: hp(2),
  },
})
