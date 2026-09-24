import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const roleHome: Record<string, string> = {
  LANDLORD: "/landlord/dashboard",
  PROPERTY_MANAGER: "/landlord/dashboard",
  TENANT: "/tenant/dashboard",
  CARETAKER: "/caretaker/dashboard",
  ADMIN: "/admin/dashboard",
  SUPER_ADMIN: "/admin/dashboard",
};

const isAdminRole = (role: string) => role === "ADMIN" || role === "SUPER_ADMIN";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role as string | null | undefined;
    const path = req.nextUrl.pathname;

    if (!role) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    if (path.startsWith("/landlord") && role !== "LANDLORD" && role !== "PROPERTY_MANAGER") {
      return NextResponse.redirect(new URL(roleHome[role] ?? "/", req.url));
    }
    if (path.startsWith("/tenant") && role !== "TENANT") {
      return NextResponse.redirect(new URL(roleHome[role] ?? "/", req.url));
    }
    if (path.startsWith("/caretaker") && role !== "CARETAKER") {
      return NextResponse.redirect(new URL(roleHome[role] ?? "/", req.url));
    }
    if (path.startsWith("/admin") && !isAdminRole(role)) {
      return NextResponse.redirect(new URL(roleHome[role] ?? "/", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/landlord/:path*", "/tenant/:path*", "/caretaker/:path*", "/admin/:path*"],
};
