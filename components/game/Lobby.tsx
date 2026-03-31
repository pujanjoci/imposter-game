"use client";

import { useState } from "react";
import { RoomView } from "@/lib/types";
import { Copy, Check, Users, Shield, Crown, Play, Loader2, Link } from "lucide-react";

export default function Lobby({ room, playerId }: { room: RoomView; playerId: string }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const myPlayer = room.players.find((p) => p.id === playerId);
  const isHost = myPlayer?.isHost;

  const MIN_PLAYERS = 3;
  const canStart = room.players.length >= MIN_PLAYERS;

  async function copyCode() {
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleStart() {
    if (!isHost || !canStart) return;
    setLoading(true);
    try {
      await fetch(`/api/rooms/${room.code}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-elevated anim-scale-in" style={{ maxWidth: 540, margin: "0 auto", padding: "var(--card-py) var(--card-px)" }}>
      {/* ── Status ── */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 56, height: 56, borderRadius: "50%",
          background: "var(--primary-dim)", border: "1px solid rgba(139,92,246,0.3)",
          marginBottom: "1rem", color: "var(--primary)",
          boxShadow: "0 0 24px var(--primary-glow)",
        }}>
          <Users size={28} />
        </div>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
          Waiting for players…
        </h2>
        <p style={{
          marginTop: "0.5rem", color: "var(--text-3)",
          fontSize: "0.95rem", fontWeight: 500,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
        }}>
          {room.players.length} / 10 players joined
        </p>
      </div>

      {/* ── Room Code ── */}
      <div style={{
        background: "rgba(11,15,26,0.6)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "1.25rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "1rem", marginBottom: "2rem",
      }}>
        <div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)", fontWeight: 600 }}>
            Room Code
          </span>
          <div style={{
            fontSize: "1.75rem", fontFamily: "var(--font-geist-mono, monospace)",
            fontWeight: 800, color: "var(--primary)", letterSpacing: "0.15em",
            marginTop: "0.2rem",
          }}>
            {room.code}
          </div>
        </div>
        <button
          onClick={copyCode}
          className="btn btn-secondary"
          style={{ width: "auto", display: "flex", alignItems: "center", gap: "0.4rem" }}
          title="Copy room code"
        >
          {copied ? <Check size={16} style={{ color: "var(--success)" }} /> : <Copy size={16} />}
          <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{copied ? "Copied!" : "Copy Code"}</span>
        </button>
      </div>

      {/* ── Player List ── */}
      <div style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Shield size={14} /> Players in lobby
        </h3>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {room.players.map((p) => (
            <div key={p.id} className="anim-fade-in" style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.75rem 1rem", borderRadius: "calc(var(--radius-md) - 2px)",
              background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: `hsl(${p.name.charCodeAt(0) * 13 % 360}, 60%, 40%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.8rem", fontWeight: 800, color: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}>
                  {p.name[0].toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, color: p.id === playerId ? "var(--primary)" : "var(--text-1)", fontSize: "0.95rem" }}>
                  {p.name} {p.id === playerId && <span style={{ color: "var(--text-3)", fontSize: "0.8rem", fontWeight: 500 }}>(You)</span>}
                </span>
              </div>
              {p.isHost && (
                <div className="badge badge-amber" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Crown size={12} /> Host
                </div>
              )}
            </div>
          ))}

          {/* Empty slots for visual cue */}
          {Array.from({ length: Math.max(0, MIN_PLAYERS - room.players.length) }).map((_, i) => (
            <div key={`empty-${i}`} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.75rem 1rem", borderRadius: "calc(var(--radius-md) - 2px)",
              border: "1px dashed rgba(255,255,255,0.1)", background: "transparent",
            }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
              <span style={{ color: "var(--text-3)", fontSize: "0.9rem", fontStyle: "italic" }}>Waiting for player…</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Host Controls ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={!canStart || loading}
            className={`btn btn-lg ${canStart ? "btn-primary" : "btn-secondary"}`}
            style={{ width: "100%", opacity: !canStart ? 0.5 : 1 }}
          >
            {loading ? (
              <><Loader2 size={20} className="spinner" /> Starting game…</>
            ) : canStart ? (
              <><Play size={20} /> Start Game</>
            ) : (
              `${MIN_PLAYERS} players to start`
            )}
          </button>
        ) : (
          <div style={{
            textAlign: "center", padding: "1rem", borderRadius: "calc(var(--radius-md) - 2px)",
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            color: "var(--text-2)", fontSize: "0.9rem", fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
          }}>
            <Loader2 size={16} className="spinner" /> Waiting for host to start…
          </div>
        )}
      </div>
    </div>
  );
}
