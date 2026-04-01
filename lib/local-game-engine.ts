import { Room, Player, RoomView, Vote } from "./types";
import { pickRandomWord } from "./words";

const MIN_PLAYERS = 3;

// Helper to generate IDs without Node's crypto
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "").substring(0, 16);
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateCode(): string {
  // Generate a random 6-character hex code
  return Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0")
    .toUpperCase();
}

function getLocalRoomFromStorage(code: string): Room | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(`local_room_${code}`);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as Room;
  } catch {
    return null;
  }
}

function saveLocalRoomToStorage(room: Room): void {
  if (typeof window === "undefined") return;
  room.updatedAt = Date.now();
  localStorage.setItem(`local_room_${room.code}`, JSON.stringify(room));
}

function broadcast(code: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("local-room-updated", { detail: { code } }));
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
    singleDeviceMode: true,
    singleDeviceTurn: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Public API for Local Game Engine
// ---------------------------------------------------------------------------

export function createLocalRoom(playerNames: string[]): { room: Room; playerIds: string[] } {
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
  };

  saveLocalRoomToStorage(room);
  return { room, playerIds };
}

export function startLocalGame(code: string, requesterId: string): { error: string } | null {
  const room = getLocalRoomFromStorage(code);
  if (!room) return { error: "Room not found locally" };

  const requester = room.players.find((p) => p.id === requesterId);
  if (!requester?.isHost) return { error: "Only the host can start the game" };
  if (room.phase !== "lobby") return { error: "Game already started" };
  if (room.players.length < MIN_PLAYERS)
    return { error: `Need at least ${MIN_PLAYERS} players to start` };

  beginRound(room);
  saveLocalRoomToStorage(room);
  broadcast(code);
  return null;
}

function beginRound(room: Room): void {
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
  room.singleDeviceTurn = 0;
}

export function advanceLocalSingleDeviceTurn(code: string, playerId: string): { error: string } | null {
  const room = getLocalRoomFromStorage(code);
  if (!room) return { error: "Room not found locally" };
  if (room.phase !== "role_reveal") return { error: "Wrong phase" };

  const currentPlayer = room.players[room.singleDeviceTurn];
  const requester = room.players.find((p) => p.id === playerId);
  if (!requester) return { error: "Player not found" };

  if (currentPlayer) currentPlayer.isReady = true;

  const nextTurn = room.singleDeviceTurn + 1;
  if (nextTurn >= room.players.length) {
    // All players seen role, move to clue_phase for discussion
    room.phase = "clue_phase";
  } else {
    room.singleDeviceTurn = nextTurn;
  }

  saveLocalRoomToStorage(room);
  broadcast(code);
  return null;
}

export function advanceLocalToInterRound(code: string): { error: string } | null {
  const room = getLocalRoomFromStorage(code);
  if (!room) return { error: "Room not found locally" };
  if (room.phase !== "clue_phase") return { error: "Wrong phase" };

  room.phase = "inter_round";
  saveLocalRoomToStorage(room);
  broadcast(code);
  return null;
}

export function submitLocalGuess(code: string, playerId: string, guess: string): { error: string } | null {
  const room = getLocalRoomFromStorage(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "inter_round") return { error: "Wrong phase" };
  if (room.imposterId !== playerId) return { error: "Only the imposter can guess" };

  const trimmed = guess.trim();
  if (!trimmed) return { error: "Guess cannot be empty" };

  room.imposterGuess = trimmed;
  const correct = trimmed.toLowerCase() === room.word!.toLowerCase();
  room.imposterGuessCorrect = correct;

  if (correct) {
    room.result = "imposter_wins";
    room.resultReason = `The Imposter correctly guessed the secret word: "${room.word}"`;
    room.phase = "results";
  } else {
    room.phase = "results";
    room.result = null;
    room.resultReason = "The imposter guessed wrong! Time to vote out the suspect.";
  }

  saveLocalRoomToStorage(room);
  broadcast(code);
  return null;
}

export function skipLocalGuess(code: string, playerId: string): { error: string } | null {
  const room = getLocalRoomFromStorage(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "inter_round") return { error: "Wrong phase" };
  if (room.imposterId !== playerId) return { error: "Only the imposter can skip" };

  room.imposterGuess = null;
  room.imposterGuessCorrect = null;
  room.phase = "results";
  room.result = null;
  room.resultReason = null;

  saveLocalRoomToStorage(room);
  broadcast(code);
  return null;
}

export function submitLocalVote(code: string, voterId: string, targetId: string | "skip"): { error: string } | null {
  const room = getLocalRoomFromStorage(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "results") return { error: "Wrong phase" }; 
  // Wait, in SD mode the voting happens IN results phase.
  // Actually, previously SD mode did not have a vote_phase. 
  // Let's create a vote logic equivalent for SD mode.
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

  if (room.votes.length === room.players.length) {
    resolveLocalVotes(room);
  } else {
    // Move to next player's turn to vote? No, in SD mode the votes are just cast consecutively by passing the phone
    // We can just keep it in results phase while they vote, or create a specific vote view.
    // In original code, SD mode skipped vote_phase and went straight to Results, assuming they just discussed. 
    // Wait! Let's check original game-store for SD vote logic.
    // In original: "if (room.singleDeviceMode) room.phase = 'results';"
    // So SD mode never collects individual votes in the App! They just vote in real life, and then reveal who was imposter.
  }

  saveLocalRoomToStorage(room);
  broadcast(code);
  return null;
}

function resolveLocalVotes(room: Room): void {
  // Not used if we skip voting in the app for SD mode.
}

export function revealLocalImposter(code: string): { error: string } | null {
  const room = getLocalRoomFromStorage(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "results") return { error: "Wrong phase" };
  
  room.result = "players_win"; // Doesn't matter, just trigger full reveal
  room.resultReason = `The Imposter was ${room.players.find(p => p.id === room.imposterId)?.name}!`;

  saveLocalRoomToStorage(room);
  broadcast(code);
  return null;
}

export function startNextLocalRound(code: string, requesterId: string): { error: string } | null {
  const room = getLocalRoomFromStorage(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "results") return { error: "Wrong phase" };

  const requester = room.players.find((p) => p.id === requesterId);
  if (!requester?.isHost) return { error: "Only the host can start the next round" };

  room.roundNumber += 1;
  beginRound(room);
  saveLocalRoomToStorage(room);
  broadcast(code);
  return null;
}

export function getLocalRoomView(code: string, playerId: string): RoomView | null {
  const room = getLocalRoomFromStorage(code);
  if (!room) return null;

  const isImposter = room.imposterId === playerId;
  const isResultsPhase = room.phase === "results";
  
  // Single device specifics
  const isSingleDevice = room.singleDeviceMode;
  const activePlayer = isSingleDevice ? room.players[room.singleDeviceTurn] : null;
  const activeSingleDevicePlayerId = activePlayer?.id ?? "";
  
  const effectivePlayerId = isSingleDevice && room.phase === "role_reveal"
    ? activeSingleDevicePlayerId
    : playerId;
  const effectiveIsImposter = room.imposterId === effectivePlayerId;

  return {
    code: room.code,
    players: room.players.map((p) => ({
      ...p,
      role: isResultsPhase
        ? (p.id === room.imposterId ? "imposter" : "crewmate")
        : isSingleDevice && room.phase === "role_reveal"
          ? (p.id === activeSingleDevicePlayerId
              ? (p.id === room.imposterId ? "imposter" : "crewmate")
              : undefined)
          : isSingleDevice
            ? (p.id === room.imposterId ? "imposter" : "crewmate")
            : p.id === playerId
              ? (p.id === room.imposterId ? "imposter" : "crewmate")
              : undefined,
      clue: p.clue ?? null,
      vote: p.vote ?? null,
      skippedVote: p.skippedVote ?? false,
    })),
    phase: room.phase,
    word: isResultsPhase
      ? room.word
      : isSingleDevice && room.phase === "role_reveal"
        ? (effectiveIsImposter ? null : room.word)
        : (isSingleDevice
          ? room.word
          : (isImposter ? null : room.word)),
    wordCategory: room.wordCategory,
    imposterHint: isResultsPhase
      ? room.imposterHint
      : (isSingleDevice
        ? room.imposterHint
        : (isImposter ? room.imposterHint : null)),
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
