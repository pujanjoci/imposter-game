"use client";

import { useState } from "react";
import { RoomView } from "@/lib/types";
import {
  Send, FileText, Loader2, Sparkles, MessageSquare,
  ChevronRight, Tag, Users
} from "lucide-react";
import { submitClueClient, advanceToInterRoundClient } from "@/lib/api-client";
import { playGameSound, triggerHaptic, HAPTICS } from "@/lib/audio";

export default function CluePhase({ room, playerId }: { room: RoomView; playerId: string }) {
  const [clue, setClue] = useState("");
  const [loading, setLoading] = useState(false);

  const isSingleDevice = room.singleDeviceMode;
  const isHiddenWords = room.gameMode === "hidden_words";

  const me = room.players.find((p) => p.id === playerId);
  if (!me && !isSingleDevice) return null;

  // Simpler: just check submissions empty status
  const hasSubmitted = me ? !!me.clue : false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clue.trim() || loading || !me) return;
    triggerHaptic(HAPTICS.TAP);
    playGameSound("TAP");
    setLoading(true);
    try {
      await submitClueClient(room.code, me.id, clue.trim());
      if (isSingleDevice) {
        setClue("");
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
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-1)" }}>Submission Received!</h3>
          <p style={{ color: "var(--text-2)", marginTop: "0.25rem" }}>
            Your submission: <strong style={{ color: "var(--primary)", fontWeight: 800 }}>&quot;{me?.clue}&quot;</strong>
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

  // ── SINGLE DEVICE: Discussion Time ────────────────────────────────────────
  if (isSingleDevice) {
    return (
      <div className="card-elevated anim-scale-in" style={{ maxWidth: 540, margin: "0 auto", padding: "var(--card-py) var(--card-px)", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 56, height: 56, borderRadius: "50%",
          background: "var(--primary-dim)", color: "var(--primary)",
          marginBottom: "1rem", boxShadow: "0 0 24px var(--primary-glow)",
        }}>
          <Users size={28} />
        </div>
        <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-1)", marginBottom: "0.5rem" }}>
          Discussion Time!
        </h3>
        <p style={{ color: "var(--text-3)", fontSize: "0.95rem", marginBottom: "2rem" }}>
          Go around the group and say your one-word clue out loud! 
          <br /><br />
          Once everyone has shared their clue, click below to {isHiddenWords ? "reveal the result" : "advance to the Imposter's turn"}.
        </p>
        <button
          onClick={async () => {
             setLoading(true);
             try {
               await advanceToInterRoundClient(room.code);
             } finally {
               setLoading(false);
             }
          }}
          disabled={loading}
          className="btn btn-primary btn-lg btn-full"
        >
           {loading ? (
             <><Loader2 size={20} className="spinner" /> Advancing…</>
           ) : (
             <><ChevronRight size={20} /> {isHiddenWords ? "Advance to Reveal" : "Advance to Imposter Guess"}</>
           )}
        </button>
      </div>
    );
  }

  // ── MULTIPLAYER MODE ──────────────────────────────────────────────────────
  const mpMe = room.players.find((p) => p.id === playerId)!;
  const mpIsImposter = mpMe.role === "imposter";
  const mpIsUndercover = mpMe.role === "undercover";

  return (
    <div className="card-elevated anim-scale-in" style={{ maxWidth: 540, margin: "0 auto", padding: "var(--card-py) var(--card-px)" }}>
      {room.resultReason && (
        <div className="msg msg-warn anim-fade-in" style={{ marginBottom: "1.5rem" }}>
          {room.resultReason}
        </div>
      )}
      {/* Context Header */}
      <div style={{
        background: (mpIsImposter && !isHiddenWords)
          ? "rgba(244,63,94,0.08)"
          : mpIsUndercover
            ? "rgba(245,158,11,0.08)"
            : "rgba(139,92,246,0.08)",
        border: `1px solid ${
          (mpIsImposter && !isHiddenWords)
            ? "rgba(244,63,94,0.2)"
            : mpIsUndercover
              ? "rgba(245,158,11,0.2)"
              : "rgba(139,92,246,0.2)"
        }`,
        borderRadius: "var(--radius-lg)",
        padding: "1.25rem",
        marginBottom: "2rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem"
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "calc(var(--radius-md) - 2px)",
          background: (mpIsImposter && !isHiddenWords)
            ? "var(--danger-dim)"
            : mpIsUndercover
              ? "var(--warning-dim)"
              : "var(--primary-dim)",
          color: (mpIsImposter && !isHiddenWords)
            ? "var(--danger)"
            : mpIsUndercover
              ? "var(--warning)"
              : "var(--primary)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {(mpIsImposter && !isHiddenWords) ? <Sparkles size={24} /> : <FileText size={24} />}
        </div>
        <div>
          <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)", fontWeight: 700, marginBottom: "0.2rem" }}>
            {isHiddenWords
              ? "Your Word"
              : mpIsUndercover
                ? "Your Word"
                : mpIsImposter
                  ? "Your Goal"
                  : "The Secret Word"}
          </h3>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-1)", letterSpacing: "0.02em" }}>
            {(mpIsImposter && !isHiddenWords) ? "Blend in. Act casual." : room.word}
          </div>
          {room.wordCategory && (
            <div style={{
              marginTop: "0.2rem",
              fontSize: "0.8rem",
              color: (mpIsImposter && !isHiddenWords)
                ? "var(--danger)"
                : mpIsUndercover
                  ? "var(--warning)"
                  : "var(--primary)",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem"
            }}>
              <Tag size={11} /> Category: <span style={{ fontWeight: 600 }}>{room.wordCategory}</span>
            </div>
          )}
          {(mpIsImposter && !isHiddenWords) && room.imposterHint && (
            <div style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "rgba(244,63,94,0.8)" }}>
              Hint: <span style={{ fontWeight: 600 }}>{room.imposterHint}</span>
            </div>
          )}
          {mpIsUndercover && (
            <div style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "rgba(245,158,11,0.8)" }}>
              Note: <span style={{ fontWeight: 600 }}>You are Undercover. Blend in!</span>
            </div>
          )}
        </div>
      </div>

      {/* Clue Input Form */}
      <form onSubmit={handleSubmit} className="anim-slide-up">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-2)" }}>
            Enter your one-word submission:
          </label>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)" }}>
            Round {room.clueRound || 1} of 3
          </span>
        </div>
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
