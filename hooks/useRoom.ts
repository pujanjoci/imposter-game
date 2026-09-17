"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { RoomView } from "@/lib/types";
import { isLocalRoom } from "@/lib/api-client";
import { getLocalRoomView } from "@/lib/local-game-engine";

interface UseRoomReturn {
  room: RoomView | null;
  playerId: string;
  error: string;
  connected: boolean;
}

export function useRoom(code: string): UseRoomReturn {
  const [room, setRoom] = useState<RoomView | null>(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(true); // Default to optimistic true
  const [playerId, setPlayerId] = useState("");
  const esRef = useRef<EventSource | null>(null);
  const consecutiveFailuresRef = useRef(0);
  const mountedRef = useRef(true);

  // Resolve playerId from localStorage
  useEffect(() => {
    mountedRef.current = true;
    const pid = localStorage.getItem(`player_${code}`) || "";
    setPlayerId(pid);
    return () => {
      mountedRef.current = false;
    };
  }, [code]);

  // Direct snapshot fetcher (HTTP fallback / fast initial load)
  const fetchSnapshot = useCallback(async (pid: string): Promise<boolean> => {
    if (!pid || !mountedRef.current || isLocalRoom(code)) return false;
    try {
      const res = await fetch(`/api/rooms/${code}?playerId=${pid}`, {
        cache: "no-store",
      });
      if (!mountedRef.current) return false;
      if (res.ok) {
        const data: RoomView = await res.json();
        setRoom(data);
        setError("");
        setConnected(true);
        consecutiveFailuresRef.current = 0;
        return true;
      } else if (res.status === 404) {
        consecutiveFailuresRef.current += 1;
        if (consecutiveFailuresRef.current >= 4) {
          setError("Room not found. It may have expired — please create or join a new room.");
          setConnected(false);
        }
        return false;
      }
    } catch {
      consecutiveFailuresRef.current += 1;
      if (consecutiveFailuresRef.current >= 3) {
        setConnected(false);
      }
    }
    return false;
  }, [code]);

  // Main connection management: SSE + Polling Fallback
  useEffect(() => {
    if (!playerId) return;

    // ── Single-Device Local Mode ───────────────────────────────────────────
    if (isLocalRoom(code)) {
      setConnected(true);
      setError("");

      const updateLocalRoom = () => {
        if (!mountedRef.current) return;
        const localRoom = getLocalRoomView(code, playerId);
        if (localRoom) {
          setRoom(localRoom);
          setError("");
        } else {
          setError("Local room not found.");
        }
      };

      updateLocalRoom();

      const handler = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail?.code === code) {
          updateLocalRoom();
        }
      };

      window.addEventListener("local-room-updated", handler);
      return () => {
        window.removeEventListener("local-room-updated", handler);
      };
    }

    // ── Multiplayer Mode ───────────────────────────────────────────────────
    // 1. Immediate initial snapshot fetch
    fetchSnapshot(playerId);

    // 2. Setup Server-Sent Events (SSE)
    let sseActive = true;
    const base =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : "";
    const url = `${base}/api/rooms/${code}/stream?playerId=${playerId}`;

    try {
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        if (!mountedRef.current || !sseActive) return;
        setConnected(true);
        setError("");
        consecutiveFailuresRef.current = 0;
      };

      es.onmessage = (e) => {
        if (!mountedRef.current || !sseActive) return;
        try {
          const data: RoomView = JSON.parse(e.data);
          if ((data as unknown as { error?: string }).error) {
            setError((data as unknown as { error: string }).error);
            return;
          }
          setRoom(data);
          setError("");
          setConnected(true);
          consecutiveFailuresRef.current = 0;
        } catch {
          // Keepalive or ping
        }
      };

      es.onerror = () => {
        // SSE had a connection drop — let EventSource auto-reconnect natively
        // Polling interval below will continue serving updates seamlessly
      };
    } catch {
      // EventSource failed to instantiate, fallback interval handles it
    }

    // 3. Heartbeat / Hybrid Polling Interval (runs every 2s as failsafe)
    // Ensures real-time responsiveness even if SSE is buffered by mobile networks
    const pollInterval = setInterval(() => {
      if (mountedRef.current) {
        // If SSE is not currently in OPEN state, poll actively
        if (!esRef.current || esRef.current.readyState !== EventSource.OPEN) {
          fetchSnapshot(playerId);
        }
      }
    }, 2000);

    // 4. Mobile screen unlock / tab resume recovery
    const handleResume = () => {
      if (document.visibilityState === "visible" && mountedRef.current) {
        fetchSnapshot(playerId);
      }
    };

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("online", handleResume);

    return () => {
      sseActive = false;
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("online", handleResume);
      clearInterval(pollInterval);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [code, playerId, fetchSnapshot]);

  return { room, playerId, error, connected };
}