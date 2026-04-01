"use client";

import { useState } from "react";
import { RoomView } from "@/lib/types";
import {
  Loader2, Target, SkipForward, Sparkles, MessageSquare,
  Eye, EyeOff,
} from "lucide-react";
import { submitGuessClient, skipGuessClient } from "@/lib/api-client";

export default function InterRound({
  room,
  playerId,
}: {
  room: RoomView;
  playerId: string;
}) {
  const [guess, setGuess] = useState("");
  const [showGuess, setShowGuess] = useState(false);
  const [loading, setLoading] = useState<"guess" | "skip" | null>(null);

  const isSingleDevice = room.singleDeviceMode;

  // In single-device mode, all roles are revealed so we can find the imposter
  // The device acts on behalf of the imposter player
  const imposterPlayer = isSingleDevice
    ? room.players.find((p) => p.role === "imposter")
    : null;

  // The player doing the API call:
  // - SD mode: the imposter player's ID (device acts as them)
  // - Multiplayer: own player ID
  const activePlayerId = isSingleDevice && imposterPlayer
    ? imposterPlayer.id
    : playerId;

  const me = room.players.find((p) => p.id === playerId);
  if (!me) return null;

  // In single-device mode, always show the imposter's interaction
  const isImposter = isSingleDevice ? true : me.role === "imposter";

  // ── Submit guess ──────────────────────────────────────────────────────────
  async function handleGuess(e: React.FormEvent) {
    e.preventDefault();
    if (!guess.trim() || loading) return;
    setLoading("guess");
    try {
      await submitGuessClient(room.code, activePlayerId, guess.trim());
    } finally {
      setLoading(null);
    }
  }

  // ── Skip guess → go straight to vote/results phase ───────────────────────
  async function handleSkip() {
    if (loading) return;
    setLoading("skip");
    try {
      await skipGuessClient(room.code, activePlayerId);
    } finally {
      setLoading(null);
    }
  }

  // ── Crewmate waiting view (multiplayer only) ─────────────────────────────
  if (!isImposter) {
    return (
      <div
        className="card-elevated anim-scale-in"
        style={{
          maxWidth: 540,
          margin: "0 auto",
          padding: "var(--card-py) var(--card-px)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--warning-dim)",
            color: "var(--warning)",
            marginBottom: "1.5rem",
            boxShadow: "0 0 32px var(--warning-glow)",
          }}
        >
          <Loader2 size={32} className="spinner" />
        </div>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--text-1)",
            letterSpacing: "-0.02em",
          }}
        >
          Imposter is deciding…
        </h2>
        <p style={{ color: "var(--text-3)", marginTop: "0.5rem", fontSize: "0.95rem" }}>
          They can try to guess the secret word now — or skip straight to the vote.
        </p>

        {/* Show everyone's clues while waiting */}
        <div style={{ marginTop: "2rem", textAlign: "left" }}>
          <h3
            style={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-3)",
              fontWeight: 700,
              marginBottom: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <MessageSquare size={14} /> All Clues
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {room.players.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  padding: "0.65rem 1rem",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 600, color: "var(--text-2)", fontSize: "0.9rem" }}>
                  {p.name}
                </span>
                <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: "1rem" }}>
                  {p.clue ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Imposter view (multiplayer + single-device) ───────────────────────────
  return (
    <div
      className="card-elevated anim-scale-in"
      style={{ maxWidth: 540, margin: "0 auto", padding: "var(--card-py) var(--card-px)" }}
    >
      {/* Header */}
      <div
        style={{
          background: "rgba(244,63,94,0.08)",
          border: "1px solid rgba(244,63,94,0.2)",
          borderRadius: "var(--radius-lg)",
          padding: "1.25rem",
          marginBottom: "1.75rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-md)",
            background: "var(--danger-dim)",
            color: "var(--danger)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Sparkles size={24} />
        </div>
        <div>
          <h3
            style={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--danger)",
              fontWeight: 800,
              marginBottom: "0.25rem",
            }}
          >
            {isSingleDevice
              ? "Imposter Decision"
              : "Your Turn to Guess"}
          </h3>
          <p style={{ color: "var(--text-2)", fontSize: "0.9rem", fontWeight: 500 }}>
            {!isSingleDevice && "Guess the secret word now to win instantly — or skip to the vote."}
            {isSingleDevice && "Ready to see if the group caught you? Continue to the vote."}
          </p>
        </div>
      </div>

      {/* All clues for the imposter to review */}
      {!isSingleDevice && (
        <>
          <h3
            style={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-3)",
              fontWeight: 700,
              marginBottom: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <MessageSquare size={14} /> Crewmate Clues
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              marginBottom: "1.75rem",
            }}
          >
            {room.players
              .filter((p) => p.id !== activePlayerId)
              .map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    padding: "0.65rem 1rem",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--text-2)", fontSize: "0.9rem" }}>
                    {p.name}
                  </span>
                  <span style={{ fontWeight: 700, color: "var(--cyan, #06b6d4)", fontSize: "1rem" }}>
                    {p.clue ?? "—"}
                  </span>
                </div>
              ))}
            {/* Imposter's own clue */}
            {room.players.find((p) => p.id === activePlayerId)?.clue && (
              <div
                style={{
                  background: "rgba(244,63,94,0.05)",
                  border: "1px solid rgba(244,63,94,0.15)",
                  padding: "0.65rem 1rem",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 600, color: "var(--danger)", fontSize: "0.9rem" }}>
                  {isSingleDevice && imposterPlayer ? imposterPlayer.name : "You"}
                </span>
                <span style={{ fontWeight: 700, color: "var(--danger)", fontSize: "1rem" }}>
                  {room.players.find((p) => p.id === activePlayerId)?.clue}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Guess form - Hidden in single device mode */}
      {!isSingleDevice && (
        <form onSubmit={handleGuess} style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--text-2)",
            }}
          >
            What is the secret word?
          </label>
          <div style={{ position: "relative", marginBottom: "0.75rem" }}>
            <input
              type={showGuess ? "text" : "password"}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Type your guess…"
              className="input input-lg"
              autoComplete="off"
              style={{
                paddingRight: "3rem",
                touchAction: "manipulation",
                fontSize: "1rem",
              }}
            />
            <button
              type="button"
              onClick={() => setShowGuess((v) => !v)}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-3)",
                touchAction: "manipulation",
                padding: "0.25rem",
              }}
            >
              {showGuess ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={!guess.trim() || !!loading}
            className="btn btn-danger btn-lg btn-full"
            style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
          >
            {loading === "guess" ? (
              <><Loader2 size={18} className="spinner" /> Guessing…</>
            ) : (
              <><Target size={18} /> Submit Guess & Win</>
            )}
          </button>
        </form>
      )}

      {/* Divider */}
      {!isSingleDevice && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            margin: "1.25rem 0",
            color: "var(--text-3)",
            fontSize: "0.8rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          or
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
      )}

      {/* Skip button */}
      <button
        type="button"
        onClick={handleSkip}
        disabled={!!loading}
        className="btn btn-secondary btn-lg btn-full"
        style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      >
        {loading === "skip" ? (
          <><Loader2 size={18} className="spinner" /> {isSingleDevice ? "Continuing…" : "Skipping…"}</>
        ) : (
          <><SkipForward size={18} /> {isSingleDevice ? "Continue to Vote" : "Skip — Go to Vote"}</>
        )}
      </button>
    </div>
  );
}