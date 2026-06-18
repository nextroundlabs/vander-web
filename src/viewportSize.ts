import { Dimensions, Platform } from 'react-native'

/** Dimensões do viewport em CSS/dp lógicos — mesma lógica do useViewport. */
export function getViewportSize() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return { width: window.innerWidth, height: window.innerHeight }
  }
  const { width, height } = Dimensions.get('window')
  return { width, height }
}
