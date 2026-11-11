// FIBS — one timing table. The picture (index.html) and the soundtrack (sound.mjs) both read this,
// so a landing and its sound can't drift apart. Times are seconds.
globalThis.TL = {
  fps: 30,
  dur: 14.3,
  bpm: 100, beat0: 0.32,         // everything below sits on this grid: a beat is 0.6 s, a step (16th) 0.15 s
  cut: 3.32,                      // shot A (the hook) -> shot B (the pack shot)

  // Shot A: the blue one lands alone, then a few land behind it, out of focus.
  heroA: { drop: 0.42, fall: 0.5 },
  backA: [
    { f: 'cherry', x: -2.4, z: -3.6, drop: 1.10 },
    { f: 'lemon',  x: -0.3, z: -5.6, drop: 1.70 },
    { f: 'lime',   x: -5.0, z: -6.5, drop: 2.00 },
    { f: 'orange', x:  1.9, z: -7.2, drop: 2.30 },
  ],
  headline: [                     // "Never met a raspberry." one word at a time
    { w: 'Never', at: 1.22 }, { w: 'met', at: 1.52 }, { w: 'a', at: 1.97 }, { w: 'raspberry.', at: 2.12 },
  ],

  // Shot B: eight land in a 3x3 grid, one slot left empty; the blue one takes it.
  // c, r = column, row. note = step in the scale the landing plays.
  fall: 0.42,
  grid: [
    { f: 'cherry', c: 0, r: 0, drop: 3.50, note: 0 },
    { f: 'lemon',  c: 2, r: 2, drop: 3.80, note: 1 },
    { f: 'lemon',  c: 1, r: 0, drop: 4.10, note: 2 },
    { f: 'lime',   c: 0, r: 2, drop: 4.40, note: 3 },
    { f: 'lime',   c: 2, r: 0, drop: 4.70, note: 4 },
    { f: 'cherry', c: 1, r: 2, drop: 5.00, note: 5 },
    { f: 'orange', c: 0, r: 1, drop: 5.30, note: 6 },
    { f: 'grape',  c: 2, r: 1, drop: 5.60, note: 7 },
  ],
  heroB: { drop: 6.47, fall: 0.45 },

  wordmark: 3.32,                 // FIBS pops
  line1: 7.52,                    // "100% artificial."
  swap: 9.32,                     // ... becomes "So is this ad."
  credit: 9.92,                   // "Every pixel is code"

  // The reveal. Each pair is [time, seam position]: 1 = all picture, 0 = all wireframe.
  wipe: [[8.72, 1], [9.32, 0.5], [11.12, 0.5], [11.72, 0], [12.32, 0], [12.92, 1]],
};
