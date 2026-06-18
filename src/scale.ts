import { Dimensions, Platform } from 'react-native'

/**
 * Retorna a largura do viewport em CSS pixels.
 * No web usamos window.innerWidth — garante CSS pixels corretos
 * independente do devicePixelRatio (alguns builds do React Native Web
 * retornam pixels físicos via Dimensions.get, o que quebra o layout
 * em dispositivos com DPR > 1).
 */
const getW = (): number => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.innerWidth
  return Dimensions.get('window').width
}

const getH = (): number => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.innerHeight
  return Dimensions.get('window').height
}

export const W = getW()
export const H = getH()

/** Percentagem da largura do viewport */
export const wp = (pct: number) => (getW() * pct) / 100

/** Percentagem da altura do viewport */
export const hp = (pct: number) => (getH() * pct) / 100

/** Percentagem da menor dimensão — usado para fontes */
export const fp = (pct: number) => (Math.min(getW(), getH()) * pct) / 100
