/** Paleta retro — jogo promocional de bar/restaurante */
export const R = {
  navy:   '#001B4F',
  pink:   '#F04F83',
  yellow: '#FDBF1E',
  cream:  '#FFF1C7',
  dark:   '#050505',
  coral:  '#F45B68',
  green:  '#0F5B3E',
  navyDeep: '#06183D',
} as const

/** Alias legados — mantém compatibilidade com imports existentes */
export const C = {
  ...R,
  neonGreen: R.yellow,
  black: R.dark,
  darkGray: '#1a1028',
  mediumGray: '#2a2040',
  agedWhite: R.cream,
  textDim: '#9a8f7a',
  danger: R.coral,
  warning: R.yellow,
  brandNavy: R.navy,
  brandBlue: '#003080',
  brandPink: R.pink,
  brandYellow: R.yellow,
  brandGreen: R.green,
  brandWhite: R.cream,
}
