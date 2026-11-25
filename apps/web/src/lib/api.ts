import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: ApiErrorDetail[];

  constructor(
    message: string,
    status = 500,
    code = "INTERNAL_ERROR",
    details?: ApiErrorDetail[]
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Strictly in-memory JWT access token (never stored in localStorage/sessionStorage)
let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface QueueEntry {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueEntry[] = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((entry) => {
    if (error || !token) {
      entry.reject(error);
    } else {
      entry.resolve(token);
    }
  });
  failedQueue = [];
}

export function normalizeApiError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{
      error?: {
        code?: string;
        message?: string;
        details?: ApiErrorDetail[];
      };
      message?: string;
    }>;

    const status = axiosErr.response?.status ?? 0;
    const apiErr = axiosErr.response?.data?.error;
    const message =
      apiErr?.message ||
      axiosErr.response?.data?.message ||
      (status === 0
        ? "Unable to reach the TechQuery API server. Please ensure the backend is running."
        : axiosErr.message || "An unexpected network error occurred.");
    const code = apiErr?.code || (status === 0 ? "NETWORK_ERROR" : "API_ERROR");

    return new ApiClientError(message, status, code, apiErr?.details);
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message, 500, "UNKNOWN_ERROR");
  }

  return new ApiClientError("An unexpected error occurred", 500, "UNKNOWN_ERROR");
}

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  timeout: 15000,
  withCredentials: true,
});

// Request Interceptor: Attach in-memory Bearer access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Single-Flight 401 Refresh Queue & Error Normalization
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? "";

    const isAuthBypassRoute =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/refresh");

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthBypassRoute
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((queueErr) => Promise.reject(normalizeApiError(queueErr)));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await api.post<{
          success: boolean;
          data: { accessToken: string };
        }>("/auth/refresh");

        const newToken = refreshResponse.data.data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        processQueue(refreshError, null);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:session-expired"));
        }
        return Promise.reject(normalizeApiError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);
