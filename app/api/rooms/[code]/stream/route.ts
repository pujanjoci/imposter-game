// GET /api/rooms/[code]/stream?playerId=xxx
// Server-Sent Events — pushes room state to all connected clients
import { NextRequest } from "next/server";
import { getRoomView, subscribe, getRoom } from "@/lib/game-store";
import { Room } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const roomCode = code.toUpperCase();
  const playerId = req.nextUrl.searchParams.get("playerId") || "";

  // Verify room exists — return a proper JSON 404 so the client stops retrying
  const room = getRoom(roomCode);
  if (!room) {
    return new Response(JSON.stringify({ error: "Room not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Helper: serialize the room view and enqueue it as an SSE event
      function send(r: Room) {
        const view = getRoomView(roomCode, playerId);
        if (!view) return;
        const data = `data: ${JSON.stringify(view)}\n\n`;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          // Client already disconnected — ignore
        }
      }

      // Send the current state immediately on connect
      send(room);

      // Subscribe to future state changes
      const unsub = subscribe(roomCode, send);

      // Keep-alive ping every 20 s to prevent proxy/mobile timeouts
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(ping);
        }
      }, 20_000);

      // Clean up when the client disconnects
      req.signal.addEventListener("abort", () => {
        unsub();
        clearInterval(ping);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}