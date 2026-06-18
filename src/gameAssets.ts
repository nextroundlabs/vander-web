/**
 * gameAssets.ts — todos os require() de imagens do jogo em um só lugar.
 * Nomes de arquivo sem espaços ou acentos (necessário para o Metro bundler).
 */

// ─── Fundos das telas ─────────────────────────────────────────────────────────
export const BG_RANKING = require('../assets/bg-ranking.png')
export const RANK_TABLE = require('../assets/rank_table.png')
export const BG_LOGIN   = require('../assets/bg-login.png')
export const BG_JOGO = require('../assets/jogo-da-memoria.png')

export const BTN_LOGIN    = require('../assets/login_btn.png')
export const BTN_CADASTRO = require('../assets/cadastro_btn.png')

// ─── Verso das cartas (único para todas) ──────────────────────────────────────
export const CARD_BACK = require('../assets/card-back.png')

// ─── Frentes + pop-ups por par ────────────────────────────────────────────────
// card1/card2 = frentes do par | popup = overlay ao acertar
export const CARD_ASSETS = {
  batataFrita: {
    card1: require('../assets/card-batata-1.png'),
    card2: require('../assets/card-batata-2.png'),
    popup: require('../assets/popup-batata.png'),
    label: 'BATATA FRITA COM RAGU',
  },
  lasanha: {
    card1: require('../assets/card-lasanha-1.png'),
    card2: require('../assets/card-lasanha-2.png'),
    popup: require('../assets/popup-lasanha.png'),
    label: 'LASANHA À BOLONHESA',
  },
  massasFrescas: {
    card1: require('../assets/card-massas-1.png'),
    card2: require('../assets/card-massas-2.png'),
    popup: require('../assets/popup-massas.png'),
    label: 'MASSAS FRESCAS',
  },
  paixaoArdente: {
    card1: require('../assets/card-paixao-1.png'),
    card2: require('../assets/card-paixao-2.png'),
    popup: require('../assets/popup-paixao.png'),
    label: 'PAIXÃO ARDENTE',
  },
  tempura: {
    card1: require('../assets/card-tempura-1.png'),
    card2: require('../assets/card-tempura-2.png'),
    popup: require('../assets/popup-tempura.png'),
    label: 'TEMPURÁ DE QUIABO',
  },
  vanderale: {
    card1: require('../assets/card-vanderale-1.png'),
    card2: require('../assets/card-vanderale-2.png'),
    popup: require('../assets/popup-vanderale.png'),
    label: 'VANDERALE',
  },
}
