import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  const isAuthPage = request.nextUrl.pathname === '/login' || 
                     request.nextUrl.pathname === '/signup'
  
  const isTodoPage = request.nextUrl.pathname.startsWith('/todos')

  if (isTodoPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/todos', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/todos/:path*', '/login', '/signup']
}