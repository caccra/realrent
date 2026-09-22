import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <PublicHeader />

      <main className="mx-auto flex max-w-5xl flex-1 flex-col justify-center px-6 py-20">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Rent tracking and digital leases, built for Uganda landlords and tenants.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-slate-600">
          Manage properties and units, issue digital leases, track rent due and paid, and give
          every tenant a clear receipt trail — no more verbal agreements or lost records.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/register?role=LANDLORD"
            className="rounded-md bg-emerald-700 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-800"
          >
            I&apos;m a Landlord
          </Link>
          <Link
            href="/register?role=TENANT"
            className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            I&apos;m a Tenant
          </Link>
          <Link
            href="/properties"
            className="rounded-md px-5 py-3 text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Browse available properties →
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
