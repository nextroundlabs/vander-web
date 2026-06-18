import { useState, useEffect } from 'react'
import { useWindowDimensions, Platform } from 'react-native'
import { getViewportSize } from '../viewportSize'

/**
 * Retorna as dimensões reais do viewport em CSS/dp lógicos.
 *
 * - Web: window.innerWidth/innerHeight (CSS pixels, ignora devicePixelRatio).
 * - Native: useWindowDimensions() (dp, atualiza em rotação).
 */
export function useViewport() {
  const { width: dimW, height: dimH } = useWindowDimensions()
  const [webSize, setWebSize] = useState(getViewportSize)

  useEffect(() => {
    if (Platform.OS !== 'web') return
    const sync = () => setWebSize(getViewportSize())
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  if (Platform.OS === 'web') return webSize
  return { width: dimW, height: dimH }
}
