import { Room, Player, RoomView } from "./types";
import type { GameMode } from "./types";
import { pickRandomWord, pickDecoyWord, getImposterCount } from "./words";

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
    imposterHints: {},
    playerWords: {},
    imposterIds: [],
    imposterCount: 0,
    manualImposterCount: null,
    gameMode: "classic",
    submissions: [],
    votes: [],
    imposterGuess: null,
    imposterGuessCorrect: null,
    result: null,
    resultReason: null,
    roundNumber: 1,
    clueRound: 1,
    singleDeviceMode: true,
    singleDeviceTurn: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Public API for Local Game Engine
// ---------------------------------------------------------------------------

export function createLocalRoom(
  playerNames: string[],
  manualImposterCount: number | null = null,
  gameMode: GameMode = "classic"
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
    manualImposterCount,
    gameMode,
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
  const gameMode = room.gameMode ?? "classic";
  const count = room.manualImposterCount ?? getImposterCount(room.players.length);
  room.imposterCount = count;

  // Pick N unique imposters
  const shuffled = [...room.players].sort(() => Math.random() - 0.5);
  const selectedImposters = shuffled.slice(0, count);
  room.imposterIds = selectedImposters.map((p) => p.id);

  let undercoverId = "";
  if (gameMode === "undercover") {
    const nonImposters = shuffled.slice(count);
    if (nonImposters.length > 0) {
      undercoverId = nonImposters[0].id;
    }
  }

  const { word, category, hints } = pickRandomWord();
  room.word = word;
  room.wordCategory = category;
  room.playerWords = {};

  // Assign a unique hint to each imposter
  room.imposterHints = {};
  const shuffledHints = [...hints].sort(() => Math.random() - 0.5);
  const decoy = (gameMode === "hidden_words" || gameMode === "undercover") ? pickDecoyWord(word, category) : null;
  selectedImposters.forEach((p, i) => {
    if (gameMode === "hidden_words" && decoy) {
      room.playerWords[p.id] = decoy.word;
      return;
    }
    room.imposterHints[p.id] = shuffledHints[i % shuffledHints.length];
  });

  room.players.forEach((p) => {
    p.isReady = false;
    if (room.imposterIds.includes(p.id)) {
      p.role = "imposter";
      if (gameMode === "classic" || gameMode === "undercover") {
        room.playerWords[p.id] = "";
      }
    } else if (p.id === undercoverId) {
      p.role = "undercover";
      if (decoy) {
        room.playerWords[p.id] = decoy.word;
      }
    } else {
      p.role = "crewmate";
      room.playerWords[p.id] = word;
    }
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
  room.clueRound = 1;
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

  room.phase = room.gameMode === "hidden_words" ? "results" : "inter_round";
  saveLocalRoomToStorage(room);
  broadcast(code);
  return null;
}

export function submitLocalGuess(code: string, playerId: string, guess: string): { error: string } | null {
  const room = getLocalRoomFromStorage(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "inter_round") return { error: "Wrong phase" };
  if (room.gameMode === "hidden_words") return { error: "Guessing is disabled in hidden word mode" };
  if (!room.imposterIds.includes(playerId)) return { error: "Only the imposter can guess" };

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
  if (room.gameMode === "hidden_words") return { error: "Guessing is disabled in hidden word mode" };
  if (!room.imposterIds.includes(playerId)) return { error: "Only the imposter can skip" };

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
  }

  saveLocalRoomToStorage(room);
  broadcast(code);
  return null;
}

function resolveLocalVotes(room: Room): void {
  const voteCounts: Record<string, number> = {};
  let skipCount = 0;
  room.votes.forEach(v => {
    if (v.targetId === "skip") {
      skipCount++;
    } else {
      voteCounts[v.targetId] = (voteCounts[v.targetId] || 0) + 1;
    }
  });

  const totalRealVotes = room.players.length - skipCount;

  let mostVotedId = "";
  let maxVotes = 0;
  for (const id in voteCounts) {
    if (voteCounts[id] > maxVotes) {
      maxVotes = voteCounts[id];
      mostVotedId = id;
    }
  }

  // Check for a tie among real votes
  const topCount = Object.values(voteCounts).filter((c) => c === maxVotes).length;
  const isTie = topCount > 1;

  const isSkippedOrTied = totalRealVotes === 0 || isTie || skipCount >= maxVotes || maxVotes === 0;

  if (isSkippedOrTied) {
    if (!room.clueRound) room.clueRound = 1;
    if (room.clueRound < 3) {
      room.clueRound += 1;
      room.result = null;
      room.resultReason =
        (totalRealVotes === 0 || skipCount >= maxVotes)
          ? `Vote skipped! Submit another clue for this round (Round ${room.clueRound} of 3).`
          : `Vote tied! Submit another clue for this round (Round ${room.clueRound} of 3).`;
      room.phase = "clue_phase";
      
      // Reset clues and votes
      room.submissions = [];
      room.votes = [];
      room.players.forEach((p) => {
        p.clue = null;
        p.vote = null;
        p.skippedVote = false;
      });
      return;
    } else {
      // Already did 3 rounds of clues, end the round with no winner
      room.result = null;
      room.resultReason = "No one was eliminated after 3 rounds of clues!";
      room.phase = "results";
      return;
    }
  }

  const mostVotedPlayer = room.players.find((p) => p.id === mostVotedId);
  const isTargetImposterOrUndercover = room.imposterIds.includes(mostVotedId) || mostVotedPlayer?.role === "undercover";

  if (isTargetImposterOrUndercover) {
    room.result = "players_win";
    room.resultReason = room.gameMode === "undercover"
      ? `Crewmates correctly voted out the ${mostVotedPlayer?.role === "imposter" ? "Imposter" : "Undercover"}: ${mostVotedPlayer?.name}!`
      : `Crewmates correctly voted out an Imposter: ${mostVotedPlayer?.name}!`;
  } else {
    room.result = "imposter_wins";
    room.resultReason = room.gameMode === "undercover"
      ? `Crewmates voted out ${mostVotedPlayer?.name} — who was innocent! The Imposter & Undercover win.`
      : `Crewmates voted out ${mostVotedPlayer?.name} — who was innocent! The Imposters survive.`;
  }
}

export function revealLocalImposter(code: string): { error: string } | null {
  const room = getLocalRoomFromStorage(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "results") return { error: "Wrong phase" };
  
  const specialPlayers = room.players.filter(p => room.imposterIds.includes(p.id) || p.role === "undercover");
  room.result = "players_win";
  room.resultReason = `The special players were: ${specialPlayers.map(p => `${p.name} (${p.role === "imposter" ? "Imposter" : "Undercover"})`).join(", ")}!`;

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

  const isImposter = room.imposterIds.includes(playerId);
  const isResultsPhase = room.phase === "results";
  const gameMode = room.gameMode ?? "classic";
  const playerWords = room.playerWords ?? {};
  
  const isSingleDevice = room.singleDeviceMode;
  const activePlayer = isSingleDevice ? room.players[room.singleDeviceTurn] : null;
  const activeSingleDevicePlayerId = activePlayer?.id ?? "";
  
  const effectivePlayerId = isSingleDevice && room.phase === "role_reveal"
    ? activeSingleDevicePlayerId
    : playerId;
  const effectiveIsImposter = room.imposterIds.includes(effectivePlayerId);
  const effectivePlayer = room.players.find(p => p.id === effectivePlayerId);
  const effectiveIsUndercover = effectivePlayer?.role === "undercover";
  
  const visibleWord = gameMode === "hidden_words"
    ? playerWords[effectivePlayerId] || room.word
    : gameMode === "undercover"
      ? (effectiveIsImposter ? null : (effectiveIsUndercover ? playerWords[effectivePlayerId] : room.word))
      : (effectiveIsImposter ? null : room.word);

  return {
    code: room.code,
    players: room.players.map((p) => ({
      ...p,
      role: isResultsPhase
        ? p.role
        : isSingleDevice && room.phase === "role_reveal"
          ? (p.id === activeSingleDevicePlayerId ? p.role : undefined)
          : isSingleDevice
            ? p.role
            : p.id === playerId ? p.role : undefined,
      clue: p.clue ?? null,
      vote: p.vote ?? null,
      skippedVote: p.skippedVote ?? false,
    })),
    phase: room.phase,
    word: isResultsPhase
      ? room.word
      : (gameMode === "hidden_words" || gameMode === "undercover")
        ? visibleWord
      : isSingleDevice && room.phase === "role_reveal"
        ? (effectiveIsImposter ? null : room.word)
        : (isSingleDevice
          ? room.word
          : (isImposter ? null : room.word)),
    wordCategory: room.wordCategory,
    imposterHint: (gameMode === "hidden_words" || gameMode === "undercover" && !effectiveIsImposter)
      ? null
      : room.imposterHints[playerId] || (isSingleDevice ? room.imposterHints[activeSingleDevicePlayerId] : null),
    imposterIds: isResultsPhase ? room.imposterIds : [],
    imposterWords: isResultsPhase && (gameMode === "hidden_words" || gameMode === "undercover")
      ? Object.fromEntries(
          room.players
            .filter(p => room.imposterIds.includes(p.id) || p.role === "undercover")
            .map((p) => [p.id, playerWords[p.id] || ""])
        )
      : {},
    imposterCount: room.imposterCount,
    manualImposterCount: room.manualImposterCount,
    gameMode,
    submissions: room.submissions,
    votes: room.votes,
    imposterGuess: room.imposterGuess,
    imposterGuessCorrect: room.imposterGuessCorrect,
    result: room.result,
    resultReason: room.resultReason,
    roundNumber: room.roundNumber,
    clueRound: room.clueRound,
    singleDeviceMode: room.singleDeviceMode,
    singleDeviceTurn: room.singleDeviceTurn,
    updatedAt: room.updatedAt,
  };
}
