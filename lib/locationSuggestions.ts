import { countries, type ICountry, type TCountryCode } from "countries-list";

export type LocationSuggestion = {
  label: string;
  kind: "city" | "country";
};

type Candidate = LocationSuggestion & {
  search: string[];
  priority: number;
};

const MAX_QUERY_LENGTH = 80;

const STARTUP_HUBS: Candidate[] = [
  city("San Francisco", "California", "United States", ["sf", "bay area", "silicon valley"]),
  city("New York", "New York", "United States", ["nyc"]),
  city("Boston", "Massachusetts", "United States"),
  city("Seattle", "Washington", "United States"),
  city("Austin", "Texas", "United States"),
  city("Los Angeles", "California", "United States", ["la"]),
  city("Palo Alto", "California", "United States"),
  city("Mountain View", "California", "United States"),
  city("Bengaluru", "Karnataka", "India", ["bangalore"]),
  city("Mumbai", "Maharashtra", "India"),
  city("Delhi", null, "India", ["new delhi"]),
  city("Gurugram", "Haryana", "India", ["gurgaon"]),
  city("Hyderabad", "Telangana", "India"),
  city("Pune", "Maharashtra", "India"),
  city("Chennai", "Tamil Nadu", "India"),
  city("Singapore", null, "Singapore"),
  city("London", null, "United Kingdom", ["uk"]),
  city("Berlin", null, "Germany"),
  city("Paris", null, "France"),
  city("Amsterdam", null, "Netherlands"),
  city("Stockholm", null, "Sweden"),
  city("Dublin", null, "Ireland"),
  city("Tel Aviv", null, "Israel"),
  city("Dubai", null, "United Arab Emirates", ["uae"]),
  city("Toronto", "Ontario", "Canada"),
  city("Vancouver", "British Columbia", "Canada"),
  city("Sydney", "New South Wales", "Australia"),
  city("Melbourne", "Victoria", "Australia"),
  city("Tokyo", null, "Japan"),
  city("Seoul", null, "South Korea"),
  city("Jakarta", null, "Indonesia"),
  city("Ho Chi Minh City", null, "Vietnam", ["saigon"]),
];

const COUNTRY_ALIASES: Partial<Record<TCountryCode, string[]>> = {
  AE: ["uae", "emirates"],
  GB: ["uk", "britain", "great britain"],
  IN: ["bharat"],
  KR: ["korea"],
  US: ["usa", "us", "america", "united states of america"],
  VN: ["viet nam"],
};

let countryCandidates: Candidate[] | null = null;

function city(
  name: string,
  region: string | null,
  country: string,
  aliases: string[] = []
): Candidate {
  const label =
    !region && name === country
      ? name
      : [name, region, country].filter(Boolean).join(", ");
  return {
    label,
    kind: "city",
    priority: 0,
    search: [name, region, country, label, ...aliases].filter(Boolean) as string[],
  };
}

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function cappedQuery(query: string) {
  return normalize(query).slice(0, MAX_QUERY_LENGTH);
}

function countryNameCandidates(): Candidate[] {
  if (countryCandidates) return countryCandidates;

  countryCandidates = (
    Object.entries(countries) as Array<[TCountryCode, ICountry]>
  ).flatMap(([code, country]) => {
    const countryCandidate: Candidate = {
      label: country.name,
      kind: "country",
      priority: 2,
      search: [
        code,
        country.name,
        country.native,
        country.capital,
        ...(COUNTRY_ALIASES[code] ?? []),
      ].filter(Boolean),
    };

    if (!country.capital || country.capital === country.name) {
      return [countryCandidate];
    }

    return [
      {
        label: `${country.capital}, ${country.name}`,
        kind: "city",
        priority: 1,
        search: [country.capital, country.name, countryCandidate.label],
      },
      countryCandidate,
    ];
  });

  return countryCandidates;
}

function candidateRank(candidate: Candidate, query: string) {
  let best: number | null = null;
  for (const term of candidate.search) {
    const normalized = normalize(term);
    let rank: number | null = null;
    if (normalized === query) rank = 0;
    else if (normalized.startsWith(query)) rank = 10;
    else if (normalized.includes(query)) rank = 20;

    if (rank !== null) {
      rank += candidate.priority;
      best = best === null ? rank : Math.min(best, rank);
    }
  }
  return best;
}

function pushUnique(
  suggestions: LocationSuggestion[],
  seen: Set<string>,
  suggestion: LocationSuggestion
) {
  const key = normalize(suggestion.label);
  if (seen.has(key)) return;
  seen.add(key);
  suggestions.push(suggestion);
}

export function suggestLocations(query: string, limit = 8): LocationSuggestion[] {
  const q = cappedQuery(query);
  if (q.length < 2) return [];

  const seen = new Set<string>();
  const suggestions: LocationSuggestion[] = [];
  const matches = [...STARTUP_HUBS, ...countryNameCandidates()]
    .map((candidate) => ({ candidate, rank: candidateRank(candidate, q) }))
    .filter(
      (match): match is { candidate: Candidate; rank: number } =>
        match.rank !== null
    )
    .sort(
      (a, b) =>
        a.rank - b.rank || a.candidate.label.localeCompare(b.candidate.label)
    );

  for (const { candidate } of matches) {
    if (suggestions.length >= limit) break;
    pushUnique(suggestions, seen, candidate);
  }

  return suggestions;
}
