export function SetupNotice({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="max-w-md rounded-card border border-line bg-surface p-5">
        <h2 className="text-sm font-medium text-ink">Database not connected</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">
          {message}
        </p>
      </div>
    </div>
  );
}
