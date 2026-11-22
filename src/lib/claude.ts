import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type * as z from "zod/v4";
import type { PreparedImage } from "./images";
import type { ModelId } from "./store";

// The browser talks to Anthropic directly with the user's own key (bring-your-own-key).
// No server of ours ever sees the key, the profile or the photos.

export const MODELS: { id: ModelId; en: string; es: string }[] = [
  { id: "claude-opus-5-5", en: "Claude Opus 5.5: best answers", es: "Claude Opus 5.5: las mejores respuestas" },
  { id: "claude-sonnet-5-5", en: "Claude Sonnet 5.5: faster, about half the cost", es: "Claude Sonnet 5.5: más rápido, la mitad de coste" },
  { id: "claude-haiku-5-5", en: "Claude Haiku 5.5: quickest and cheapest", es: "Claude Haiku 5.5: el más rápido y barato" },
];

export type ClaudeErrorCode =
  | "no_key" | "bad_key" | "rate_limited" | "overloaded" | "network" | "refused"
  | "too_long" | "bad_answer" | "cancelled" | "bad_request" | "unknown";

export class ClaudeError extends Error {
  constructor(public code: ClaudeErrorCode, message?: string) {
    super(message ?? code);
  }
}

function client(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 5 * 60 * 1000 });
}

function mapError(e: unknown): ClaudeError {
  if (e instanceof ClaudeError) return e;
  if (e instanceof Anthropic.APIUserAbortError) return new ClaudeError("cancelled");
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) return new ClaudeError("bad_key");
  if (e instanceof Anthropic.RateLimitError) return new ClaudeError("rate_limited");
  if (e instanceof Anthropic.InternalServerError) return new ClaudeError("overloaded");
  if (e instanceof Anthropic.APIConnectionError) return new ClaudeError("network");
  if (e instanceof Anthropic.BadRequestError) return new ClaudeError("bad_request", e.message);
  return new ClaudeError("unknown", e instanceof Error ? e.message : String(e));
}

/** Checks a key without spending tokens. */
export async function testKey(apiKey: string): Promise<void> {
  if (!apiKey.trim()) throw new ClaudeError("no_key");
  try {
    await client(apiKey.trim()).models.list({ limit: 1 });
  } catch (e) {
    throw mapError(e);
  }
}

export interface AskOptions<S extends z.ZodType> {
  apiKey: string | undefined;
  model: ModelId;
  schema: S;
  prompt: string;
  images?: PreparedImage[];
  effort?: "low" | "medium" | "high";
  signal?: AbortSignal;
}

/** One request, one validated JSON answer. */
export async function ask<S extends z.ZodType>(o: AskOptions<S>): Promise<z.infer<S>> {
  if (!o.apiKey) throw new ClaudeError("no_key");
  const content: Anthropic.Beta.BetaContentBlockParam[] = (o.images ?? []).map((img) => ({
    type: "image" as const,
    source: { type: "base64" as const, media_type: img.mediaType, data: img.base64 },
  }));
  content.push({ type: "text", text: o.prompt });

  // On a safety decline, Opus and Sonnet 5.5 retry on a fallback model inside the same call.
  const fallback = o.model === "claude-haiku-5-5" ? {} : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" };

  try {
    const res = await client(o.apiKey).beta.messages.parse(
      {
        model: o.model,
        max_tokens: 16000,
        messages: [{ role: "user", content }],
        output_config: { format: betaZodOutputFormat(o.schema), effort: o.effort ?? "medium" },
        ...fallback,
      } as Parameters<Anthropic["beta"]["messages"]["parse"]>[0],
      { signal: o.signal },
    );
    if (res.stop_reason === "refusal") throw new ClaudeError("refused");
    if (res.stop_reason === "max_tokens") throw new ClaudeError("too_long");
    if (res.parsed_output == null) throw new ClaudeError("bad_answer");
    return res.parsed_output as z.infer<S>;
  } catch (e) {
    throw mapError(e);
  }
}
