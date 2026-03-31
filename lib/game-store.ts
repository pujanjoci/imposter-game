// ─── In-Memory Game Store ─────────────────────────────────────────────────
import { Room, Player, RoomView, Vote } from "./types";
import { pickRandomWord } from "./words";
import { randomBytes } from "crypto";

const MIN_PLAYERS = 3;

// ---------------------------------------------------------------------------
// Singleton Maps — survive Next.js hot reloads in dev
// ---------------------------------------------------------------------------
const g = globalThis as typeof globalThis & {
  __rooms?: Map<string, Room>;
  __subscribers?: Map<string, Set<(room: Room) => void>>;
};
if (!g.__rooms) g.__rooms = new Map<string, Room>();
if (!g.__subscribers) g.__subscribers = new Map<string, Set<(room: Room) => void>>();

const rooms = g.__rooms;
const subscribers = g.__subscribers;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateCode(): string {
  return randomBytes(3).toString("hex").toUpperCase();
}

function generateId(): string {
  return randomBytes(8).toString("hex");
}

function broadcast(code: string): void {
  const room = rooms.get(code);
  if (!room) return;
  subscribers.get(code)?.forEach((cb) => cb(room));
}

function touch(room: Room): void {
  room.updatedAt = Date.now();
}

function makePlayer(overrides: Partial<Player> & { id: string; name: string }): Player {
  return {
    isHost: false,
    isReady: false,
    role: undefined,
    clue: null,
    vote: null,
    skippedVote: false,
    ...overrides,
  };
}

function baseRoom(code: string): Omit<Room, "players"> {
  return {
    code,
    phase: "lobby",
    word: null,
    wordCategory: null,
    imposterHint: null,
    imposterId: null,
    submissions: [],
    votes: [],
    imposterGuess: null,
    imposterGuessCorrect: null,
    result: null,
    resultReason: null,
    roundNumber: 1,
    singleDeviceMode: false,
    singleDeviceTurn: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function createRoom(hostName: string): { room: Room; hostId: string } {
  const code = generateCode();
  const hostId = generateId();

  const room: Room = {
    ...baseRoom(code),
    players: [makePlayer({ id: hostId, name: hostName, isHost: true })],
  };

  rooms.set(code, room);
  return { room, hostId };
}

/**
 * Create a room in Single Device Mode.
 * All player names are provided upfront; no joining mid-game.
 * Returns IDs for every player in order.
 */
export function createRoomSingleDevice(
  playerNames: string[]
): { room: Room; playerIds: string[] } {
  const code = generateCode();
  const playerIds: string[] = [];

  const players: Player[] = playerNames.map((name, i) => {
    const id = generateId();
    playerIds.push(id);
    return makePlayer({ id, name, isHost: i === 0 });
  });

  const room: Room = {
    ...baseRoom(code),
    players,
    singleDeviceMode: true,
    singleDeviceTurn: 0,
  };

  rooms.set(code, room);
  return { room, playerIds };
}

export function joinRoom(
  code: string,
  playerName: string
): { playerId: string } | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "lobby") return { error: "Game already in progress" };
  if (room.players.length >= 10) return { error: "Room is full (max 10)" };
  if (room.singleDeviceMode) return { error: "This is a single-device room — all players were set up at creation" };

  const trimmed = playerName.trim();
  if (!trimmed) return { error: "Name cannot be empty" };
  if (room.players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase()))
    return { error: "Name already taken in this room" };

  const playerId = generateId();
  room.players.push(makePlayer({ id: playerId, name: trimmed }));
  touch(room);
  broadcast(code);
  return { playerId };
}

export function startGame(
  code: string,
  requesterId: string
): { error: string } | null {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };

  const requester = room.players.find((p) => p.id === requesterId);
  if (!requester?.isHost) return { error: "Only the host can start the game" };
  if (room.phase !== "lobby") return { error: "Game already started" };
  if (room.players.length < MIN_PLAYERS)
    return { error: `Need at least ${MIN_PLAYERS} players to start` };

  beginRound(room);
  touch(room);
  broadcast(code);
  return null;
}

// Shared setup logic for both first start and subsequent rounds
function beginRound(room: Room): void {
  // Pick a new imposter each round
  const imposterIndex = Math.floor(Math.random() * room.players.length);
  room.imposterId = room.players[imposterIndex].id;

  const { word, category, hint } = pickRandomWord();
  room.word = word;
  room.wordCategory = category;
  room.imposterHint = hint;

  room.players.forEach((p) => {
    p.isReady = false;
    p.role = p.id === room.imposterId ? "imposter" : "crewmate";
    p.clue = null;
    p.vote = null;
    p.skippedVote = false;
  });

  room.submissions = [];
  room.votes = [];
  room.imposterGuess = null;
  room.imposterGuessCorrect = null;
  room.result = null;
  room.resultReason = null;
  room.phase = "role_reveal";

  // In single-device mode, start from the first player's turn
  if (room.singleDeviceMode) {
    room.singleDeviceTurn = 0;
  }
}

/**
 * For single-device mode: advance to the next player's role reveal.
 * When all players have seen their role, automatically advance to clue_phase.
 */
export function advanceSingleDeviceTurn(
  code: string,
  playerId: string
): { error: string } | null {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (!room.singleDeviceMode) return { error: "Not a single-device room" };
  if (room.phase !== "role_reveal") return { error: "Wrong phase" };

  // The current "active" player is at singleDeviceTurn index
  const currentPlayer = room.players[room.singleDeviceTurn];
  // Only the host OR the current active player can advance
  const requester = room.players.find((p) => p.id === playerId);
  if (!requester) return { error: "Player not found" };

  // Mark current player ready
  if (currentPlayer) currentPlayer.isReady = true;

  const nextTurn = room.singleDeviceTurn + 1;
  if (nextTurn >= room.players.length) {
    // All players have seen their role — advance to clue phase
    room.phase = "clue_phase";
  } else {
    room.singleDeviceTurn = nextTurn;
  }

  touch(room);
  broadcast(code);
  return null;
}

export function setPlayerReady(
  code: string,
  playerId: string
): { error: string } | null {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "role_reveal") return { error: "Wrong phase" };

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { error: "Player not found" };
  player.isReady = true;
  touch(room);

  if (room.players.every((p) => p.isReady)) {
    room.phase = "clue_phase";
  }

  broadcast(code);
  return null;
}

export function submitClue(
  code: string,
  playerId: string,
  clue: string
): { error: string } | null {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "clue_phase") return { error: "Wrong phase" };

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { error: "Player not found" };
  if (room.submissions.some((s) => s.playerId === playerId))
    return { error: "You already submitted a clue" };

  const trimmed = clue.trim();
  if (!trimmed) return { error: "Clue cannot be empty" };

  // Enforce one-word clue for everyone
  if (trimmed.includes(" "))
    return { error: "Clue must be a single word — no spaces allowed" };
  if (trimmed.length > 30) return { error: "Clue too long (max 30 chars)" };

  room.submissions.push({
    playerId,
    playerName: player.name,
    clue: trimmed,
    submittedAt: Date.now(),
  });

  // Mirror onto player so getRoomView can read it directly
  player.clue = trimmed;
  touch(room);

  // Once everyone has submitted, move to the inter-round buffer
  // where the imposter can see all clues and decide to guess or skip
  if (room.submissions.length === room.players.length) {
    room.phase = "inter_round";
  }

  broadcast(code);
  return null;
}

// ---------------------------------------------------------------------------
// inter_round: imposter decides to guess the word or skip to vote phase
// ---------------------------------------------------------------------------

export function submitGuess(
  code: string,
  playerId: string,
  guess: string
): { error: string } | null {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "inter_round") return { error: "Wrong phase" };
  if (room.imposterId !== playerId) return { error: "Only the imposter can guess" };

  const trimmed = guess.trim();
  if (!trimmed) return { error: "Guess cannot be empty" };

  room.imposterGuess = trimmed;
  const correct = trimmed.toLowerCase() === room.word!.toLowerCase();
  room.imposterGuessCorrect = correct;

  if (correct) {
    // Imposter guessed right → imposter wins immediately, skip voting
    room.result = "imposter_wins";
    room.resultReason = `The Imposter correctly guessed the secret word: "${room.word}"`;
    room.phase = "results";
  } else {
    // Wrong guess → crewmates can now vote
    room.phase = room.singleDeviceMode ? "results" : "vote_phase";
    if (room.singleDeviceMode) {
      // In single-device mode, wrong guess also means vote by picking a suspect
      // We skip the vote phase and go directly to results with no winner yet
      room.result = null;
      room.resultReason = "The imposter guessed wrong. Time to vote!";
    }
  }

  touch(room);
  broadcast(code);
  return null;
}

// Imposter chooses to skip guessing → go straight to vote phase
export function skipGuess(
  code: string,
  playerId: string
): { error: string } | null {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "inter_round") return { error: "Wrong phase" };
  if (room.imposterId !== playerId) return { error: "Only the imposter can skip" };

  room.imposterGuess = null;
  room.imposterGuessCorrect = null;
  room.phase = room.singleDeviceMode ? "results" : "vote_phase";

  if (room.singleDeviceMode) {
    // In single-device, skip guess → show results with option to reveal imposter
    room.result = null;
    room.resultReason = null;
  }

  touch(room);
  broadcast(code);
  return null;
}

// ---------------------------------------------------------------------------
// Vote phase — players vote to eliminate or skip
// ---------------------------------------------------------------------------

export function submitVote(
  code: string,
  voterId: string,
  targetId: string | "skip"
): { error: string } | null {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "vote_phase") return { error: "Wrong phase" };
  if (room.votes.some((v) => v.voterId === voterId)) return { error: "Already voted" };

  const voter = room.players.find((p) => p.id === voterId);
  if (!voter) return { error: "Voter not found" };

  if (targetId !== "skip") {
    const target = room.players.find((p) => p.id === targetId);
    if (!target) return { error: "Target player not found" };
  }

  room.votes.push({ voterId, targetId });
  voter.vote = targetId;
  if (targetId === "skip") voter.skippedVote = true;

  touch(room);

  // Once everyone has voted, tally results
  if (room.votes.length === room.players.length) {
    resolveVotes(room);
  }

  broadcast(code);
  return null;
}

function resolveVotes(room: Room): void {
  // Count votes against each player (skip votes are excluded from tally)
  const tally: Record<string, number> = {};
  let skipCount = 0;

  room.votes.forEach((v) => {
    if (v.targetId === "skip") {
      skipCount++;
    } else {
      tally[v.targetId] = (tally[v.targetId] || 0) + 1;
    }
  });

  const totalRealVotes = room.players.length - skipCount;

  // Find who got the most votes
  let maxVotes = 0;
  let mostVotedId = "";
  for (const [pid, count] of Object.entries(tally)) {
    if (count > maxVotes) {
      maxVotes = count;
      mostVotedId = pid;
    }
  }

  // Check for a tie among real votes
  const topCount = Object.values(tally).filter((c) => c === maxVotes).length;
  const isTie = topCount > 1;

  if (totalRealVotes === 0 || isTie || maxVotes === 0) {
    // Everyone skipped or it's a tie — no elimination, start next round
    room.result = null;
    room.resultReason =
      totalRealVotes === 0
        ? "Everyone skipped the vote — starting next round!"
        : "It's a tie — no one was eliminated. Starting next round!";
    room.phase = "results";
    return;
  }

  const mostVotedPlayer = room.players.find((p) => p.id === mostVotedId);

  if (mostVotedId === room.imposterId) {
    room.result = "players_win";
    room.resultReason = `Crewmates correctly voted out the Imposter: ${mostVotedPlayer?.name}!`;
  } else {
    room.result = "imposter_wins";
    room.resultReason = `Crewmates voted out ${mostVotedPlayer?.name} — who was innocent! The Imposter survives.`;
  }

  room.phase = "results";
}

// ---------------------------------------------------------------------------
// Next round — host triggers a new round with the same players
// ---------------------------------------------------------------------------

export function startNextRound(
  code: string,
  requesterId: string
): { error: string } | null {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "results") return { error: "Wrong phase — must be in results to start next round" };

  const requester = room.players.find((p) => p.id === requesterId);
  if (!requester?.isHost) return { error: "Only the host can start the next round" };

  room.roundNumber += 1;
  beginRound(room);
  touch(room);
  broadcast(code);
  return null;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function getRoomView(code: string, playerId: string): RoomView | null {
  const room = rooms.get(code);
  if (!room) return null;

  const isImposter = room.imposterId === playerId;
  const isResultsPhase = room.phase === "results";

  // In single-device mode, the "active" player is at singleDeviceTurn
  // Everyone uses the same device, so we reveal based on whose turn it is
  const isSingleDevice = room.singleDeviceMode;
  const activePlayer = isSingleDevice ? room.players[room.singleDeviceTurn] : null;
  const activeSingleDevicePlayerId = activePlayer?.id ?? "";

  // Determine imposter status for role reveal
  const effectivePlayerId = isSingleDevice && room.phase === "role_reveal"
    ? activeSingleDevicePlayerId
    : playerId;
  const effectiveIsImposter = room.imposterId === effectivePlayerId;

  return {
    code: room.code,

    players: room.players.map((p) => ({
      ...p,
      // Role mapping:
      // - Results: reveal all roles
      // - SD role_reveal: show only the active turn player's role
      // - SD clue/inter/results: reveal all roles (CluePhase needs to know who is imposter)
      // - Multiplayer: show only own role
      role: isResultsPhase
        ? (p.id === room.imposterId ? "imposter" : "crewmate")
        : isSingleDevice && room.phase === "role_reveal"
          ? (p.id === activeSingleDevicePlayerId
              ? (p.id === room.imposterId ? "imposter" : "crewmate")
              : undefined)
          : isSingleDevice
            // In SD clue/inter phase, reveal all roles so components can render per-player
            ? (p.id === room.imposterId ? "imposter" : "crewmate")
            : p.id === playerId
              ? (p.id === room.imposterId ? "imposter" : "crewmate")
              : undefined,
      clue: p.clue ?? null,
      vote: p.vote ?? null,
      skippedVote: p.skippedVote ?? false,
    })),

    phase: room.phase,

    // Word:
    // - SD role_reveal imposter: no word
    // - SD clue phase: always send word (CluePhase hides from imposter via role check)
    // - Multiplayer imposter: no word until results
    word: isResultsPhase
      ? room.word
      : isSingleDevice && room.phase === "role_reveal"
        ? (effectiveIsImposter ? null : room.word)
        : (isSingleDevice
          ? room.word  // always send in clue/inter phase in SD; UI filters
          : (isImposter ? null : room.word)),

    // Category: always visible
    wordCategory: room.wordCategory,

    // Hint:
    // - Results: always reveal
    // - SD mode: always include (CluePhase shows it only to imposter player)
    // - Multiplayer: only imposter sees it
    imposterHint: isResultsPhase
      ? room.imposterHint
      : (isSingleDevice
        ? room.imposterHint  // always include; UI gates based on player role
        : (isImposter ? room.imposterHint : null)),

    // Imposter identity revealed only in results
    imposterId: isResultsPhase ? room.imposterId : null,

    submissions: room.submissions,
    votes: room.votes,
    imposterGuess: room.imposterGuess,
    imposterGuessCorrect: room.imposterGuessCorrect,
    result: room.result,
    resultReason: room.resultReason,
    roundNumber: room.roundNumber,
    singleDeviceMode: room.singleDeviceMode,
    singleDeviceTurn: room.singleDeviceTurn,
    updatedAt: room.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// SSE Pub-Sub
// ---------------------------------------------------------------------------

export function subscribe(
  code: string,
  callback: (room: Room) => void
): () => void {
  if (!subscribers.has(code)) subscribers.set(code, new Set());
  subscribers.get(code)!.add(callback);
  return () => subscribers.get(code)?.delete(callback);
}

// ---------------------------------------------------------------------------
// Cleanup stale rooms (> 3 hours old)
// ---------------------------------------------------------------------------

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.createdAt > 3 * 60 * 60 * 1000) {
      rooms.delete(code);
      subscribers.delete(code);
    }
  }
}, 10 * 60 * 1000);