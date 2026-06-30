import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

export default async function proxy(req: NextRequest) {
  const session = await auth()
  const isLoggedIn = !!session?.user
  
  // Exclude landing page and auth APIs
  const isOnLandingPage = req.nextUrl.pathname === '/'
  const isAuthRoute = req.nextUrl.pathname.startsWith('/api/auth')

  if (isOnLandingPage || isAuthRoute) {
    return NextResponse.next()
  }

  if (isLoggedIn) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to the landing page
  return NextResponse.redirect(new URL('/', req.nextUrl))
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|$).*)"],
}
