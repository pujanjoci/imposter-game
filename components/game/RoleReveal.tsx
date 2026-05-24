"use client";

import { useState, useEffect } from "react";
import { RoomView } from "@/lib/types";
import { advanceSingleDeviceTurnClient } from "@/lib/api-client";
import { EyeOff, Loader2, Sparkles, UserX, ShieldCheck, Tag, Eye } from "lucide-react";
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
  const isHiddenWords = room.gameMode === "hidden_words";

  // In single-device mode, the active player being shown role
  const activeSdPlayer = isSingleDevice ? room.players[room.singleDeviceTurn] : null;
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
            {isLastPlayer ? (isHiddenWords ? "All Words Revealed!" : "All Roles Revealed!") : `Pass to ${nextPlayer?.name}`}
          </h2>
          <p style={{ color: "var(--text-3)", marginBottom: "2.5rem", fontSize: "1rem" }}>
            {isLastPlayer
              ? (isHiddenWords ? "Everyone has seen their word. Start the clues and watch for the odd one out." : "Everyone should know their role. Ready to figure out the imposter?")
              : `Make sure ${nextPlayer?.name} is holding the device before continuing.`}
          </p>
          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={handleSingleDeviceNext}
            disabled={loading}
          >
            {loading ? <Loader2 className="spinner" /> : isLastPlayer ? "Start Discussion" : `I am ${nextPlayer?.name}`}
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
            {showRole
              ? (isHiddenWords ? "Remember your word!" : "Remember your role!")
              : `Tap the card to reveal your ${isHiddenWords ? "word" : "role"}. Hide the screen from others!`}
          </p>
        </div>

        {/* ── Role Card (3D perspective flip) ── */}
        <div
          className="perspective-1000"
          style={{
            width: "100%",
            height: 320,
            margin: "0 auto 1.5rem auto",
            cursor: showRole ? "default" : "pointer",
          }}
          onClick={() => {
            if (!showRole) {
              triggerHaptic(HAPTICS.REVEAL);
              playGameSound("REVEAL");
              setShowRole(true);
            }
          }}
        >
          <div className={`card-inner ${showRole ? "card-flipped" : ""}`} style={{ width: "100%", height: "100%" }}>
            
            {/* CARD FRONT */}
            <div className="card-front" style={{
              position: "absolute", width: "100%", height: "100%",
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "1rem"
            }}>
              <div style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
                marginBottom: "0.5rem"
              }}>
                <EyeOff size={32} style={{ color: "var(--text-3)" }} />
              </div>
              <span style={{ fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-3)" }}>
                Tap to Reveal
              </span>
            </div>

            {/* CARD BACK */}
            <div className={`card-back ${
              isHiddenWords
                ? "glow-primary"
                : displayRole === "imposter"
                  ? "glow-danger"
                  : displayRole === "undercover"
                    ? "glow-warning"
                    : "glow-primary"
            }`} style={{
              position: "absolute", width: "100%", height: "100%",
              background: isHiddenWords
                ? "linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(139,92,246,0.12) 100%)"
                : displayRole === "imposter"
                  ? "linear-gradient(135deg, rgba(244,63,94,0.1) 0%, rgba(244,63,94,0.2) 100%)"
                  : displayRole === "undercover"
                    ? "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.2) 100%)"
                    : "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.16) 100%)",
              border: "1px solid transparent",
              borderRadius: "var(--radius-xl)", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "1rem",
              padding: "1.5rem"
            }}>
              {isHiddenWords ? (
                <>
                  <Sparkles size={52} style={{ color: "var(--cyan)" }} />
                  {room.wordCategory && (
                    <div className="badge badge-cyan">
                      <Tag size={11} /> {room.wordCategory}
                    </div>
                  )}
                  <p style={{ color: "var(--text-2)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                    Your secret word is:
                  </p>
                  <div style={{
                    background: "var(--bg-card)",
                    border: "1px solid rgba(34,211,238,0.3)",
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
              ) : displayRole === "imposter" ? (
                <>
                  <UserX size={52} style={{ color: "var(--danger)" }} />
                  <h3 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--danger)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>
                    IMPOSTER
                  </h3>
                  {room.wordCategory && (
                    <div className="badge badge-red">
                      <Tag size={11} /> {room.wordCategory}
                    </div>
                  )}
                  {displayHint && (
                    <div style={{
                      background: "rgba(244,63,94,0.1)",
                      padding: "0.5rem 1rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px dashed rgba(244,63,94,0.3)",
                      maxWidth: 280,
                    }}>
                      <p style={{ fontSize: "0.7rem", color: "var(--danger)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.2rem" }}>
                        Your Hint
                      </p>
                      <p style={{ fontSize: "0.85rem", color: "#fff", fontWeight: 600, lineHeight: 1.3 }}>{displayHint}</p>
                    </div>
                  )}
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", fontStyle: "italic" }}>
                    Blend in. Don&apos;t get caught.
                  </p>
                </>
              ) : displayRole === "undercover" ? (
                <>
                  <EyeOff size={52} style={{ color: "var(--warning)" }} />
                  <h3 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--warning)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>
                    UNDERCOVER
                  </h3>
                  {room.wordCategory && (
                    <div className="badge badge-amber">
                      <Tag size={11} /> {room.wordCategory}
                    </div>
                  )}
                  <p style={{ color: "var(--text-2)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                    Your secret word is:
                  </p>
                  <div style={{
                    background: "var(--bg-card)",
                    border: "1px solid rgba(245,158,11,0.3)",
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
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", fontStyle: "italic" }}>
                    You have a decoy word! Blend in.
                  </p>
                </>
              ) : (
                <>
                  <Sparkles size={52} style={{ color: "var(--primary)" }} />
                  <h3 style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--primary)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
                    CREWMATE
                  </h3>
                  {room.wordCategory && (
                    <div className="badge badge-purple">
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
          </div>
        </div>

        {/* Manual advance */}
        {showRole && (
          <div className="anim-fade-in" style={{ marginTop: "1.5rem" }}>
            <button
              onClick={handleHideAndPass}
              className="btn btn-primary btn-full btn-lg"
            >
              {isHiddenWords ? "Hide Word & Proceed" : "Hide Role & Proceed"}
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
          <ShieldCheck size={24} style={{ color: "var(--primary)" }} /> {isHiddenWords ? "Your Secret Word" : "Your Secret Role"}
        </h2>
        <p style={{ marginTop: "0.5rem", color: "var(--text-3)", fontSize: "0.95rem" }}>
          Tap the card below to reveal your {isHiddenWords ? "word" : "role"}. Make sure no one else is looking!
        </p>
      </div>

      {/* ── Role Card (3D perspective flip) ── */}
      <div
        className="perspective-1000"
        style={{
          width: "100%",
          height: 320,
          margin: "0 auto 2rem auto",
          cursor: "pointer",
        }}
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
      >
        <div className={`card-inner ${showRole ? "card-flipped" : ""}`} style={{ width: "100%", height: "100%" }}>
          
          {/* CARD FRONT */}
          <div className="card-front" style={{
            position: "absolute", width: "100%", height: "100%",
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "1rem"
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
              marginBottom: "0.5rem"
            }}>
              <EyeOff size={32} style={{ color: "var(--text-3)" }} />
            </div>
            <span style={{ fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-3)" }}>
              Tap to Reveal
            </span>
          </div>

          {/* CARD BACK */}
          <div className={`card-back ${
            isHiddenWords
              ? "glow-primary"
              : me?.role === "imposter"
                ? "glow-danger"
                : me?.role === "undercover"
                  ? "glow-warning"
                  : "glow-primary"
          }`} style={{
            position: "absolute", width: "100%", height: "100%",
            background: isHiddenWords
              ? "linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(139,92,246,0.12) 100%)"
              : me?.role === "imposter"
                ? "linear-gradient(135deg, rgba(244,63,94,0.1) 0%, rgba(244,63,94,0.2) 100%)"
                : me?.role === "undercover"
                  ? "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.2) 100%)"
                  : "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.16) 100%)",
            border: "1px solid transparent",
            borderRadius: "var(--radius-xl)", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "1rem",
            padding: "1.5rem"
          }}>
            {isHiddenWords ? (
              <>
                <Sparkles size={56} style={{ color: "var(--cyan)" }} />
                {room.wordCategory && (
                  <div className="badge badge-cyan">
                    <Tag size={11} /> Category: {room.wordCategory}
                  </div>
                )}
                <p style={{ color: "var(--text-2)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                  Your word is:
                </p>
                <div style={{
                  background: "var(--bg-card)",
                  border: "1px solid rgba(34,211,238,0.3)",
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
            ) : me?.role === "imposter" ? (
              <>
                <UserX size={56} style={{ color: "var(--danger)" }} />
                <h3 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--danger)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>
                  IMPOSTER
                </h3>
                {room.wordCategory && (
                  <div className="badge badge-red">
                    <Tag size={11} /> Category: {room.wordCategory}
                  </div>
                )}
                {room.imposterHint && (
                  <div style={{
                    background: "rgba(244,63,94,0.15)",
                    padding: "0.5rem 1rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px dashed rgba(244,63,94,0.3)",
                    marginTop: "0.25rem",
                    maxWidth: 300,
                  }}>
                    <p style={{ fontSize: "0.7rem", color: "var(--danger)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                      Your Hint
                    </p>
                    <p style={{ fontSize: "0.9rem", color: "#fff", fontWeight: 600, lineHeight: 1.3 }}>{room.imposterHint}</p>
                  </div>
                )}
                <p style={{ color: "var(--text-1)", marginTop: "0.25rem", fontSize: "0.9rem", fontWeight: 500, fontStyle: "italic" }}>
                  Blend in. Don&apos;t get caught.
                </p>
              </>
            ) : me?.role === "undercover" ? (
              <>
                <UserX size={56} style={{ color: "var(--warning)" }} />
                <h3 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--warning)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>
                  UNDERCOVER
                </h3>
                {room.wordCategory && (
                  <div className="badge badge-amber">
                    <Tag size={11} /> Category: {room.wordCategory}
                  </div>
                )}
                <p style={{ color: "var(--text-2)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                  Your secret word is:
                </p>
                <div style={{
                  background: "var(--bg-card)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "var(--radius-lg)",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "#fff",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4) inset",
                }}>
                  {room.word}
                </div>
                <p style={{ color: "var(--text-1)", marginTop: "0.25rem", fontSize: "0.9rem", fontWeight: 500, fontStyle: "italic" }}>
                  You have a decoy word! Blend in.
                </p>
              </>
            ) : (
              <>
                <Sparkles size={56} style={{ color: "var(--primary)" }} />
                <h3 style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--primary)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
                  CREWMATE
                </h3>
                {room.wordCategory && (
                  <div className="badge badge-purple">
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
        </div>
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
              {loading ? <Loader2 size={20} className="spinner" /> : `I've memorized my ${isHiddenWords ? "word" : "role"} - Ready up`}
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
