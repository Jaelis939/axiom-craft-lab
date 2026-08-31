import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  Boxes,
  Loader2,
  Play,
  RefreshCw,
  Send,
  Square,
  Terminal,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { EngineSettings } from "@/components/studio/EngineSettings";
import { FileExplorer } from "@/components/studio/FileExplorer";
import { PreviewFrame, type PreviewHandle } from "@/components/studio/PreviewFrame";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { runAgent, type AgentEvent } from "@/lib/cryptoxi/agent";
import { build } from "@/lib/cryptoxi/bundler";
import { project, useProject } from "@/lib/cryptoxi/project";
import { isConfigured, loadProvider, type ProviderConfig, DEFAULT_PROVIDER } from "@/lib/cryptoxi/provider";

const IDEAS = [
  "Create a 3D zombie survival game with inventory, weapons, crafting, quests, enemies, day/night cycle and a large map.",
  "Build a first-person parkour runner with wall-running, grapple hook and a timer leaderboard.",
  "Make a top-down twin-stick shooter with waves, upgrades and screen shake.",
  "Add a stamina system tied to sprinting, with a HUD bar.",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CryptoXI — Autonomous AI Game Developer" },
      {
        name: "description",
        content:
          "CryptoXI is a project-aware AI game developer: it plans, architects, writes, builds, tests, debugs and previews real multi-file 3D web games on your own inference backend.",
      },
      { property: "og:title", content: "CryptoXI — Autonomous AI Game Developer" },
      {
        property: "og:description",
        content:
          "Describe a game or a change. CryptoXI inspects the project, writes the systems, builds, runs, fixes errors and shows you the running game.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudioPage,
});

type LogItem = AgentEvent & { id: number };

function StudioPage() {
  const [config, setConfig] = useState<ProviderConfig>(DEFAULT_PROVIDER);
  const [request, setRequest] = useState("");
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<LogItem[]>([]);
  const [phase, setPhase] = useState("Idle");
  const previewRef = useRef<PreviewHandle>(null);
  const abortRef = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const state = useProject();

  useEffect(() => setConfig(loadProvider()), []);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  const push = useCallback((event: AgentEvent) => {
    setLog((l) => [...l, { ...event, id: l.length + Date.now() }].slice(-200));
    if (event.kind === "phase") setPhase(`${event.role} · ${event.phase}`);
  }, []);

  const start = useCallback(async () => {
    const prompt = request.trim();
    if (prompt.length < 3) {
      toast.error("Tell CryptoXI what to build or fix.");
      return;
    }
    if (!isConfigured(config)) {
      toast.error("Configure an inference backend under Engine first.");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setLog([]);
    if (!project.get().brief) project.setMeta({ brief: prompt });

    try {
      await runAgent({
        request: prompt,
        config,
        signal: controller.signal,
        onEvent: (event) => {
          push(event);
          if (event.kind === "done") toast.success("CryptoXI finished — the game is running.");
          if (event.kind === "error") toast.error(event.text);
        },
        ctx: {
          runPreview: async (html) => (await previewRef.current?.run(html)) ?? [],
        },
      });
    } finally {
      setRunning(false);
      setPhase("Idle");
      abortRef.current = null;
    }
  }, [request, config, push]);

  const runNow = async () => {
    const files = Object.fromEntries(project.list().map((p) => [p, project.read(p) ?? ""]));
    const result = build(files);
    project.setBuildErrors(result.errors);
    if (!result.ok) {
      toast.error(result.errors[0] ?? "Build failed.");
      return;
    }
    const errors = await previewRef.current?.run(result.html);
    project.setRuntimeErrors(errors ?? []);
  };

  const download = () => {
    const files = Object.fromEntries(project.list().map((p) => [p, project.read(p) ?? ""]));
    const result = build(files);
    const blob = new Blob([result.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(state.name || "cryptoxi-game").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFiles = Object.keys(state.files).length > 0;
  const problems = [...state.buildErrors, ...state.runtimeErrors];

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-arcade-grid opacity-[0.3]" />
      <div className="pointer-events-none absolute -top-40 left-1/3 h-[34rem] w-[34rem] rounded-full bg-primary/20 blur-[140px]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Crypto<span className="text-primary">XI</span>
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              An autonomous AI game developer — plans, writes, builds, tests and fixes your project.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
              {running ? phase : isConfigured(config) ? config.model : "no backend"}
            </span>
            <EngineSettings config={config} onChange={setConfig} />
          </div>
        </header>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,26rem)_1fr]">
          <section className="flex flex-col gap-3">
            <div className="rounded-2xl border border-border bg-card/70 p-3 backdrop-blur-xl">
              <Textarea
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) start();
                }}
                rows={4}
                placeholder="Create a 3D zombie survival game with inventory, crafting and a day/night cycle…"
                className="resize-none border-input bg-background/60 text-sm"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {IDEAS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRequest(i)}
                    className="max-w-full truncate rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    {i.slice(0, 46)}…
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={start} disabled={running} className="font-display tracking-wide">
                  {running ? <Loader2 className="animate-spin" /> : <Send />}
                  {running ? "Working…" : hasFiles ? "Send to CryptoXI" : "Build my game"}
                </Button>
                {running && (
                  <Button variant="outline" onClick={() => abortRef.current?.abort()}>
                    <Square /> Stop
                  </Button>
                )}
              </div>
            </div>

            <div className="flex min-h-[18rem] flex-1 flex-col rounded-2xl border border-border bg-card/70 backdrop-blur-xl">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs font-semibold">
                <Terminal className="size-3.5 text-primary" /> Activity
              </div>
              <div ref={logRef} className="max-h-[26rem] flex-1 space-y-2 overflow-auto p-3 text-xs">
                {!log.length && (
                  <p className="text-muted-foreground">
                    CryptoXI's plan, file edits, builds, test runs and fixes stream here.
                  </p>
                )}
                {log.map((item) => (
                  <LogRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          </section>

          <section className="flex flex-col rounded-2xl border border-border bg-card/60 backdrop-blur-xl">
            <Tabs defaultValue="preview" className="flex h-full flex-col gap-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="files">Files ({Object.keys(state.files).length})</TabsTrigger>
                  <TabsTrigger value="problems">Problems ({problems.length})</TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={runNow} disabled={!hasFiles || running}>
                    <Play /> Run
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => previewRef.current?.reload()} disabled={!hasFiles}>
                    <RefreshCw /> Restart
                  </Button>
                  <Button size="sm" onClick={download} disabled={!hasFiles}>
                    <Download /> Export
                  </Button>
                </div>
              </div>

              <TabsContent value="preview" className="m-0">
                <div className="aspect-video w-full overflow-hidden rounded-b-2xl">
                  <PreviewFrame ref={previewRef} onRuntimeError={(m) => project.pushRuntimeError(m)} />
                </div>
              </TabsContent>
              <TabsContent value="files" className="m-0 h-[28rem]">
                <FileExplorer />
              </TabsContent>
              <TabsContent value="problems" className="m-0 h-[28rem] overflow-auto p-3">
                {problems.length ? (
                  <ul className="space-y-2 text-xs">
                    {problems.map((p, i) => (
                      <li key={i} className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2">
                        <AlertTriangle className="size-3.5 shrink-0 text-destructive" />
                        <pre className="whitespace-pre-wrap break-words">{p}</pre>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3.5 text-primary" /> No build or runtime errors recorded.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </div>
    </main>
  );
}

function LogRow({ item }: { item: LogItem }) {
  if (item.kind === "phase")
    return (
      <p className="flex items-center gap-2 font-display text-[11px] uppercase tracking-[0.18em] text-primary">
        <Boxes className="size-3.5" /> {item.role} · {item.phase}
      </p>
    );
  if (item.kind === "thought")
    return (
      <p className="flex gap-2 text-muted-foreground">
        <Bot className="mt-0.5 size-3.5 shrink-0 text-accent" />
        <span className="whitespace-pre-wrap">{item.text}</span>
      </p>
    );
  if (item.kind === "tool")
    return (
      <div className="rounded-lg border border-border bg-secondary/40 p-2">
        <p className="flex items-center gap-2 font-mono text-[11px]">
          <Wrench className={`size-3 ${item.ok ? "text-primary" : "text-destructive"}`} />
          {item.name}
          {item.detail ? <span className="truncate text-muted-foreground">{item.detail}</span> : null}
        </p>
        {!item.ok && <pre className="mt-1 whitespace-pre-wrap text-[11px] text-destructive">{item.output.slice(0, 600)}</pre>}
      </div>
    );
  if (item.kind === "done")
    return (
      <p className="flex gap-2 rounded-lg border border-primary/40 bg-primary/10 p-2">
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <span className="whitespace-pre-wrap">{item.summary}</span>
      </p>
    );
  if (item.kind === "error")
    return (
      <p className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-destructive">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
        <span className="whitespace-pre-wrap">{item.text}</span>
      </p>
    );
  return null;
}
