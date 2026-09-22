import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-slate-500 sm:flex-row">
        <p>© {new Date().getFullYear()} RealRent</p>
        <nav className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-slate-900">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-slate-900">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
