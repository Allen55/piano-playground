// Pure keyboard geometry shared by the server-rendered diagram (and anything else that draws keys).
const BLACK_PITCHES = new Set([1, 3, 6, 8, 10]);

export function isBlackKey(midi: number): boolean { return BLACK_PITCHES.has(((midi % 12) + 12) % 12); }

export type KeyRect = { midi: number; black: boolean; x: number; width: number; height: number };
export type KeyboardLayout = { keys: KeyRect[]; width: number; height: number; whiteCount: number };

/** Lay out keys from `start` to `end` (inclusive MIDI numbers). White keys tile left to right; black keys straddle the seam. */
export function keyboardLayout(start = 60, end = 83, whiteWidth = 24, whiteHeight = 110): KeyboardLayout {
  const blackWidth = whiteWidth * 0.6;
  const blackHeight = whiteHeight * 0.62;
  const keys: KeyRect[] = [];
  let whites = 0;
  for (let midi = start; midi <= end; midi++) {
    if (isBlackKey(midi)) keys.push({ midi, black: true, x: whites * whiteWidth - blackWidth / 2, width: blackWidth, height: blackHeight });
    else { keys.push({ midi, black: false, x: whites * whiteWidth, width: whiteWidth, height: whiteHeight }); whites++; }
  }
  return { keys, width: whites * whiteWidth, height: whiteHeight, whiteCount: whites };
}

/**
 * A tight keyboard window for small diagrams: starts on the white key at or just below the lowest note and spans
 * `whites` white keys (more if needed to reach the highest note). Every triad or seventh inversion fits in 8.
 */
export function fitWindow(midis: number[], whites = 8): { start: number; end: number } {
  const lowest = Math.min(...midis), highest = Math.max(...midis);
  const start = isBlackKey(lowest) ? lowest - 1 : lowest;
  let end = start, count = 1;
  while (count < whites || end < highest) { end++; if (!isBlackKey(end)) count++; }
  if (isBlackKey(end)) end++; // never stop on a black key: it would be drawn half outside the diagram
  return { start, end };
}
