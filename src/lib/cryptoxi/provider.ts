/**
 * CryptoXI model layer.
 *
 * Provider-independent: any OpenAI-compatible inference backend works
 * (Ollama, LM Studio, vLLM, llama.cpp server, OpenRouter, Together, ...).
 * Swapping the model never requires touching the agent layer.
 */

export type ProviderConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
};

export const DEFAULT_PROVIDER: ProviderConfig = {
  baseUrl: "http://localhost:11434/v1",
  apiKey: "",
  model: "qwen2.5-coder:14b",
  temperature: 0.3,
  maxTokens: 8192,
};

const KEY = "cryptoxi.provider.v1";

export function loadProvider(): ProviderConfig {
  if (typeof window === "undefined") return DEFAULT_PROVIDER;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PROVIDER;
    return { ...DEFAULT_PROVIDER, ...(JSON.parse(raw) as Partial<ProviderConfig>) };
  } catch {
    return DEFAULT_PROVIDER;
  }
}

export function saveProvider(config: ProviderConfig) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(config));
  } catch {
    /* storage unavailable */
  }
}

export function isConfigured(config: ProviderConfig) {
  return Boolean(config.baseUrl.trim() && config.model.trim());
}

function endpoint(config: ProviderConfig, path: string) {
  return `${config.baseUrl.trim().replace(/\/+$/, "")}${path}`;
}

function headers(config: ProviderConfig) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey.trim()) h["Authorization"] = `Bearer ${config.apiKey.trim()}`;
  return h;
}

export type ToolCall = {
  id: string;
  name: string;
  arguments: string;
};

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string; tool_calls?: ToolCall[] }
  | { role: "tool"; content: string; tool_call_id: string; name: string };

export type ToolSchema = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type Completion = {
  content: string;
  toolCalls: ToolCall[];
};

function wireMessages(messages: ChatMessage[]) {
  return messages.map((m) => {
    if (m.role === "assistant") {
      return {
        role: "assistant",
        content: m.content || "",
        ...(m.tool_calls?.length
          ? {
              tool_calls: m.tool_calls.map((t) => ({
                id: t.id,
                type: "function",
                function: { name: t.name, arguments: t.arguments },
              })),
            }
          : {}),
      };
    }
    if (m.role === "tool") {
      return { role: "tool", content: m.content, tool_call_id: m.tool_call_id, name: m.name };
    }
    return { role: m.role, content: m.content };
  });
}

export async function listModels(config: ProviderConfig): Promise<string[]> {
  const res = await fetch(endpoint(config, "/models"), { headers: headers(config) });
  if (!res.ok) throw new Error(`Model list failed (${res.status})`);
  const json = (await res.json()) as { data?: Array<{ id?: string }> };
  return (json.data ?? []).map((m) => m.id ?? "").filter(Boolean);
}

/** Non-streaming completion with tool support — the agent loop's workhorse. */
export async function complete(
  config: ProviderConfig,
  messages: ChatMessage[],
  tools: ToolSchema[],
  signal?: AbortSignal,
): Promise<Completion> {
  const res = await fetch(endpoint(config, "/chat/completions"), {
    method: "POST",
    headers: headers(config),
    ...(signal ? { signal } : {}),
    body: JSON.stringify({
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      messages: wireMessages(messages),
      ...(tools.length
        ? {
            tools: tools.map((t) => ({
              type: "function",
              function: { name: t.name, description: t.description, parameters: t.parameters },
            })),
            tool_choice: "auto",
          }
        : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(describeError(res.status, detail));
  }

  const json = (await res.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
        tool_calls?: Array<{ id?: string; function?: { name?: string; arguments?: string } }>;
      };
    }>;
  };

  const message = json.choices?.[0]?.message;
  const content = message?.content ?? "";
  const native = (message?.tool_calls ?? []).map((t, i) => ({
    id: t.id || `call_${i}_${Date.now()}`,
    name: t.function?.name ?? "",
    arguments: t.function?.arguments ?? "{}",
  }));

  const toolCalls = native.length ? native : parseInlineToolCalls(content);
  return { content, toolCalls };
}

function describeError(status: number, detail: string) {
  const trimmed = detail.slice(0, 400);
  if (status === 401 || status === 403) return `Your inference endpoint rejected the credentials (${status}).`;
  if (status === 404) return `Endpoint or model not found (404). Check the base URL and model id. ${trimmed}`;
  if (status === 429) return "Your inference backend is rate limiting — slow down and retry.";
  if (status >= 500) return `Inference backend error (${status}). ${trimmed}`;
  return `Request rejected (${status}). ${trimmed}`;
}

/**
 * Fallback for models without native tool calling: they emit
 * ```json { "tool": "write_file", "arguments": { ... } } ```
 */
export function parseInlineToolCalls(content: string): ToolCall[] {
  const calls: ToolCall[] = [];
  const re = /```(?:json|tool)?\s*(\{[\s\S]*?\})\s*```/g;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = re.exec(content))) {
    try {
      const parsed = JSON.parse(match[1] ?? "{}") as { tool?: string; name?: string; arguments?: unknown };
      const name = parsed.tool ?? parsed.name;
      if (!name) continue;
      calls.push({
        id: `inline_${index++}_${Date.now()}`,
        name,
        arguments: JSON.stringify(parsed.arguments ?? {}),
      });
    } catch {
      /* not a tool block */
    }
  }
  return calls;
}
