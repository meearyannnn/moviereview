/**
 * WatchProviders.tsx
 * "Where to Watch" panel — fetches TMDB JustWatch data and renders
 * streaming/rent/buy providers with logos, names and type badges.
 * Detects user country via Intl API (falls back to US).
 */
import { useEffect, useState, memo } from "react";
import { Tv2, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { tmdb } from "@/services/tmdb";

interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

interface ProviderGroup {
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
  link?: string;
}

interface WatchProvidersProps {
  mediaId: number;
  mediaType: "movie" | "tv";
}

// Infer locale country (e.g. "IN", "US")
const getUserCountry = (): string => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const parts = locale.split("-");
    return parts[parts.length - 1].toUpperCase() || "US";
  } catch {
    return "US";
  }
};

const BADGE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  flatrate: { label: "Stream",     color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  rent:     { label: "Rent",       color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  buy:      { label: "Buy",        color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
};

export const WatchProviders = memo(({ mediaId, mediaType }: WatchProvidersProps) => {
  const [providers, setProviders] = useState<ProviderGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState("US");
  const [error, setError] = useState(false);

  useEffect(() => {
    const c = getUserCountry();
    setCountry(c);
    setLoading(true);
    setError(false);
    setProviders(null);

    tmdb
      .getWatchProviders(mediaId, mediaType)
      .then((data) => {
        const results = data?.results ?? {};
        // Try user country, fallback to US, then first available
        const group: ProviderGroup =
          results[c] ?? results["US"] ?? Object.values(results)[0] ?? null;
        setProviders(group);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [mediaId, mediaType]);

  const allProviders: { type: string; list: Provider[] }[] = [];
  if (providers?.flatrate?.length) allProviders.push({ type: "flatrate", list: providers.flatrate.slice(0, 6) });
  if (providers?.rent?.length)     allProviders.push({ type: "rent",     list: providers.rent.slice(0, 6) });
  if (providers?.buy?.length)      allProviders.push({ type: "buy",      list: providers.buy.slice(0, 4) });

  const hasProviders = allProviders.length > 0;

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.35)" }}
          >
            <Tv2 className="h-3.5 w-3.5 text-red-400" />
          </span>
          Where to Watch
        </h2>
        {providers?.link && (
          <a
            href={providers.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white/80 transition-colors"
          >
            All options
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Card */}
      <div
        className="rounded-2xl border border-white/[0.08] overflow-hidden"
        style={{ background: "rgba(11,13,19,0.85)", backdropFilter: "blur(12px)" }}
      >
        {loading && (
          <div className="flex items-center justify-center gap-2.5 py-10 text-white/30">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading providers…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 px-5 py-8 text-white/40">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">Could not load streaming data.</span>
          </div>
        )}

        {!loading && !error && !hasProviders && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-white/35">No streaming options found for your region.</p>
            <p className="mt-1 text-xs text-white/25">Try a VPN or check a different country.</p>
          </div>
        )}

        {!loading && !error && hasProviders && (
          <div className="divide-y divide-white/[0.05]">
            {allProviders.map(({ type, list }) => {
              const badge = BADGE_STYLES[type];
              return (
                <div key={type} className="px-5 py-4">
                  {/* Type label */}
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.color}25` }}
                    >
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-white/25 font-medium">
                      {country !== "US" ? `• ${country}` : ""}
                    </span>
                  </div>

                  {/* Provider logos */}
                  <div className="flex flex-wrap gap-3">
                    {list.map((p) => (
                      <a
                        key={p.provider_id}
                        href={providers?.link ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={p.provider_name}
                        className="group flex flex-col items-center gap-1.5 focus-visible:outline-none"
                      >
                        <div
                          className="relative h-11 w-11 overflow-hidden rounded-xl border border-white/10 transition-all duration-200 group-hover:border-white/35 group-hover:scale-105 group-hover:shadow-lg"
                          style={{ boxShadow: "0 0 0 0 transparent" }}
                        >
                          <img
                            src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                            alt={p.provider_name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="max-w-[52px] truncate text-center text-[9px] font-semibold text-white/45 group-hover:text-white/70 transition-colors leading-tight">
                          {p.provider_name}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Powered-by note */}
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-[10px] text-white/20">Powered by JustWatch via TMDB</span>
              <span className="text-[10px] text-white/20">{country} region</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

WatchProviders.displayName = "WatchProviders";
