import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/groups/new",
  "/onboarding",
  "/profile",
  "/notifications",
  "/calendar",
  "/bookmarks",
  "/settings",
  "/my-groups",
  "/resources",
];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/groups/new",
    "/onboarding/:path*",
    "/profile/:path*",
    "/notifications/:path*",
    "/calendar/:path*",
    "/bookmarks/:path*",
    "/settings/:path*",
    "/my-groups/:path*",
    "/resources/:path*",
  ],
};
