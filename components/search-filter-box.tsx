"use client";

export function SearchFilterBox({
  placeholder,
  containerId,
}: {
  placeholder: string;
  containerId: string;
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value.toLowerCase().trim();
    const container = document.getElementById(containerId);
    if (!container) return;
    const items = container.querySelectorAll<HTMLElement>("[data-search-text]");
    items.forEach((el) => {
      const text = el.dataset.searchText ?? "";
      el.hidden = q.length > 0 && !text.includes(q);
    });
  }

  return (
    <input
      type="search"
      onChange={handleChange}
      placeholder={placeholder}
      className="mb-4 w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
    />
  );
}
