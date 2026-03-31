// POST /api/rooms/[code]/single-ready
// Advances the single-device role reveal to the next player
import { NextRequest, NextResponse } from "next/server";
import { advanceSingleDeviceTurn } from "@/lib/game-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { playerId } = await req.json();
    const err = advanceSingleDeviceTurn(code.toUpperCase(), playerId);
    if (err) return NextResponse.json(err, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to advance turn" }, { status: 500 });
  }
}
