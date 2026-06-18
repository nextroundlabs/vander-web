import { useState, useEffect } from 'react'
import { Platform } from 'react-native'

/**
 * Retorna as dimensões reais do viewport em CSS pixels.
 *
 * Por que não usar apenas useWindowDimensions() do React Native?
 * Em alguns dispositivos Android, a API de Dimensions do React Native Web
 * retorna pixels físicos (ex: 1080px) em vez de pixels CSS lógicos
 * (ex: 360px), fazendo o layout ficar 3x maior que o esperado.
 * Este hook usa window.innerWidth/innerHeight no web, que sempre retornam
 * os valores corretos em CSS pixels, independente do devicePixelRatio.
 */
export function useViewport() {
  const getSize = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight }
    }
    const { Dimensions } = require('react-native')
    return Dimensions.get('window')
  }

  const [size, setSize] = useState(getSize)

  useEffect(() => {
    if (Platform.OS !== 'web') return
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return size
}
