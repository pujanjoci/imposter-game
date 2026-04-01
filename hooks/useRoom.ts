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

const MAX_RETRIES = 8;
const BASE_DELAY = 2000;
const MAX_DELAY = 30000;

export function useRoom(code: string): UseRoomReturn {
  const [room, setRoom] = useState<RoomView | null>(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const esRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether we're mounted to avoid state updates after unmount
  const mountedRef = useRef(true);

  // Resolve playerId from localStorage — don't error immediately on missing,
  // let the room page handle the redirect (supports mobile share links)
  useEffect(() => {
    mountedRef.current = true;
    const pid = localStorage.getItem(`player_${code}`) || "";
    setPlayerId(pid);
    return () => {
      mountedRef.current = false;
    };
  }, [code]);

  const connect = useCallback(async () => {
    if (!playerId) return;
    if (!mountedRef.current) return;

    if (isLocalRoom(code)) {
      setConnected(true);
      setError("");
      retriesRef.current = 0;

      const updateLocalRoom = () => {
        if (!mountedRef.current) return;
        const localRoom = getLocalRoomView(code, playerId);
        if (localRoom) {
          setRoom(localRoom);
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

      esRef.current = {
        close: () => window.removeEventListener("local-room-updated", handler),
      } as any;
      return;
    }

    // Hit retry limit — stop trying
    if (retriesRef.current >= MAX_RETRIES) {
      setError("Unable to connect to the room. It may have expired or the server restarted.");
      setConnected(false);
      return;
    }

    // ── Pre-check: verify the room exists before opening the SSE connection.
    // This surfaces a clean error immediately instead of an infinite 404 loop.
    try {
      const check = await fetch(`/api/rooms/${code}?playerId=${playerId}`);
      if (!mountedRef.current) return;
      if (check.status === 404) {
        setError("Room not found. It may have expired — please create or join a new room.");
        setConnected(false);
        return;
      }
    } catch {
      // Network error on pre-check — fall through and try the SSE connection anyway
    }

    if (!mountedRef.current) return;

    // Close any existing connection
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    // Use an absolute URL so EventSource works correctly on mobile browsers
    // that are connected via LAN IP (e.g. 192.168.x.x:3000)
    const base =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : "";
    const url = `${base}/api/rooms/${code}/stream?playerId=${playerId}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      if (!mountedRef.current) return;
      setConnected(true);
      setError("");
      retriesRef.current = 0;
    };

    es.onmessage = (e) => {
      if (!mountedRef.current) return;
      try {
        const data: RoomView = JSON.parse(e.data);
        // Server may send an error payload — surface it and stop
        if ((data as unknown as { error?: string }).error) {
          setError((data as unknown as { error: string }).error);
          setConnected(false);
          es.close();
          return;
        }
        setRoom(data);
        setError("");
      } catch {
        // Ignore parse errors (e.g. keep-alive ping lines)
      }
    };

    es.onerror = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      es.close();
      esRef.current = null;

      retriesRef.current += 1;

      if (retriesRef.current >= MAX_RETRIES) {
        setError("Connection lost. The room may no longer exist.");
        return;
      }

      // Exponential back-off: 2s → 4s → 8s → … capped at 30s
      const delay = Math.min(BASE_DELAY * Math.pow(2, retriesRef.current - 1), MAX_DELAY);
      retryTimerRef.current = setTimeout(() => connect(), delay);
    };
  }, [code, playerId]);

  useEffect(() => {
    if (!playerId) return;
    retriesRef.current = 0;
    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [connect, playerId]);

  return { room, playerId, error, connected };
}