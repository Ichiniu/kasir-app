import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
}

export function apiSuccess<T>(data?: T, message?: string, status: number = 200) {
  const body: ApiResponse<T> = {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
  };
  return NextResponse.json(body, { status });
}

export function apiError(message: string, errorCode: string = "INTERNAL_SERVER_ERROR", status: number = 400) {
  const body: ApiResponse = {
    success: false,
    message,
    errorCode,
  };
  return NextResponse.json(body, { status });
}
