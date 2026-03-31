// POST /api/rooms/[code]/next-round
import { NextRequest, NextResponse } from "next/server";
import { startNextRound } from "@/lib/game-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await req.json();
    const playerId = body?.playerId;

    if (!playerId) {
      return NextResponse.json({ error: "playerId is required" }, { status: 400 });
    }

    const err = startNextRound(code.toUpperCase(), playerId);
    if (err) return NextResponse.json(err, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[next-round] error:", e);
    return NextResponse.json({ error: "Failed to start next round" }, { status: 500 });
  }
}