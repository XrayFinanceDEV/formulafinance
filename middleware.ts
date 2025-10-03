import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { ROUTE_PERMISSIONS, UserRole } from './types/rbac'

// Public routes (no authentication required)
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/confirm',
  '/',
]

// Static routes that don't need auth
const STATIC_ROUTES = ['/_next', '/api', '/favicon.ico', '/public']

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Allow static routes
  if (STATIC_ROUTES.some(route => path.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => path === route || path.startsWith(route))) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: req,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('from', path)
    return NextResponse.redirect(loginUrl)
  }

  // Get user role from JWT metadata (fast check)
  const userRole = session.user.app_metadata?.role as UserRole

  if (!userRole) {
    // If no role assigned, redirect to unauthorized page
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  // Check route permissions
  const matchedRoute = findMatchingRoute(path)

  if (matchedRoute) {
    const allowedRoles = ROUTE_PERMISSIONS[matchedRoute]

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      // User doesn't have permission for this route
      return NextResponse.redirect(new URL('/forbidden', req.url))
    }
  }

  return response
}

/**
 * Find matching route pattern for dynamic routes
 * Examples: /customers/123 -> /customers/[id]
 */
function findMatchingRoute(path: string): string | null {
  // First check for exact match
  if (ROUTE_PERMISSIONS[path]) {
    return path
  }

  // Check for dynamic route patterns
  for (const route of Object.keys(ROUTE_PERMISSIONS)) {
    // Convert route pattern to regex
    // /customers/[id] -> /customers/([^/]+)
    // /customers/[id]/edit -> /customers/([^/]+)/edit
    const routePattern = route.replace(/\[.*?\]/g, '[^/]+')
    const regex = new RegExp(`^${routePattern}$`)

    if (regex.test(path)) {
      return route
    }
  }

  return null
}

// Configure which routes middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
