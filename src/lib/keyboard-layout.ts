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
