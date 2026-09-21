export function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const dimension = size === "md" ? "h-5 w-5" : "h-4 w-4";
  const rounded = Math.round(rating);

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 20 20"
          className={`${dimension} ${n <= rounded ? "fill-amber-400" : "fill-slate-200"}`}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />
        </svg>
      ))}
    </span>
  );
}
