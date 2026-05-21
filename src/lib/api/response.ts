import { NextResponse } from "next/server";
import type { ApiError, ApiSuccess, PaginationMeta } from "@/types/api";

export function apiSuccess<T>(data: T, meta?: PaginationMeta, status = 200, message?: string) {
  const body: ApiSuccess<T> = { success: true, data, ...(message ? { message } : {}), ...(meta ? { meta } : {}) };
  return NextResponse.json(body, { status });
}

export function apiError(
  message: string,
  status = 400,
  code = "BAD_REQUEST",
  details?: unknown
) {
  const body: ApiError = {
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
  return NextResponse.json(body, { status });
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const search = searchParams.get("search") ?? undefined;
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";
  const status = searchParams.get("status") ?? undefined;
  return { page, limit, search, sortBy, sortOrder, status, skip: (page - 1) * limit };
}

export function paginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
