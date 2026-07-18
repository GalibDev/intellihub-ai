import type { ApiResponse } from "@/types";

const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const API_URL = configuredApiUrl.endsWith("/api") ? configuredApiUrl : `${configuredApiUrl}/api`;
export class ApiClientError extends Error { constructor(message: string, public status: number, public details?: unknown) { super(message); } }

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const isForm = init.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, { ...init, credentials: "include", headers: { ...(isForm ? {} : { "Content-Type": "application/json" }), ...init.headers } });
  if (response.status === 401 && retry && !path.includes("/auth/")) {
    const refreshed = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
    if (refreshed.ok) return request<T>(path, init, false);
  }
  const payload = await response.json().catch(() => ({ success: false, message: "The server returned an invalid response" })) as ApiResponse<T>;
  if (!response.ok) throw new ApiClientError(payload.message || "Request failed", response.status, payload.error);
  return payload.data;
}
export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown, signal?: AbortSignal) => request<T>(path, { method: "POST", body: data instanceof FormData ? data : JSON.stringify(data ?? {}), signal }),
  put: <T>(path: string, data: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
