// POST /api/rooms/[code]/vote
import { NextRequest, NextResponse } from "next/server";
import { submitVote } from "@/lib/game-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { voterId, targetId } = await req.json();

    if (!voterId) {
      return NextResponse.json({ error: "voterId is required" }, { status: 400 });
    }
    if (!targetId) {
      return NextResponse.json({ error: "targetId is required (use 'skip' to abstain)" }, { status: 400 });
    }

    const err = submitVote(code.toUpperCase(), voterId, targetId);
    if (err) return NextResponse.json(err, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[vote] error:", e);
    return NextResponse.json({ error: "Failed to submit vote" }, { status: 500 });
  }
}