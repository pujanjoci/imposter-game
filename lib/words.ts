export interface WordEntry {
  word: string;
  category: string;
  hints: string[];
}

export const WORD_BANK: WordEntry[] = [
  // ── NEPALI FOOD & DRINK ──
  { word: "momo", category: "Nepali Food", hints: ["dumpling", "achar", "steamed", "buff/chicken"] },
  { word: "dalbhat", category: "Nepali Food", hints: ["tarkari", "everyday", "power 24 hour", "bhat"] },
  { word: "selroti", category: "Nepali Food", hints: ["tihar", "rice flour", "ring shape", "sweet"] },
  { word: "chiya", category: "Nepali Drink", hints: ["morning", "milk", "tea", "masala"] },
  { word: "gundruk", category: "Nepali Food", hints: ["fermented", "leafy", "soup", "saag"] },
  { word: "sukuti", category: "Nepali Food", hints: ["dried meat", "khaja", "spicy", "baji"] },
  { word: "panipuri", category: "Nepali Food", hints: ["street food", "sour water", "crispy", "spicy"] },
  { word: "chatpate", category: "Nepali Food", hints: ["wai wai", "street food", "lemon", "puffed rice"] },
  { word: "choila", category: "Nepali Food", hints: ["newari", "grilled meat", "mustard oil", "spicy"] },
  { word: "jujudhau", category: "Nepali Food", hints: ["bhaktapur", "king curd", "clay pot", "sweet"] },
  { word: "chhurpi", category: "Nepali Food", hints: ["hard cheese", "yak milk", "mountain", "chewy"] },
  { word: "thukpa", category: "Nepali Food", hints: ["noodle soup", "warm", "tibetan/himalayan", "winter"] },
  { word: "tongba", category: "Nepali Drink", hints: ["millet", "bamboo straw", "warm water", "mountain"] },
  { word: "khir", category: "Nepali Food", hints: ["saun 15", "sweet rice", "milk", "celebration"] },
  { word: "bara", category: "Nepali Food", hints: ["lentil pancake", "woh", "traditional", "egg/meat"] },
  { word: "kachila", category: "Nepali Food", hints: ["raw meat", "spicy", "newari cuisine", "festival"] },
  { word: "yomari", category: "Nepali Food", hints: ["chaku", "rice flour", "yomari punhi", "sweet"] },
  { word: "sekuwa", category: "Nepali Food", hints: ["charcoal grilled", "dharan", "bbq", "tender"] },
  { word: "aloo tama", category: "Nepali Food", hints: ["bamboo shoot", "potato", "sour soup", "bodi"] },

  // ── NEPALI PLACES & DESTINATIONS ──
  { word: "sagarmatha", category: "Nepali Place", hints: ["mount everest", "highest peak", "solukhumbu", "snow"] },
  { word: "pokhara", category: "Nepali City", hints: ["fewa lake", "lakeside", "paragliding", "annapurna"] },
  { word: "kathmandu", category: "Nepali City", hints: ["capital", "city of temples", "valley", "heritage"] },
  { word: "pashupatinath", category: "Nepali Landmark", hints: ["bagmati river", "holy temple", "lord shiva", "ghat"] },
  { word: "swyambhunath", category: "Nepali Landmark", hints: ["monkey temple", "buddhist eyes", "stupa", "hilltop"] },
  { word: "boudhanath", category: "Nepali Landmark", hints: ["giant stupa", "prayer flags", "kora", "peace"] },
  { word: "lumbini", category: "Nepali Landmark", hints: ["birthplace of buddha", "maya devi", "monasteries", "peace"] },
  { word: "rara lake", category: "Nepali Nature", hints: ["mugu", "biggest lake", "deep blue", "remote"] },
  { word: "chitwan", category: "Nepali Destination", hints: ["rhino", "jungle safari", "national park", "sauraha"] },
  { word: "mustang", category: "Nepali Destination", hints: ["rain shadow", "muktinath", "apple", "windy"] },
  { word: "nagarkot", category: "Nepali Destination", hints: ["sunrise", "himalayan view", "hill station", "picnic"] },
  { word: "ilam", category: "Nepali Destination", hints: ["tea garden", "kanyam", "foggy hills", "eastern nepal"] },
  { word: "dharan", category: "Nepali City", hints: ["clock tower", "bhedetar gate", "street food", "eastern hub"] },

  // ── NEPALI FESTIVALS & CULTURE ──
  { word: "dashain", category: "Nepali Festival", hints: ["red tika", "jamara", "flying kites", "dakshina"] },
  { word: "tihar", category: "Nepali Festival", hints: ["lights", "deusi bhailo", "bhai tika", "diyas"] },
  { word: "holi", category: "Nepali Festival", hints: ["colors", "lola / water balloon", "spring", "celebration"] },
  { word: "teej", category: "Nepali Festival", hints: ["red sari", "fasting", "dancing", "women festival"] },
  { word: "maghe sankranti", category: "Nepali Festival", hints: ["til ko laddu", "tarul", "chaku", "ghee"] },
  { word: "indra jatra", category: "Nepali Festival", hints: ["kumari chariot", "lakhey dance", "basantapur", "samay baji"] },
  { word: "losar", category: "Nepali Festival", hints: ["new year", "tibetan/sherpa", "monastery", "celebration"] },
  { word: "chhath", category: "Nepali Festival", hints: ["sun worship", "thekua", "river bank", "terai"] },

  // ── NEPALI OBJECTS & TRADITIONS ──
  { word: "khukuri", category: "Nepali Object", hints: ["gorkha", "curved blade", "national weapon", "leather sheath"] },
  { word: "dhakatopi", category: "Nepali Object", hints: ["national hat", "traditional print", "palpa", "headwear"] },
  { word: "doko", category: "Nepali Object", hints: ["bamboo basket", "namlo", "carrying goods", "hills"] },
  { word: "madal", category: "Nepali Object", hints: ["folk drum", "two headed", "maruni", "beats"] },
  { word: "sarangi", category: "Nepali Object", hints: ["gaine / gandharva", "four strings", "bow", "folk melody"] },
  { word: "nanglo", category: "Nepali Object", hints: ["winnowing tray", "bamboo", "flat", "cleaning rice"] },
  { word: "silauto", category: "Nepali Object", hints: ["grinding stone", "lohoro", "achar", "masala"] },
  { word: "panche baja", category: "Nepali Object", hints: ["wedding music", "damaha", "narsingha", "traditional band"] },

  // ── NEPALI WILDLIFE & NATURE ──
  { word: "rhino", category: "Nepali Wildlife", hints: ["one horn", "chitwan", "thick skin", "grassland"] },
  { word: "red panda", category: "Nepali Wildlife", hints: ["habre", "bamboo eater", "endangered", "langtang"] },
  { word: "danfe", category: "Nepali Wildlife", hints: ["national bird", "nine colors", "himalayan monal", "feathers"] },
  { word: "snow leopard", category: "Nepali Wildlife", hints: ["ghost of mountains", "high altitude", "predator", "fur"] },
  { word: "laligurans", category: "Nepali Nature", hints: ["national flower", "rhododendron", "red bloom", "hills"] },
  { word: "yak", category: "Nepali Wildlife", hints: ["himalayas", "thick fur", "chhurpi source", "high altitude"] },
  { word: "yeti", category: "Nepali Legend", hints: ["snowman", "himalayas", "giant footprints", "mythical"] },

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
  const item = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
  return item || { word: "momo", category: "Nepali Food", hints: ["dumpling", "achar", "steamed", "buff/chicken"] };
}

export function pickDecoyWord(secretWord: string, category: string): WordEntry {
  const sameCategory = WORD_BANK.filter(
    (entry) => entry.category === category && entry.word !== secretWord
  );
  const pool = sameCategory.length > 0
    ? sameCategory
    : WORD_BANK.filter((entry) => entry.word !== secretWord);

  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return {
    word: secretWord === "momo" ? "dalbhat" : "momo",
    category,
    hints: ["popular", "traditional", "nepali", "delicious"]
  };
}
