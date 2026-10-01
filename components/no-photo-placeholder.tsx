export function NoPhotoPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-mint text-ivy-700">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="M21 16l-5.5-5.5a2 2 0 00-2.8 0L5 18" />
      </svg>
      <span className="text-sm font-medium">No photo yet</span>
    </div>
  );
}
