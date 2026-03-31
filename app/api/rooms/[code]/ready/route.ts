// POST /api/rooms/[code]/ready
import { NextRequest, NextResponse } from "next/server";
import { setPlayerReady } from "@/lib/game-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { playerId } = await req.json();
    const err = setPlayerReady(code.toUpperCase(), playerId);
    if (err) return NextResponse.json(err, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to mark ready" }, { status: 500 });
  }
}
