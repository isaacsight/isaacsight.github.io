// Shared setup for the Codevember pieces.
// Studio Rules: two inks (pink + blue), warm paper never white, new colours only
// from overlap (multiply), depth from offset not effects, grain under the type.

export const INK = { paper: '#f3eee3', pink: '#ff48b0', blue: '#3d63b8' };
export const W = 1080; // 4:5, sized for the X feed
export const H = 1350;
export const DISPLAY = '800 {s}px Display, Impact, sans-serif';
export const TEXT = '400 {s}px Text, Arial, sans-serif';
export const font = (f, s) => f.replace('{s}', s);

// Seeded random so every frame export matches the live piece.
export function rng(seed = 7) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

export const ease = (x) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);

export function makePlate(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function makeGrain() {
  const r = rng(11);
  const g = makePlate(W / 2, H / 2);
  const x = g.getContext('2d');
  const img = x.createImageData(g.width, g.height);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 255 - Math.pow(r(), 4) * 60;
    img.data[i] = v;
    img.data[i + 1] = v - 2;
    img.data[i + 2] = v - 6;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  // a few paper fibres
  x.strokeStyle = 'rgba(120,100,70,.10)';
  x.lineWidth = 0.6;
  for (let i = 0; i < 140; i++) {
    const px = r() * g.width, py = r() * g.height, a = r() * Math.PI, l = 4 + r() * 14;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l);
    x.stroke();
  }
  return g;
}

export async function setup() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const fit = () => {
    const s = Math.min(innerWidth / W, innerHeight / H);
    c.style.width = W * s + 'px';
    c.style.height = H * s + 'px';
  };
  addEventListener('resize', fit);
  fit();
  for (const [name, file, weight] of [['Display', 'assets/display.ttf', '800'], ['Text', 'assets/text.ttf', '400']]) {
    try {
      const f = new FontFace(name, `url(${file})`, { weight });
      await f.load();
      document.fonts.add(f);
    } catch (e) {
      console.warn('font failed, using fallback', name, e);
    }
  }
  return { c, ctx, grain: makeGrain(), recording: false };
}

// Paper first, grain on its own layer under everything printed.
export function paper(k) {
  const { ctx, grain } = k;
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = INK.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.55;
  ctx.drawImage(grain, 0, 0, W, H);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

// Print a plate in multiply so overlaps make the third colour.
export function print(k, plate, dx = 0, dy = 0) {
  const { ctx } = k;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.94;
  ctx.drawImage(plate, dx, dy);
  ctx.restore();
}

// Credit line, set in blue at the foot of the sheet.
export function credit(k, left, num, color = INK.blue, mode = 'multiply') {
  const { ctx } = k;
  ctx.save();
  ctx.globalCompositeOperation = mode;
  ctx.fillStyle = color;
  ctx.font = font(TEXT, 26);
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(left, 64, H - 92);
  ctx.font = font(TEXT, 20);
  ctx.fillText('Isaac Hernandez · code written with AI under my direction', 64, H - 56);
  ctx.textAlign = 'right';
  ctx.font = font(TEXT, 26);
  ctx.fillText(num + ' / Codevember 2026', W - 64, H - 92);
  ctx.restore();
}

// Fit one fixed size to the longest line, then keep it.
export function fitSize(ctx, face, lines, width) {
  let lo = 20, hi = 900;
  while (hi - lo > 1) {
    const mid = (lo + hi) / 2;
    ctx.font = font(face, mid);
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (w > width) hi = mid; else lo = mid;
  }
  return Math.floor(lo);
}

// Run a fixed-length loop. window.renderAt(t) lets a frame exporter step time exactly.
// Press R to record one loop as a .webm.
export function run(k, LOOP, render, name) {
  let t0 = performance.now();
  k.restart = (at = 0) => { t0 = performance.now() - at * 1000; };
  const frame = (now) => {
    if (window.__frozen) return;
    render(((now - t0) / 1000) % LOOP);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  window.LOOP = LOOP;
  window.renderAt = (t) => { window.__frozen = true; render(t % LOOP); };
  window.ready = true;

  const record = () => {
    if (k.recording) return;
    k.recording = true;
    k.restart();
    const stream = k.c.captureStream(60);
    const type = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    const mr = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 16e6 });
    const chunks = [];
    mr.ondataavailable = (e) => chunks.push(e.data);
    mr.onstop = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
      a.download = name + '.webm';
      a.click();
      k.recording = false;
    };
    mr.start();
    setTimeout(() => mr.stop(), LOOP * 1000 + 100);
  };
  addEventListener('keydown', (e) => { if ((e.key === 'r' || e.key === 'R') && !window.__typing) record(); });
  window.record = record;
}
