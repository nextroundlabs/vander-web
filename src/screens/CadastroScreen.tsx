import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { R, C } from '../theme'
import { B } from '../brand'
import { useScale } from '../hooks/useScale'
import VirtualKeyboard from '../components/VirtualKeyboard'
import KeyboardDock, { useKeyboardDockPadding } from '../components/KeyboardDock'
import { saveCadastro, getCadastroByTelefone } from '../db/storage'
import { Cadastro } from '../types'
import { RetroButton, RetroBackground, RetroPanel, RetroModal } from '../components/retro'
import { S, serifSubDark, handLabel } from '../retro/styles'

type Props = {
  telefone: string
  onComplete: (c: Cadastro) => void
  onBack: () => void
  asModal?: boolean
}

export default function CadastroScreen({ telefone, onComplete, onBack, asModal = false }: Props) {
  const [telefoneInput, setTelefoneInput] = useState(telefone)
  const [dataNascimentoInput, setDataNascimentoInput] = useState('')
  const [nome, setNome] = useState('')
  const [lgpd, setLgpd] = useState(false)
  const [lgpdModalVisible, setLgpdModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeField, setActiveField] = useState<'telefone' | 'dataNascimento' | 'nome'>(
    telefone ? 'dataNascimento' : 'telefone',
  )

  const phoneDigits = telefoneInput.replace(/\D/g, '')
  const birthDigits = dataNascimentoInput.replace(/\D/g, '')
  const dataNascimento = parseBirthDate(birthDigits)
  const canSubmit = phoneDigits.length >= 8 && !!dataNascimento && nome.trim().length >= 2 && lgpd && !loading

  const go = async () => {
    if (phoneDigits.length < 8) {
      setError('Digite um telefone valido')
      setActiveField('telefone')
      return
    }
    if (!dataNascimento) {
      setError('Digite uma data de nascimento valida')
      setActiveField('dataNascimento')
      return
    }
    if (nome.trim().length < 2) {
      setError('Digite seu nome completo')
      return
    }
    if (!lgpd) {
      setError('Você precisa aceitar os termos para continuar')
      return
    }
    setError('')
    setLoading(true)
    try {
      const existing = await getCadastroByTelefone(phoneDigits)
      if (existing) {
        setError("Usuário já cadastrado. Utilize a opção 'Já tenho cadastro'.")
        return
      }
      const now = new Date().toISOString()
      const cadastroLocal: Cadastro = {
        id: Date.now().toString(),
        nome: nome.trim().toUpperCase(),
        telefone: phoneDigits,
        dataNascimento,
        dataCadastro: now,
        aceitouLGPD: true,
        dataAceiteLGPD: now,
      }
      // saveCadastro agora retorna o cadastro com o id REAL do banco — é esse
      // id que precisa seguir pro resto do fluxo (partidas/resgates
      // referenciam cadastros por id, e o id local Date.now() não existe no banco).
      const cadastroSalvo = await saveCadastro(cadastroLocal)
      onComplete(cadastroSalvo)
    } finally {
      setLoading(false)
    }
  }

  const kbValue =
    activeField === 'telefone' ? phoneDigits : activeField === 'dataNascimento' ? birthDigits : nome
  const kbOnChange =
    activeField === 'telefone'
      ? setTelefoneInput
      : activeField === 'dataNascimento'
        ? setDataNascimentoInput
        : setNome
  const kbMaxLen = activeField === 'telefone' ? 11 : activeField === 'dataNascimento' ? 8 : 40
  const kbMode = activeField === 'nome' ? ('alpha' as const) : ('numeric' as const)
  const keyboardPadding = useKeyboardDockPadding(kbMode)
  const { wp, hp, fp } = useScale()

  const body = (
    <View style={s.inner}>
      <TouchableOpacity style={[s.backRow, { paddingHorizontal: wp(5), paddingTop: hp(1.5) }]} onPress={onBack}>
        <Text style={[s.back, { fontSize: fp(2.4) }]}>← VOLTAR</Text>
      </TouchableOpacity>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: keyboardPadding, paddingHorizontal: wp(5), paddingVertical: hp(1) }]}
        keyboardShouldPersistTaps="handled"
      >
        <RetroPanel style={s.panel}>
          <Text style={[s.panelTitle, { fontSize: fp(4.5), marginBottom: hp(0.5) }]}>Cadastro</Text>
          <Text style={[serifSubDark, { marginTop: hp(0.5) }]}>Como devemos te chamar?</Text>

          <Field
            label="Telefone"
            active={activeField === 'telefone'}
            onPress={() => setActiveField('telefone')}
            value={phoneDigits.length > 0 ? formatPhone(phoneDigits) : '(00) 00000-0000'}
            empty={phoneDigits.length === 0}
          />
          <Field
            label="Data nascimento"
            active={activeField === 'dataNascimento'}
            onPress={() => setActiveField('dataNascimento')}
            value={birthDigits.length > 0 ? formatBirthDate(birthDigits) : 'DD/MM/AAAA'}
            empty={birthDigits.length === 0}
          />
          <Field
            label="Nome completo"
            active={activeField === 'nome'}
            onPress={() => setActiveField('nome')}
            value={nome.length > 0 ? nome : 'SEU NOME AQUI'}
            empty={nome.length === 0}
          />

          {error ? <Text style={[s.error, { fontSize: fp(2.2), marginTop: hp(1) }]}>{error}</Text> : null}

          <TouchableOpacity style={[s.lgpdRow, { marginTop: hp(1.5) }]} onPress={() => setLgpdModalVisible(true)} activeOpacity={0.7}>
            <View style={[s.lgpdBox, { width: fp(3), height: fp(3), marginRight: wp(3) }, lgpd && s.lgpdBoxChecked]}>
              {lgpd && <Text style={[s.lgpdCheck, { fontSize: fp(1.8) }]}>✓</Text>}
            </View>
            <Text style={[s.lgpdText, { fontSize: fp(1.8), lineHeight: fp(2.6) }]}>Li e concordo com os termos de uso e política de privacidade.</Text>
          </TouchableOpacity>
        </RetroPanel>
      </ScrollView>

      <KeyboardDock>
        <RetroButton
          label="Jogar! →"
          onPress={go}
          disabled={!canSubmit}
          loading={loading}
          style={{ marginHorizontal: wp(5), marginBottom: hp(0.6) }}
        />
        <VirtualKeyboard key={activeField} value={kbValue} onChange={kbOnChange} maxLength={kbMaxLen} mode={kbMode} />
      </KeyboardDock>

      <RetroModal
        visible={lgpdModalVisible}
        title="Termo de Consentimento para Tratamento de Dados Pessoais (LGPD)"
        flatTitle
        scrollable
        borderColor={R.pink}
        confirmLabel="LI E ACEITO"
        onConfirm={() => {
          setLgpd(true)
          setLgpdModalVisible(false)
        }}
        onClose={() => setLgpdModalVisible(false)}
      >
        <Text style={[s.lgpdParagraph, { fontSize: fp(2), lineHeight: fp(3), marginBottom: hp(1.5) }]}>
          Ao marcar esta opção, declaro que tenho 18 anos ou mais e autorizo a coleta e o tratamento dos meus dados
          pessoais informados neste cadastro (nome completo, telefone e data de nascimento) para participação nesta
          ação promocional.
        </Text>
        <Text style={[s.lgpdParagraph, { fontSize: fp(2), lineHeight: fp(3), marginBottom: hp(1.5) }]}>
          Também autorizo que meus dados sejam utilizados pela empresa para envio de informações, promoções, campanhas,
          novidades, ofertas e comunicações relacionadas aos seus produtos e serviços, por meio dos canais de contato
          informados.
        </Text>
        <Text style={[s.lgpdParagraph, { fontSize: fp(2), lineHeight: fp(3), marginBottom: hp(1.5) }]}>
          Estou ciente de que meus dados serão tratados em conformidade com a Lei Geral de Proteção de Dados Pessoais
          (Lei nº 13.709/2018 - LGPD), podendo solicitar, a qualquer momento, a atualização, correção ou exclusão dos
          meus dados por meio dos canais de atendimento disponibilizados pela empresa.
        </Text>
      </RetroModal>
    </View>
  )

  if (asModal) return body
  return <RetroBackground>{body}</RetroBackground>
}

function Field({
  label,
  active,
  onPress,
  value,
  empty,
}: {
  label: string
  active: boolean
  onPress: () => void
  value: string
  empty: boolean
}) {
  const { hp, fp } = useScale()
  return (
    <View style={{ marginTop: hp(1.2) }}>
      <Text style={{ fontFamily: B.font, fontSize: fp(2), color: R.navy, fontWeight: B.fontWeightMedium, marginBottom: hp(0.4), letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {label.toUpperCase()}
      </Text>
      <TouchableOpacity style={[S.creamInput, active && s.inputActive]} onPress={onPress} activeOpacity={0.7}>
        <Text style={[S.creamInputText, empty && s.placeholder]} numberOfLines={1}>
          {value}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

function formatPhone(value: string) {
  return value.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15)
}

function formatBirthDate(value: string) {
  return value.replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3').slice(0, 10)
}

function parseBirthDate(value: string) {
  if (value.length !== 8) return null
  const day = Number(value.slice(0, 2))
  const month = Number(value.slice(2, 4))
  const year = Number(value.slice(4, 8))
  if (year < 1900) return null
  const date = new Date(year, month - 1, day)
  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getTime() <= Date.now()
  if (!isValid) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const s = StyleSheet.create({
  inner: { flex: 1 },
  backRow: { flexShrink: 0 },
  back: { color: R.yellow, fontFamily: B.font, letterSpacing: 2, textTransform: 'uppercase' },
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
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
  inputActive: { borderColor: R.pink, borderWidth: 4 },
  placeholder: { color: C.textDim, fontWeight: '400' },
  error: { color: R.coral, fontFamily: B.font, textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase' },
  lgpdRow: { flexDirection: 'row', alignItems: 'flex-start' },
  lgpdBox: {
    borderWidth: 3,
    borderColor: R.navy,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lgpdBoxChecked: { backgroundColor: R.yellow },
  lgpdCheck: { color: R.navy, fontFamily: B.font, fontWeight: B.fontWeight },
  lgpdText: { flex: 1, fontFamily: B.font, color: R.navy, letterSpacing: 0.5, textTransform: 'uppercase' },
  lgpdParagraph: {
    fontFamily: B.font,
    color: R.navy,
    letterSpacing: 0.3,
  },
})
