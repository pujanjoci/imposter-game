// POST /api/rooms/[code]/join
import { NextRequest, NextResponse } from "next/server";
import { joinRoom } from "@/lib/game-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { playerName } = await req.json();
    if (!playerName || !String(playerName).trim()) {
      return NextResponse.json({ error: "Player name is required" }, { status: 400 });
    }
    const result = joinRoom(code.toUpperCase(), String(playerName).trim());
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ playerId: result.playerId });
  } catch {
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}
