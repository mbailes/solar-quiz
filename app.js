import * as THREE from "./vendor/three.module.min.js";
import { PLANETS } from "./planets.js";

// ---------- procedural planet textures (no image files, no licences) ----------
function hash(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const s = t => t * t * (3 - 2 * t);
  const u = s(xf), v = s(yf), w = s(zf);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
  return L(L(L(c(0,0,0), c(1,0,0), u), L(c(0,1,0), c(1,1,0), u), v),
           L(L(c(0,0,1), c(1,0,1), u), L(c(0,1,1), c(1,1,1), u), v), w);
}
function fbm(x, y, z, oct = 5) {
  let a = 0.5, f = 1, s = 0;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f, z * f); a *= 0.5; f *= 2.03; }
  return s / (1 - Math.pow(0.5, oct));
}
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const clamp01 = t => Math.max(0, Math.min(1, t));

function planetTexture(p) {
  const W = 1024, H = 512;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  const img = ctx.createImageData(W, H);
  const c0 = hex(p.colours[0]), c1 = hex(p.colours[1]);
  const seed = p.name.length * 17.3;
  const spot = p.spot ? hex(p.spot) : null;
  for (let j = 0; j < H; j++) {
    const lat = Math.PI / 2 - (j + 0.5) / H * Math.PI;
    const cl = Math.cos(lat), sl = Math.sin(lat);
    for (let i = 0; i < W; i++) {
      const lon = (i + 0.5) / W * 2 * Math.PI;
      const x = cl * Math.cos(lon), y = sl, z = cl * Math.sin(lon);
      let col;
      if (p.kind === "rocky") {
        const n = fbm(x * 3 + seed, y * 3, z * 3);
        col = mix(c0, c1, clamp01((n - 0.3) * 2));
        if (p.polarCaps && Math.abs(lat) > 1.3 + 0.08 * (fbm(x * 6, y * 6, z * 6) - 0.5)) col = [235, 232, 228];
      } else if (p.kind === "cloudy") {
        const n = fbm(x * 2 + seed, y * 5, z * 2);
        col = mix(c0, c1, clamp01(n * 1.4 - 0.2));
      } else if (p.kind === "earth") {
        const n = fbm(x * 2.2 + seed, y * 2.2, z * 2.2);
        if (n > 0.53) col = mix([62, 120, 50], [150, 125, 80], clamp01((n - 0.53) * 5));
        else col = mix([15, 50, 110], [35, 95, 165], clamp01(n * 1.8));
        if (Math.abs(lat) > 1.22) col = [238, 242, 248];
        const cloud = fbm(x * 4 + 9, y * 6, z * 4);
        col = mix(col, [255, 255, 255], clamp01((cloud - 0.55) * 3) * 0.8);
      } else if (p.kind === "gas") {
        const turb = fbm(x * 4 + seed, y * 4, z * 4);
        const b = 0.5 + 0.5 * Math.sin(lat * 18 + turb * 3.2);
        col = mix(c0, c1, b);
      } else { // ice giant
        const turb = fbm(x * 3 + seed, y * 3, z * 3);
        const b = 0.5 + 0.5 * Math.sin(lat * 9 + turb * 1.5);
        col = mix(c0, c1, b * (p.name === "Uranus" ? 0.8 : 0.45));
      }
      if (spot) { // oval storm at latitude -22 deg
        const dl = (lat + 0.38) / 0.09, dn = (Math.atan2(Math.sin(lon - 2), Math.cos(lon - 2))) / 0.2;
        const r = dl * dl + dn * dn;
        if (r < 1) col = mix(col, spot, 0.85 * (1 - r * r));
      }
      const k = (j * W + i) * 4;
      img.data[k] = col[0]; img.data[k + 1] = col[1]; img.data[k + 2] = col[2]; img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  if (p.craters) { // shaded craters, drawn in equirectangular so they stay round near the equator
    let s = 7;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let n = 0; n < 160; n++) {
      const cx = rnd() * W, cy = H * (0.15 + 0.7 * rnd()), r = 2 + 18 * Math.pow(rnd(), 3);
      ctx.fillStyle = "rgba(40,36,32,0.35)"; ctx.beginPath(); ctx.ellipse(cx, cy, r, r, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(230,225,215,0.35)"; ctx.lineWidth = Math.max(1, r / 6);
      ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 0.9, Math.PI * 1.9); ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function ringTexture() {
  const W = 512, cv = document.createElement("canvas"); cv.width = W; cv.height = 1;
  const ctx = cv.getContext("2d"), img = ctx.createImageData(W, 1);
  for (let i = 0; i < W; i++) {
    const r = i / W;
    let a = 0.55 + 0.35 * Math.sin(r * 90) * Math.sin(r * 23);
    if (r > 0.56 && r < 0.62) a = 0.05;                // Cassini division
    if (r < 0.08) a *= r / 0.08;
    const k = i * 4;
    img.data[k] = 225; img.data[k + 1] = 205; img.data[k + 2] = 165; img.data[k + 3] = clamp01(a) * 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- three.js scene ----------
const canvas = document.getElementById("planet");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 0, 4.2);
scene.add(new THREE.AmbientLight(0xffffff, 0.25));
const sun = new THREE.DirectionalLight(0xffffff, 2.6);
sun.position.set(-4, 1.5, 3);
scene.add(sun);

// stars
{
  const g = new THREE.BufferGeometry(), N = 600, pos = new Float32Array(N * 3);
  let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < N; i++) {
    const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, r = 30;
    pos.set([r * Math.sqrt(1 - u * u) * Math.cos(th), r * u, r * Math.sqrt(1 - u * u) * Math.sin(th) - 10], i * 3);
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, sizeAttenuation: true })));
}

const tilt = new THREE.Group();     // axial tilt (fixed)
const spin = new THREE.Group();     // daily rotation
tilt.add(spin); scene.add(tilt);
// faint spin axis through the poles, so the tilt (and Uranus lying on its side) is obvious
const axis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.45, 0), new THREE.Vector3(0, 1.45, 0)]),
  new THREE.LineBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.55 }));
tilt.add(axis);
const sphereGeo = new THREE.SphereGeometry(1, 96, 64);
let globe = null, rings = null, spinRate = 0.3;
const texCache = new Map();

function showPlanet(p) {
  if (!texCache.has(p.name)) texCache.set(p.name, planetTexture(p));
  if (globe) { spin.remove(globe); globe.material.dispose(); }
  if (rings) { tilt.remove(rings); rings.geometry.dispose(); rings.material.dispose(); rings = null; }
  globe = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial({ map: texCache.get(p.name), roughness: 1, metalness: 0 }));
  spin.add(globe);
  const scale = p.rings ? 0.62 : 1;
  globe.scale.setScalar(scale);
  axis.scale.setScalar(scale);
  if (p.rings) {
    const geo = new THREE.RingGeometry(scale * 1.25, scale * 2.3, 128, 1);
    const pos = geo.attributes.position, uv = geo.attributes.uv, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {             // map u to radius so the 1-D texture runs outward
      v.fromBufferAttribute(pos, i);
      uv.setXY(i, (v.length() - scale * 1.25) / (scale * 1.05), 0.5);
    }
    rings = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: ringTexture(), transparent: true, side: THREE.DoubleSide, roughness: 1, depthWrite: false }));
    rings.rotation.x = -Math.PI / 2;
    tilt.add(rings);
  }
  // Tilt shown towards the viewer's right so it is visible; >90 deg reads as spinning backwards.
  tilt.rotation.set(0.25, 0, -THREE.MathUtils.degToRad(p.tiltDeg));
  // Real rotation periods span 10 h to 243 days; compress them so every planet visibly turns.
  spinRate = 0.9 * Math.pow(10 / Math.abs(p.rotationHours), 0.3);
}

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.position.z = Math.max(4.8, 4.8 / (w / h));
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);

// drag to spin (touch + mouse), with a little momentum
let dragging = false, lastX = 0, dragVel = 0;
canvas.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; dragVel = 0; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener("pointermove", e => {
  if (!dragging) return;
  const dx = (e.clientX - lastX) / canvas.clientWidth * Math.PI * 1.5;
  spin.rotation.y += dx; dragVel = dx * 60; lastX = e.clientX;
});
const endDrag = () => { dragging = false; };
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let last = performance.now();
renderer.setAnimationLoop(now => {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!dragging) {
    spin.rotation.y += (reduceMotion ? 0 : spinRate * dt) + dragVel * dt;
    dragVel *= Math.pow(0.04, dt);
  }
  renderer.render(scene, camera);
});

// ---------- quiz ----------
const $ = id => document.getElementById(id);
const fmt = (n, d = 0) => n.toLocaleString("en-AU", { maximumFractionDigits: d });
function rotationText(h) {
  const a = Math.abs(h), back = h < 0 ? " (backwards)" : "";
  return (a > 48 ? `${fmt(a / 24, 1)} Earth days` : `${fmt(a, 1)} hours`) + back;
}
function yearText(d) { return d > 1000 ? `${fmt(d / 365.25, 1)} Earth years` : `${fmt(d, 1)} Earth days`; }

let idx = Math.max(0, Math.min(PLANETS.length - 1, parseInt(location.hash.slice(1), 10) - 1 || 0)), score = 0;  // #N opens planet N
$("qtotal").textContent = PLANETS.length;

function render() {
  const p = PLANETS[idx];
  showPlanet(p);
  $("pname").textContent = p.name;
  $("qnum").textContent = idx + 1;
  $("score").textContent = score;
  const rows = [
    ["Diameter", `${fmt(p.diameterKm)} km`],
    ["Mass", `${fmt(p.massEarth, 3)} × Earth`],
    ["Distance from Sun", `${fmt(p.distanceAU, 2)} AU`],
    ["Day (one spin)", rotationText(p.rotationHours)],
    ["Year (one orbit)", yearText(p.yearDays)],
    ["Axial tilt", `${fmt(p.tiltDeg, 1)}°`],
    ["Moons", fmt(p.moons)],
    ["Mean temperature", `${fmt(p.meanTempC)} °C`],
    ["Surface gravity", `${fmt(p.gravity, 1)} m/s²`],
  ];
  const dl = $("stats"); dl.replaceChildren();
  for (const [k, v] of rows) {
    const dt = document.createElement("dt"); dt.textContent = k;
    const dd = document.createElement("dd"); dd.textContent = v;
    dl.append(dt, dd);
  }
  $("fact").textContent = p.fact;
  $("question").textContent = p.question.q;
  const box = $("options"); box.replaceChildren();
  p.question.options.forEach((txt, i) => {
    const b = document.createElement("button"); b.textContent = txt;
    b.addEventListener("click", () => choose(i));
    box.append(b);
  });
  $("why").hidden = true; $("next").hidden = true;
  $("card").hidden = false; $("done").hidden = true;
}

function choose(i) {
  const q = PLANETS[idx].question;
  const btns = [...$("options").children];
  btns.forEach((b, k) => { b.disabled = true; if (k === q.answer) b.classList.add("correct"); });
  const ok = i === q.answer;
  if (ok) score++; else btns[i].classList.add("wrong");
  $("score").textContent = score;
  const why = $("why"); why.replaceChildren();
  const s = document.createElement("strong"); s.className = ok ? "good" : "bad"; s.textContent = ok ? "Correct! " : "Not quite. ";
  why.append(s, document.createTextNode(q.why)); why.hidden = false;
  const nx = $("next"); nx.hidden = false;
  nx.textContent = idx + 1 < PLANETS.length ? `Next: ${PLANETS[idx + 1].name} →` : "See your score";
  nx.focus({ preventScroll: true });
  why.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
}

$("next").addEventListener("click", () => {
  idx++;
  if (idx < PLANETS.length) { render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  else {
    $("card").hidden = true; $("done").hidden = false;
    const msg = score === PLANETS.length ? "Perfect — you know your Solar System!" : score >= 5 ? "Great work!" : "Have another go — you'll get there!";
    $("final").textContent = `You scored ${score} out of ${PLANETS.length}. ${msg}`;
  }
});
$("restart").addEventListener("click", () => { idx = 0; score = 0; render(); });

render();
