export interface WordEntry {
  word: string;
  category: string;
  hints: string[];
}

export const WORD_BANK: WordEntry[] = [
  // ── PROFESSIONS ──
  { word: "doctor", category: "Profession", hints: ["medicine", "stethoscope", "hospital", "patients"] },
  { word: "teacher", category: "Profession", hints: ["education", "classroom", "grading", "mentor"] },
  { word: "artist", category: "Profession", hints: ["creative", "canvas", "gallery", "medium"] },
  { word: "astronaut", category: "Profession", hints: ["space", "gravity", "orbit", "shuttle"] },
  { word: "chef", category: "Profession", hints: ["food", "kitchen", "recipe", "cuisine"] },
  { word: "firefighter", category: "Profession", hints: ["emergency", "extinguish", "rescue", "hazard"] },
  { word: "detective", category: "Profession", hints: ["investigation", "mystery", "clues", "evidence"] },
  { word: "gladiator", category: "Profession", hints: ["combat", "arena", "warrior", "spectacle"] },

  // ── ANIMALS ──
  { word: "elephant", category: "Animal", hints: ["mammal", "trunk", "tusks", "herd"] },
  { word: "penguin", category: "Animal", hints: ["bird", "arctic", "waddle", "flightless"] },
  { word: "kangaroo", category: "Animal", hints: ["marsupial", "pouch", "hopping", "outback"] },
  { word: "dolphin", category: "Animal", hints: ["aquatic", "intelligent", "sonar", "pod"] },
  { word: "cheetah", category: "Animal", hints: ["feline", "speed", "spotted", "predator"] },
  { word: "chameleon", category: "Animal", hints: ["reptile", "camouflage", "color", "scales"] },
  { word: "octopus", category: "Animal", hints: ["marine", "tentacles", "ink", "mollusk"] },
  { word: "peacock", category: "Animal", hints: ["feathers", "colorful", "display", "fowl"] },

  // ── FOOD & DRINK ──
  { word: "pizza", category: "Food", hints: ["dough", "cheese", "slice", "topping"] },
  { word: "sushi", category: "Food", hints: ["seafood", "rice", "raw", "roll"] },
  { word: "chocolate", category: "Food", hints: ["sweet", "cocoa", "dessert", "bar"] },
  { word: "coffee", category: "Drink", hints: ["caffeine", "brew", "roasted", "morning"] },
  { word: "taco", category: "Food", hints: ["mexican", "shell", "filling", "spicy"] },
  { word: "spaghetti", category: "Food", hints: ["pasta", "sauce", "noodles", "italian"] },
  { word: "pancake", category: "Food", hints: ["breakfast", "syrup", "griddle", "batter"] },
  { word: "smoothie", category: "Drink", hints: ["blended", "fruit", "refreshing", "straw"] },

  // ── OBJECTS ──
  { word: "camera", category: "Object", hints: ["photography", "lens", "shutter", "capture"] },
  { word: "laptop", category: "Object", hints: ["computer", "portable", "keyboard", "screen"] },
  { word: "guitar", category: "Object", hints: ["instrument", "strings", "acoustic", "melody"] },
  { word: "telescope", category: "Object", hints: ["lenses", "astronomy", "vision", "distant"] },
  { word: "bicycle", category: "Object", hints: ["vehicle", "wheels", "gears", "transport"] },
  { word: "umbrella", category: "Object", hints: ["weather", "protection", "rain", "canopy"] },
  { word: "lantern", category: "Object", hints: ["light", "oil", "glow", "burn"] },
  { word: "compass", category: "Object", hints: ["navigation", "magnetic", "direction", "needle"] },

  // ── PLACES & GEOGRAPHY ──
  { word: "beach", category: "Location", hints: ["sand", "ocean", "tide", "shore"] },
  { word: "jungle", category: "Location", hints: ["forest", "tropical", "wildlife", "dense"] },
  { word: "library", category: "Location", hints: ["books", "quiet", "knowledge", "shelves"] },
  { word: "hospital", category: "Location", hints: ["medical", "care", "treatment", "clinic"] },
  { word: "tsunami", category: "Disaster", hints: ["wave", "flooding", "coastal", "impact"] },
  { word: "volcano", category: "Geology", hints: ["eruption", "magma", "active", "mountain"] },
  { word: "pyramid", category: "Landmark", hints: ["monument", "ancient", "tomb", "structure"] },
  { word: "museum", category: "Location", hints: ["exhibition", "artifacts", "culture", "heritage"] },

  // ── FANTASY & MYTHOLOGY ──
  { word: "dragon", category: "Mythology", hints: ["creature", "fire", "scales", "legend"] },
  { word: "wizard", category: "Fantasy", hints: ["magic", "spells", "staff", "mystical"] },
  { word: "vampire", category: "Mythology", hints: ["undead", "fangs", "night", "blood"] },
  { word: "mermaid", category: "Mythology", hints: ["ocean", "tail", "mythic", "scales"] },
  { word: "zombie", category: "Mythology", hints: ["monster", "apocalypse", "undead", "brain"] },

  // ── MISCELLANEOUS ──
  { word: "rainbow", category: "Nature", hints: ["colors", "spectrum", "prism", "arc"] },
  { word: "tornado", category: "Weather", hints: ["storm", "vortex", "wind", "funnel"] },
  { word: "diamond", category: "Material", hints: ["gemstone", "expensive", "pressure", "sparkle"] },
  { word: "magnet", category: "Science", hints: ["attraction", "polarity", "field", "force"] },
  { word: "battery", category: "Object", hints: ["power", "energy", "charge", "cell"] },
];

export function getImposterCount(playerCount: number): number {
  if (playerCount <= 5) return 1;
  if (playerCount <= 9) return 2;
  if (playerCount <= 14) return 3;
  return 4;
}

export function pickRandomWord(): WordEntry {
  return WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
}
