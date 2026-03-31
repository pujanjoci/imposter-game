"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserSearch, Home, Link2, ArrowRight, Loader2,
  Smartphone, Users, Plus, Trash2, ChevronRight,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Single Device Mode state
  const [singleDevice, setSingleDevice] = useState(false);
  const [sdPlayers, setSdPlayers] = useState<string[]>(["", "", ""]);

  // Auto-fill room code from ?code= URL param (supports mobile share links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    if (codeParam) {
      setCode(codeParam.toUpperCase());
      setTab("join");
    }
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Enter your name"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create room"); return; }
      localStorage.setItem(`player_${data.code}`, data.playerId);
      router.push(`/room/${data.code}`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Enter your name"); return; }
    if (!code.trim()) { setError("Enter a room code"); return; }
    const roomCode = code.trim().toUpperCase();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/rooms/${roomCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to join room"); return; }
      localStorage.setItem(`player_${roomCode}`, data.playerId);
      router.push(`/room/${roomCode}`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSingleDevice(e: React.FormEvent) {
    e.preventDefault();
    const names = sdPlayers.map((n) => n.trim()).filter(Boolean);
    if (names.length < 3) { setError("Need at least 3 players"); return; }
    const unique = new Set(names.map((n) => n.toLowerCase()));
    if (unique.size !== names.length) { setError("Player names must be unique"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ singleDevice: true, playerNames: names }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create room"); return; }
      // Store all player IDs in localStorage under the room code
      // The active device uses playerIds[0] as the "device owner"
      localStorage.setItem(`player_${data.code}`, data.playerIds[0]);
      // Store all IDs so the RoleReveal component can track each player
      localStorage.setItem(`sdPlayers_${data.code}`, JSON.stringify(data.playerIds));
      router.push(`/room/${data.code}`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function addSdPlayer() {
    if (sdPlayers.length >= 10) return;
    setSdPlayers([...sdPlayers, ""]);
  }

  function removeSdPlayer(i: number) {
    if (sdPlayers.length <= 3) return;
    setSdPlayers(sdPlayers.filter((_, idx) => idx !== i));
  }

  function updateSdPlayer(i: number, val: string) {
    const copy = [...sdPlayers];
    copy[i] = val;
    setSdPlayers(copy);
  }

  return (
    <>
      {/* Background gradient */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 70%)",
        }}
      />

      <main
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--page-px, 1.25rem)",
          background: "var(--bg-base)",
          overscrollBehavior: "none",
        }}
      >
        <div style={{ width: "100%", maxWidth: 480 }}>

          {/* ── Logo / Header ── */}
          <div className="anim-slide-up" style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--primary-dim)",
                border: "1px solid rgba(139,92,246,0.3)",
                marginBottom: "1rem",
                boxShadow: "0 0 32px var(--primary-glow)",
              }}
            >
              <UserSearch size={28} style={{ color: "var(--primary)" }} />
            </div>
            <h1
              style={{
                fontSize: "clamp(1.6rem, 5vw, 2.2rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--text-1)",
                lineHeight: 1.1,
              }}
            >
              Imposter<span style={{ color: "var(--primary)" }}>Game</span>
            </h1>
            <p style={{ marginTop: "0.5rem", color: "var(--text-3)", fontSize: "clamp(0.85rem, 2.5vw, 0.95rem)" }}>
              Blend in. Bluff smart. Catch the fake.
            </p>
          </div>

          {/* ── Mode Toggle ── */}
          <div
            className="anim-slide-up"
            style={{
              display: "flex",
              gap: 8,
              marginBottom: "1.25rem",
              animationDelay: "40ms",
            }}
          >
            <button
              type="button"
              onClick={() => { setSingleDevice(false); setError(""); }}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                padding: "0.65rem",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${!singleDevice ? "rgba(139,92,246,0.4)" : "var(--border)"}`,
                background: !singleDevice ? "var(--primary-dim)" : "var(--bg-elevated)",
                color: !singleDevice ? "var(--primary)" : "var(--text-3)",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                minHeight: 44,
                transition: "all 0.18s",
              }}
            >
              <Users size={16} /> Multiplayer
            </button>
            <button
              type="button"
              onClick={() => { setSingleDevice(true); setError(""); }}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                padding: "0.65rem",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${singleDevice ? "rgba(139,92,246,0.4)" : "var(--border)"}`,
                background: singleDevice ? "var(--primary-dim)" : "var(--bg-elevated)",
                color: singleDevice ? "var(--primary)" : "var(--text-3)",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                minHeight: 44,
                transition: "all 0.18s",
              }}
            >
              <Smartphone size={16} /> Single Device
            </button>
          </div>

          {/* ── Card ── */}
          <div className="card-elevated anim-slide-up" style={{ animationDelay: "80ms" }}>

            {/* ── SINGLE DEVICE MODE ── */}
            {singleDevice ? (
              <form onSubmit={handleSingleDevice}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                  }}>
                    <Smartphone size={18} style={{ color: "var(--primary)" }} />
                    <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-1)", margin: 0 }}>
                      Single Device Mode
                    </h2>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-3)", lineHeight: 1.5 }}>
                    All players on one phone. Each player will get 2 seconds to view their role privately, then pass the phone. No voting screen — a host reveals the imposter at the end.
                  </p>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--text-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}>
                    Player Names ({sdPlayers.filter(n => n.trim()).length}/{sdPlayers.length})
                  </label>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {sdPlayers.map((player, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: player.trim()
                            ? `hsl(${player.charCodeAt(0) * 13 % 360}, 60%, 40%)`
                            : "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          color: "#fff",
                          flexShrink: 0,
                          transition: "background 0.2s",
                        }}>
                          {player.trim() ? player[0].toUpperCase() : i + 1}
                        </div>
                        <input
                          className="input"
                          placeholder={`Player ${i + 1}`}
                          value={player}
                          onChange={(e) => updateSdPlayer(i, e.target.value)}
                          maxLength={20}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          style={{ flex: 1, fontSize: "1rem", touchAction: "manipulation" }}
                        />
                        {sdPlayers.length > 3 && (
                          <button
                            type="button"
                            onClick={() => removeSdPlayer(i)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 32,
                              height: 32,
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border)",
                              background: "var(--danger-dim)",
                              color: "var(--danger)",
                              cursor: "pointer",
                              flexShrink: 0,
                              touchAction: "manipulation",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {sdPlayers.length < 10 && (
                    <button
                      type="button"
                      onClick={addSdPlayer}
                      style={{
                        marginTop: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        background: "none",
                        border: "1px dashed rgba(139,92,246,0.3)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--primary)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: "0.5rem 0.75rem",
                        width: "100%",
                        justifyContent: "center",
                        touchAction: "manipulation",
                      }}
                    >
                      <Plus size={15} /> Add Player
                    </button>
                  )}
                </div>

                {error && <div className="error-msg anim-fade-in" style={{ marginBottom: "0.75rem" }}>{error}</div>}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-full"
                  disabled={loading}
                  style={{
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                    minHeight: 48,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? (
                    <><Loader2 size={18} className="spinner" /> Setting up…</>
                  ) : (
                    <><ChevronRight size={18} /> Start Game</>
                  )}
                </button>
              </form>
            ) : (
              /* ── MULTIPLAYER MODE ── */
              <>
                {/* Tab switcher */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 4,
                    padding: 4,
                    background: "var(--bg-base)",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "1.5rem",
                  }}
                >
                  {(["create", "join"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setTab(t); setError(""); }}
                      aria-label={t === "create" ? "Create a new room" : "Join an existing room"}
                      style={{
                        touchAction: "manipulation",
                        WebkitTapHighlightColor: "transparent",
                        minHeight: 44,
                        padding: "0.6rem",
                        borderRadius: "calc(var(--radius-md) - 2px)",
                        border: "none",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        transition: "all 0.18s",
                        background: tab === t ? "var(--primary)" : "transparent",
                        color: tab === t ? "#fff" : "var(--text-3)",
                        boxShadow: tab === t ? "0 0 16px var(--primary-glow)" : "none",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem",
                        WebkitUserSelect: "none",
                        userSelect: "none",
                      }}
                    >
                      {t === "create" ? (
                        <><Home size={15} /> Create Room</>
                      ) : (
                        <><Link2 size={15} /> Join Room</>
                      )}
                    </button>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={tab === "create" ? handleCreate : handleJoin}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                    {/* Player name */}
                    <div>
                      <label
                        htmlFor="player-name"
                        style={{
                          display: "block",
                          marginBottom: "0.4rem",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "var(--text-3)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Your Name
                      </label>
                      <input
                        id="player-name"
                        className="input input-lg"
                        placeholder="Enter your nickname"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={20}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        style={{ fontSize: "1rem", touchAction: "manipulation" }}
                      />
                    </div>

                    {/* Room code (join tab only) */}
                    {tab === "join" && (
                      <div className="anim-fade-in">
                        <label
                          htmlFor="room-code"
                          style={{
                            display: "block",
                            marginBottom: "0.4rem",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "var(--text-3)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          Room Code
                        </label>
                        <input
                          id="room-code"
                          className="input input-lg"
                          placeholder="e.g. A3F9C2"
                          value={code}
                          onChange={(e) => setCode(e.target.value.toUpperCase())}
                          maxLength={6}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="characters"
                          spellCheck={false}
                          style={{
                            fontFamily: "var(--font-geist-mono, monospace)",
                            letterSpacing: "0.15em",
                            fontSize: "1.1rem",
                            textTransform: "uppercase",
                            touchAction: "manipulation",
                          }}
                        />
                      </div>
                    )}

                    {error && <div className="error-msg anim-fade-in">{error}</div>}

                    {/* Submit button */}
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg btn-full"
                      disabled={loading}
                      style={{
                        marginTop: "0.25rem",
                        touchAction: "manipulation",
                        WebkitTapHighlightColor: "transparent",
                        minHeight: 48,
                        cursor: loading ? "not-allowed" : "pointer",
                      }}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={18} className="spinner" />
                          {tab === "create" ? "Creating…" : "Joining…"}
                        </>
                      ) : (
                        <>
                          {tab === "create" ? "Create Room" : "Join Game"}
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>

                  </div>
                </form>
              </>
            )}
          </div>

          {/* ── Footer hint ── */}
          <p
            className="anim-fade-in"
            style={{
              textAlign: "center",
              marginTop: "1.5rem",
              color: "var(--text-3)",
              fontSize: "0.8rem",
              animationDelay: "200ms",
            }}
          >
            {singleDevice
              ? "Pass the phone around — each player sees their role privately"
              : "3–10 players · No account needed · Instant rooms"}
          </p>

        </div>
      </main>
    </>
  );
}