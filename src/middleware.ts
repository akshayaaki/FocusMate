import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Direct open access across all student workspace modules
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
