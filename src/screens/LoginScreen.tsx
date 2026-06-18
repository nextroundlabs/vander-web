import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
} from 'react-native'
import { R } from '../theme'
import { B } from '../brand'
import { wp, hp, fp } from '../scale'
import VirtualKeyboard from '../components/VirtualKeyboard'
import KeyboardDock, { KEYBOARD_DOCK_PADDING } from '../components/KeyboardDock'
import BlurModal from '../components/BlurModal'
import ScreenTransition from '../components/ScreenTransition'
import CadastroScreen from './CadastroScreen'
import { getCadastroByTelefone } from '../db/storage'
import { Cadastro } from '../types'
import { RetroButton, RetroPanel } from '../components/retro'
import { S, serifSubDark, handLabel } from '../retro/styles'
import { BG_LOGIN } from '../gameAssets'

type ModalMode = 'none' | 'phone' | 'cadastro'

type Props = {
  onExistingCadastro: (cadastro: Cadastro) => void
  onCadastro: () => void
  onNewCadastro: (telefone: string) => void
  onBack: () => void
}

function PhoneEntry({ onConfirm, onBack }: { onConfirm: (t: string) => void; onBack: () => void }) {
  const [tel, setTel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const go = async () => {
    if (tel.length < 8) { setError('Mínimo 8 dígitos'); return }
    setError('')
    setLoading(true)
    try { await onConfirm(tel) } finally { setLoading(false) }
  }

  const display = tel.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15)

  return (
    <View style={s.modalInner}>
      <TouchableOpacity style={s.backRow} onPress={onBack}>
        <Text style={s.back}>← VOLTAR</Text>
      </TouchableOpacity>
      <ScrollView
        contentContainerStyle={[s.formScroll, { paddingBottom: KEYBOARD_DOCK_PADDING }]}
        keyboardShouldPersistTaps="handled"
      >
        <RetroPanel style={s.panel}>
          <Text style={s.panelTitle}>Seu Telefone</Text>
          <Text style={[serifSubDark, s.subtitle]}>Digite para identificar seu cadastro</Text>
          <Text style={handLabel}>~ só os números ~</Text>
          <View style={[S.creamInput, { marginTop: hp(2) }]}>
            <Text style={[S.creamInputText, tel.length === 0 && s.placeholder]}>
              {tel.length > 0 ? display : '(00) 00000-0000'}
            </Text>
          </View>
          {error ? <Text style={s.error}>{error}</Text> : null}
        </RetroPanel>
      </ScrollView>
      <KeyboardDock>
        <RetroButton
          label="Entrar →"
          onPress={go}
          disabled={loading || tel.length < 8}
          loading={loading}
          style={{ marginHorizontal: wp(5), marginBottom: hp(0.6) }}
        />
        <VirtualKeyboard value={tel} onChange={setTel} maxLength={11} mode="numeric" />
      </KeyboardDock>
    </View>
  )
}

export default function LoginScreen({ onExistingCadastro, onCadastro, onNewCadastro, onBack }: Props) {
  const [modal, setModal] = useState<ModalMode>('none')
  const [cadastroTel, setCadastroTel] = useState('')

  const closeModal = () => setModal('none')

  const openCadastro = (tel = '') => {
    setCadastroTel(tel)
    setModal('cadastro')
    if (tel) onNewCadastro(tel)
    else onCadastro()
  }

  const handlePhone = async (tel: string) => {
    const ex = await getCadastroByTelefone(tel)
    if (ex) { closeModal(); onExistingCadastro(ex) }
    else openCadastro(tel)
  }

  const handleCadastroComplete = (c: Cadastro) => {
    closeModal()
    onExistingCadastro(c)
  }

  return (
    <>
      <ImageBackground source={BG_LOGIN} style={s.root} resizeMode="cover">
        {/* VOLTAR */}
        <TouchableOpacity style={s.backRow} onPress={onBack}>
          <Text style={s.back}>← VOLTAR</Text>
        </TouchableOpacity>

        {/* Botões reais posicionados na parte inferior da tela.
            A imagem de fundo já mostra os botões visualmente — estes
            TouchableOpacity transparentes ficam sobrepostos sobre eles,
            garantindo que funcionem em qualquer tamanho de tela sem depender
            de cálculo de pixels. */}
        <View style={s.buttonsArea}>
          <TouchableOpacity
            style={s.btn}
            onPress={() => openCadastro()}
            activeOpacity={0.7}
            accessibilityLabel="Cadastrar"
          />
          <TouchableOpacity
            style={s.btn}
            onPress={() => setModal('phone')}
            activeOpacity={0.7}
            accessibilityLabel="Já tenho cadastro"
          />
        </View>
      </ImageBackground>

      <BlurModal visible={modal === 'phone'} onClose={closeModal}>
        {modal === 'phone' && (
          <ScreenTransition screenKey="phone">
            <PhoneEntry onConfirm={handlePhone} onBack={closeModal} />
          </ScreenTransition>
        )}
      </BlurModal>

      <BlurModal visible={modal === 'cadastro'} onClose={closeModal}>
        {modal === 'cadastro' && (
          <ScreenTransition screenKey={`cadastro-${cadastroTel}`}>
            <CadastroScreen
              telefone={cadastroTel}
              asModal
              onComplete={handleCadastroComplete}
              onBack={closeModal}
            />
          </ScreenTransition>
        )}
      </BlurModal>
    </>
  )
}

const s = StyleSheet.create({
  root: { flex: 1 },
  modalInner: { flex: 1 },
  backRow: { paddingHorizontal: wp(5), paddingTop: hp(1.5), zIndex: 5 },
  back: {
    color: R.yellow, fontFamily: B.font,
    fontSize: fp(2.4), letterSpacing: 2, textTransform: 'uppercase',
  },
  /**
   * Área que cobre os dois botões da imagem de fundo.
   * A imagem de design (1080×1920) tem os botões entre ~69% e ~86% da altura.
   * Usamos posição absoluta com percentagens — funciona em qualquer resolução
   * porque é relativa ao container (que já preenche a tela via flex:1).
   */
  buttonsArea: {
    position: 'absolute',
    left: '14%',
    right: '14%',
    top: '65%',
    bottom: '10%',
    justifyContent: 'space-around',
  },
  btn: {
    flex: 1,
    marginVertical: '1.5%',
  },
  formScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
  },
  panel: { width: '100%' },
  panelTitle: {
    width: '100%',
    textAlign: 'center',
    alignSelf: 'center',
    fontFamily: B.font,
    fontWeight: B.fontWeight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: fp(4.5),
    color: R.navy,
    textShadowColor: R.yellow,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    marginBottom: hp(0.5),
  },
  subtitle: { marginTop: hp(0.5) },
  placeholder: { color: '#9a8f7a', opacity: 0.7 },
  error: {
    color: R.coral, fontFamily: B.font,
    fontSize: fp(2.4), textAlign: 'center',
    marginTop: hp(1), letterSpacing: 0.5, textTransform: 'uppercase',
  },
})
