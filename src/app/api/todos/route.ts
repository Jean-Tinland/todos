import { NextRequest, NextResponse } from "next/server";
import {
  createTodo,
  getFirstPastGroup,
  getGroupedTodos,
} from "@/lib/todos-repository";
import * as Auth from "@/services/auth";

export const runtime = "nodejs";

const MAX_TODO_CONTENT_LENGTH = 2000;

export const GET = async (request: NextRequest) => {
  try {
    Auth.checkRequest(request);

    const searchParams = request.nextUrl.searchParams;

    if (searchParams.get("firstPast") === "true") {
      const group = await getFirstPastGroup(
        searchParams.get("reference") || undefined,
      );

      return NextResponse.json(group, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const windowDays = Number(searchParams.get("days"));
    const payload = await getGroupedTodos({
      reference: searchParams.get("reference") || undefined,
      windowDays: Number.isFinite(windowDays) ? windowDays : undefined,
    });

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Auth.AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Could not read todos" },
      { status: 500 },
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    Auth.checkRequest(request);

    const body = (await request.json().catch(() => null)) as {
      content?: unknown;
    } | null;

    const content = typeof body?.content === "string" ? body.content : "";

    if (!content.trim()) {
      return NextResponse.json(
        { error: "Todo content cannot be empty" },
        { status: 400 },
      );
    }

    if (content.length > MAX_TODO_CONTENT_LENGTH) {
      return NextResponse.json(
        {
          error: `Todo content is too long (max ${MAX_TODO_CONTENT_LENGTH} characters)`,
        },
        { status: 413 },
      );
    }

    const todo = await createTodo(content);
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    if (error instanceof Auth.AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Could not create todo" },
      { status: 500 },
    );
  }
};
