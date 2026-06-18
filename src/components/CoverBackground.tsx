import React from 'react'
import {
  View,
  Image,
  ImageSourcePropType,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { useCoverTransform } from '../hooks/useCoverTransform'
import { useViewport } from '../hooks/useViewport'
import { R } from '../theme'

type Props = {
  source: ImageSourcePropType
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * Fundo artístico 1080×1920 com recorte cover idêntico ao useCoverTransform.
 * ImageBackground + resizeMode="cover" sozinho não garante o mesmo recorte
 * que designRect() — esta camada aplica scale/offset explicitamente.
 */
export default function CoverBackground({ source, children, style }: Props) {
  const { width, height } = useViewport()
  const { scale, offsetX, offsetY, designW, designH } = useCoverTransform()

  return (
    <View style={[styles.root, { width, height }, style]}>
      <Image
        source={source}
        style={{
          position: 'absolute',
          width: designW * scale,
          height: designH * scale,
          left: offsetX,
          top: offsetY,
        }}
        resizeMode="cover"
      />
      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: R.dark,
  },
  content: {
    ...StyleSheet.absoluteFill,
  },
})
