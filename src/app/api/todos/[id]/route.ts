import { NextRequest, NextResponse } from "next/server";
import { isDateKey } from "@/lib/date";
import { deleteTodo, updateTodo } from "@/lib/todos-repository";
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    Auth.checkRequest(request);

    const { id: idParam } = await context.params;
    const id = parseId(idParam);

    const body = (await request.json().catch(() => null)) as {
      date?: unknown;
      content?: unknown;
      done?: unknown;
    } | null;

    const date = typeof body?.date === "string" ? body.date : "";

    if (!id || !date || !isDateKey(date)) {
      return NextResponse.json(
        { error: "Missing or invalid todo id/date" },
        { status: 400 },
      );
    }

    const patch: Partial<{ content: string; done: boolean }> = {};

    if (typeof body?.content === "string") {
      patch.content = body.content;
    }

    if (typeof body?.done === "boolean") {
      patch.done = body.done;
    }

    const updated = await updateTodo(date, id, patch);

    if (!updated) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Auth.AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Could not update todo" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    Auth.checkRequest(request);

    const { id: idParam } = await context.params;
    const id = parseId(idParam);
    const date = request.nextUrl.searchParams.get("date");

    if (!id || !date || !isDateKey(date)) {
      return NextResponse.json(
        { error: "Missing or invalid todo id/date" },
        { status: 400 },
      );
    }

    const deleted = await deleteTodo(date, id);

    if (!deleted) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Auth.AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Could not delete todo" },
      { status: 500 },
    );
  }
}
