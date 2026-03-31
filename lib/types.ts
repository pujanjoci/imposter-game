// ─── Shared TypeScript Types ───────────────────────────────────────────────

export type GamePhase =
  | "lobby"
  | "role_reveal"
  | "clue_phase"
  | "guess_phase"
  | "inter_round"   // buffer: imposter decides whether to guess the word
  | "vote_phase"
  | "results";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  // Per-round fields — reset each round
  role?: "crewmate" | "imposter";
  clue?: string | null;
  vote?: string | null;
  skippedVote?: boolean;
}

export interface Submission {
  playerId: string;
  playerName: string;
  clue: string;
  submittedAt: number;
}

export interface Vote {
  voterId: string;
  targetId: string | "skip"; // "skip" = player chose not to vote anyone out
}

export type GameResult = "players_win" | "imposter_wins";

export interface Room {
  code: string;
  players: Player[];
  phase: GamePhase;
  // game state
  word: string | null;
  wordCategory: string | null;   // category of the secret word (e.g. "Disaster")
  imposterHint: string | null;
  imposterId: string | null;
  submissions: Submission[];
  votes: Vote[];
  imposterGuess: string | null;
  imposterGuessCorrect: boolean | null;
  result: GameResult | null;
  resultReason: string | null;
  roundNumber: number;
  // single device mode
  singleDeviceMode: boolean;
  singleDeviceTurn: number; // index into players array; whose role is being revealed
  // metadata
  createdAt: number;
  updatedAt: number;
}

// Client-safe room view (what each player's browser receives over SSE)
export interface RoomView {
  code: string;
  players: Player[];
  phase: GamePhase;
  word: string | null;          // null for imposter until results
  wordCategory: string | null;  // always visible (helps imposter blend)
  imposterHint: string | null;  // only for imposter
  imposterId: string | null;    // revealed only in results
  submissions: Submission[];
  votes: Vote[];
  imposterGuess: string | null;
  imposterGuessCorrect: boolean | null;
  result: GameResult | null;
  resultReason: string | null;
  roundNumber: number;
  singleDeviceMode: boolean;
  singleDeviceTurn: number;
  updatedAt: number;
}