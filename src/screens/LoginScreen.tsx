import React, { useMemo, useState } from 'react'

import {

  View,

  Text,

  TouchableOpacity,

  StyleSheet,

  ScrollView,

  Image,

} from 'react-native'

import { R } from '../theme'

import { B } from '../brand'

import { useScale } from '../hooks/useScale'

import { useCoverTransform } from '../hooks/useCoverTransform'

import { designRect } from '../designCanvas'

import VirtualKeyboard from '../components/VirtualKeyboard'

import KeyboardDock, { useKeyboardDockPadding } from '../components/KeyboardDock'

import BlurModal from '../components/BlurModal'

import ScreenTransition from '../components/ScreenTransition'

import CadastroScreen from './CadastroScreen'

import { getCadastroByTelefone } from '../db/storage'

import { Cadastro } from '../types'

import { RetroButton, RetroPanel } from '../components/retro'

import { S, serifSubDark, handLabel } from '../retro/styles'

import { BG_LOGIN, BTN_LOGIN, BTN_CADASTRO } from '../gameAssets'
import CoverBackground from '../components/CoverBackground'



/** Área dos dois botões no canvas bg-login (1080×1920) */

const BTNS_LEFT = 227

const BTNS_TOP = 1306

const BTNS_W = 626

const BTNS_H = 346

const BTN_H = 138



/** Botão voltar no canvas */

const BACK_LEFT = 54

const BACK_TOP = 29



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

  const keyboardPadding = useKeyboardDockPadding('numeric')

  const { wp, hp, fp } = useScale()



  const go = async () => {

    if (tel.length < 8) { setError('Mínimo 8 dígitos'); return }

    setError('')

    setLoading(true)

    try { await onConfirm(tel) } finally { setLoading(false) }

  }



  const display = tel.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15)



  return (

    <View style={modalStyles.inner}>

      <TouchableOpacity style={modalStyles.backRow} onPress={onBack}>

        <Text style={[modalStyles.back, { fontSize: fp(2.4) }]}>← VOLTAR</Text>

      </TouchableOpacity>

      <ScrollView

        contentContainerStyle={[modalStyles.formScroll, { paddingBottom: keyboardPadding, paddingHorizontal: wp(5), paddingVertical: hp(1) }]}

        keyboardShouldPersistTaps="handled"

      >

        <RetroPanel style={modalStyles.panel}>

          <Text style={[modalStyles.panelTitle, { fontSize: fp(4.5), marginBottom: hp(0.5) }]}>Seu Telefone</Text>

          <Text style={[serifSubDark, { marginTop: hp(0.5) }]}>Digite para identificar seu cadastro</Text>

          <Text style={handLabel}>~ só os números ~</Text>

          <View style={[S.creamInput, { marginTop: hp(2) }]}>

            <Text style={[S.creamInputText, tel.length === 0 && modalStyles.placeholder]}>

              {tel.length > 0 ? display : '(00) 00000-0000'}

            </Text>

          </View>

          {error ? <Text style={[modalStyles.error, { fontSize: fp(2.4), marginTop: hp(1) }]}>{error}</Text> : null}

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

  const { scale, offsetX, offsetY } = useCoverTransform()

  const { fp } = useScale()



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



  const backRowStyle = useMemo(

    () => ({

      position: 'absolute' as const,

      zIndex: 5,

      ...designRect(BACK_LEFT, BACK_TOP, 400, 60, scale, offsetX, offsetY),

    }),

    [scale, offsetX, offsetY],

  )



  const buttonsAreaStyle = useMemo(

    () => ({

      position: 'absolute' as const,

      justifyContent: 'space-between' as const,

      alignItems: 'center' as const,

      ...designRect(BTNS_LEFT, BTNS_TOP, BTNS_W, BTNS_H, scale, offsetX, offsetY),

    }),

    [scale, offsetX, offsetY],

  )



  const btnHeight = BTN_H * scale



  return (

    <>

      <CoverBackground source={BG_LOGIN}>

        <TouchableOpacity style={backRowStyle} onPress={onBack}>

          <Text style={[s.back, { fontSize: fp(2.4) }]}>← VOLTAR</Text>

        </TouchableOpacity>



        <View style={buttonsAreaStyle}>

          <TouchableOpacity

            style={[s.btn, { height: btnHeight }]}

            onPress={() => openCadastro()}

            activeOpacity={0.85}

            accessibilityLabel="Cadastrar"

          >

            <Image source={BTN_CADASTRO} style={s.btnImg} resizeMode="contain" />

          </TouchableOpacity>

          <TouchableOpacity

            style={[s.btn, { height: btnHeight }]}

            onPress={() => setModal('phone')}

            activeOpacity={0.85}

            accessibilityLabel="Já tenho cadastro"

          >

            <Image source={BTN_LOGIN} style={s.btnImg} resizeMode="contain" />

          </TouchableOpacity>

        </View>

      </CoverBackground>



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

  back: {

    color: R.yellow, fontFamily: B.font,

    letterSpacing: 2, textTransform: 'uppercase',

  },

  btn: {

    width: '100%',

    minHeight: 44,

    justifyContent: 'center',

  },

  btnImg: {

    width: '100%',

    height: '100%',

  },

})



const modalStyles = StyleSheet.create({

  inner: { flex: 1 },

  backRow: { paddingHorizontal: 20, paddingTop: 12, zIndex: 5 },

  back: {

    color: R.yellow, fontFamily: B.font,

    letterSpacing: 2, textTransform: 'uppercase',

  },

  formScroll: {

    flexGrow: 1,

    justifyContent: 'center',

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

    color: R.navy,

    textShadowColor: R.yellow,

    textShadowOffset: { width: 2, height: 2 },

    textShadowRadius: 0,

  },

  placeholder: { color: '#9a8f7a', opacity: 0.7 },

  error: {

    color: R.coral, fontFamily: B.font,

    textAlign: 'center',

    letterSpacing: 0.5, textTransform: 'uppercase',

  },

})

