"use client";

import { useState, useEffect, useRef } from "react";
import { RoomView } from "@/lib/types";
import { advanceSingleDeviceTurnClient } from "@/lib/api-client";
import { Eye, EyeOff, Loader2, Sparkles, UserX, ShieldCheck, Tag, ChevronRight } from "lucide-react";
import { PlayerBadge } from "@/components/ui/PlayerBadge";
import { playGameSound, triggerHaptic, HAPTICS } from "@/lib/audio";

interface RoleRevealProps {
  room: RoomView;
  playerId: string;
}

export default function RoleReveal({ room, playerId }: RoleRevealProps) {
  const [showRole, setShowRole] = useState(false);
  const [loading, setLoading] = useState(false);
  const [waitingToPass, setWaitingToPass] = useState(false);

  const me = room.players.find((p) => p.id === playerId);
  const isSingleDevice = room.singleDeviceMode;

  // In single-device mode, the active player being shown role
  const activeSdPlayer = isSingleDevice ? room.players[room.singleDeviceTurn] : null;
  const isMyTurn = isSingleDevice ? activeSdPlayer?.id === playerId : true;

  // Derive role/word from the active player in single-device mode
  // The server already sends the correct role/word for the active player
  const activeRole = isSingleDevice
    ? (activeSdPlayer?.id === room.players.find(p => p.id === room.players[room.singleDeviceTurn]?.id)?.id
        ? activeSdPlayer?.role
        : undefined)
    : me?.role;

  // In single-device mode, the role shown is for the active turn player
  const displayRole = isSingleDevice ? activeSdPlayer?.role : me?.role;
  const displayWord = room.word; // null for imposter (handled server-side)
  const displayHint = room.imposterHint; // only sent to imposter

  function handleHideAndPass() {
    if (isSingleDevice) {
      setWaitingToPass(true);
      setShowRole(false);
    } else {
      handleReady();
    }
  }

  // Reset for each turn change in single-device mode
  useEffect(() => {
    setShowRole(false);
    setWaitingToPass(false);
  }, [room.singleDeviceTurn]);

  async function handleReady() {
    setLoading(true);
    try {
      await fetch(`/api/rooms/${room.code}/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
    } finally {
      // Don't clear loading — let SSE update drive the state change
    }
  }

  async function handleSingleDeviceNext() {
    setLoading(true);
    try {
      await advanceSingleDeviceTurnClient(room.code, playerId);
    } finally {
      setLoading(false);
    }
  }

  // Ensure 'me' is defined for multiplayer before rendering
  if (!me && !isSingleDevice) return null;

  if (isSingleDevice) {
    const totalPlayers = room.players.length;
    const currentTurn = room.singleDeviceTurn;
    const currentPlayer = room.players[currentTurn];
    const isLastPlayer = currentTurn === totalPlayers - 1;

    if (waitingToPass) {
      const nextPlayer = isLastPlayer ? null : room.players[currentTurn + 1];
      return (
        <div className="card anim-scale-in" style={{ maxWidth: 460, margin: "0 auto", textAlign: "center", padding: "3rem 2rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-1)" }}>
            {isLastPlayer ? "All Roles Revealed!" : `Pass to ${nextPlayer?.name}`}
          </h2>
          <p style={{ color: "var(--text-3)", marginBottom: "2.5rem", fontSize: "1rem" }}>
            {isLastPlayer ? "Everyone should know their role. Ready to figure out the imposter?" : `Make sure ${nextPlayer?.name} is holding the device before continuing.`}
          </p>
          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={handleSingleDeviceNext}
            disabled={loading}
          >
            {loading ? <Loader2 className="spinner" /> : isLastPlayer ? "Start Game" : `I am ${nextPlayer?.name}`}
          </button>
        </div>
      );
    }

    return (
      <div className="card anim-scale-in" style={{ maxWidth: 460, margin: "0 auto", textAlign: "center" }}>
        {/* Progress indicator */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginBottom: "1rem",
          }}>
            {room.players.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i < currentTurn ? 20 : 8,
                  height: 8,
                  borderRadius: 99,
                  background: i < currentTurn
                    ? "var(--success)"
                    : i === currentTurn
                      ? "var(--primary)"
                      : "var(--border)",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>
            Player {currentTurn + 1} of {totalPlayers}
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          {currentPlayer && (
            <PlayerBadge 
              player={currentPlayer} 
              isCurrentTurn={true} 
            />
          )}
          <h2 style={{
            fontSize: "1.4rem",
            fontWeight: 800,
            color: "var(--text-1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            marginTop: "0.5rem"
          }}>
            {currentPlayer?.name}&apos;s Turn
          </h2>
          <p style={{ marginTop: "0.4rem", color: "var(--text-3)", fontSize: "0.9rem" }}>
            {showRole ? "Remember your role!" : "Tap the card to reveal your role. Hide the screen from others!"}
          </p>
        </div>

        {/* Role Card */}
        <div
          onClick={() => {
            if (!showRole) {
              triggerHaptic(HAPTICS.REVEAL);
              playGameSound("REVEAL");
              setShowRole(true);
            }
          }}
          className="hover-lift"
          style={{
            background: showRole
              ? displayRole === "imposter" ? "var(--danger-dim)" : "var(--primary-dim)"
              : "var(--bg-elevated)",
            border: `1px solid ${showRole
              ? displayRole === "imposter" ? "rgba(244,63,94,0.3)" : "rgba(139,92,246,0.3)"
              : "var(--border)"}`,
            borderRadius: "var(--radius-xl)",
            padding: "2.5rem 1.5rem",
            cursor: showRole ? "default" : "pointer",
            marginBottom: "1.5rem",
            transition: "all var(--dur-med) var(--ease-spring)",
            boxShadow: showRole
              ? displayRole === "imposter" ? "0 8px 32px var(--danger-glow)" : "0 8px 32px var(--primary-glow)"
              : "none",
          }}
        >
          {!showRole ? (
            <div className="anim-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "var(--text-3)" }}>
              <EyeOff size={48} />
              <span style={{ fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Tap to Reveal</span>
            </div>
          ) : (
            <div className="anim-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              {displayRole === "imposter" ? (
                <>
                  <UserX size={52} style={{ color: "var(--danger)" }} />
                  <h3 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--danger)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>
                    IMPOSTER
                  </h3>
                  {/* Category badge */}
                  {room.wordCategory && (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      background: "rgba(244,63,94,0.12)",
                      border: "1px solid rgba(244,63,94,0.25)",
                      borderRadius: 99,
                      padding: "0.2rem 0.65rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--danger)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      <Tag size={11} /> {room.wordCategory}
                    </div>
                  )}
                  {/* Hint */}
                  {displayHint && (
                    <div style={{
                      background: "rgba(244,63,94,0.1)",
                      padding: "0.75rem 1rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px dashed rgba(244,63,94,0.3)",
                      maxWidth: 280,
                    }}>
                      <p style={{ fontSize: "0.75rem", color: "var(--danger)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
                        Your Hint
                      </p>
                      <p style={{ fontSize: "1rem", color: "#fff", fontWeight: 600, lineHeight: 1.4 }}>{displayHint}</p>
                    </div>
                  )}
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", fontStyle: "italic" }}>
                    Blend in. Don&apos;t get caught.
                  </p>
                </>
              ) : (
                <>
                  <Sparkles size={52} style={{ color: "var(--primary)" }} />
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
                    CREWMATE
                  </h3>
                  {/* Category badge */}
                  {room.wordCategory && (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      background: "var(--primary-dim)",
                      border: "1px solid rgba(139,92,246,0.25)",
                      borderRadius: 99,
                      padding: "0.2rem 0.65rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      <Tag size={11} /> {room.wordCategory}
                    </div>
                  )}
                  <p style={{ color: "var(--text-2)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                    The secret word is:
                  </p>
                  <div style={{
                    background: "var(--bg-card)",
                    border: "1px solid rgba(139,92,246,0.3)",
                    padding: "0.75rem 1.75rem",
                    borderRadius: "var(--radius-lg)",
                    fontSize: "1.75rem",
                    fontWeight: 900,
                    color: "#fff",
                    letterSpacing: "-0.01em",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.4) inset",
                  }}>
                    {displayWord}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Manual advance */}
        {showRole && (
          <div className="anim-fade-in" style={{ marginTop: "1.5rem" }}>
            <button
              onClick={handleHideAndPass}
              className="btn btn-primary btn-full btn-lg"
            >
              Hide Role & Proceed
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Multiplayer Mode ────────────────────────────────────────────────────
  return (
    <div className="card anim-scale-in" style={{ maxWidth: 460, margin: "0 auto", textAlign: "center" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-1)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          <ShieldCheck size={24} style={{ color: "var(--primary)" }} /> Your Secret Role
        </h2>
        <p style={{ marginTop: "0.5rem", color: "var(--text-3)", fontSize: "0.95rem" }}>
          Tap the card below to reveal your role. Make sure no one else is looking!
        </p>
      </div>

      {/* ── Role Card ── */}
      <div
        onClick={() => {
          if (!showRole) {
            triggerHaptic(HAPTICS.REVEAL);
            playGameSound("REVEAL");
          } else {
            playGameSound("TAP");
            triggerHaptic(HAPTICS.TAP);
          }
          setShowRole(!showRole);
        }}
        className="hover-lift"
        style={{
          background: showRole
            ? me?.role === "imposter" ? "var(--danger-dim)" : "var(--primary-dim)"
            : "var(--bg-elevated)",
          border: `1px solid ${showRole
            ? me?.role === "imposter" ? "rgba(244,63,94,0.3)" : "rgba(139,92,246,0.3)"
            : "var(--border)"}`,
          borderRadius: "var(--radius-xl)",
          padding: "2.5rem 1.5rem",
          cursor: "pointer",
          marginBottom: "2rem",
          transition: "all var(--dur-med) var(--ease-spring)",
          boxShadow: showRole
            ? me?.role === "imposter" ? "0 8px 32px var(--danger-glow)" : "0 8px 32px var(--primary-glow)"
            : "none",
        }}
      >
        {!showRole ? (
          <div className="anim-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "var(--text-3)" }}>
            <EyeOff size={48} />
            <span style={{ fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Tap to Reveal</span>
          </div>
        ) : (
          <div className="anim-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            {me?.role === "imposter" ? (
              <>
                <UserX size={56} style={{ color: "var(--danger)" }} />
                <h3 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--danger)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>
                  IMPOSTER
                </h3>
                {/* Category badge */}
                {room.wordCategory && (
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    background: "rgba(244,63,94,0.12)",
                    border: "1px solid rgba(244,63,94,0.25)",
                    borderRadius: 99,
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--danger)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    <Tag size={11} /> Category: {room.wordCategory}
                  </div>
                )}
                {room.imposterHint && (
                  <div style={{
                    background: "rgba(244,63,94,0.15)",
                    padding: "0.65rem 1rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px dashed rgba(244,63,94,0.3)",
                    marginTop: "0.25rem",
                    maxWidth: 300,
                  }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--danger)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
                      Your Hint
                    </p>
                    <p style={{ fontSize: "1rem", color: "#fff", fontWeight: 600, lineHeight: 1.4 }}>{room.imposterHint}</p>
                  </div>
                )}
                <p style={{ color: "var(--text-1)", marginTop: "0.25rem", fontSize: "0.9rem", fontWeight: 500, fontStyle: "italic" }}>
                  Blend in. Don&apos;t get caught.
                </p>
              </>
            ) : (
              <>
                <Sparkles size={56} style={{ color: "var(--primary)" }} />
                <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
                  CREWMATE
                </h3>
                {/* Category badge */}
                {room.wordCategory && (
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    background: "var(--primary-dim)",
                    border: "1px solid rgba(139,92,246,0.25)",
                    borderRadius: 99,
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    <Tag size={11} /> Category: {room.wordCategory}
                  </div>
                )}
                <p style={{ color: "var(--text-2)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                  The secret word is:
                </p>
                <div style={{
                  background: "var(--bg-card)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "var(--radius-lg)",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "#fff",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4) inset",
                }}>
                  {room.word}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{
          marginTop: "1.5rem",
          minHeight: "3.5rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
      }}>
        {showRole ? (
          <div className="anim-fade-in" style={{ width: "100%" }}>
            <button
              onClick={handleHideAndPass}
              disabled={loading}
              className="btn btn-primary btn-full btn-lg"
            >
              {loading ? <Loader2 size={20} className="spinner" /> : "I've memorized my role – Ready up"}
            </button>
          </div>
        ) : (
          <div style={{
            textAlign: "center",
            color: "var(--text-3)",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}>
            <Loader2 size={14} className="spinner" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "0.4rem" }} />
            Don&apos;t let anyone see your screen
          </div>
        )}
      </div>

      <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--text-3)", textAlign: "center" }}>
        {room.players.filter((p) => p.isReady).length} / {room.players.length} players ready
      </div>
    </div>
  );
}
