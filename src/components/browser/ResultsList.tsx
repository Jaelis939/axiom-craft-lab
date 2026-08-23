import { ExternalLink } from "lucide-react";
import type { SearchResult } from "@/data/search-results";

type ResultsListProps = {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
};

export function ResultsList({ query, results, isLoading }: ResultsListProps) {
  if (isLoading) {
    return (
      <ul className="space-y-4" aria-busy="true" aria-label="Loading results">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="rounded-xl border border-chrome-border/60 bg-chrome-elevated/40 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-chrome-border" />
            <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-chrome-border" />
            <div className="mt-3 h-3 w-full animate-pulse rounded bg-chrome-border/70" />
          </li>
        ))}
      </ul>
    );
  }

  if (!query) {
    return (
      <p className="text-sm text-chrome-muted">
        Start typing above to search the local index — try “css”, “react”, “http” or “database”.
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-chrome-border/60 bg-chrome-elevated/40 p-6">
        <p className="text-sm font-medium text-chrome-foreground">No results for “{query}”</p>
        <p className="mt-1 text-sm text-chrome-muted">
          Check the spelling or search for a broader term.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="mb-4 text-xs uppercase tracking-wider text-chrome-muted">
        {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
      </p>
      <ul className="space-y-3">
        {results.map((result) => (
          <li key={result.id}>
            <article className="group rounded-xl border border-chrome-border/60 bg-chrome-elevated/40 p-4 transition hover:border-chrome-accent/60 hover:bg-chrome-elevated/70">
              <p className="truncate text-xs text-chrome-muted">{result.url}</p>
              <h3 className="mt-1 text-base font-semibold text-chrome-foreground">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 hover:text-chrome-accent"
                >
                  {result.title}
                  <ExternalLink className="size-3.5 opacity-0 transition group-hover:opacity-100" />
                </a>
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-chrome-muted">{result.snippet}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {result.tags.slice(0, 4).map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-chrome-border px-2 py-0.5 text-[11px] text-chrome-muted"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ul>
    </>
  );
}
