import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { BrowserToolbar } from "@/components/browser/BrowserToolbar";
import { ResultsList } from "@/components/browser/ResultsList";
import { searchIndex } from "@/data/search-results";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nova Browser — Search the local index" },
      {
        name: "description",
        content:
          "A browser-style search workspace with an address bar, ranked results list, and back, forward, reload and home navigation controls.",
      },
      { property: "og:title", content: "Nova Browser — Search the local index" },
      {
        property: "og:description",
        content:
          "Search a curated developer index with a familiar browser interface: address bar, ranked results and history navigation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BrowserPage,
});

function BrowserPage() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([""]);
  const [cursor, setCursor] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = history[cursor] ?? "";
  const results = useMemo(() => searchIndex(query), [query]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function startLoading() {
    if (timer.current) clearTimeout(timer.current);
    setIsLoading(true);
    timer.current = setTimeout(() => setIsLoading(false), 320);
  }

  function navigate(next: string) {
    const trimmed = next.trim();
    if (trimmed === query) {
      startLoading();
      return;
    }
    const nextHistory = [...history.slice(0, cursor + 1), trimmed];
    setHistory(nextHistory);
    setCursor(nextHistory.length - 1);
    setInput(trimmed);
    startLoading();
  }

  function goTo(index: number) {
    setCursor(index);
    setInput(history[index] ?? "");
    startLoading();
  }

  return (
    <main className="min-h-screen bg-chrome px-3 py-6 text-chrome-foreground sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-chrome-border bg-chrome-elevated/30 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-chrome-border bg-chrome-elevated/70 px-4 py-2.5">
          <span className="size-3 rounded-full bg-chrome-border" />
          <span className="size-3 rounded-full bg-chrome-border" />
          <span className="size-3 rounded-full bg-chrome-border" />
          <div className="ml-3 flex items-center gap-2 rounded-t-md bg-chrome px-3 py-1.5 text-xs text-chrome-muted">
            <Globe className="size-3.5 text-chrome-accent" />
            <span className="max-w-40 truncate">{query || "New tab"}</span>
          </div>
        </div>

        <BrowserToolbar
          value={input}
          onValueChange={setInput}
          onSubmit={() => navigate(input)}
          onBack={() => cursor > 0 && goTo(cursor - 1)}
          onForward={() => cursor < history.length - 1 && goTo(cursor + 1)}
          onReload={startLoading}
          onHome={() => navigate("")}
          canGoBack={cursor > 0}
          canGoForward={cursor < history.length - 1}
          isLoading={isLoading}
        />

        <div className="min-h-[26rem] px-4 py-6 sm:px-8">
          {!query && !isLoading ? (
            <header className="mb-8 text-center">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nova Browser</h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-chrome-muted">
                A browser-style workspace over a curated developer index.
              </p>
            </header>
          ) : null}
          <ResultsList query={query} results={results} isLoading={isLoading} />
        </div>
      </div>
    </main>
  );
}
