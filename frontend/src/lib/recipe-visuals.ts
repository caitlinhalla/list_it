// Deterministic hash → visual style for a recipe card tile.
// Same title always yields the same hue + emoji — no randomness.

export interface RecipeVisual {
  hueDeg: number;          // base hue for gradient
  background: string;      // CSS gradient
  ring: string;            // solid color for accents/dots
  emoji: string;
}

const EMOJIS = [
  "🍗", "🍝", "🥬", "🍲", "🍓", "🥘", "🍜", "🥗",
  "🍳", "🧀", "🥖", "🌮", "🍛", "🥧", "🍰", "🫕",
];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function recipeVisual(title: string): RecipeVisual {
  const h = hash(title || "recipe");
  // Keep hues inside warm / earthy range: 15°–130° + 300°–360°
  const warmHues = [18, 28, 38, 48, 78, 95, 115, 325, 345];
  const hueDeg = warmHues[h % warmHues.length];
  const sat = 45;     // muted saturation for editorial feel
  const lightTop = 78;
  const lightBottom = 48;
  const background = `linear-gradient(135deg, hsl(${hueDeg} ${sat}% ${lightTop}%), hsl(${hueDeg} ${sat}% ${lightBottom}%))`;
  const ring = `hsl(${hueDeg} ${sat}% ${lightBottom}%)`;
  const emoji = EMOJIS[(h >> 8) % EMOJIS.length];
  return { hueDeg, background, ring, emoji };
}
