import { env } from "@/lib/env";
import type { AIProvider, StructuredRequest, StructuredResponse } from "./provider";

const DEFAULT_MODEL = "gemini-2.5-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash-exp",
  "gemini-1.5-pro",
];

export class AIProviderError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

function stripCodeFence(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fence ? fence[1] : text).trim();
}

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private readonly model: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor() {
    this.apiKey = (env.AI_API_KEY || "").trim();
    this.model = (process.env.AI_MODEL || DEFAULT_MODEL).trim();
    const rawTimeout = process.env.AI_TIMEOUT_MS ? Number(process.env.AI_TIMEOUT_MS) : 60_000;
    this.timeoutMs = Number.isFinite(rawTimeout) && rawTimeout >= 1000 ? rawTimeout : 60_000;
    const rawRetries = process.env.AI_MAX_RETRIES ? Number(process.env.AI_MAX_RETRIES) : 2;
    this.maxRetries = Number.isFinite(rawRetries) && rawRetries >= 0 ? rawRetries : 2;
  }

  async generateStructured<T>(req: StructuredRequest): Promise<StructuredResponse<T>> {
    if (!this.apiKey) {
      throw new AIProviderError("AI_API_KEY belum dikonfigurasi pada server.", "MISSING_API_KEY", 500);
    }

    const modelsToTry = [
      this.model,
      ...FALLBACK_MODELS,
    ].filter((m, i, arr) => Boolean(m) && arr.indexOf(m) === i);

    let lastError: unknown;
    for (const model of modelsToTry) {
      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        const started = Date.now();
        try {
          const raw = await this.callApiWithModel(model, req);
          const parsed = JSON.parse(stripCodeFence(raw)) as T;
          return { output: parsed, model, durationMs: Date.now() - started };
        } catch (error) {
          lastError = error;
          if (error instanceof AIProviderError && error.status === 404) {
            // Model deprecated or not found (404), fall through to next candidate model
            break;
          }
          const retryable = !(error instanceof AIProviderError) || error.status === 429 || error.status >= 500;
          if (!retryable || attempt === this.maxRetries) break;
          await new Promise((r) => setTimeout(r, 2 ** attempt * 500));
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Gagal memanggil provider AI.");
  }

  private async callApiWithModel(modelName: string, req: StructuredRequest): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${BASE_URL}/${modelName}:generateContent?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: req.input }] }],
          generationConfig: {
            temperature: req.temperature ?? 0.2,
            maxOutputTokens: req.maxOutputTokens ?? 8192,
            responseMimeType: "application/json",
            responseSchema: req.schema,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        const code =
          res.status === 429
            ? "RATE_LIMITED"
            : res.status === 404
              ? "MODEL_NOT_FOUND"
              : res.status === 400
                ? "INVALID_REQUEST"
                : "PROVIDER_ERROR";
        throw new AIProviderError(`Provider AI error ${res.status} (${modelName}): ${body.slice(0, 300)}`, code, res.status);
      }

      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new AIProviderError("Provider AI tidak mengembalikan konten.", "EMPTY_RESPONSE", 502);
      return text;
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new AIProviderError(`Provider AI timeout setelah ${this.timeoutMs}ms.`, "TIMEOUT", 504);
      }
      throw new AIProviderError(error instanceof Error ? error.message : String(error), "NETWORK_ERROR", 502);
    } finally {
      clearTimeout(timer);
    }
  }
}
