import { useCallback, useState } from "react";
import { api } from "../services/api";
import type { ValidationResult } from "../types/content";

interface UseValidationReturn {
  result: ValidationResult | null;
  history: ValidationResult[];
  validating: boolean;
  loading: boolean;
  error: string | null;
  validate: (contentId: string) => Promise<ValidationResult>;
  fetchHistory: (contentId: string) => Promise<void>;
  clear: () => void;
}

export function useValidation(): UseValidationReturn {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [history, setHistory] = useState<ValidationResult[]>([]);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(async (contentId: string): Promise<ValidationResult> => {
    setValidating(true);
    setError(null);
    try {
      const data = await api.post<ValidationResult>(`/validation/${contentId}/validate`);
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Validation failed";
      setError(message);
      throw err;
    } finally {
      setValidating(false);
    }
  }, []);

  const fetchHistory = useCallback(async (contentId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ValidationResult[]>(`/validation/${contentId}/history`);
      setHistory(data);
      if (data.length > 0) {
        setResult(data[0]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch validation history";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setHistory([]);
    setError(null);
  }, []);

  return {
    result,
    history,
    validating,
    loading,
    error,
    validate,
    fetchHistory,
    clear,
  };
}
