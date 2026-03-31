// POST /api/rooms/[code]/guess
import { NextRequest, NextResponse } from "next/server";
import { submitGuess } from "@/lib/game-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { playerId, guess } = await req.json();
    const err = submitGuess(code.toUpperCase(), playerId, guess);
    if (err) return NextResponse.json(err, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[guess] error:", e);
    return NextResponse.json({ error: "Failed to submit guess" }, { status: 500 });
  }
}