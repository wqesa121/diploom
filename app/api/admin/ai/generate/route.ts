import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { generateArticleWithAI } from "@/lib/ai";
import { aiGenerateSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = aiGenerateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }

  try {
    const payload = await generateArticleWithAI(parsed.data);
    return NextResponse.json(payload);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate article" }, { status: 500 });
  }
}
