export function SoldOutBadge({ label }: { label?: string | null }) {
  if (!label) return null;
  return (
    <span className="ml-2 inline-flex shrink-0 items-center rounded-full border border-red-400/50 bg-red-500/10 px-2 py-0.5 align-middle text-[11px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-300">
      {label}
    </span>
  );
}
