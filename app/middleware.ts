import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const auth = request.headers.get("authorization")
    if (auth !== `Basic ${btoa("admin:mpg3d2026")}`) {
      return new NextResponse("Zugriff verweigert", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Admin"',
        },
      })
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}