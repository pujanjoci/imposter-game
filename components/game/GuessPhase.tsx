"use client";

import { useState } from "react";
import { RoomView } from "@/lib/types";
import { Send, Crosshair, Target, Loader2, Sparkles, MessageSquare } from "lucide-react";
import { playGameSound, triggerHaptic, HAPTICS } from "@/lib/audio";

export default function GuessPhase({ room, playerId }: { room: RoomView; playerId: string }) {
  const [guess, setGuess] = useState("");
  const [loading, setLoading] = useState(false);

  const me = room.players.find((p) => p.id === playerId);
  if (!me) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guess.trim()) return;
    triggerHaptic(HAPTICS.REVEAL);
    playGameSound("REVEAL");
    setLoading(true);
    try {
      await fetch(`/api/rooms/${room.code}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, guess: guess.trim() }),
      });
    } finally {
      // Stream updates phase
    }
  }

  const isImposter = me.role === "imposter";

  if (!isImposter) {
    return (
      <div className="card-elevated anim-scale-in" style={{ maxWidth: 540, margin: "0 auto", padding: "var(--card-py) var(--card-px)", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 64, height: 64, borderRadius: "50%",
          background: "var(--warning-dim)", color: "var(--warning)",
          marginBottom: "1.5rem", boxShadow: "0 0 32px var(--warning-glow)",
        }}>
          <Loader2 size={32} className="spinner" />
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
          The Imposter is guessing…
        </h2>
        <p style={{ color: "var(--text-3)", marginTop: "0.5rem", fontSize: "0.95rem" }}>
          They saw everyone&apos;s clues and are trying to figure out the secret word.
        </p>

        {/* ── Recap Clues ── */}
        <div style={{ marginTop: "2rem", textAlign: "left", flex: 1 }}>
          <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <MessageSquare size={16} /> Everyone&apos;s Clues
          </h3>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem", padding: 0 }}>
            {room.players.map((p) => (
              <li key={p.id} className="anim-fade-in" style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                padding: "0.75rem 1rem", borderRadius: "calc(var(--radius-md) - 2px)",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <span style={{ fontWeight: 600, color: "var(--text-2)" }}>{p.name}</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)" }}>"{p.clue}"</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated anim-scale-in" style={{ maxWidth: 540, margin: "0 auto", padding: "var(--card-py) var(--card-px)" }}>
      {/* ── Context Header ── */}
      <div style={{
        background: "rgba(244,63,94,0.08)",
        border: "1px solid rgba(244,63,94,0.2)",
        borderRadius: "var(--radius-lg)",
        padding: "1.25rem",
        marginBottom: "2rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem"
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "calc(var(--radius-md) - 2px)",
          background: "var(--danger-dim)", color: "var(--danger)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Sparkles size={24} />
        </div>
        <div>
          <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--danger)", fontWeight: 800, marginBottom: "0.2rem" }}>
            Your Goal
          </h3>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-1)", letterSpacing: "0.02em" }}>
            Guess the secret word.
          </div>
        </div>
      </div>

      {/* ── Clues Grid ── */}
      <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Crosshair size={16} /> Crewmate Clues
      </h3>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr", gap: "0.5rem",
        marginBottom: "2rem"
      }}>
        {room.players.map((p) => (
          <div key={p.id} className="anim-fade-in" style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            padding: "0.75rem 1rem", borderRadius: "calc(var(--radius-md) - 2px)",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <span style={{ fontWeight: 600, color: "var(--text-2)" }}>{p.name}</span>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--cyan)" }}>"{p.clue}"</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="anim-slide-up">
        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-2)" }}>
          What is the secret word?
        </label>
         <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Type your guess…"
            className="input input-lg"
            autoFocus
            required
          />
          <button
            type="submit"
            disabled={loading || !guess.trim()}
            className="btn btn-danger btn-lg"
            style={{ padding: "0 2rem" }}
          >
            {loading ? (
              <><Loader2 size={20} className="spinner" /> Guessing…</>
            ) : (
              <><Target size={20} /> Submit Guess</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
