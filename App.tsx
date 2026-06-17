import React from 'react'
import { Platform } from 'react-native'
import GameApp from './src/GameApp'
import AdminApp from './src/AdminApp'

/**
 * Roteador mínimo, só para separar duas URLs:
 *
 *   /        → GameApp  (fluxo público: idle → login → jogo → premiação —
 *                         é esse link que vai no QR code do evento)
 *   /admin   → AdminApp (tela de senha + dashboard — link separado, não
 *                         linkado em lugar nenhum do jogo público)
 *
 * Em apps nativos (Android/iOS) não existe esse conceito de "caminho de URL",
 * então sempre cai no GameApp — o /admin é uma rota só da versão web.
 */
export default function App() {
  const isAdminRoute =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.location.pathname.replace(/\/+$/, '').toLowerCase() === '/admin'

  return isAdminRoute ? <AdminApp /> : <GameApp />
}
