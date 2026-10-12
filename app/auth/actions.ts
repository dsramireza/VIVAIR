"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { loginMessage, registrationMessage } from "@/lib/auth/access"

export type AuthState = { error?: string; success?: string }

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72)
})
const registerSchema = credentialsSchema.extend({ name: z.string().trim().min(2).max(100) })

export async function register(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Revisa el nombre, correo y contraseña" }
  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { name: parsed.data.name }
  })
  if (error) return { error: registrationMessage(error.code) }
  return { success: "Cuenta creada. Ya puedes iniciar sesión." }
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Correo o contraseña incorrectos" }
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: loginMessage(error.code) }
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null }
  redirect(profile?.role === "Administrator" ? "/admin/vuelos" : "/reservas")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}
