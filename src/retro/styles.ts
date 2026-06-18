import { StyleSheet, Platform, ViewStyle, TextStyle } from 'react-native'
import { C, R } from '../theme'
import { B } from '../brand'
import { fp, wp, hp } from '../scale'

export const retro = {
  /** Borda grossa padrão */
  stroke: 4,
  strokeLg: 6,
  radius: 16,
  radiusLg: 24,
  shadowOffset: { x: 5, y: 5 },
}

export const posterFrame: ViewStyle = {
  flex: 1,
  borderWidth: retro.strokeLg,
  borderColor: R.pink,
  backgroundColor: R.dark,
  margin: wp(2),
  borderRadius: retro.radiusLg,
  overflow: 'hidden',
}

export const retroPanelCream: ViewStyle = {
  backgroundColor: R.cream,
  borderWidth: retro.stroke,
  borderColor: R.navy,
  borderRadius: retro.radius,
  padding: wp(4),
  ...Platform.select({
    web: { boxShadow: `${retro.shadowOffset.x}px ${retro.shadowOffset.y}px 0 ${R.coral}` } as any,
    default: {
      shadowColor: R.coral,
      shadowOffset: { width: retro.shadowOffset.x, height: retro.shadowOffset.y },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 8,
    },
  }),
}

export const retroPanelNavy: ViewStyle = {
  backgroundColor: R.navy,
  borderWidth: retro.stroke,
  borderColor: R.yellow,
  borderRadius: retro.radius,
  padding: wp(4),
}

export const retroButtonPrimary: ViewStyle = {
  backgroundColor: R.yellow,
  borderWidth: retro.stroke,
  borderColor: R.navy,
  borderRadius: retro.radius,
  paddingVertical: hp(1.6),
  paddingHorizontal: wp(6),
  minHeight: 48,
  alignItems: 'center',
  justifyContent: 'center',
  ...Platform.select({
    web: { boxShadow: `5px 6px 0 ${R.coral}`, cursor: 'pointer' } as any,
    default: {
      shadowColor: R.coral,
      shadowOffset: { width: 5, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 6,
    },
  }),
}

export const retroButtonSecondary: ViewStyle = {
  ...retroButtonPrimary,
  backgroundColor: R.pink,
  borderColor: R.navy,
}

export const retroButtonDark: ViewStyle = {
  ...retroButtonPrimary,
  backgroundColor: R.navyDeep,
  borderColor: R.cream,
}

export const retroButtonText: TextStyle = {
  fontFamily: B.font,
  fontWeight: B.fontWeight,
  fontSize: fp(3),
  color: R.navy,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
}

export const retroButtonTextLight: TextStyle = {
  ...retroButtonText,
  color: R.cream,
}

export const handLabel: TextStyle = {
  fontFamily: B.font,
  fontSize: fp(2.4),
  color: R.pink,
  letterSpacing: 1,
  textTransform: 'uppercase',
  transform: [{ rotate: '-3deg' }],
}

export const serifSub: TextStyle = {
  fontFamily: B.font,
  fontSize: fp(2.2),
  color: R.cream,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  textAlign: 'center',
}

export const serifSubDark: TextStyle = {
  ...serifSub,
  color: R.navy,
}

export const creamInput: ViewStyle = {
  backgroundColor: R.cream,
  borderWidth: 3,
  borderColor: R.navy,
  borderRadius: 12,
  paddingVertical: hp(1.2),
  paddingHorizontal: wp(4),
}

export const creamInputText: TextStyle = {
  fontFamily: B.font,
  fontSize: fp(3.5),
  color: R.navy,
  textAlign: 'center',
  letterSpacing: 1,
  textTransform: 'uppercase',
}

export const rankingRow: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: R.cream,
  borderWidth: 3,
  borderColor: R.navy,
  borderRadius: 12,
  marginBottom: hp(0.8),
  overflow: 'hidden',
}

export const rankingPos: ViewStyle = {
  backgroundColor: R.pink,
  width: wp(14),
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: hp(1),
  borderRightWidth: 3,
  borderRightColor: R.navy,
}

export const retroBgTexture: ViewStyle = {
  flex: 1,
  backgroundColor: R.dark,
}

export const S = StyleSheet.create({
  posterFrame: posterFrame as ViewStyle,
  panelCream: retroPanelCream as ViewStyle,
  panelNavy: retroPanelNavy as ViewStyle,
  btnPrimary: retroButtonPrimary as ViewStyle,
  btnSecondary: retroButtonSecondary as ViewStyle,
  btnDark: retroButtonDark as ViewStyle,
  btnText: retroButtonText as TextStyle,
  btnTextLight: retroButtonTextLight as TextStyle,
  handLabel: handLabel as TextStyle,
  serifSub: serifSub as TextStyle,
  creamInput: creamInput as ViewStyle,
  creamInputText: creamInputText as TextStyle,
  rankingRow: rankingRow as ViewStyle,
  rankingPos: rankingPos as ViewStyle,
})
