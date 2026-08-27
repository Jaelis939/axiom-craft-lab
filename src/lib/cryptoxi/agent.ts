/**
 * CryptoXI agent orchestration — the Understand → Plan → Architect → Generate
 * → Build → Test → Debug → Fix → Preview loop.
 *
 * The model layer is swappable (see provider.ts); the intelligence lives here,
 * in the role charters, the project memory and the tool system.
 */

import { project, projectContext } from "./project";
import { complete, type ChatMessage, type ProviderConfig } from "./provider";
import { pickRole, systemPrompt } from "./roles";
import { executeTool, TOOL_SCHEMAS, type ToolContext } from "./tools";

export type AgentEvent =
  | { kind: "phase"; role: string; phase: string }
  | { kind: "thought"; text: string }
  | { kind: "tool"; name: string; detail: string; ok: boolean; output: string }
  | { kind: "preview"; html: string }
  | { kind: "done"; summary: string }
  | { kind: "error"; text: string };

export type RunOptions = {
  request: string;
  config: ProviderConfig;
  ctx: ToolContext;
  onEvent: (event: AgentEvent) => void;
  signal?: AbortSignal;
  maxSteps?: number;
};

function argSummary(name: string, raw: string) {
  try {
    const a = JSON.parse(raw) as Record<string, string>;
    return a.path ?? a.name ?? a.label ?? a.summary?.slice(0, 60) ?? "";
  } catch {
    return "";
  }
}

export async function runAgent(opts: RunOptions): Promise<void> {
  const { request, config, ctx, onEvent, signal } = opts;
  const maxSteps = opts.maxSteps ?? 40;

  let phase: "plan" | "build" | "fix" | "qa" = project.list().length ? "build" : "plan";
  let role = pickRole(request, phase);
  onEvent({ kind: "phase", role: role.title, phase });

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(role) },
    {
      role: "user",
      content: `${projectContext()}\n\n---\nUSER REQUEST:\n${request}`,
    },
  ];

  let steps = 0;
  let consecutiveNoTool = 0;

  while (steps < maxSteps) {
    if (signal?.aborted) return;
    steps++;

    let result;
    try {
      result = await complete(config, messages, TOOL_SCHEMAS, signal);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      onEvent({ kind: "error", text: (error as Error).message });
      return;
    }

    if (result.content.trim()) onEvent({ kind: "thought", text: result.content.trim() });

    if (!result.toolCalls.length) {
      consecutiveNoTool++;
      messages.push({ role: "assistant", content: result.content });
      if (consecutiveNoTool >= 2) {
        onEvent({ kind: "error", text: "CryptoXI stopped calling tools. Try a more specific request." });
        return;
      }
      messages.push({
        role: "user",
        content:
          "Prose alone does not change the project. Continue the pipeline with an actual tool call (list_files, read_file, write_file, patch_file, build_project, run_project, run_tests, or finish).",
      });
      continue;
    }
    consecutiveNoTool = 0;

    messages.push({ role: "assistant", content: result.content, tool_calls: result.toolCalls });

    for (const call of result.toolCalls) {
      if (signal?.aborted) return;

      if (call.name === "finish") {
        let summary = "Done.";
        try {
          summary = (JSON.parse(call.arguments) as { summary?: string }).summary ?? summary;
        } catch {
          /* keep default */
        }
        const state = project.get();
        const blocking = [...state.buildErrors, ...state.runtimeErrors];
        if (blocking.length) {
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            name: call.name,
            content: `Cannot finish — unresolved errors remain:\n${blocking.join("\n")}\nFix them, rebuild and re-run.`,
          });
          phase = "fix";
          role = pickRole(request, phase);
          messages[0] = { role: "system", content: systemPrompt(role) };
          onEvent({ kind: "phase", role: role.title, phase });
          continue;
        }
        onEvent({ kind: "done", summary });
        return;
      }

      const res = await executeTool(call.name, call.arguments, ctx);
      onEvent({
        kind: "tool",
        name: call.name,
        detail: argSummary(call.name, call.arguments),
        ok: res.ok,
        output: res.output,
      });
      if (res.previewHtml) onEvent({ kind: "preview", html: res.previewHtml });

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.name,
        content: res.output.slice(0, 12000),
      });

      // Phase transitions driven by real project state, not model claims.
      const next: typeof phase =
        !res.ok && /build|run|test/.test(call.name)
          ? "fix"
          : call.name === "run_project" || call.name === "run_tests"
            ? "qa"
            : phase === "plan" && /write_file|create_scene|generate_asset/.test(call.name)
              ? "build"
              : phase;
      if (next !== phase) {
        phase = next;
        role = pickRole(request, phase);
        messages[0] = { role: "system", content: systemPrompt(role) };
        onEvent({ kind: "phase", role: role.title, phase });
      }
    }

    // Keep the live project map in front of the model.
    messages.push({ role: "user", content: `CURRENT PROJECT STATE:\n${projectContext()}` });
  }

  onEvent({ kind: "error", text: `Stopped after ${maxSteps} steps. Ask CryptoXI to continue.` });
}
