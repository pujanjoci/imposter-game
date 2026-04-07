import { ShieldCheck, UserX, Crown } from "lucide-react";
import { Player } from "@/lib/types";

export function PlayerBadge({ 
  player, 
  highlight = false, 
  showRole = false,
  isCurrentTurn = false 
}: { 
  player: Player; 
  highlight?: boolean; 
  showRole?: boolean;
  isCurrentTurn?: boolean;
}) {
  const isImposter = player.role === "imposter";

  return (
    <div 
      className={`anim-fade-in ${highlight ? 'glass-card-sm' : ''}`} 
      style={{
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        padding: highlight ? "0.75rem 1rem" : "0.5rem 0.75rem", 
        borderRadius: highlight ? "var(--radius-md)" : "calc(var(--radius-md) - 2px)",
        background: highlight 
          ? "rgba(255,255,255,0.03)" 
          : isCurrentTurn ? "var(--primary-dim)" : "transparent",
        border: highlight 
          ? "1px solid var(--border)"
          : isCurrentTurn ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
        transition: "all 0.2s ease"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Avatar */}
        <div style={{
          width: highlight ? 36 : 28, 
          height: highlight ? 36 : 28, 
          borderRadius: "50%",
          background: `hsl(${player.name.charCodeAt(0) * 13 % 360}, 60%, 40%)`,
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          fontSize: highlight ? "1rem" : "0.8rem", 
          fontWeight: 800, 
          color: "#fff",
          boxShadow: isCurrentTurn ? "0 0 12px var(--primary-glow)" : "0 2px 8px rgba(0,0,0,0.3)",
        }}>
          {player.name[0].toUpperCase()}
        </div>
        
        {/* Name */}
        <span style={{ 
          fontWeight: 600, 
          color: isCurrentTurn ? "var(--primary)" : "var(--text-1)", 
          fontSize: highlight ? "1.05rem" : "0.95rem" 
        }}>
          {player.name}
        </span>
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        {player.isHost && (
          <div className="badge badge-amber" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Crown size={12} /> Host
          </div>
        )}
        {showRole && player.role && (
          <div className={`badge ${isImposter ? 'badge-red' : 'badge-cyan'}`} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {isImposter ? <UserX size={12} /> : <ShieldCheck size={12} />}
            {isImposter ? "Imposter" : "Crewmate"}
          </div>
        )}
      </div>
    </div>
  );
}
