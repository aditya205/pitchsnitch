type ScoreRingProps = {
  /** 0–100. Undefined/null renders an empty track with a dash — "not yet scored". */
  score?: number | null;
  size?: number;
};

export function ScoreRing({ score, size = 28 }: ScoreRingProps) {
  const stroke = Math.max(2.5, size * 0.065);
  const fontSize = Math.max(10, Math.round(size * 0.27));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const scored = typeof score === "number";
  const clamped = scored ? Math.max(0, Math.min(100, score)) : 0;

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={scored ? `Score ${clamped} out of 100` : "Not yet scored"}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-line"
        />
        {scored && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - clamped / 100)}
            className="stroke-ink"
          />
        )}
      </svg>
      <span
        style={{ fontSize }}
        className={
          scored
            ? "absolute font-semibold leading-none text-ink"
            : "absolute leading-none text-ink-tertiary"
        }
      >
        {scored ? clamped : "–"}
      </span>
    </span>
  );
}
