"use client";

import { useState } from "react";
import { RoomView } from "@/lib/types";
import { Loader2, UserX, Skull, SkipForward } from "lucide-react";

export default function VotePhase({
  room,
  playerId,
}: {
  room: RoomView;
  playerId: string;
}) {
  const [selectedId, setSelectedId] = useState<string | "skip" | null>(null);
  const [loading, setLoading] = useState(false);

  const me = room.players.find((p) => p.id === playerId);
  if (!me) return null;

  const hasVoted = !!me.vote || me.skippedVote;
  const pendingCount = room.players.filter((p) => !p.vote && !p.skippedVote).length;
  const voteOptions = room.players.filter((p) => p.id !== playerId);

  async function castVote(targetId: string | "skip") {
    if (hasVoted || loading) return;
    setSelectedId(targetId);
    setLoading(true);
    try {
      await fetch(`/api/rooms/${room.code}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId: playerId, targetId }),
      });
    } finally {
      setLoading(false);
    }
  }

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
      {/* Header */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--danger-dim)",
          color: "var(--danger)",
          marginBottom: "1.5rem",
          boxShadow: "0 0 32px var(--danger-glow)",
        }}
      >
        <UserX size={32} />
      </div>
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--text-1)",
          letterSpacing: "-0.02em",
        }}
      >
        Vote out the Imposter
      </h2>
      <p style={{ color: "var(--text-3)", marginTop: "0.4rem", fontSize: "0.95rem" }}>
        {hasVoted
          ? `Waiting for ${pendingCount} more player${pendingCount !== 1 ? "s" : ""}…`
          : "Who do you think is faking it?"}
      </p>

      {/* Player vote buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "0.75rem",
          marginTop: "1.75rem",
          marginBottom: "1rem",
        }}
      >
        {voteOptions.map((p) => {
          const isSelected = selectedId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => castVote(p.id)}
              disabled={hasVoted || loading}
              className="hover-lift"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.25rem",
                borderRadius: "var(--radius-lg)",
                border: `1px solid ${isSelected ? "rgba(244,63,94,0.4)" : "var(--border)"}`,
                background: isSelected ? "var(--danger-dim)" : "var(--bg-card)",
                color: "var(--text-1)",
                cursor: hasVoted ? "default" : "pointer",
                transition: "all 0.2s ease",
                opacity: hasVoted && !isSelected ? 0.5 : 1,
                boxShadow: isSelected ? "0 4px 16px var(--danger-glow)" : "none",
                textAlign: "left",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: `hsl(${p.name.charCodeAt(0) * 13 % 360}, 60%, 40%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {p.name[0].toUpperCase()}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>{p.name}</div>
                  {p.clue && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-3)", fontStyle: "italic" }}>
                      clue: "{p.clue}"
                    </div>
                  )}
                </div>
              </div>
              {isSelected && (
                <div
                  className="badge badge-red anim-scale-in"
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <Skull size={12} /> Voted
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Skip vote button */}
      {!hasVoted && (
        <button
          onClick={() => castVote("skip")}
          disabled={loading}
          className="btn btn-secondary btn-full"
          style={{
            marginTop: "0.5rem",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          {loading && selectedId === "skip" ? (
            <><Loader2 size={16} className="spinner" /> Skipping…</>
          ) : (
            <><SkipForward size={16} /> Skip Vote</>
          )}
        </button>
      )}

      {/* Waiting indicator */}
      {hasVoted && pendingCount > 0 && (
        <div
          className="anim-fade-in"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            color: "var(--text-3)",
            fontSize: "0.9rem",
            fontWeight: 500,
            marginTop: "1rem",
          }}
        >
          <Loader2 size={16} className="spinner" />
          {pendingCount} vote{pendingCount !== 1 ? "s" : ""} pending…
        </div>
      )}
    </div>
  );
}