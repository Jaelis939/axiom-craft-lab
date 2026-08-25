import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import {
  Gamepad2,
  Sparkles,
  Loader2,
  Download,
  RefreshCw,
  Wand2,
  Code2,
  Play,
  Square,
} from "lucide-react";
import { toast } from "sonner";

import { GameFrame } from "@/components/studio/GameFrame";
import { extractHtml } from "@/lib/game-prompt";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const IDEAS = [
  "Neon snake with power-ups and a combo multiplier",
  "Space shooter with waves, boss and screen shake",
  "Endless runner on a synthwave grid",
  "Brick breaker with particle explosions",
  "Flappy-style bird through a neon canyon",
  "Tower defense on a hex grid",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arcadia — Free AI Game Generator" },
      {
        name: "description",
        content:
          "Describe any game and Arcadia builds a polished, playable HTML5 game in seconds — free, fast, and instantly downloadable.",
      },
      { property: "og:title", content: "Arcadia — Free AI Game Generator" },
      {
        property: "og:description",
        content:
          "Type an idea, get a complete browser game with graphics, sound and controls. Play it instantly or download the single HTML file.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  const [idea, setIdea] = useState("");
  const [status, setStatus] = useState<"idle" | "building">("idle");
  const [chars, setChars] = useState(0);
  const [html, setHtml] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [version, setVersion] = useState(0);
  const [lastIdea, setLastIdea] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const build = useCallback(
    async (prompt: string, remix: boolean) => {
      const trimmed = prompt.trim();
      if (trimmed.length < 3) {
        toast.error("Describe the game you want first.");
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("building");
      setChars(0);
      setShowCode(false);

      try {
        const response = await fetch("/api/generate-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idea: trimmed,
            ...(remix && html ? { previousHtml: html } : {}),
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? "Build failed. Please try again.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let raw = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += decoder.decode(value, { stream: true });
          setChars(raw.length);
        }

        const doc = extractHtml(raw);
        if (!doc.toLowerCase().includes("</html>")) {
          throw new Error("The game came back incomplete — try building again.");
        }
        setHtml(doc);
        setLastIdea(trimmed);
        setVersion((v) => v + 1);
        toast.success(remix ? "Game updated." : "Game ready — press play in the preview.");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        toast.error((error as Error).message);
      } finally {
        setStatus("idle");
        abortRef.current = null;
      }
    },
    [html],
  );

  const download = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(lastIdea || "game").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const building = status === "building";

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-arcade-grid opacity-[0.35]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-52 right-0 h-[32rem] w-[32rem] rounded-full bg-accent/20 blur-[140px]" />

      <div className="relative mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="size-3.5" /> free · unlimited · instant
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Describe a game.
            <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Play it seconds later.
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            Arcadia writes a complete HTML5 game — graphics, sound, controls, scoring and
            difficulty curve — in one self-contained file you can play here or download.
          </p>
        </header>

        <section className="mt-10 rounded-2xl border border-border bg-card/70 p-4 shadow-glow backdrop-blur-xl sm:p-6">
          <label htmlFor="idea" className="font-display text-sm font-semibold tracking-wide">
            What should we build?
          </label>
          <Textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) build(idea, false);
            }}
            placeholder="A fast neon platformer where you dash through collapsing floors, with combo scoring and a boss at 60 seconds…"
            rows={3}
            className="mt-3 resize-none border-input bg-background/60 text-base"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {IDEAS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setIdea(preset)}
                className="rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={() => build(idea, false)}
              disabled={building}
              className="font-display tracking-wide"
            >
              {building ? (
                <>
                  <Loader2 className="animate-spin" /> Building…
                </>
              ) : (
                <>
                  <Gamepad2 /> Generate game
                </>
              )}
            </Button>

            {html && !building && (
              <Button size="lg" variant="secondary" onClick={() => build(idea || lastIdea, true)}>
                <Wand2 /> Improve current game
              </Button>
            )}

            {building && (
              <>
                <Button size="lg" variant="outline" onClick={() => abortRef.current?.abort()}>
                  <Square /> Stop
                </Button>
                <span className="text-xs text-muted-foreground">
                  {chars.toLocaleString()} characters written
                </span>
              </>
            )}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">
              {html ? `Preview · v${version}` : "Preview"}
            </h2>
            {html && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setVersion((v) => v + 1)}>
                  <RefreshCw /> Restart
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowCode((s) => !s)}>
                  <Code2 /> {showCode ? "Hide code" : "View code"}
                </Button>
                <Button size="sm" onClick={download}>
                  <Download /> Download HTML
                </Button>
              </div>
            )}
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card/60 shadow-glow backdrop-blur-xl">
            <div className="aspect-video w-full">
              {html ? (
                <GameFrame key={version} html={html} title={lastIdea || "Generated game"} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  {building ? (
                    <>
                      <Loader2 className="size-8 animate-spin text-primary" />
                      <p className="font-display text-sm">Writing your game engine…</p>
                      <p className="text-xs text-muted-foreground">
                        {chars.toLocaleString()} characters and counting
                      </p>
                    </>
                  ) : (
                    <>
                      <Play className="size-8 text-primary" />
                      <p className="font-display text-sm">Your game will appear here</p>
                      <p className="max-w-sm text-xs text-muted-foreground">
                        Keyboard and touch controls included. Click inside the frame first so the
                        game receives your input.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {showCode && html && (
            <pre className="mt-3 max-h-96 overflow-auto rounded-2xl border border-border bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground">
              <code>{html}</code>
            </pre>
          )}
        </section>
      </div>
    </main>
  );
}
