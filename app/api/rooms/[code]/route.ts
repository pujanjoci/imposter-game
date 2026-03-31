// GET /api/rooms/[code] — get room state for a specific player
import { NextRequest, NextResponse } from "next/server";
import { getRoomView } from "@/lib/game-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const playerId = req.nextUrl.searchParams.get("playerId") || "";
  const view = getRoomView(code.toUpperCase(), playerId);
  if (!view) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  return NextResponse.json(view);
}
