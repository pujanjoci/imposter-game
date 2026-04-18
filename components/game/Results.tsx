"use client";

import { RoomView } from "@/lib/types";
import { useState, useEffect } from "react";
import {
  UserX, ShieldCheck, Loader2, Sparkles, Crown,
  CheckCircle2, XCircle, SkipForward, Users, Eye, Tag,
  BookOpen,
} from "lucide-react";
import { nextRoundClient } from "@/lib/api-client";
import { playGameSound, triggerHaptic, HAPTICS } from "@/lib/audio";

interface ResultsProps {
  room: RoomView;
  playerId: string;
  onPlayAgain: () => void;
}

export default function Results({ room, playerId, onPlayAgain }: ResultsProps) {
  const [loading, setLoading] = useState(false);
  const [imposterRevealed, setImposterRevealed] = useState(false);

  // Vibrate once on mount in multiplayer mode to signal game end
  useEffect(() => {
    if (!room.singleDeviceMode) {
      triggerHaptic(HAPTICS.WINNER);
      playGameSound("WINNER");
    }
  }, []);

  const me = room.players.find((p) => p.id === playerId);
  if (!me) return null;

  const imposterWon = room.result === "imposter_wins";
  const isTieOrSkip = room.result === null;
  const imposterPlayers = room.players.filter((p) => room.imposterIds.includes(p.id));

  async function handleNextRound() {
    setLoading(true);
    try {
      await nextRoundClient(room.code, playerId);
    } catch (err: any) {
      console.error("[next-round]", err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── SINGLE DEVICE MODE ────────────────────────────────────────────────────
  if (room.singleDeviceMode) {
    return (
      <div
        className="card-elevated anim-scale-in"
        style={{
          maxWidth: 520,
          margin: "0 auto",
          padding: "var(--card-py) var(--card-px)",
          textAlign: "center",
        }}
      >
        {!imposterRevealed ? (
          /* ── Pre-reveal screen ── */
          <>
            <div style={{ marginBottom: "2rem" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(139,92,246,0.15)",
                color: "var(--primary)",
                marginBottom: "1.25rem",
                boxShadow: "0 0 48px var(--primary-glow)",
              }}>
                <Crown size={36} />
              </div>
              <h2 style={{
                fontSize: "1.75rem",
                fontWeight: 900,
                color: "var(--text-1)",
                letterSpacing: "-0.02em",
                margin: 0,
                lineHeight: 1,
              }}>
                Round Over!
              </h2>
              <p style={{
                marginTop: "0.75rem",
                color: "var(--text-2)",
                fontSize: "0.95rem",
                fontWeight: 500,
              }}>
                Everyone has submitted their clues. Time to vote and reveal the imposter!
              </p>
              {room.resultReason && (
                <div style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1rem",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.9rem",
                  color: "var(--text-2)",
                }}>
                  {room.resultReason}
                </div>
              )}
            </div>

            {/* Clues summary - Not shown in SD mode since clues are spoken */}
            {!room.singleDeviceMode && room.submissions.length > 0 && (
              <div style={{ marginBottom: "2rem", textAlign: "left" }}>
                <h3 style={{
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-3)",
                  fontWeight: 700,
                  marginBottom: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}>
                  <BookOpen size={14} /> Submitted Clues
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {room.submissions.map((s) => (
                    <div key={s.playerId} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.6rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                    }}>
                      <span style={{ fontWeight: 600, color: "var(--text-2)", fontSize: "0.9rem" }}>
                        {s.playerName}
                      </span>
                      <span style={{
                        fontWeight: 700,
                        color: "var(--text-1)",
                        fontSize: "0.95rem",
                        fontFamily: "var(--font-geist-mono, monospace)",
                      }}>
                        {s.clue}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p style={{
              fontSize: "0.85rem",
              color: "var(--text-3)",
              marginBottom: "1.5rem",
              fontStyle: "italic",
            }}>
              Discuss the clues, then press the button to reveal who the {room.imposterCount > 1 ? "imposters were" : "imposter was"}!
            </p>

            <button
              onClick={() => {
                triggerHaptic(HAPTICS.WINNER);
                playGameSound("WINNER");
                setImposterRevealed(true);
              }}
              className="btn btn-primary btn-lg btn-full"
              style={{
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                minHeight: 52,
                fontSize: "1rem",
              }}
            >
              <Eye size={20} /> Reveal the {room.imposterCount > 1 ? "Imposters" : "Imposter"}!
            </button>
          </>
        ) : (
          /* ── Post-reveal screen ── */
          <>
            {/* Big imposter reveal */}
            <div style={{
              background: "var(--danger-dim)",
              border: "1px solid rgba(244,63,94,0.3)",
              borderRadius: "var(--radius-xl)",
              padding: "2rem 1.5rem",
              marginBottom: "1.5rem",
              boxShadow: "0 0 48px var(--danger-glow)",
            }}>
              <UserX size={52} style={{ color: "var(--danger)", marginBottom: "0.75rem" }} />
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--danger)", fontWeight: 800, marginBottom: "0.5rem" }}>
                The {room.imposterCount > 1 ? "Imposters Were" : "Imposter Was"}…
              </div>
              <div style={{
                fontSize: "2.25rem",
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "-0.02em",
                lineHeight: 1,
                marginBottom: "0.5rem",
              }}>
                {pluralizeImposterNames(imposterPlayers)}
              </div>
              <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                {room.imposterCount > 1 ? "were blending in all along!" : "was blending in all along!"}
              </div>
            </div>

            {/* Word reveal + category */}
            <div style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              padding: "1.5rem",
              marginBottom: "1.5rem",
            }}>
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
                  marginBottom: "1rem",
                }}>
                  <Tag size={11} /> {room.wordCategory}
                </div>
              )}
              <div style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                The Secret Word
              </div>
              <div style={{
                fontSize: "2.5rem",
                fontWeight: 900,
                color: "var(--primary)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
                marginBottom: "1rem",
              }}>
                {room.word}
              </div>
              {/* Imposter's hint */}
              {room.imposterHint && (
                <div style={{
                  background: "rgba(244,63,94,0.08)",
                  border: "1px dashed rgba(244,63,94,0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.65rem 0.9rem",
                  textAlign: "left",
                }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--danger)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                    {room.imposterCount > 1 ? "Your Hint Was" : "Imposter's Hint Was"}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "var(--text-2)", fontWeight: 500, lineHeight: 1.4 }}>
                    "{room.imposterHint}"
                  </div>
                </div>
              )}
            </div>

            {/* Clue submissions in reveal mode - Not shown in SD mode */}
            {!room.singleDeviceMode && room.submissions.length > 0 && (
              <div style={{ marginBottom: "1.5rem", textAlign: "left" }}>
                <h3 style={{
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-3)",
                  fontWeight: 700,
                  marginBottom: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}>
                  <BookOpen size={14} /> Clue Breakdown
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {room.submissions.map((s) => {
                    const isImposter = room.imposterIds.includes(s.playerId);
                    return (
                      <div key={s.playerId} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.6rem 0.9rem",
                        background: isImposter ? "rgba(244,63,94,0.08)" : "var(--bg-card)",
                        border: `1px solid ${isImposter ? "rgba(244,63,94,0.2)" : "var(--border)"}`,
                        borderRadius: "var(--radius-md)",
                      }}>
                        <span style={{ fontWeight: 600, color: isImposter ? "var(--danger)" : "var(--text-2)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          {s.playerName}
                          {isImposter && <UserX size={13} />}
                        </span>
                        <span style={{
                          fontWeight: 700,
                          color: "var(--text-1)",
                          fontSize: "0.95rem",
                          fontFamily: "var(--font-geist-mono, monospace)",
                        }}>
                          {s.clue}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={handleNextRound}
                disabled={loading}
                className="btn btn-primary btn-lg btn-full anim-slide-up"
                style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
              >
                {loading ? (
                  <><Loader2 size={18} className="spinner" /> Starting…</>
                ) : (
                  <><Sparkles size={18} /> Play Next Round</>
                )}
              </button>
              <button
                onClick={onPlayAgain}
                className="btn btn-secondary anim-fade-in"
                style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
              >
                Leave Game
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  function pluralizeImposterNames(imposters: any[]) {
    if (imposters.length === 0) return "Unknown";
    if (imposters.length === 1) return imposters[0].name;
    if (imposters.length === 2) return `${imposters[0].name} and ${imposters[1].name}`;
    const allButLast = imposters.slice(0, -1).map(p => p.name).join(", ");
    return `${allButLast}, and ${imposters[imposters.length - 1].name}`;
  }

  // ── MULTIPLAYER MODE ──────────────────────────────────────────────────────

  // Derive header color/icon
  const headerColor = isTieOrSkip
    ? "var(--warning)"
    : imposterWon
      ? "var(--danger)"
      : "var(--success)";

  const headerGlow = isTieOrSkip
    ? "var(--warning-glow)"
    : imposterWon
      ? "var(--danger-glow)"
      : "var(--success-glow, rgba(34,197,94,0.3))";

  const HeaderIcon = isTieOrSkip ? SkipForward : imposterWon ? UserX : ShieldCheck;

  const headline = isTieOrSkip
    ? "NO WINNER"
    : imposterWon
      ? (room.imposterCount > 1 ? "IMPOSTERS WIN!" : "IMPOSTER WINS!")
      : "CREWMATES WIN!";

  return (
    <div
      className="card-elevated anim-scale-in"
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "var(--card-py) var(--card-px)",
        textAlign: "center",
      }}
    >
      {/* ── Outcome header ── */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: `${headerColor}22`,
            color: headerColor,
            marginBottom: "1.25rem",
            boxShadow: `0 0 48px ${headerGlow}`,
          }}
        >
          <HeaderIcon size={36} />
        </div>
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: 900,
            color: headerColor,
            letterSpacing: "-0.02em",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {headline}
        </h2>
        {room.resultReason && (
          <p
            style={{
              marginTop: "0.75rem",
              color: "var(--text-2)",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            {room.resultReason}
          </p>
        )}
        {/* Secret word reveal with category */}
        <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {room.wordCategory && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.8rem",
              color: "var(--text-3)",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 99,
              padding: "0.2rem 0.55rem",
              fontWeight: 600,
            }}>
              <Tag size={11} /> {room.wordCategory}
            </span>
          )}
          <p style={{ color: "var(--text-3)", fontSize: "0.9rem", margin: 0 }}>
            The secret word was{" "}
            <span style={{ color: "var(--primary)", fontWeight: 800 }}>"{room.word}"</span>
          </p>
        </div>
      </div>

      {/* ── Imposter reveal ── */}
      <div
        className="anim-slide-up"
        style={{
          background: "var(--danger-dim)",
          border: "1px solid rgba(244,63,94,0.2)",
          padding: "1rem 1.25rem",
          borderRadius: "var(--radius-xl)",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "0.75rem",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--danger)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <UserX size={18} color="#fff" />
        </div>
        <div>
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--danger)",
              fontWeight: 800,
              marginBottom: "0.2rem",
            }}
          >
            The {room.imposterCount > 1 ? "Imposters" : "Imposter"}
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-1)" }}>
            {pluralizeImposterNames(imposterPlayers)}
          </div>
        </div>
      </div>

      {/* ── Imposter hint reveal ── */}
      {room.imposterHint && (
        <div
          className="anim-slide-up"
          style={{
            background: "rgba(244,63,94,0.06)",
            border: "1px dashed rgba(244,63,94,0.2)",
            padding: "0.85rem 1.25rem",
            borderRadius: "var(--radius-xl)",
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
            marginBottom: "0.75rem",
            textAlign: "left",
            animationDelay: "60ms",
          }}
        >
          <div style={{ color: "var(--danger)", flexShrink: 0, marginTop: 2 }}>
            <BookOpen size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--danger)", fontWeight: 800, marginBottom: "0.2rem" }}>
              {room.imposterCount > 1 ? "Your Hint Was" : "Imposter's Hint Was"}
            </div>
            <div style={{ fontSize: "0.92rem", fontWeight: 500, color: "var(--text-2)", lineHeight: 1.4 }}>
              "{room.imposterHint}"
            </div>
          </div>
        </div>
      )}

      {/* ── Imposter guess result ── */}
      {room.imposterGuess !== null && (
        <div
          className="anim-slide-up"
          style={{
            background:
              room.imposterGuessCorrect
                ? "rgba(244,63,94,0.08)"
                : "rgba(34,197,94,0.08)",
            border: `1px solid ${room.imposterGuessCorrect ? "rgba(244,63,94,0.2)" : "rgba(34,197,94,0.2)"}`,
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-xl)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "0.75rem",
            textAlign: "left",
            animationDelay: "80ms",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: room.imposterGuessCorrect
                ? "var(--danger-dim)"
                : "rgba(34,197,94,0.15)",
              color: room.imposterGuessCorrect ? "var(--danger)" : "var(--success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {room.imposterGuessCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-3)",
                fontWeight: 700,
                marginBottom: "0.2rem",
              }}
            >
              Imposter&apos;s Guess
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-1)" }}>
              &quot;{room.imposterGuess}&quot;{" "}
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: room.imposterGuessCorrect ? "var(--danger)" : "var(--success)",
                }}
              >
                {room.imposterGuessCorrect ? "✓ Correct!" : "✗ Wrong"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add helping function at bottom of component or before return */}
      {room.votes.length > 0 && (
        <div
          className="anim-fade-in"
          style={{
            marginBottom: "1.5rem",
            textAlign: "left",
            animationDelay: "150ms",
          }}
        >
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
            <Users size={14} /> Vote Breakdown
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {room.players.map((p) => {
              const votesAgainst = room.votes.filter(
                (v) => v.targetId === p.id
              ).length;
              if (votesAgainst === 0) return null;
              const isImposter = room.imposterIds.includes(p.id);
              return (
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
                  <span
                    style={{
                      fontWeight: 600,
                      color: "var(--text-2)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    {p.name}
                    {isImposter && (
                      <span className="badge badge-red" style={{ fontSize: "0.7rem" }}>
                        Imposter
                      </span>
                    )}
                  </span>
                  <span
                    style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-1)" }}
                  >
                    {votesAgainst} vote{votesAgainst !== 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
            {/* Skipped votes count */}
            {(() => {
              const skips = room.votes.filter((v) => v.targetId === "skip").length;
              if (skips === 0) return null;
              return (
                <div
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
                  <span
                    style={{
                      fontWeight: 600,
                      color: "var(--text-3)",
                      fontSize: "0.9rem",
                      fontStyle: "italic",
                    }}
                  >
                    Skipped
                  </span>
                  <span
                    style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-3)" }}
                  >
                    {skips} player{skips !== 1 ? "s" : ""}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Round info ── */}
      <div
        style={{
          color: "var(--text-3)",
          fontSize: "0.8rem",
          marginBottom: "1.5rem",
          fontWeight: 500,
        }}
      >
        Round {room.roundNumber}
      </div>

      {/* ── Actions ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          maxWidth: 320,
          margin: "0 auto",
        }}
      >
        {me.isHost ? (
          <button
            onClick={handleNextRound}
            disabled={loading}
            className="btn btn-primary btn-lg btn-full anim-slide-up"
            style={{
              animationDelay: "300ms",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {loading ? (
              <><Loader2 size={18} className="spinner" /> Starting…</>
            ) : (
              <><Sparkles size={18} /> Play Next Round</>
            )}
          </button>
        ) : (
          <p
            className="anim-fade-in"
            style={{
              color: "var(--text-3)",
              fontSize: "0.9rem",
              fontWeight: 500,
              animationDelay: "300ms",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <Loader2 size={16} className="spinner" /> Waiting for host to start next round…
          </p>
        )}

        <button
          onClick={onPlayAgain}
          className="btn btn-secondary anim-fade-in"
          style={{
            animationDelay: "400ms",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}