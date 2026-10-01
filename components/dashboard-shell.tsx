import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { NotificationBell } from "@/components/notification-bell";
import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";
import { MobileNav } from "@/components/mobile-nav";

export function DashboardShell({
  title,
  userName,
  nav,
  children,
}: {
  title: string;
  userName: string;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-60 shrink-0 flex-col bg-ivy-900 p-4 lg:flex">
        <Link href="/">
          <Logo variant="light" />
        </Link>
        <div className="mt-8">
          <NavLinks nav={nav} />
        </div>
      </aside>

      <div className="flex min-h-full flex-1 flex-col bg-sand">
        <header className="relative border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Logo />
            </Link>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <MobileNav nav={nav} userName={userName} />
            </div>
          </div>
        </header>

        <div className="hidden items-center justify-between border-b border-slate-200 bg-white px-8 py-4 lg:flex">
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <NotificationBell />
            <span>{userName}</span>
            <SignOutButton />
          </div>
        </div>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <h1 className="mb-6 text-xl font-semibold text-slate-900 lg:hidden">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
