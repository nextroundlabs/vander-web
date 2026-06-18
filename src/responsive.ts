/** Breakpoints em CSS pixels (alinhados ao useViewport). */
export const BREAKPOINTS = {
  compact: 400,
  narrow: 600,
  medium: 768,
} as const

export function isCompact(width: number) {
  return width < BREAKPOINTS.compact
}

export function isNarrow(width: number) {
  return width < BREAKPOINTS.narrow
}

export function isMedium(width: number) {
  return width < BREAKPOINTS.medium
}
