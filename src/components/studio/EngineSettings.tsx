import { useEffect, useState } from "react";
import { Loader2, Plug, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listModels, loadProvider, saveProvider, type ProviderConfig } from "@/lib/cryptoxi/provider";

const PRESETS: Array<{ label: string; baseUrl: string; model: string }> = [
  { label: "Ollama (local)", baseUrl: "http://localhost:11434/v1", model: "qwen2.5-coder:14b" },
  { label: "LM Studio (local)", baseUrl: "http://localhost:1234/v1", model: "qwen2.5-coder-14b-instruct" },
  { label: "vLLM (local)", baseUrl: "http://localhost:8000/v1", model: "Qwen/Qwen2.5-Coder-32B-Instruct" },
  { label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "qwen/qwen3-coder" },
];

export function EngineSettings({
  config,
  onChange,
}: {
  config: ProviderConfig;
  onChange: (config: ProviderConfig) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(config);
  const [testing, setTesting] = useState(false);
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    if (open) setDraft(loadProvider());
  }, [open]);

  const test = async () => {
    setTesting(true);
    try {
      const ids = await listModels(draft);
      setModels(ids.slice(0, 40));
      toast.success(`Connected — ${ids.length} model(s) available.`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  const save = () => {
    saveProvider(draft);
    onChange(draft);
    setOpen(false);
    toast.success("Inference backend saved.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plug /> Engine
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">CryptoXI inference backend</DialogTitle>
          <DialogDescription>
            CryptoXI is provider-independent. Point it at any OpenAI-compatible endpoint — local or
            remote. The game-development intelligence stays the same when you swap models.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setDraft((d) => ({ ...d, baseUrl: p.baseUrl, model: p.model }))}
              className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              value={draft.baseUrl}
              onChange={(e) => setDraft((d) => ({ ...d, baseUrl: e.target.value }))}
              placeholder="http://localhost:11434/v1"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="apiKey">API key (optional for local backends)</Label>
            <Input
              id="apiKey"
              type="password"
              value={draft.apiKey}
              onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
              placeholder="sk-…"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="model">Model id</Label>
            <Input
              id="model"
              list="cryptoxi-models"
              value={draft.model}
              onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
            />
            <datalist id="cryptoxi-models">
              {models.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="temp">Temperature</Label>
              <Input
                id="temp"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={draft.temperature}
                onChange={(e) => setDraft((d) => ({ ...d, temperature: Number(e.target.value) }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="maxTokens">Max tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                step="512"
                value={draft.maxTokens}
                onChange={(e) => setDraft((d) => ({ ...d, maxTokens: Number(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={test} disabled={testing}>
            {testing ? <Loader2 className="animate-spin" /> : <Plug />} Test connection
          </Button>
          <Button onClick={save}>
            <Check /> Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
