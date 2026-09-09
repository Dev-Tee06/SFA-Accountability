import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register') || request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname === '/admin/register'
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login' && request.nextUrl.pathname !== '/admin/register'

  function redirectWithCookies(urlPath: string) {
    const url = request.nextUrl.clone()
    url.pathname = urlPath
    const response = NextResponse.redirect(url)
    
    // Crucial: copy over cookies from the supabaseResponse to preserve session refresh tokens
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })
    return response
  }

  // If trying to access dashboard/admin without user
  if (!user && (isDashboardPage || isAdminPage)) {
    return redirectWithCookies(isAdminPage ? '/admin/login' : '/login')
  }

  // If we have a user
  if (user) {
    // Check if the user is an admin by querying the profiles table
    let isAdmin = false;
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (user.email === 'babayodetestimony0318@gmail.com' || (profile && profile.role === 'admin')) {
      isAdmin = true;
    }

    // Admin accessing non-admin pages
    if (isAdmin && (isAuthPage || isDashboardPage || request.nextUrl.pathname === '/')) {
      return redirectWithCookies('/admin')
    }

    // Normal user accessing admin pages (but allow them to see the login page so they can switch accounts or see errors)
    if (!isAdmin && isAdminPage) {
      return redirectWithCookies('/admin/login')
    }

    // Normal user accessing auth pages
    if (!isAdmin && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register'))) {
      // Send them to dashboard ONLY if they try to access the normal login/register
      return redirectWithCookies('/dashboard')
    }
    
    // Normal user accessing admin login/register: let them stay there so they can switch accounts or see the "Access denied" error.
  }

  return supabaseResponse
}
