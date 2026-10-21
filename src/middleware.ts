import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookie } from "better-auth/cookies";

const publicRoutes = ['/login', '/register']

const adminRoutes = ['/audit', '/riwayat-kas']

const superAdminRoutes = ['/settings', '/users', '/cabang']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = getSessionCookie(request);

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/tablet') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  if (!sessionCookie && !publicRoutes.includes(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

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

  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (token && superAdminRoutes.some(route => pathname.startsWith(route))) {
    if (token.role !== 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  if (token && adminRoutes.some(route => pathname.startsWith(route))) {
    if (token.role !== 'ADMIN' && token.role !== 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|api/health|api/tablet|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
