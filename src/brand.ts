/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  BRAND — TROQUE AQUI QUANDO O DESIGNER ENTREGAR             ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Este arquivo centraliza TUDO que é visual/identidade do bar.
 * Você NÃO precisa mexer em nenhuma outra tela para trocar logo,
 * fonte ou fundo — basta editar as constantes do objeto B abaixo.
 *
 * Padrão de uso nas telas:  import { B } from '../brand'
 *                            fontFamily: B.font
 */

import { ImageSourcePropType, Platform, TextStyle } from 'react-native'

export const B = {
  // ─── TIPOGRAFIA ─────────────────────────────────────────────────────────────
  //
  // Fonte única do app — Anton (assets/fonts/Anton.ttf).
  // Carregada via expo-font (useAppFonts) em todas as plataformas, inclusive web.
  //
  font: 'Anton',
  /** Anton só tem peso regular; no web, pesos 700/900 causam fallback para fonte do sistema. */
  fontWeight: Platform.select({ web: '400', default: '900' }) as TextStyle['fontWeight'],
  fontWeightMedium: Platform.select({ web: '400', default: '700' }) as TextStyle['fontWeight'],
  /** @deprecated alias — use B.font */
  fontHand: 'Anton',
  /** @deprecated alias — use B.font */
  fontSerif: 'Anton',

  // ─── COR DE FUNDO ───────────────────────────────────────────────────────────
  //
  // Cor escura usada como fundo em todas as telas do jogo.
  // Se for usar bgImage (abaixo), essa cor fica atrás enquanto a imagem carrega.
  //
  bg: '#050505',

  // ─── IMAGEM DE FUNDO ────────────────────────────────────────────────────────
  //
  // Valor atual: null  →  usa apenas a cor bg acima (sem imagem).
  //
  // Para usar uma imagem de fundo:
  //   1. Coloque o arquivo em  assets/fundo.jpg  (ou .png)
  //   2. Mude para:  bgImage: require('../assets/fundo.jpg') as ImageSourcePropType,
  //   3. Nas telas, troque  <View style={s.root}>  por:
  //        <ImageBackground source={B.bgImage!} style={s.root} resizeMode="cover">
  //        </ImageBackground>
  //
  bgImage: null as ImageSourcePropType | null,

  // ─── LOGOTIPO ────────────────────────────────────────────────────────────────
  //
  // O logo atual é texto em bloco (sem imagem).
  // logoLines são as linhas dentro da caixa do logo.
  //
  // Para usar imagem de logo:
  //   1. Coloque o arquivo em  assets/logo.png
  //   2. Descomente:  logoImage: require('../assets/logo.png') as ImageSourcePropType,
  //   3. Nos componentes LogoBlock, troque o mapa de texto por:
  //        <Image source={B.logoImage!} style={{ width: wp(20), height: hp(8) }} resizeMode="contain" />
  //
  logoLines: ['VAN', 'DER', 'ALE'] as string[],

  // ─── IDENTIDADE TEXTUAL ─────────────────────────────────────────────────────

  /** Nome completo do bar — aparece em títulos e mensagens */
  nomeBa: 'VANDERALE',

  /** Handle do Instagram — tela de compartilhamento */
  handleInstagram: '@vanderale',
}
