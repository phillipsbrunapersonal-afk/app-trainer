import "server-only";
import { NextRequest, NextResponse } from "next/server";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function withCors(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function corsJson(body: unknown, init?: { status?: number }): NextResponse {
  return withCors(NextResponse.json(body, init));
}

export function corsPreflight(): NextResponse {
  return withCors(new NextResponse(null, { status: 200 }));
}

export function checkAutomationAuth(request: NextRequest): NextResponse | null {
  const expected = process.env.AUTOMATION_API_TOKEN;
  if (!expected) {
    return corsJson(
      { error: "AUTOMATION_API_TOKEN no está configurado en el servidor." },
      { status: 500 }
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (token !== expected) {
    return corsJson({ error: "No autorizado." }, { status: 401 });
  }

  return null;
}
