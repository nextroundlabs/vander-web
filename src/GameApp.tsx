import { StatusBar } from 'expo-status-bar'
import React, { useState } from 'react'
import { useAppFonts } from './hooks/useAppFonts'
import { View, StyleSheet, Platform } from 'react-native'
import { R } from './theme'
import { Cadastro, Partida, Screen } from './types'
import ScreenTransition from './components/ScreenTransition'
import IdleScreen from './screens/IdleScreen'
import LoginScreen from './screens/LoginScreen'
import JogoScreen from './screens/JogoScreen'
import PremiacaoScreen from './screens/PremiacaoScreen'

export default function GameApp() {
  const [fontsLoaded] = useAppFonts()
  const [screen, setScreen] = useState<Screen>('idle')
  const [cadastro, setCadastro] = useState<Cadastro | null>(null)
  const [partida, setPartida] = useState<Partida | null>(null)
  const rootSize = Platform.OS === 'web'
    ? ({ width: '100%', height: '100%' } as const)
    : undefined
  const screenWrap = Platform.OS === 'web' ? styles.screenWeb : styles.screenNative

  const renderScreen = () => {
    switch (screen) {
      case 'idle':
        return <IdleScreen onStart={() => setScreen('login')} />
      case 'login':
        return (
          <LoginScreen
            onExistingCadastro={c => { setCadastro(c); setScreen('jogo') }}
            onCadastro={() => {}}
            onNewCadastro={() => {}}
            onBack={() => setScreen('idle')}
          />
        )
      case 'jogo':
        return cadastro ? (
          <JogoScreen
            cadastro={cadastro}
            onFinish={p => { setPartida(p); setScreen('premiacao') }}
          />
        ) : null
      case 'premiacao':
        return cadastro && partida ? (
          <PremiacaoScreen
            cadastro={cadastro}
            partida={partida}
            onPlayAgain={() => setScreen('jogo')}
            onHome={() => { setCadastro(null); setPartida(null); setScreen('idle') }}
          />
        ) : null
      default:
        return null
    }
  }

  if (!fontsLoaded) {
    return <View style={[styles.root, rootSize]} />
  }

  return (
    <View style={[styles.root, rootSize]}>
      <StatusBar style="light" />
      <ScreenTransition screenKey={screen} style={screenWrap}>
        {renderScreen()}
      </ScreenTransition>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: R.dark },
  screenWeb: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  screenNative: { flex: 1 },
})
