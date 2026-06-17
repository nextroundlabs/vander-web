import { useFonts } from 'expo-font'

/** Loads Anton via expo-font on all platforms (including web @font-face injection). */
export function useAppFonts() {
  const [loaded, error] = useFonts({
    Anton: require('../../assets/fonts/Anton.ttf'),
  })

  if (error) {
    console.warn('[useAppFonts] failed to load Anton:', error)
  }

  return [loaded, error] as const
}
