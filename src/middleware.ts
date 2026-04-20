import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookie } from "better-auth/cookies";

// Routes yang tidak memerlukan authentication
const publicRoutes = ['/login', '/register']

// Routes yang hanya bisa diakses oleh ADMIN
const adminRoutes = ['/users', '/settings', '/audit', '/riwayat-kas']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = getSessionCookie(request);

  // 1. Skip middleware untuk static files dan API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 2. Optimistic check: Jika tidak ada cookie dan rute private -> langsung tendang ke login
  if (!sessionCookie && !publicRoutes.includes(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 3. Jika ada cookie atau rute publik, baru cek validasi session yang sebenarnya
  let token = null;
  if (sessionCookie) {
    const sessionResponse = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }).catch(() => null);

    if (sessionResponse?.ok) {
      const sessionData = await sessionResponse.json();
      token = sessionData?.user;
    }
  }

  // Jika user sudah login dan mencoba akses halaman login/register
  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check admin-only routes
  if (token && adminRoutes.some(route => pathname.startsWith(route))) {
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
