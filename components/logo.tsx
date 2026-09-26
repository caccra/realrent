export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#1B4D3A" />
      <path d="M17 30L32 17L47 30" fill="none" stroke="#F6F4EE" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="36" r="6.5" fill="#E8804A" />
      <path d="M28.6 40.5L35.4 40.5L33.6 48L30.4 48Z" fill="#E8804A" />
    </svg>
  );
}

export function Logo({
  className = "",
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const textColor = variant === "light" ? "text-white" : "text-ivy-800";
  return (
    <span className={`inline-flex items-center gap-2 font-heading text-lg font-bold ${textColor} ${className}`}>
      <LogoMark />
      kezavi
    </span>
  );
}
