import {
  createLocalRoom,
  startLocalGame,
  advanceLocalSingleDeviceTurn,
  advanceLocalToInterRound,
  submitLocalGuess,
  skipLocalGuess,
  submitLocalVote,
  revealLocalImposter,
  startNextLocalRound
} from "./local-game-engine";

/**
 * Checks if a given room code is a locally-hosted single-device room
 * by checking localStorage.
 */
export function isLocalRoom(code: string): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(`local_room_${code}`);
}

/**
 * Creates a single device room entirely locally.
 */
export async function createSingleDeviceRoomClient(playerNames: string[]): Promise<{ code: string; playerIds: string[] }> {
  // We simulate an async API call but actually do it synchronously locally
  const { room, playerIds } = createLocalRoom(playerNames);
  return { code: room.code, playerIds };
}

/**
 * Starts the game. Routes to local engine if local, else hits API.
 */
export async function startGameClient(code: string, playerId: string): Promise<void> {
  if (isLocalRoom(code)) {
    const res = startLocalGame(code, playerId);
    if (res?.error) throw new Error(res.error);
    return;
  }
  
  const res = await fetch(`/api/rooms/${code}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to start game");
  }
}

/**
 * Advances turn in Single Device mode role reveal.
 */
export async function advanceSingleDeviceTurnClient(code: string, playerId: string): Promise<void> {
  if (isLocalRoom(code)) {
    const res = advanceLocalSingleDeviceTurn(code, playerId);
    if (res?.error) throw new Error(res.error);
    return;
  }

  const res = await fetch(`/api/rooms/${code}/single-ready`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to advance turn");
  }
}

/**
 * (Multiplayer only) Submits a clue.
 */
export async function submitClueClient(code: string, playerId: string, clue: string): Promise<void> {
  // Clue submission is disabled in local single device mode, so this shouldn't be called locally.
  const res = await fetch(`/api/rooms/${code}/clue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, clue }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to submit clue");
  }
}

/**
 * Single Device Mode: advance from discussion to InterRound
 */
export async function advanceToInterRoundClient(code: string): Promise<void> {
  if (isLocalRoom(code)) {
    const res = advanceLocalToInterRound(code);
    if (res?.error) throw new Error(res.error);
    return;
  }
}

/**
 * Submits imposter guess.
 */
export async function submitGuessClient(code: string, playerId: string, guess: string): Promise<void> {
  if (isLocalRoom(code)) {
    const res = submitLocalGuess(code, playerId, guess);
    if (res?.error) throw new Error(res.error);
    return;
  }

  const res = await fetch(`/api/rooms/${code}/guess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, guess }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to submit guess");
  }
}

/**
 * Skips imposter guess.
 */
export async function skipGuessClient(code: string, playerId: string): Promise<void> {
  if (isLocalRoom(code)) {
    const res = skipLocalGuess(code, playerId);
    if (res?.error) throw new Error(res.error);
    return;
  }

  const res = await fetch(`/api/rooms/${code}/skip-guess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to skip guess");
  }
}

/**
 * Starts next round
 */
export async function nextRoundClient(code: string, playerId: string): Promise<void> {
  if (isLocalRoom(code)) {
    const res = startNextLocalRound(code, playerId);
    if (res?.error) throw new Error(res.error);
    return;
  }

  const res = await fetch(`/api/rooms/${code}/next-round`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to start next round");
  }
}

/**
 * Submits a vote.
 */
export async function submitVoteClient(code: string, voterId: string, targetId: string | "skip"): Promise<void> {
  if (isLocalRoom(code)) {
    const res = submitLocalVote(code, voterId, targetId);
    if (res?.error) throw new Error(res.error);
    return;
  }

  const res = await fetch(`/api/rooms/${code}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voterId, targetId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to submit vote");
  }
}

/**
 * Single device mode: explicit button to reveal the imposter on the Results screen.
 */
export async function revealLocalImposterClient(code: string): Promise<void> {
  if (isLocalRoom(code)) {
    const res = revealLocalImposter(code);
    if (res?.error) throw new Error(res.error);
    return;
  }
}

/**
 * Starts next round.
 */
export async function startNextRoundClient(code: string, requesterId: string): Promise<void> {
  if (isLocalRoom(code)) {
    const res = startNextLocalRound(code, requesterId);
    if (res?.error) throw new Error(res.error);
    return;
  }

  const res = await fetch(`/api/rooms/${code}/continue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requesterId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to start next round");
  }
}
