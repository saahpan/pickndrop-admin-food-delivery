import { type NextRequest, NextResponse } from "next/server";

const AUTH_PATHS = ["/auth/v1/login", "/auth/v2/login", "/auth/v1/register", "/auth/v2/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));
  if (isAuthPath || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = request.cookies.get("__session");

  if (!session?.value) {
    const loginUrl = new URL("/auth/v1/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|\\.netlify|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
