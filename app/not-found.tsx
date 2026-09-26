import Link from "next/link";
import { Button } from "@/components/ui";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="max-w-sm text-center">
        <Logo className="justify-center" />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
        </p>
        <div className="mt-6">
          <Link href="/">
            <Button type="button">Go home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
