import type { ApiError } from "../types/content";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

class ApiClientError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiClientError";
    this.status = status;
    this.detail = detail;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const error: ApiError = await response.json();
      detail = error.detail ?? detail;
    } catch {
      // Use default detail
    }
    throw new ApiClientError(response.status, detail);
  }
  return response.json() as Promise<T>;
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = `${BASE_URL}${path}`;
  if (!params) return url;
  const searchParams = new URLSearchParams(params);
  return `${url}?${searchParams.toString()}`;
}

export const api = {
  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const response = await fetch(buildUrl(path, params), {
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body != null ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: body != null ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete<T = void>(path: string): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<T>(response);
  },
};

export { ApiClientError };
