import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  // Any protected route first requires an authenticated session.
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin area additionally requires the admin role.
  if (pathname.startsWith("/admin")) {
    const role = (req.auth.user as { role?: string })?.role;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/listings/new",
    "/listings/:id/edit",
    "/services/new",
  ],
};
