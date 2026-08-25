import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { GAME_SYSTEM_PROMPT, buildUserPrompt } from "@/lib/game-prompt";

const BodySchema = z.object({
  idea: z.string().min(3).max(2000),
  previousHtml: z.string().max(400_000).optional(),
});

export const Route = createFileRoute("/api/generate-game")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return Response.json({ error: "AI is not configured." }, { status: 500 });
        }

        let body: z.infer<typeof BodySchema>;
        try {
          body = BodySchema.parse(await request.json());
        } catch {
          return Response.json({ error: "Describe your game in a few words." }, { status: 400 });
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
          body: JSON.stringify({
            model: "openai/gpt-5.6-sol",
            stream: true,
            messages: [
              { role: "system", content: GAME_SYSTEM_PROMPT },
              { role: "user", content: buildUserPrompt(body.idea, body.previousHtml) },
            ],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          let message = "The game engine couldn't be reached. Please try again.";
          if (upstream.status === 429) message = "Too many builds at once — wait a few seconds and retry.";
          if (upstream.status === 402) message = "AI credits are exhausted for this workspace.";
          if (upstream.status === 403) message = "AI access is blocked for this workspace.";
          console.error("gateway error", upstream.status, detail.slice(0, 500));
          return Response.json({ error: message }, { status: upstream.status });
        }

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const reader = upstream.body!.getReader();
            try {
              for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const data = trimmed.slice(5).trim();
                  if (!data || data === "[DONE]") continue;
                  try {
                    const json = JSON.parse(data);
                    const delta = json?.choices?.[0]?.delta?.content;
                    if (typeof delta === "string" && delta.length) {
                      controller.enqueue(encoder.encode(delta));
                    }
                  } catch {
                    // ignore keep-alives and partial frames
                  }
                }
              }
            } catch (error) {
              console.error("stream error", error);
            } finally {
              controller.close();
              reader.releaseLock();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
          },
        });
      },
    },
  },
});
