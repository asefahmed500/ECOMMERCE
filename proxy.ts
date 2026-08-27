import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const SESSION_COOKIE = "ecomi_session"

function hasSession(request: NextRequest) {
  return Boolean(request.cookies.get(SESSION_COOKIE)?.value)
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const authed = hasSession(request)

  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/account")

  if (isProtected && !authed) {
    const url = new URL("/login", request.url)
    url.searchParams.set("next", pathname + search)
    return NextResponse.redirect(url)
  }

  if (authed && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/notifications", "/login", "/register"],
}
