import { NextRequest, NextResponse } from "next/server";
import { isDateKey } from "@/lib/date";
import { transferTodo } from "@/lib/todos-repository";
import * as Auth from "@/services/auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseId(value: string) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    Auth.checkRequest(request);

    const { id: idParam } = await context.params;
    const id = parseId(idParam);

    const body = (await request.json().catch(() => null)) as {
      sourceDate?: unknown;
    } | null;

    const sourceDate =
      typeof body?.sourceDate === "string" ? body.sourceDate : "";

    if (!id || !sourceDate || !isDateKey(sourceDate)) {
      return NextResponse.json(
        { error: "Missing or invalid todo id/source date" },
        { status: 400 },
      );
    }

    const transferred = await transferTodo(sourceDate, id);

    if (!transferred) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json(transferred, { status: 201 });
  } catch (error) {
    if (error instanceof Auth.AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Could not transfer todo" },
      { status: 500 },
    );
  }
}
