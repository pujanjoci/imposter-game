"use client";

import { useState, useEffect } from "react";
import { RoomView } from "@/lib/types";
import {
  Send, FileText, Loader2, Sparkles, MessageSquare,
  ChevronRight, EyeOff, Eye, Tag,
} from "lucide-react";

export default function CluePhase({ room, playerId }: { room: RoomView; playerId: string }) {
  const [clue, setClue] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Single Device: tracks which player is currently entering a clue
  // We cycle through players who haven't submitted yet
  const [sdActiveIndex, setSdActiveIndex] = useState<number>(0);

  const isSingleDevice = room.singleDeviceMode;

  // Determine who is entering a clue in SD mode
  const playersWithoutClue = room.players.filter((p) => !p.clue);
  const sdCurrentPlayer = isSingleDevice ? playersWithoutClue[0] : null;

  // Reset clue when SD active player changes
  useEffect(() => {
    if (isSingleDevice) {
      setClue("");
      setShowHint(false);
    }
  }, [sdCurrentPlayer?.id, isSingleDevice]);

  const me = isSingleDevice ? sdCurrentPlayer : room.players.find((p) => p.id === playerId);
  if (!me) return null;

  const isImposter = me.id === room.players.find(
    (p) => isSingleDevice
      ? false // In SD mode we can't know imposter until results
      : p.id === playerId
  )?.id
    ? false
    : room.imposterHint !== null && me.clue === null
      ? false // can't determine in SD
      : false;

  // Simpler: just check submissions empty status
  const hasSubmitted = !!me.clue;

  // For the word/hint display in SD mode, we need to show based on role
  // which is embedded in the player object
  const activePlayerRole = me.role;
  const showWord = activePlayerRole !== "imposter"; // imposter doesn't see the word
  const showImposterHint = activePlayerRole === "imposter";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clue.trim() || loading) return;
    setLoading(true);
    try {
      await fetch(`/api/rooms/${room.code}/clue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: me?.id, clue: clue.trim() }),
      });
      // In SD mode, reset for next player (SSE will update room.players)
      if (isSingleDevice) {
        setClue("");
        setShowHint(false);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── ALL SUBMITTED (waiting state for multiplayer non-host) ────────────────
  if (!isSingleDevice && hasSubmitted) {
    return (
      <div className="card-elevated anim-scale-in" style={{ maxWidth: 540, margin: "0 auto", padding: "var(--card-py) var(--card-px)" }}>
        <div className="anim-scale-in" style={{ textAlign: "center", padding: "1.5rem 0" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 48, height: 48, borderRadius: "50%",
            background: "var(--success-dim)", color: "var(--success)",
            marginBottom: "1rem", boxShadow: "0 0 24px var(--success-glow)",
          }}>
            <MessageSquare size={24} />
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-1)" }}>Clue Submitted!</h3>
          <p style={{ color: "var(--text-2)", marginTop: "0.25rem" }}>
            Your clue: <strong style={{ color: "var(--primary)", fontWeight: 800 }}>"{me.clue}"</strong>
          </p>
          <div style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", fontSize: "0.85rem", fontWeight: 600 }}>
              <span style={{ color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Players ready</span>
              <span style={{ color: "var(--primary)" }}>{room.players.filter(p => p.clue).length} / {room.players.length}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(room.players.filter(p => p.clue).length / room.players.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SINGLE DEVICE: All submitted, waiting for phase transition ────────────
  if (isSingleDevice && playersWithoutClue.length === 0) {
    return (
      <div className="card-elevated anim-scale-in" style={{ maxWidth: 540, margin: "0 auto", padding: "var(--card-py) var(--card-px)", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 56, height: 56, borderRadius: "50%",
          background: "var(--success-dim)", color: "var(--success)",
          marginBottom: "1rem", boxShadow: "0 0 24px var(--success-glow)",
        }}>
          <MessageSquare size={28} />
        </div>
        <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-1)", marginBottom: "0.5rem" }}>
          All Clues Submitted!
        </h3>
        <p style={{ color: "var(--text-3)", fontSize: "0.9rem" }}>
          Moving to the imposter&apos;s guess phase…
        </p>
        <Loader2 size={20} className="spinner" style={{ margin: "1.5rem auto 0", color: "var(--primary)" }} />
      </div>
    );
  }

  // ── SINGLE DEVICE: Pass-the-phone clue entry ──────────────────────────────
  if (isSingleDevice && sdCurrentPlayer) {
    const submittedCount = room.players.filter(p => p.clue).length;
    const totalPlayers = room.players.length;

    return (
      <div className="card-elevated anim-scale-in" style={{ maxWidth: 540, margin: "0 auto", padding: "var(--card-py) var(--card-px)" }}>
        {/* Progress */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: "0.75rem" }}>
            {room.players.map((p, i) => (
              <div key={i} style={{
                width: p.clue ? 20 : 8,
                height: 8,
                borderRadius: 99,
                background: p.clue ? "var(--success)" : p.id === sdCurrentPlayer.id ? "var(--primary)" : "var(--border)",
                transition: "all 0.3s",
              }} />
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>
            Clue {submittedCount + 1} of {totalPlayers}
          </p>
        </div>

        {/* Player header */}
        <div style={{
          background: showImposterHint ? "rgba(244,63,94,0.08)" : "rgba(139,92,246,0.08)",
          border: `1px solid ${showImposterHint ? "rgba(244,63,94,0.2)" : "rgba(139,92,246,0.2)"}`,
          borderRadius: "var(--radius-lg)",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: `hsl(${sdCurrentPlayer.name.charCodeAt(0) * 13 % 360}, 60%, 40%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1rem", fontWeight: 900, color: "#fff", flexShrink: 0,
          }}>
            {sdCurrentPlayer.name[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: showImposterHint ? "var(--danger)" : "var(--primary)", fontWeight: 700, marginBottom: "0.15rem" }}>
              {sdCurrentPlayer.name}&apos;s Turn
            </div>
            {showWord && (
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-1)" }}>
                Word: <span style={{ color: "var(--primary)" }}>{room.word}</span>
                {room.wordCategory && (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-3)", fontWeight: 500, marginLeft: "0.5rem" }}>
                    ({room.wordCategory})
                  </span>
                )}
              </div>
            )}
            {showImposterHint && (
              <div>
                <div style={{ fontSize: "0.85rem", color: "var(--danger)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Tag size={12} /> {room.wordCategory}
                </div>
                {!showHint ? (
                  <button
                    type="button"
                    onClick={() => setShowHint(true)}
                    style={{ background: "none", border: "none", color: "var(--danger)", fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", padding: 0, marginTop: "0.15rem" }}
                  >
                    <Eye size={13} /> Reveal your hint
                  </button>
                ) : (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-2)", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <EyeOff size={13} onClick={() => setShowHint(false)} style={{ cursor: "pointer" }} />
                    {room.imposterHint}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Clue input */}
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-2)" }}>
            Enter your one-word clue:
          </label>
          <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
            <input
              type="text"
              value={clue}
              onChange={(e) => setClue(e.target.value.replace(/\s/g, ""))}
              placeholder="e.g. Delicious"
              className="input input-lg"
              autoFocus
              maxLength={20}
              required
              style={{ fontSize: "1rem", touchAction: "manipulation" }}
            />
            {clue.trim().includes(" ") && (
              <p className="error-msg anim-fade-in">Only one word allowed!</p>
            )}
            <button
              type="submit"
              disabled={loading || !clue.trim() || clue.trim().includes(" ")}
              className="btn btn-primary btn-lg btn-full"
              style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
            >
              {loading ? (
                <><Loader2 size={20} className="spinner" /> Submitting…</>
              ) : submittedCount + 1 === totalPlayers ? (
                <><Send size={20} /> Submit Final Clue</>
              ) : (
                <><ChevronRight size={20} /> Submit & Pass to {room.players[submittedCount + 1]?.name}</>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── MULTIPLAYER MODE ──────────────────────────────────────────────────────
  const mpMe = room.players.find((p) => p.id === playerId)!;
  const mpIsImposter = mpMe.role === "imposter";

  return (
    <div className="card-elevated anim-scale-in" style={{ maxWidth: 540, margin: "0 auto", padding: "var(--card-py) var(--card-px)" }}>
      {/* Context Header */}
      <div style={{
        background: mpIsImposter ? "rgba(244,63,94,0.08)" : "rgba(139,92,246,0.08)",
        border: `1px solid ${mpIsImposter ? "rgba(244,63,94,0.2)" : "rgba(139,92,246,0.2)"}`,
        borderRadius: "var(--radius-lg)",
        padding: "1.25rem",
        marginBottom: "2rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem"
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "calc(var(--radius-md) - 2px)",
          background: mpIsImposter ? "var(--danger-dim)" : "var(--primary-dim)",
          color: mpIsImposter ? "var(--danger)" : "var(--primary)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {mpIsImposter ? <Sparkles size={24} /> : <FileText size={24} />}
        </div>
        <div>
          <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)", fontWeight: 700, marginBottom: "0.2rem" }}>
            {mpIsImposter ? "Your Goal" : "The Secret Word"}
          </h3>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-1)", letterSpacing: "0.02em" }}>
            {mpIsImposter ? "Blend in. Act casual." : room.word}
          </div>
          {mpIsImposter && room.wordCategory && (
            <div style={{ marginTop: "0.2rem", fontSize: "0.8rem", color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Tag size={11} /> Category: <span style={{ fontWeight: 600 }}>{room.wordCategory}</span>
            </div>
          )}
          {mpIsImposter && room.imposterHint && (
            <div style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "rgba(244,63,94,0.8)" }}>
              Hint: <span style={{ fontWeight: 600 }}>{room.imposterHint}</span>
            </div>
          )}
        </div>
      </div>

      {/* Clue Input Form */}
      <form onSubmit={handleSubmit} className="anim-slide-up">
        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-2)" }}>
          Enter your one-word clue:
        </label>
        <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
          <input
            type="text"
            value={clue}
            onChange={(e) => setClue(e.target.value)}
            placeholder="e.g. Delicious"
            className="input input-lg"
            autoFocus
            maxLength={20}
            required
            style={{ fontSize: "1rem", touchAction: "manipulation" }}
          />
          <button
            type="submit"
            disabled={loading || !clue.trim() || clue.trim().includes(" ")}
            className="btn btn-primary btn-lg"
            style={{ padding: "0 2rem", touchAction: "manipulation" }}
          >
            {loading ? (
              <><Loader2 size={20} className="spinner" /> Sending…</>
            ) : (
              <><Send size={20} /> Submit Clue</>
            )}
          </button>
        </div>
        {clue.trim().includes(" ") && (
          <p className="error-msg anim-fade-in" style={{ marginTop: "1rem" }}>
            Only one word allowed!
          </p>
        )}
      </form>
    </div>
  );
}
