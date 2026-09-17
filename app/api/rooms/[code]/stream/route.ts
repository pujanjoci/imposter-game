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
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;
      let ping: NodeJS.Timeout | null = null;
      let unsub: (() => void) | null = null;

      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        if (ping) {
          clearInterval(ping);
          ping = null;
        }
        if (unsub) {
          unsub();
          unsub = null;
        }
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      // Instruct browser to reconnect every 1s on drops
      try {
        controller.enqueue(encoder.encode("retry: 1000\n\n"));
      } catch {
        cleanup();
        return;
      }

      // Helper: serialize the room view and enqueue it as an SSE event
      function send(r: Room) {
        if (isClosed) return;
        const view = getRoomView(roomCode, playerId);
        if (!view) return;
        const data = `data: ${JSON.stringify(view)}\n\n`;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          cleanup();
        }
      }

      // Send current state immediately on connect
      send(room);

      // Subscribe to future state changes
      unsub = subscribe(roomCode, send);

      // Keep-alive ping every 15 s
      ping = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          cleanup();
        }
      }, 15_000);

      // Clean up when client disconnects
      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      // ReadableStream cancelled
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, no-store, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Content-Type-Options": "nosniff",
    },
  });
}