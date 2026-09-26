import Link from "next/link";
import { Logo } from "@/components/logo";

const COLUMNS = [
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/how-it-works", label: "Property Management" },
      { href: "/how-it-works", label: "Tenant Management" },
      { href: "/how-it-works", label: "Rent & Payments" },
      { href: "/how-it-works", label: "Maintenance" },
      { href: "/how-it-works", label: "Reports" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/contact", label: "Help Center" },
      { href: "/contact", label: "Contact Support" },
      { href: "/contact", label: "FAQs" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/cookies", label: "Cookie Policy" },
    ],
  },
] as const;

export function PublicFooter() {
  return (
    <footer className="bg-ivy-900">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/">
              <Logo variant="light" />
            </Link>
            <p className="mt-2 text-sm text-ivy-200">Smarter property management. Simpler real estate.</p>
            <p className="mt-2 text-sm text-ivy-200">
              Manage properties, tenants, payments, leases, maintenance, and more — all from one
              platform.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-medium text-white">{column.title}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-ivy-200 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-ivy-200">
          © {new Date().getFullYear()} Kezavi
        </div>
      </div>
    </footer>
  );
}
