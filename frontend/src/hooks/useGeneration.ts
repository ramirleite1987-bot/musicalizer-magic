import { useCallback, useRef, useState } from "react";
import { createGenerationStream } from "../services/streaming";
import type { GenerationRequest } from "../types/content";

export type GenerationStatus = "idle" | "generating" | "error";

interface UseGenerationReturn {
  status: GenerationStatus;
  output: string;
  error: string | null;
  generate: (request: GenerationRequest) => void;
  cancel: () => void;
  reset: () => void;
}

export function useGeneration(): UseGenerationReturn {
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus("idle");
  }, []);

  const reset = useCallback(() => {
    cancel();
    setOutput("");
    setError(null);
  }, [cancel]);

  const generate = useCallback((request: GenerationRequest) => {
    controllerRef.current?.abort();
    setOutput("");
    setError(null);
    setStatus("generating");

    const controller = createGenerationStream(
      "/generation/stream",
      request,
      {
        onToken: (text: string) => {
          setOutput((prev) => prev + text);
        },
        onDone: () => {
          controllerRef.current = null;
          setStatus("idle");
        },
        onError: (errorMsg: string) => {
          controllerRef.current = null;
          setError(errorMsg);
          setStatus("error");
        },
      }
    );

    controllerRef.current = controller;
  }, []);

  return { status, output, error, generate, cancel, reset };
}
