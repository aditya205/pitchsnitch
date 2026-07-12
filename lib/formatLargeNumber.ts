const SUFFIX_MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  m: 1_000_000,
  mm: 1_000_000,
  mn: 1_000_000,
  million: 1_000_000,
  b: 1_000_000_000,
  bn: 1_000_000_000,
  billion: 1_000_000_000,
};

const CURRENCY_TOKEN =
  "US\\$|S\\$|A\\$|C\\$|[$₹€£]|USD|INR|EUR|GBP|SGD|AUD|CAD|Rs\\.?|rupees?|dollars?|euros?|pounds?";
const MAGNITUDE_TOKEN =
  "k|m|mm|mn|million|b|bn|billion";
const RAW_NUMBER_TOKEN =
  "[+-]?(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?";
const NUMBER_TOKEN =
  new RegExp(
    `(?:(${CURRENCY_TOKEN})\\s*)?(${RAW_NUMBER_TOKEN})(?:\\s*(${MAGNITUDE_TOKEN}))?(?:\\s*(${CURRENCY_TOKEN}))?(?![A-Za-z0-9_])`,
    "gi"
  );

function formatScaledNumber(value: number): string {
  const fixed = value.toFixed(2);
  const [whole, decimal] = fixed.split(".");
  const wholeFormatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(whole));

  return decimal === "00" ? wholeFormatted : `${wholeFormatted}.${decimal}`;
}

function formatPlainNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMagnitude(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `${formatScaledNumber(value / 1_000_000_000)} Bn`;
  }
  if (abs >= 1_000_000) {
    return `${formatScaledNumber(value / 1_000_000)} Mn`;
  }
  return formatPlainNumber(value);
}

function tokenValue(number: string, suffix?: string): number | null {
  const parsed = Number(number.replaceAll(",", ""));
  if (!Number.isFinite(parsed)) return null;
  const multiplier = suffix
    ? SUFFIX_MULTIPLIERS[suffix.toLowerCase()] ?? 1
    : 1;
  return parsed * multiplier;
}

function currencySymbol(token?: string): string {
  const normalized = token?.trim().toLowerCase().replace(/\.$/, "");
  if (!normalized) return "";

  if (["$", "us$", "usd", "dollar", "dollars"].includes(normalized)) return "$";
  if (["₹", "inr", "rs", "rupee", "rupees"].includes(normalized)) return "₹";
  if (["€", "eur", "euro", "euros"].includes(normalized)) return "€";
  if (["£", "gbp", "pound", "pounds"].includes(normalized)) return "£";
  if (["s$", "sgd"].includes(normalized)) return "S$";
  if (["a$", "aud"].includes(normalized)) return "A$";
  if (["c$", "cad"].includes(normalized)) return "C$";

  return token?.trim() ?? "";
}

/**
 * Formats numeric tokens for fund-facing amount fields. Currency cues next to
 * the number are normalized to symbols, while surrounding text is preserved.
 */
export function formatLargeNumber(value: unknown): string | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? formatMagnitude(value) : null;
  }
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  let changed = false;
  const formatted = trimmed.replaceAll(
    NUMBER_TOKEN,
    (
      match: string,
      prefix: string | undefined,
      number: string,
      magnitude: string | undefined,
      trailingCurrency: string | undefined
    ) => {
      const parsed = tokenValue(number, magnitude);
      if (parsed == null) return match;

      changed = true;
      const symbol = currencySymbol(prefix) || currencySymbol(trailingCurrency);
      return `${symbol}${formatMagnitude(parsed)}`;
    }
  );

  return changed ? formatted : trimmed;
}

export function formatRoundWithStage(
  stage: string | null | undefined,
  amount: unknown
): string | null {
  const cleanStage = typeof stage === "string" && stage.trim()
    ? stage.trim()
    : null;
  const formattedAmount = formatLargeNumber(amount);

  if (!cleanStage) return formattedAmount;
  if (!formattedAmount) return cleanStage;
  if (formattedAmount.toLowerCase().includes(cleanStage.toLowerCase())) {
    return formattedAmount;
  }

  return `${cleanStage} · ${formattedAmount}`;
}
