import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native'
import { useAppFonts } from './hooks/useAppFonts'
import { R } from './theme'
import ScreenTransition from './components/ScreenTransition'
import AdminLoginScreen from './screens/AdminLoginScreen'
import DashboardScreen from './screens/DashboardScreen'
import { isAdminAuthenticated } from './lib/adminAuth'

/**
 * AdminApp — tudo que existe na rota /admin. Não importa NADA do fluxo do
 * jogo (IdleScreen, LoginScreen, JogoScreen, PremiacaoScreen) — são bundles
 * conceitualmente separados, só unidos pelo roteador em App.tsx.
 */
export default function AdminApp() {
  const [fontsLoaded] = useAppFonts()
  const [checandoSessao, setChecandoSessao] = useState(true)
  const [autenticado, setAutenticado] = useState(false)
  const { width, height } = useWindowDimensions()

  // Se o admin já tem uma sessão válida do Supabase Auth (login anterior
  // ainda não expirou), pula direto pro dashboard sem pedir senha de novo.
  useEffect(() => {
    isAdminAuthenticated().then(ok => {
      setAutenticado(ok)
      setChecandoSessao(false)
    })
  }, [])

  const rootSize = Platform.OS === 'web' ? ({ width: '100%', height: '100%' } as any) : { width, height }
  const screenWrap = Platform.OS === 'web' ? styles.screenWeb : styles.screenNative

  if (!fontsLoaded || checandoSessao) {
    return <View style={[styles.root, rootSize]} />
  }

  return (
    <View style={[styles.root, rootSize]}>
      <StatusBar style="light" />
      <ScreenTransition screenKey={autenticado ? 'dashboard' : 'login'} style={screenWrap}>
        {autenticado ? (
          <DashboardScreen onClose={() => setAutenticado(false)} />
        ) : (
          <AdminLoginScreen onUnlock={() => setAutenticado(true)} />
        )}
      </ScreenTransition>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: R.dark },
  screenWeb: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  screenNative: { flex: 1 },
})
