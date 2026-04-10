import type { GenerationResponse } from "../types/content";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export interface StreamCallbacks {
  onToken: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export function createGenerationStream(
  path: string,
  body: unknown,
  callbacks: StreamCallbacks
): AbortController {
  const controller = new AbortController();

  const url = `${BASE_URL}${path}`;

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        let detail = `Generation failed with status ${response.status}`;
        try {
          const error = await response.json();
          detail = error.detail ?? detail;
        } catch {
          // Use default detail
        }
        callbacks.onError(detail);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError("No response body");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            callbacks.onDone();
            return;
          }
          try {
            const parsed: GenerationResponse = JSON.parse(data);
            callbacks.onToken(parsed.text);
            if (parsed.done) {
              callbacks.onDone();
              return;
            }
          } catch {
            // Skip malformed events
          }
        }
      }

      callbacks.onDone();
    })
    .catch((err: Error) => {
      if (err.name === "AbortError") return;
      callbacks.onError(err.message);
    });

  return controller;
}
