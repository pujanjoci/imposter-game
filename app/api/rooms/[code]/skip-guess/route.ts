// POST /api/rooms/[code]/skip-guess
import { NextRequest, NextResponse } from "next/server";
import { skipGuess } from "@/lib/game-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { playerId } = await req.json();
    const err = skipGuess(code.toUpperCase(), playerId);
    if (err) return NextResponse.json(err, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[skip-guess] error:", e);
    return NextResponse.json({ error: "Failed to skip guess" }, { status: 500 });
  }
}