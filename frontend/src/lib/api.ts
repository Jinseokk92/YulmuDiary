import type { ApiResponse } from "@/types";
import { getAccessToken } from "@/stores/authStore";
import { handleDemoRequest } from "@/lib/demoData";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");

// --- 핵심 request 함수 ---

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // 체험판 모드 인터셉트
  if (typeof window !== "undefined" && sessionStorage.getItem("demoMode") === "true") {
    const method = options?.method ?? "GET";
    let body: unknown;
    if (options?.body && typeof options.body === "string") {
      try { body = JSON.parse(options.body); } catch { body = options.body; }
    }
    return handleDemoRequest<T>(cleanEndpoint, method, body);
  }

  const url = `${API_BASE_URL}${cleanEndpoint}`;

  console.log(`📡 [API Request] ${options?.method || "GET"} ${url}`);

  const isFormData = options?.body instanceof FormData;

  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // Authorization 헤더 자동 주입
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 외부에서 전달된 headers 병합
  if (options?.headers) {
    const externalHeaders =
      options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : (options.headers as Record<string, string>);
    Object.assign(headers, externalHeaders);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "서버에 연결할 수 없습니다. 네트워크를 확인해 주세요.");
  }

  // 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  // 401 시 로그인 페이지로 이동
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }

  let body: ApiResponse<T>;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      "PARSE_ERROR",
      "서버 응답을 처리할 수 없습니다.",
      response.status
    );
  }

  if (!response.ok || body.error) {
    throw new ApiError(
      body.error?.code ?? "UNKNOWN_ERROR",
      body.error?.message ?? `요청에 실패했습니다. (${response.status})`,
      response.status
    );
  }

  return body.data as T;
}

// --- 서버 사이드 전용 request ---

async function serverRequest<T>(endpoint: string): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  console.log(`📡 [API Server Request] GET ${url}`);

  // Next.js Server Component에서 쿠키 읽기 (동적 import로 서버에서만 실행)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // 서버 컨텍스트가 아닌 경우 무시
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "백엔드 서버에 연결할 수 없습니다.");
  }

  if (response.status === 204) {
    return null as T;
  }

  let body: ApiResponse<T>;
  try {
    body = await response.json();
  } catch {
    throw new ApiError("PARSE_ERROR", "서버 응답을 처리할 수 없습니다.", response.status);
  }

  if (!response.ok || body.error) {
    throw new ApiError(
      body.error?.code ?? "UNKNOWN_ERROR",
      body.error?.message ?? `요청에 실패했습니다. (${response.status})`,
      response.status
    );
  }

  return body.data as T;
}

// --- 공개 API 객체 ---

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, options),

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  putForm: <T>(endpoint: string, formData: FormData, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: formData,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),

  upload: <T>(endpoint: string, formData: FormData, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: formData,
    }),

  /** Server Component 전용 */
  server: {
    get: <T>(endpoint: string) => serverRequest<T>(endpoint),
  },
};
