import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // If user is authenticated, validate their is_active status
  if (user?.email && !authError) {
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('is_active')
        .eq('email', user.email)
        .single()

      // If user is deactivated, sign them out by removing the session
      if (profileError || !userProfile?.is_active) {
        // Create a response that will clear the session cookies
        const response = NextResponse.redirect(new URL('/login', request.url))
        
        // Clear Supabase auth cookies to invalidate the session
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        response.cookies.delete('sb-auth-token')
        
        return response
      }
    } catch (error) {
      console.error('Error checking user active status in middleware:', error)
      // Continue with the request if there's an error checking status
      // This prevents middleware from breaking the app
    }
  }

  return supabaseResponse
}