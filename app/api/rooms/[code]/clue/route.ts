// POST /api/rooms/[code]/clue
import { NextRequest, NextResponse } from "next/server";
import { submitClue } from "@/lib/game-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { playerId, clue } = await req.json();
    const err = submitClue(code.toUpperCase(), playerId, clue);
    if (err) return NextResponse.json(err, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit clue" }, { status: 500 });
  }
}