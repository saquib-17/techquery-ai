import { api } from "@/lib/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "CANDIDATE" | "ADMIN";
  tier: "FREE" | "PRO";
  isVerified: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: AuthUser;
  message: string;
  verificationUrl?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface VerifyEmailResponse {
  user: AuthUser;
  message: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface MessageResponse {
  message: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
  const res = await api.post<ApiEnvelope<LoginResponse>>("/auth/login", payload);
  return res.data.data;
}

export async function registerApi(payload: RegisterPayload): Promise<RegisterResponse> {
  const res = await api.post<ApiEnvelope<RegisterResponse>>("/auth/register", payload);
  return res.data.data;
}

export async function verifyEmailApi(
  payload: VerifyEmailPayload
): Promise<VerifyEmailResponse> {
  const res = await api.post<ApiEnvelope<VerifyEmailResponse>>(
    "/auth/verify-email",
    payload
  );
  return res.data.data;
}

export async function resendVerificationApi(
  payload: ResendVerificationPayload
): Promise<MessageResponse> {
  const res = await api.post<ApiEnvelope<MessageResponse>>(
    "/auth/resend-verification",
    payload
  );
  return res.data.data;
}

export async function refreshApi(): Promise<{ accessToken: string }> {
  const res = await api.post<ApiEnvelope<{ accessToken: string }>>("/auth/refresh");
  return res.data.data;
}

export async function logoutApi(): Promise<MessageResponse> {
  const res = await api.post<ApiEnvelope<MessageResponse>>("/auth/logout");
  return res.data.data;
}

export async function logoutAllApi(): Promise<MessageResponse> {
  const res = await api.post<ApiEnvelope<MessageResponse>>("/auth/logout-all");
  return res.data.data;
}
