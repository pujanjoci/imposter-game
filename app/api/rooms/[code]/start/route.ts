// POST /api/rooms/[code]/start
import { NextRequest, NextResponse } from "next/server";
import { startGame } from "@/lib/game-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { playerId } = await req.json();
    const err = startGame(code.toUpperCase(), playerId);
    if (err) return NextResponse.json(err, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 });
  }
}
