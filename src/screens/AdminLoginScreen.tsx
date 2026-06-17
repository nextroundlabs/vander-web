import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform } from 'react-native'
import { R } from '../theme'
import { B } from '../brand'
import { wp, hp, fp } from '../scale'
import { RetroBackground, RetroTitle, RetroButton } from '../components/retro'
import { signInAdmin } from '../lib/adminAuth'

type Props = {
  onUnlock: () => void
}

/**
 * Tela de senha do /admin. Diferente do antigo PIN de 4 dígitos (pensado
 * para alguém tocando uma tela sem teclado físico), aqui a validação é feita
 * no servidor via Supabase Auth — então a senha pode (e deve) ser mais forte,
 * já que esta página agora tem uma URL pública na internet.
 */
export default function AdminLoginScreen({ onUnlock }: Props) {
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const entrar = async () => {
    if (!senha) return
    setLoading(true)
    setErro('')
    const resultado = await signInAdmin(senha)
    setLoading(false)
    if (resultado.ok) onUnlock()
    else setErro(resultado.error ?? 'Senha incorreta.')
  }

  return (
    <RetroBackground decor={false}>
      <View style={styles.container}>
        <View style={styles.content}>
          <RetroTitle size="sm">Admin</RetroTitle>
          <Text style={styles.subtitle}>Painel de configuração — VANDERALE</Text>

          <TextInput
            style={styles.input}
            value={senha}
            onChangeText={v => { setSenha(v); setErro('') }}
            placeholder="Senha de acesso"
            placeholderTextColor="#9a8f7a"
            secureTextEntry
            autoFocus={Platform.OS === 'web'}
            onSubmitEditing={entrar}
            returnKeyType="go"
          />

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <RetroButton
            label={loading ? 'Entrando…' : 'Entrar'}
            onPress={entrar}
            disabled={loading || senha.length === 0}
            loading={loading}
            style={styles.button}
          />
        </View>
      </View>
    </RetroBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: wp(8) },
  subtitle: {
    color: R.cream, fontFamily: B.font, fontSize: fp(2.2), marginTop: hp(1),
    marginBottom: hp(4), letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center',
  },
  input: {
    backgroundColor: R.cream, color: R.navy, fontFamily: B.font,
    fontSize: fp(3), padding: hp(1.8), borderWidth: 3, borderColor: R.navy,
    borderRadius: 10, letterSpacing: 1, textAlign: 'center',
  },
  erro: {
    color: R.coral, fontFamily: B.font, fontSize: fp(2.2), textAlign: 'center',
    marginTop: hp(1.5), letterSpacing: 0.5, textTransform: 'uppercase',
  },
  button: { marginTop: hp(3) },
})
