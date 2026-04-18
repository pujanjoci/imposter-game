// POST /api/rooms — create a new room (multiplayer OR single-device)
import { NextRequest, NextResponse } from "next/server";
import { createRoom, createRoomSingleDevice } from "@/lib/game-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Single Device Mode ─────────────────────────────────────────────────
    if (body.singleDevice === true) {
      const playerNames: unknown = body.playerNames;
      if (!Array.isArray(playerNames) || playerNames.length < 3) {
        return NextResponse.json(
          { error: "Single device mode requires at least 3 player names" },
          { status: 400 }
        );
      }
      if (playerNames.length > 20) {
        return NextResponse.json(
          { error: "Maximum 20 players" },
          { status: 400 }
        );
      }
      const names = playerNames.map((n) => String(n).trim()).filter(Boolean);
      if (names.length !== playerNames.length) {
        return NextResponse.json(
          { error: "All player names must be non-empty" },
          { status: 400 }
        );
      }
      // Check for duplicates
      const unique = new Set(names.map((n) => n.toLowerCase()));
      if (unique.size !== names.length) {
        return NextResponse.json(
          { error: "Player names must be unique" },
          { status: 400 }
        );
      }
      const manualImposterCount = typeof body.manualImposterCount === "number" ? body.manualImposterCount : null;
      const { room, playerIds } = createRoomSingleDevice(names, manualImposterCount);
      return NextResponse.json({ code: room.code, playerIds }, { status: 201 });
    }

    // ── Multiplayer Mode ───────────────────────────────────────────────────
    const { hostName } = body;
    if (!hostName || !String(hostName).trim()) {
      return NextResponse.json({ error: "Host name is required" }, { status: 400 });
    }
    const manualImposterCount = typeof body.manualImposterCount === "number" ? body.manualImposterCount : null;
    const { room, hostId } = createRoom(String(hostName).trim(), manualImposterCount);
    return NextResponse.json({ code: room.code, playerId: hostId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
