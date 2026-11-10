import * as THREE from "./vendor/three.module.min.js";
import { PLANETS, MOON } from "./planets.js";

const EARTH = PLANETS.find(p => p.name === "Earth");
const R_EARTH_KM = EARTH.diameterKm / 2;          // scene unit = one Earth radius
const SATURN_RING = [1.11, 2.33];                  // ring inner/outer edge, in Saturn radii

// ---------- renderer, camera, lights ----------
const canvas = document.getElementById("planet");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
const FOV = 35, TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 5000);
scene.add(camera);
scene.add(new THREE.AmbientLight(0xffffff, 0.22));
const sun = new THREE.DirectionalLight(0xffffff, 2.8);
sun.position.set(-4, 1.5, 3);
scene.add(sun);

let stars;
// stars ride with the camera so they stay put however far we zoom
{
  const g = new THREE.BufferGeometry(), N = 700, pos = new Float32Array(N * 3);
  let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < N; i++) pos.set([(rnd() - 0.5) * 3000, (rnd() - 0.5) * 3000, -1500], i * 3);
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false }));
  camera.add(stars);
}

// ---------- bodies (true relative sizes) ----------
const loader = new THREE.TextureLoader();
const texCache = new Map();
function tex(url) {
  if (!texCache.has(url)) {
    const t = loader.load(url);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texCache.set(url, t);
  }
  return texCache.get(url);
}
const sphereGeo = new THREE.SphereGeometry(1, 96, 64);
const spinRateOf = hours => 0.9 * Math.pow(10 / Math.abs(hours), 0.3);   // compressed: 10 h .. 243 d all visibly turn

function makeBody(p) {
  const tilt = new THREE.Group(), spin = new THREE.Group();
  tilt.add(spin);
  const r = p.diameterKm / 2 / R_EARTH_KM;
  const globe = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial({ map: tex(p.texture), roughness: 1, metalness: 0 }));
  globe.scale.setScalar(r);
  spin.add(globe);
  const axis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.4 * r, 0), new THREE.Vector3(0, 1.4 * r, 0)]),
    new THREE.LineBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.55 }));
  tilt.add(axis);
  let extent = r;
  if (p.rings) {
    const [a, b] = SATURN_RING.map(k => k * r);
    const geo = new THREE.RingGeometry(a, b, 160, 1);
    const pos = geo.attributes.position, uv = geo.attributes.uv, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); uv.setXY(i, (v.length() - a) / (b - a), 0.5); }
    const ring = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex("textures/2k_saturn_ring_alpha.png"), transparent: true, side: THREE.DoubleSide, roughness: 1, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    tilt.add(ring);
    extent = b;
  }
  // Tilt shown towards the viewer's right so it is visible; >90 deg reads as spinning backwards.
  tilt.rotation.set(0.25, 0, -THREE.MathUtils.degToRad(p.tiltDeg));
  const root = new THREE.Group(); root.add(tilt);
  return { root, spin, r, extent, rate: spinRateOf(p.rotationHours) };
}
function disposeBody(b) {
  if (!b) return;
  scene.remove(b.root);
  b.root.traverse(o => { if (o.geometry && o.geometry !== sphereGeo) o.geometry.dispose(); if (o.material) o.material.dispose(); });
}

// ---------- view: camera stays at the fitted distance D (outside every body); zoom narrows the field of view ----------
const view = { tx: 0, ty: 0, D: 10, z: 1, zMin: 0.25, zMax: 20 };
let main = null, buddy = null, showBuddy = true;
const $ = id => document.getElementById(id);
const labels = { main: $("lblMain"), buddy: $("lblBuddy") };

const aspect = () => canvas.clientWidth / Math.max(1, canvas.clientHeight);
const halfH = () => view.D * TAN / view.z;           // half-height of the view in the z = 0 plane
function fit() {
  const a = aspect();
  let left = -main.extent, right = main.extent, half = main.extent;
  if (showBuddy) { right = buddy.root.position.x + buddy.r; half = Math.max(half, buddy.r); }
  const hw = (right - left) / 2 * 1.15, hh = half * 1.45;
  view.tx = (left + right) / 2; view.ty = -half * 0.08;
  view.D = Math.max(hh / TAN, hw / (TAN * a));
  view.z = 1;
  const rMin = showBuddy ? Math.min(main.r, buddy.r) : main.r;
  view.zMax = Math.max(1, view.D * TAN / (rMin * 1.3));
}
function zoomAt(nx, ny, k) {
  const h0 = halfH();
  view.z = THREE.MathUtils.clamp(view.z / k, view.zMin, view.zMax);
  const h1 = halfH(), a = aspect();
  view.tx += nx * (h0 - h1) * a;   // keep the point under the pointer fixed
  view.ty += ny * (h0 - h1);
}
function panBy(dxPx, dyPx) {
  const perPx = 2 * halfH() / canvas.clientHeight;
  view.tx -= dxPx * perPx; view.ty += dyPx * perPx;
}

function showPlanet(p) {
  disposeBody(main); disposeBody(buddy);
  main = makeBody(p);
  scene.add(main.root);
  const other = p.name === "Earth" ? MOON : EARTH;
  buddy = makeBody(other);
  buddy.root.position.x = main.extent + Math.max(main.r, buddy.r) * 0.35 + buddy.r;
  buddy.root.visible = showBuddy;
  scene.add(buddy.root);
  labels.main.textContent = p.name;
  labels.buddy.textContent = other.name;
  $("buddyBtn").textContent = `⊕ ${other.name} to scale`;
  const ratio = p.diameterKm / other.diameterKm;
  $("scaleCap").textContent =
    p.name === "Earth" ? `The Moon is ${fmt(1 / ratio, 2)} × Earth's width — about 50 Moons would fit inside Earth.`
    : ratio >= 1 ? `${p.name} is ${fmt(ratio, 1)} × Earth's width — ${fmt(ratio ** 3)} Earths would fit inside.`
    : `${p.name} is ${fmt(ratio, 2)} × Earth's width — ${fmt(1 / ratio ** 3)} ${p.name}s would fit inside Earth.`;
  $("scaleCap").hidden = !showBuddy;
  fit();
}

$("buddyBtn").addEventListener("click", () => {
  showBuddy = !showBuddy;
  buddy.root.visible = showBuddy;
  $("buddyBtn").setAttribute("aria-pressed", String(showBuddy));
  $("scaleCap").hidden = !showBuddy;
  fit();
});
$("resetBtn").addEventListener("click", () => fit());

function resize() {
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  camera.aspect = aspect();
  camera.updateProjectionMatrix();
  if (main) fit();
}
new ResizeObserver(resize).observe(canvas);

// ---------- input: 1 finger spins, 2 fingers pinch-zoom + pan, wheel zooms, double-tap resets ----------
const pts = new Map();
let dragVel = 0, pinch = null, lastTap = 0;
const ndc = (x, y) => { const r = canvas.getBoundingClientRect(); return [((x - r.left) / r.width) * 2 - 1, 1 - ((y - r.top) / r.height) * 2]; };

canvas.addEventListener("pointerdown", e => {
  canvas.setPointerCapture(e.pointerId);
  pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  dragVel = 0;
  if (pts.size === 2) {
    const [a, b] = [...pts.values()];
    pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
  } else if (pts.size === 1) {
    const now = performance.now();
    if (now - lastTap < 300) fit();
    lastTap = now;
  }
});
canvas.addEventListener("pointermove", e => {
  const p = pts.get(e.pointerId);
  if (!p) return;
  if (pts.size === 1) {
    const dx = (e.clientX - p.x) / canvas.clientWidth * Math.PI * 1.5;
    main.spin.rotation.y += dx; dragVel = dx * 60;
  }
  p.x = e.clientX; p.y = e.clientY;
  if (pts.size === 2 && pinch) {
    const [a, b] = [...pts.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    panBy(cx - pinch.cx, cy - pinch.cy);
    const [nx, ny] = ndc(cx, cy);
    zoomAt(nx, ny, pinch.dist / Math.max(1, dist));
    pinch = { dist, cx, cy };
  }
});
const lift = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; };
canvas.addEventListener("pointerup", lift);
canvas.addEventListener("pointercancel", lift);
canvas.addEventListener("wheel", e => {
  e.preventDefault();
  const [nx, ny] = ndc(e.clientX, e.clientY);
  zoomAt(nx, ny, Math.exp(e.deltaY * 0.0015));
}, { passive: false });

// ---------- animation ----------
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function placeLabel(el, body) {
  if (!body.root.visible) { el.hidden = true; return; }
  const x = 0.5 + (body.root.position.x - view.tx) / (halfH() * aspect()) * 0.5;
  const y = 0.5 - (-body.extent * 1.08 - view.ty) / halfH() * 0.5;
  el.hidden = x < -0.05 || x > 1.05 || y > 1.02;
  el.style.left = (x * 100) + "%";
  el.style.top = Math.min(y * 100, 91) + "%";
}
let last = performance.now();
renderer.setAnimationLoop(now => {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (main) {
    if (pts.size === 0) {
      main.spin.rotation.y += (reduceMotion ? 0 : main.rate * dt) + dragVel * dt;
      dragVel *= Math.pow(0.04, dt);
    }
    if (!reduceMotion) buddy.spin.rotation.y += buddy.rate * dt;
    camera.position.set(view.tx, view.ty, view.D);
    camera.lookAt(view.tx, view.ty, 0);
    if (camera.zoom !== view.z) { camera.zoom = view.z; camera.updateProjectionMatrix(); stars.scale.set(1 / view.z, 1 / view.z, 1); }
    placeLabel(labels.main, main);
    placeLabel(labels.buddy, buddy);
  }
  renderer.render(scene, camera);
});

// ---------- quiz ----------
function fmt(n, d = 0) { return n.toLocaleString("en-AU", { maximumFractionDigits: d }); }
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
