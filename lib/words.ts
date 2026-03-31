export const WORD_BANK = [
  // ── PROFESSIONS ──
  { word: "doctor", category: "Profession", hint: "medicine" },
  { word: "teacher", category: "Profession", hint: "education" },
  { word: "artist", category: "Profession", hint: "creative" },
  { word: "astronaut", category: "Profession", hint: "space" },
  { word: "chef", category: "Profession", hint: "food" },
  { word: "firefighter", category: "Profession", hint: "emergency" },
  { word: "detective", category: "Profession", hint: "investigation" },
  { word: "gladiator", category: "Profession", hint: "combat" },

  // ── ANIMALS ──
  { word: "elephant", category: "Animal", hint: "mammal" },
  { word: "penguin", category: "Animal", hint: "bird" },
  { word: "kangaroo", category: "Animal", hint: "marsupial" },
  { word: "dolphin", category: "Animal", hint: "aquatic" },
  { word: "cheetah", category: "Animal", hint: "feline" },
  { word: "chameleon", category: "Animal", hint: "reptile" },
  { word: "octopus", category: "Animal", hint: "marine" },
  { word: "peacock", category: "Animal", hint: "feathers" },

  // ── FOOD & DRINK ──
  { word: "pizza", category: "Food", hint: "dough" },
  { word: "sushi", category: "Food", hint: "seafood" },
  { word: "chocolate", category: "Food", hint: "sweet" },
  { word: "coffee", category: "Drink", hint: "caffeine" },
  { word: "taco", category: "Food", hint: "mexican" },
  { word: "spaghetti", category: "Food", hint: "pasta" },
  { word: "pancake", category: "Food", hint: "breakfast" },
  { word: "smoothie", category: "Drink", hint: "blended" },

  // ── OBJECTS ──
  { word: "camera", category: "Object", hint: "photography" },
  { word: "laptop", category: "Object", hint: "computer" },
  { word: "guitar", category: "Object", hint: "instrument" },
  { word: "telescope", category: "Object", hint: "lenses" },
  { word: "bicycle", category: "Object", hint: "vehicle" },
  { word: "umbrella", category: "Object", hint: "weather" },
  { word: "lantern", category: "Object", hint: "light" },
  { word: "compass", category: "Object", hint: "navigation" },

  // ── PLACES & GEOGRAPHY ──
  { word: "beach", category: "Location", hint: "sand" },
  { word: "jungle", category: "Location", hint: "forest" },
  { word: "library", category: "Location", hint: "books" },
  { word: "hospital", category: "Location", hint: "medical" },
  { word: "tsunami", category: "Disaster", hint: "wave" },
  { word: "volcano", category: "Geology", hint: "eruption" },
  { word: "pyramid", category: "Landmark", hint: "monument" },
  { word: "museum", category: "Location", hint: "exhibition" },

  // ── FANTASY & MYTHOLOGY ──
  { word: "dragon", category: "Mythology", hint: "creature" },
  { word: "wizard", category: "Fantasy", hint: "magic" },
  { word: "vampire", category: "Mythology", hint: "undead" },
  { word: "mermaid", category: "Mythology", hint: "ocean" },
  { word: "zombie", category: "Mythology", hint: "monster" },

  // ── MISCELLANEOUS ──
  { word: "rainbow", category: "Nature", hint: "colors" },
  { word: "tornado", category: "Weather", hint: "storm" },
  { word: "diamond", category: "Material", hint: "gemstone" },
  { word: "magnet", category: "Science", hint: "attraction" },
  { word: "battery", category: "Object", hint: "power" },
];

export function getRandomWord() {
  const i = Math.floor(Math.random() * WORD_BANK.length);
  return WORD_BANK[i];
}

export function pickRandomWord(): { word: string; category: string; hint: string } {
  return WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
}
