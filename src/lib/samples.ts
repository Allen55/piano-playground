// Sampled piano: Salamander Grand Piano V3 by Alexander Holm, licensed CC BY 3.0 (attribution required, see the About page).
// Samples are loaded at runtime from SAMPLE_BASE_URL. Set NEXT_PUBLIC_PIANO_SAMPLES_URL to a self-hosted copy before launch.
export const SAMPLE_BASE_URL = process.env.NEXT_PUBLIC_PIANO_SAMPLES_URL ?? "https://tonejs.github.io/audio/salamander/";

/** One sample every minor third (C, D#, F#, A) from A0 to C8; Tone.Sampler repitches the notes in between. */
export const SALAMANDER_URLS: Record<string, string> = (() => {
  const urls: Record<string, string> = { A0: "A0.mp3" };
  for (let octave = 1; octave <= 7; octave++) {
    for (const note of ["C", "D#", "F#", "A"]) urls[`${note}${octave}`] = `${note.replace("#", "s")}${octave}.mp3`;
  }
  urls.C8 = "C8.mp3";
  return urls;
})();
