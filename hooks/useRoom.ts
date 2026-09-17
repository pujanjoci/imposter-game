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

const MAX_RETRIES = 12;
const BASE_DELAY = 1500;
const MAX_DELAY = 15000;

export function useRoom(code: string): UseRoomReturn {
  const [room, setRoom] = useState<RoomView | null>(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const esRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Fetch immediate fresh snapshot from API
  const fetchSnapshot = useCallback(async (pid: string) => {
    if (!pid || isLocalRoom(code)) return;
    try {
      const res = await fetch(`/api/rooms/${code}?playerId=${pid}`, {
        cache: "no-store",
      });
      if (!mountedRef.current) return;
      if (res.ok) {
        const data: RoomView = await res.json();
        setRoom(data);
        setError("");
      } else if (res.status === 404 && retriesRef.current >= 3) {
        setError("Room not found. It may have expired — please create or join a new room.");
      }
    } catch {
      // Network blip, will retry or receive via SSE
    }
  }, [code]);

  const connect = useCallback(async () => {
    if (!playerId || !mountedRef.current) return;

    // Handle Local Single Device Room
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

    // Hit retry limit
    if (retriesRef.current >= MAX_RETRIES) {
      setError("Connection lost. The room may have expired or server restarted.");
      setConnected(false);
      return;
    }

    // Immediately fetch snapshot for fast initial state
    fetchSnapshot(playerId);

    // Close any prior EventSource
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const base =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : "";
    const url = `${base}/api/rooms/${code}/stream?playerId=${playerId}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      if (!mountedRef.current) return;
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      setConnected(true);
      setError("");
      retriesRef.current = 0;
      // Fetch latest state upon handshake
      fetchSnapshot(playerId);
    };

    es.onmessage = (e) => {
      if (!mountedRef.current) return;
      try {
        const data: RoomView = JSON.parse(e.data);
        if ((data as unknown as { error?: string }).error) {
          setError((data as unknown as { error: string }).error);
          setConnected(false);
          es.close();
          return;
        }
        setRoom(data);
        setError("");
        setConnected(true);
      } catch {
        // Ping or keepalive lines
      }
    };

    es.onerror = () => {
      if (!mountedRef.current) return;

      // Grace period before marking UI as disconnected
      if (!disconnectTimerRef.current) {
        disconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current && (!esRef.current || esRef.current.readyState !== EventSource.OPEN)) {
            setConnected(false);
          }
        }, 1500);
      }

      // If browser already closed or failed the connection, reconnect with backoff
      if (es.readyState === EventSource.CLOSED) {
        es.close();
        esRef.current = null;

        retriesRef.current += 1;
        if (retriesRef.current >= MAX_RETRIES) {
          setError("Connection lost. Please refresh or return to lobby.");
          return;
        }

        const delay = Math.min(BASE_DELAY * Math.pow(1.5, retriesRef.current - 1), MAX_DELAY);
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        retryTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, delay);
      }
    };
  }, [code, playerId, fetchSnapshot]);

  // Initial connection
  useEffect(() => {
    if (!playerId) return;
    retriesRef.current = 0;
    connect();

    // Reconnect and refresh on tab focus / mobile resume / network online
    const handleVisibilityOrOnline = () => {
      if (document.visibilityState === "visible" && playerId && !isLocalRoom(code)) {
        retriesRef.current = 0;
        fetchSnapshot(playerId);
        if (!esRef.current || esRef.current.readyState === EventSource.CLOSED) {
          connect();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrOnline);
    window.addEventListener("online", handleVisibilityOrOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrOnline);
      window.removeEventListener("online", handleVisibilityOrOnline);
      esRef.current?.close();
      esRef.current = null;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
    };
  }, [connect, playerId, code, fetchSnapshot]);

  return { room, playerId, error, connected };
}