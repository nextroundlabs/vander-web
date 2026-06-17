import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
  useWindowDimensions,
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

const IMG_W = 1080
const IMG_H = 1920

const BTN_LEFT_X = 187.4
const BTN_RIGHT_X = 195.4
const BTN_HEIGHT = 142.736
const CADASTRAR_TOP_Y = 1330.87
const JA_TENHO_TOP_Y = 1494.51

function useCoverTransform() {
  const { width: sw, height: sh } = useWindowDimensions()
  const scale = Math.max(sw / IMG_W, sh / IMG_H)
  const offsetX = (sw - IMG_W * scale) / 2
  const offsetY = (sh - IMG_H * scale) / 2
  return { scale, offsetX, offsetY, sw, sh }
}

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
    if (tel.length < 8) {
      setError('Mínimo 8 dígitos')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onConfirm(tel)
    } finally {
      setLoading(false)
    }
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
  const { scale, offsetX, offsetY, sw } = useCoverTransform()

  const closeModal = () => setModal('none')

  const openCadastro = (tel = '') => {
    setCadastroTel(tel)
    setModal('cadastro')
    if (tel) onNewCadastro(tel)
    else onCadastro()
  }

  const handlePhone = async (tel: string) => {
    const ex = await getCadastroByTelefone(tel)
    if (ex) {
      closeModal()
      onExistingCadastro(ex)
    } else {
      openCadastro(tel)
    }
  }

  const handleCadastroComplete = (c: Cadastro) => {
    closeModal()
    onExistingCadastro(c)
  }

  const btnLeft = BTN_LEFT_X * scale + offsetX
  const btnRight = BTN_RIGHT_X * scale + offsetX
  const btnWidth = sw - btnLeft - btnRight
  const btnHeight = BTN_HEIGHT * scale
  const cadastrarTop = CADASTRAR_TOP_Y * scale + offsetY
  const jaTenhoTop = JA_TENHO_TOP_Y * scale + offsetY

  const hotspotStyle = {
    position: 'absolute' as const,
    left: btnLeft,
    width: btnWidth,
    height: btnHeight,
  }

  return (
    <>
      <ImageBackground source={BG_LOGIN} style={s.root} resizeMode="cover">
        <TouchableOpacity style={s.backRow} onPress={onBack}>
          <Text style={s.back}>← VOLTAR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[hotspotStyle, { top: cadastrarTop }]}
          onPress={() => openCadastro()}
          activeOpacity={1}
          accessibilityLabel="Cadastrar"
        />

        <TouchableOpacity
          style={[hotspotStyle, { top: jaTenhoTop }]}
          onPress={() => setModal('phone')}
          activeOpacity={1}
          accessibilityLabel="Já tenho cadastro"
        />
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
  back: { color: R.yellow, fontFamily: B.font, fontSize: fp(2.4), letterSpacing: 2, textTransform: 'uppercase' },
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
  error: { color: R.coral, fontFamily: B.font, fontSize: fp(2.4), textAlign: 'center', marginTop: hp(1), letterSpacing: 0.5, textTransform: 'uppercase' },
})
