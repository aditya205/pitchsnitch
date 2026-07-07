import Link from "next/link";

export default function DealNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center">
      <p className="text-sm font-medium text-ink-secondary">Deal not found</p>
      <p className="text-[13px] text-ink-tertiary">
        It may have been removed, or the link is wrong.
      </p>
      <Link
        href="/"
        className="mt-2 text-[13px] text-accent hover:underline"
      >
        ← Back to pipeline
      </Link>
    </div>
  );
}
