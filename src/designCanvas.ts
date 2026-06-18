/** Canvas de design das artes de fundo (1080×1920). */
export const DESIGN_W = 1080
export const DESIGN_H = 1920

/** Converte retângulo do canvas de design para coordenadas de tela com cover. */
export function designRect(
  left: number,
  top: number,
  width: number,
  height: number,
  scale: number,
  offsetX: number,
  offsetY: number,
) {
  return {
    left: left * scale + offsetX,
    top: top * scale + offsetY,
    width: width * scale,
    height: height * scale,
  }
}
