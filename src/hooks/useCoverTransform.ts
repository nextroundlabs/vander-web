import { useMemo } from 'react'
import { DESIGN_H, DESIGN_W } from '../designCanvas'
import { useViewport } from './useViewport'

export type CoverTransform = {
  scale: number
  offsetX: number
  offsetY: number
  sw: number
  sh: number
  designW: number
  designH: number
}

/**
 * Escala tipo cover (object-fit: cover) para artes 1080×1920.
 * Usar para posicionar overlays alinhados ao recorte real do ImageBackground.
 */
export function useCoverTransform(
  designW: number = DESIGN_W,
  designH: number = DESIGN_H,
): CoverTransform {
  const { width: sw, height: sh } = useViewport()

  return useMemo(() => {
    const scale = Math.max(sw / designW, sh / designH)
    const offsetX = (sw - designW * scale) / 2
    const offsetY = (sh - designH * scale) / 2
    return { scale, offsetX, offsetY, sw, sh, designW, designH }
  }, [sw, sh, designW, designH])
}
