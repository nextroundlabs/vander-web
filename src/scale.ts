import { Dimensions } from 'react-native'

/** Retorna as dimensões atuais da janela (chamado a cada uso, não cached) */
const dim = () => Dimensions.get('window')

export const W = dim().width
export const H = dim().height

/** Percentagem da largura atual da janela */
export const wp = (pct: number) => (dim().width  * pct) / 100

/** Percentagem da altura atual da janela */
export const hp = (pct: number) => (dim().height * pct) / 100

/** Percentagem da menor dimensão — bom para fontes */
export const fp = (pct: number) => {
  const { width, height } = dim()
  return (Math.min(width, height) * pct) / 100
}
