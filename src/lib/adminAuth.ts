import { supabase } from './supabase'

/**
 * O dashboard tem um único usuário admin no Supabase Auth — não existe tela
 * de "criar conta", só login com senha. O e-mail é fixo e interno (o
 * visitante nunca vê isso); só a senha é digitada na tela /admin.
 *
 * Para criar esse usuário: Supabase → Authentication → Users → Add user,
 * com este e-mail e a senha que vocês escolherem (ver supabase/schema.sql).
 */
export const ADMIN_EMAIL = 'admin@vanderale.local'

export async function signInAdmin(password: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password })
  if (error) return { ok: false, error: 'Senha incorreta.' }
  return { ok: true }
}

export async function signOutAdmin(): Promise<void> {
  await supabase.auth.signOut()
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const { data } = await supabase.auth.getSession()
  return !!data.session
}
