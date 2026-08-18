import "server-only";
import { NextRequest, NextResponse } from "next/server";

export function checkAutomationAuth(request: NextRequest): NextResponse | null {
  const expected = process.env.AUTOMATION_API_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: "AUTOMATION_API_TOKEN no está configurado en el servidor." },
      { status: 500 }
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (token !== expected) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  return null;
}
