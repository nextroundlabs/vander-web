import { useMemo } from 'react'
import { useViewport } from './useViewport'

/** wp/hp/fp reativos ao viewport — preferir a wp/hp de scale.ts dentro de StyleSheet.create. */
export function useScale() {
  const { width, height } = useViewport()

  return useMemo(
    () => ({
      width,
      height,
      wp: (pct: number) => (width * pct) / 100,
      hp: (pct: number) => (height * pct) / 100,
      fp: (pct: number) => (Math.min(width, height) * pct) / 100,
    }),
    [width, height],
  )
}
