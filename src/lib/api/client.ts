import axios from "axios";
import type { ApiError, ApiSuccess } from "@/types/api";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export async function fetchApi<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const json = await res.json();
  if (!res.ok) {
    const err = json as ApiError;
    throw new Error(err.error?.message ?? "Request failed");
  }
  return (json as ApiSuccess<T>).data;
}
