import Link from "next/link";
import { Logo } from "@/components/logo";

export function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/#features" className="hidden text-slate-600 hover:text-slate-900 sm:inline">
            Features
          </Link>
          <Link href="/how-it-works" className="hidden text-slate-600 hover:text-slate-900 sm:inline">
            How it works
          </Link>
          <Link href="/pricing" className="hidden text-slate-600 hover:text-slate-900 sm:inline">
            Pricing
          </Link>
          <Link href="/about" className="hidden text-slate-600 hover:text-slate-900 sm:inline">
            About
          </Link>
          <Link href="/properties" className="text-slate-600 hover:text-slate-900">
            Browse properties
          </Link>
          <Link href="/login" className="text-slate-600 hover:text-slate-900">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-ivy-700 px-4 py-2 font-medium text-white hover:bg-ivy-800"
          >
            Get started free
          </Link>
        </nav>
      </div>
    </header>
  );
}
