import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateRandomPassword(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { full_name, email, avatar_icon, team_id } = body

    if (!full_name || !email || !avatar_icon || !team_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    const generatedPassword = generateRandomPassword(8)

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
        avatar_icon,
      },
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json({ error: authError.message ?? 'Error creando usuario en Auth' }, { status: 400 })
    }

    const user = authData.user

    if (!user?.id) {
      return NextResponse.json({ error: 'No se obtuvo el UID de Supabase Auth' }, { status: 500 })
    }

    const insertPayload = {
      full_name,
      email,
      avatar_icon,
      team_id,
      role: 'user',
      is_active: true,
    }

    const { error: insertError } = await supabase.from('users').insert([insertPayload])

    if (insertError) {
      console.error('Error inserting user row:', insertError)
      return NextResponse.json({ error: insertError.message ?? 'Error insertando usuario en tabla users' }, { status: 500 })
    }

    return NextResponse.json({ success: true, password: generatedPassword, message: `Miembro agregado. Contraseña temporal: ${generatedPassword}` })
  } catch (error) {
    console.error('Unexpected error in create-user route:', error)
    return NextResponse.json({ error: 'Error inesperado al agregar miembro' }, { status: 500 })
  }
}
