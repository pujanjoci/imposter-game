"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import Lobby from "@/components/game/Lobby";
import RoleReveal from "@/components/game/RoleReveal";
import CluePhase from "@/components/game/CluePhase";
import InterRound from "@/components/game/InterRound";
import VotePhase from "@/components/game/VotePhase";
import Results from "@/components/game/Results";
import {
  Activity, AlertCircle, LogOut, Check,
  Search, ShieldAlert, Sparkles, Crown, UserSearch, Swords, Home, Smartphone,
} from "lucide-react";

const PHASE_STEPS = [
  { key: "lobby",       label: "Lobby" },
  { key: "role_reveal", label: "Roles" },
  { key: "clue_phase",  label: "Clues" },
  { key: "inter_round", label: "Guess?" },
  { key: "vote_phase",  label: "Vote" },
  { key: "results",     label: "Results" },
];

// Single-device mode skips the vote phase
const SD_PHASE_STEPS = [
  { key: "lobby",       label: "Lobby" },
  { key: "role_reveal", label: "Roles" },
  { key: "clue_phase",  label: "Clues" },
  { key: "inter_round", label: "Guess?" },
  { key: "results",     label: "Reveal" },
];

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  // For single-device mode: read all player IDs from localStorage
  // and use the host player (index 0) as the "connected" player
  const storedPlayerId = typeof window !== "undefined"
    ? localStorage.getItem(`player_${code}`) || ""
    : "";

  const { room, playerId: hookPlayerId, connected, error } = useRoom(code);

  // In single-device mode we want to use the stored player ID
  // which is always playerIds[0] (the host), but the room view
  // rotates between players during role_reveal via singleDeviceTurn
  const playerId = hookPlayerId || storedPlayerId;

  function handlePlayAgain() {
    router.push("/");
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error && !room) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          background: "var(--bg-base)",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ color: "var(--danger)" }}>
          <AlertCircle size={48} />
        </div>
        <h2 style={{ fontWeight: 700, color: "var(--text-1)", fontSize: "1.5rem" }}>
          Unable to Connect
        </h2>
        <p style={{ color: "var(--text-3)", maxWidth: 400 }}>{error}</p>
        <button
          onClick={() => router.push("/")}
          className="btn btn-primary btn-lg"
          style={{ touchAction: "manipulation" }}
        >
          <LogOut size={18} /> Return Home
        </button>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!room) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          background: "var(--bg-base)",
        }}
      >
        <div className="spinner" style={{ width: 36, height: 36 }} />
        <p style={{ color: "var(--text-3)", fontWeight: 500 }}>
          Connecting to room {code}…
        </p>
      </div>
    );
  }

  // ── Player not in room (mobile share-link flow) ───────────────────────────
  const myPlayer = room.players.find((p) => p.id === playerId);
  if (!myPlayer && !room.singleDeviceMode) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          background: "var(--bg-base)",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ color: "var(--warning)" }}>
          <ShieldAlert size={48} />
        </div>
        <h2 style={{ fontWeight: 700, color: "var(--text-1)", fontSize: "1.5rem" }}>
          You&apos;re not in this room
        </h2>
        <p style={{ color: "var(--text-3)", maxWidth: 400 }}>
          To join this room, enter your name on the home page. The room code will be filled in automatically.
        </p>
        <a
          href={`/?code=${code}`}
          className="btn btn-primary btn-lg"
          style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", textDecoration: "none", color: "inherit", display: "inline-flex" }}
        >
          <LogOut size={18} /> Join This Room
        </a>
      </div>
    );
  }

  const isSingleDevice = room.singleDeviceMode;
  const phaseSteps = isSingleDevice ? SD_PHASE_STEPS : PHASE_STEPS;
  const currentPhaseIndex = phaseSteps.findIndex((s) => s.key === room.phase);

  // In single-device mode, use the host player always for all non-role-reveal actions
  const effectivePlayerId = playerId;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Background gradient */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 60%)",
        }}
      />

      {/* ── Header ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(13,15,20,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
          padding: "0.75rem 1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => router.push("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-1)",
              fontWeight: 700,
              fontSize: "1rem",
              touchAction: "manipulation",
            }}
          >
            <UserSearch size={20} style={{ color: "var(--primary)" }} />
            Imposter<span style={{ color: "var(--primary)" }}>Game</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {isSingleDevice && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                background: "var(--primary-dim)",
                border: "1px solid rgba(139,92,246,0.3)",
                borderRadius: 99,
                padding: "0.2rem 0.6rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--primary)",
              }}>
                <Smartphone size={12} /> Single Device
              </div>
            )}
            <code
              style={{
                background: "var(--primary-dim)",
                border: "1px solid rgba(139,92,246,0.3)",
                borderRadius: "var(--radius-sm)",
                padding: "0.2rem 0.6rem",
                fontFamily: "var(--font-geist-mono, monospace)",
                fontWeight: 700,
                color: "var(--primary)",
                fontSize: "0.9rem",
                letterSpacing: "0.1em",
              }}
            >
              {code}
            </code>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: connected ? "var(--success)" : "var(--warning)",
                boxShadow: `0 0 6px ${connected ? "var(--success)" : "var(--warning)"}`,
                animation: connected ? "none" : "pulse-glow 1.5s ease infinite",
              }}
            />
          </div>
        </div>
      </header>

      {/* Reconnecting banner */}
      {!connected && (
        <div
          style={{
            background: "var(--warning-dim)",
            color: "var(--warning)",
            textAlign: "center",
            padding: "0.5rem",
            fontSize: "0.85rem",
            borderBottom: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          Reconnecting to server…
        </div>
      )}

      {/* ── Phase progress bar ── */}
      {room.phase !== "lobby" && (
        <div
          style={{
            background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border)",
            padding: "0.5rem 1.5rem",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            style={{
              maxWidth: 960,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              minWidth: "max-content",
            }}
          >
            {phaseSteps.filter((s) => s.key !== "lobby").map((step, i) => {
              const stepIndex = phaseSteps.findIndex((s) => s.key === step.key);
              const isDone = currentPhaseIndex > stepIndex;
              const isActive = currentPhaseIndex === stepIndex;
              return (
                <div
                  key={step.key}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  {i > 0 && (
                    <div
                      style={{
                        width: 16,
                        height: 1,
                        background: isDone ? "var(--success)" : "var(--border)",
                      }}
                    />
                  )}
                  <span
                    className={`phase-tab ${isActive ? "active" : isDone ? "done" : ""}`}
                  >
                    {isDone && <Check size={12} />} {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main
        style={{
          position: "relative",
          zIndex: 1,
          padding: "2rem var(--page-px)",
          // Add bottom padding so content isn't hidden behind the sticky footer
          paddingBottom: "calc(2rem + 80px)",
          flex: 1,
          width: "100%",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        {/* Phase title */}
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--text-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {room.phase === "lobby"       && <><Home size={18} /> Game Lobby</>}
            {room.phase === "role_reveal" && <><Search size={18} /> Your Role</>}
            {room.phase === "clue_phase"  && <><Sparkles size={18} /> Submit a Clue</>}
            {room.phase === "inter_round" && <><Swords size={18} /> Imposter&apos;s Chance</>}
            {room.phase === "vote_phase"  && <><Activity size={18} /> Voting Time</>}
            {room.phase === "results"     && <><Crown size={18} /> Round Over</>}
          </h1>
        </div>

        {/* Phase component */}
        {room.phase === "lobby"       && <Lobby room={room} playerId={effectivePlayerId} />}
        {room.phase === "role_reveal" && <RoleReveal room={room} playerId={effectivePlayerId} />}
        {room.phase === "clue_phase"  && <CluePhase room={room} playerId={effectivePlayerId} />}
        {room.phase === "inter_round" && <InterRound room={room} playerId={effectivePlayerId} />}
        {room.phase === "vote_phase"  && !isSingleDevice && <VotePhase room={room} playerId={effectivePlayerId} />}
        {room.phase === "results"     && (
          <Results room={room} playerId={effectivePlayerId} onPlayAgain={handlePlayAgain} />
        )}
      </main>

      {/* ── Footer players bar ── */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 50,
          background: "rgba(13,15,20,0.9)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid var(--border)",
          padding: "0.75rem var(--page-px)",
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            paddingBottom: "0.2rem",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-3)",
              fontWeight: 600,
              flexShrink: 0,
              marginRight: "0.25rem",
            }}
          >
            Players:
          </span>
          {room.players.map((p, i) => {
            // In single-device mode, highlight the active turn player during role reveal
            const isActiveTurn = isSingleDevice && room.phase === "role_reveal" && i === room.singleDeviceTurn;
            const isMe = p.id === effectivePlayerId;
            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  flexShrink: 0,
                  padding: "0.3rem 0.75rem",
                  background:
                    isActiveTurn ? "var(--warning-dim)" :
                    isMe ? "var(--primary-dim)" : "var(--bg-elevated)",
                  border: `1px solid ${
                    isActiveTurn ? "rgba(245,158,11,0.3)" :
                    isMe ? "rgba(139,92,246,0.3)" : "var(--border)"
                  }`,
                  borderRadius: "99px",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: `hsl(${p.name.charCodeAt(0) * 13 % 360}, 60%, 40%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  {p.name[0].toUpperCase()}
                </div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: isActiveTurn ? "var(--warning)" : isMe ? "var(--primary)" : "var(--text-2)",
                  }}
                >
                  {p.name}
                </span>
                {p.isHost && (
                  <Crown size={12} style={{ color: "var(--warning)", marginLeft: "0.2rem" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}