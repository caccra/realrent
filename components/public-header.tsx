import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-emerald-800">
          RealRent
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/properties" className="text-slate-600 hover:text-slate-900">
            Browse properties
          </Link>
          <Link href="/login" className="text-slate-600 hover:text-slate-900">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
