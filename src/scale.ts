import { getViewportSize } from './viewportSize'

/**
 * Helpers de escala baseados no viewport atual.
 *
 * ATENÇÃO: wp/hp/fp chamados dentro de StyleSheet.create() são congelados
 * no carregamento do módulo. Em telas com fundo artístico, prefira
 * useScale() + useCoverTransform() dentro do componente.
 */
const getW = () => getViewportSize().width
const getH = () => getViewportSize().height

export const W = getW()
export const H = getH()

/** Percentagem da largura do viewport */
export const wp = (pct: number) => (getW() * pct) / 100

/** Percentagem da altura do viewport */
export const hp = (pct: number) => (getH() * pct) / 100

/** Percentagem da menor dimensão — usado para fontes */
export const fp = (pct: number) => (Math.min(getW(), getH()) * pct) / 100

export { useScale } from './hooks/useScale'
export { useCoverTransform } from './hooks/useCoverTransform'
export { DESIGN_W, DESIGN_H, designRect } from './designCanvas'
