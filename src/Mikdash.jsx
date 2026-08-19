import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";

/*
  ═══════════════════════════════════════════════════════════════════════════
   בֵּית הַמִּקְדָּשׁ — MIKDASH: an explorable Temple
   v3.1 — "The Sound of the Courts"

   · Yechezkel 40–48 floor plan at 1 unit = 1 amah, in Herodian white stone
   · GLSL sky (day ⇄ night timelapse), GLSL noise-displaced altar fire
   · First-person walk mode with collision + ground-height terrain
   · Kohanim walking the inner court, Levites swaying on the fifteen steps
   · Sixteen hidden wonders (8 silver rimonim + 8 living wonders) that
     unlock IN SEQUENCE as a quest — with free-explore toggle
   · A synthesized ambient bed — wind over the mountain, the fire of the
     ma'aracha, the Levites' ascent — mixed by where the eye stands
   · Progress persists across sessions via window.storage

   See README.md in this repository for the full design document.
  ═══════════════════════════════════════════════════════════════════════════
*/

const C = 500, HALF = C / 2;
const STORE_KEY = "mikdash-progress-v3";

const DISCOVERIES = [
  { kind: "rimon", title: "שער הקדים — The Sealed Eastern Gate", text: "“This gate shall remain shut; it shall not be opened… because Hashem, the God of Israel, has entered through it” (Yechezkel 44:2). Tradition binds this to Sha'ar HaRachamim — the Gate of Mercy sealed in Jerusalem's eastern wall, waiting.", hint: "Where mercy waits behind stone, inside the eastern gatehouse." },
  { kind: "rimon", title: "מים חיים — The Living Waters", text: "Yechezkel 47: a trickle from beneath the threshold becomes ankle-deep, knee-deep, then a river no one can cross — sweetening even the Dead Sea. Chazal read it as Torah itself: water that heals wherever it flows, fruit for food and leaves for healing (47:12).", hint: "Follow what begins as a trickle, east across the court." },
  { kind: "rimon", title: "הראל — The Altar Called ‘Mountain of God’", text: "Yechezkel 43:15 names the hearth 'Har'el' — Mountain of God. Uniquely, this altar is climbed by steps facing east (43:17), and must be inaugurated for seven days before the first regular offering rises.", hint: "At the foot of the mountain that burns." },
  { kind: "rimon", title: "קנה המדה — The Measuring Reed", text: "The vision arrives as a blueprint: a man 'whose appearance was like bronze' measures every wall with a reed of six long cubits (40:5). The Vilna Gaon wrote treatises reconstructing the plan — and the Midrash promises: one who studies the Temple's design, it is as if he built it.", hint: "Among the northern columns, something measures you back." },
  { kind: "rimon", title: "שכינה במערב — No Western Gate", text: "Gates open east, north, and south — never west. 'The Shechinah is in the west' (Bava Batra 25a): the wall behind the Holy of Holies stays unbroken. Nothing passes behind the Presence.", hint: "Along the one wall where no gate dares open." },
  { kind: "rimon", title: "אש מן השמים — Built by Fire or by Hands?", text: "Rambam (Hilchot Melachim 11) rules that Mashiach builds the final Temple. Rashi and Midrash Tanchuma teach it descends whole, built of fire, from Heaven. The chassidic masters reconcile them: we build from below, and Heaven completes what our hands begin.", hint: "The highest gold guards the smallest silver." },
  { kind: "rimon", title: "בית תפילה לכל העמים — A House for All Nations", text: "These courts span 500×500 amot — far beyond even Herod's platform, itself the largest sacred precinct of the ancient world. Yeshayahu 56:7: 'My House shall be called a house of prayer for all nations.' The enlarged floor plan is that promise drawn in stone.", hint: "A kitchen court in the far southwest keeps a secret." },
  { kind: "rimon", title: "גלי הים — Marble Like the Waves of the Sea", text: "Bava Batra 4a: Herod built the Temple of stones of blue-green and white marble. He wished to plate it all in gold — the Sages told him: leave it, it is more beautiful as it is, for it looks like the waves of the sea. And Sukkah 51b: 'One who has not seen it has never seen a magnificent building.'", hint: "Within the royal porch of a hundred columns." },
  { kind: "wonder", title: "השועל של רבי עקיבא — Rabbi Akiva's Fox", text: "Makkot 24b: the sages saw a fox slip out of the ruined Holy of Holies and wept — but Rabbi Akiva laughed. 'Just as Uriah's prophecy of ruin came true, so will Zechariah's: elders will yet sit in the streets of Jerusalem.' They answered: 'Akiva, you have comforted us.' Here the fox walks outside the walls — the ruin behind him, the promise standing before him.", hint: "Something small and russet waits below the southern stairs." },
  { kind: "wonder", title: "כינור של לויים — The Harp of the Levites", text: "On the fifteen steps between the courts the Levites stood with harps, lyres and cymbals — one step for each Shir HaMa'alot. David's kinor, say Chazal, hung above his bed and played by itself when the north wind moved through it at midnight (Berachot 3b). Touch it and it remembers its song.", hint: "An instrument rests where the singers stand — it still remembers." },
  { kind: "wonder", title: "שופר גדול — The Great Shofar", text: "“And it shall be on that day: a great shofar will be sounded, and the lost shall come from Assyria and the outcasts from Egypt, and they will bow to Hashem on the holy mountain in Jerusalem” (Yeshayahu 27:13). This is the shofar of ingathering — the sound before the silence of the Kodesh.", hint: "A ram's horn waits on marble near the southern gate. Dare to sound it." },
  { kind: "wonder", title: "אבן השתייה — The Foundation Stone", text: "Yoma 54b: 'The world was woven outward from the Even HaShetiya' — the stone beneath the Holy of Holies, from which creation was drawn like thread from a spindle. On Yom Kippur the Kohen Gadol placed the incense upon it. Its glow seeps from beneath the western ground: the world's first light, still warm.", hint: "The world began behind the House. Seek warmth in the western ground." },
  { kind: "wonder", title: "מנורת זהב — Light the Menorah", text: "Shabbat 22b asks: does He need our light? The Ner Ma'aravi that burned beyond its oil was 'testimony to all who enter the world that the Shechinah dwells in Israel.' You have kindled seven flames. The Sfat Emes teaches: every soul is a wick — the fire descends when the vessel is prepared.", hint: "Seven branches of gold stand cold. They wait for you." },
  { kind: "wonder", title: "קטורת — The Eleven Spices", text: "Keritot 6a counts eleven spices in the ketoret — including chelbenah, foul-smelling alone, deliberately included: a fast that excludes the sinners of Israel is no fast at all. And the house of Avtinas guarded one secret: ma'aleh ashan, the herb that made the smoke rise in a single straight column, unbent by any wind.", hint: "A small golden table before the House holds eleven fragrances. Wake them." },
  { kind: "wonder", title: "שערי ניקנור — The Doors That Crossed the Sea", text: "Yoma 38a: Nicanor brought two bronze doors from Alexandria. A storm rose; the sailors threw one into the sea — and it surfaced beneath the ship at Akko (some say the sea simply refused to keep it). All the Temple's gates were later plated gold, except Nicanor's: the miracle-bronze gleamed like gold on its own. You have just opened them.", hint: "Bronze that crossed the sea guards the top of the fifteen steps." },
  { kind: "wonder", title: "לבית התקיעה — The Trumpeting Stone", text: "In 1968, archaeologists at the Temple Mount's southwest corner found a fallen parapet stone carved: 'לבית התקיעה להב…' — 'To the place of trumpeting, to procl[aim]…' From that height a kohen sounded the trumpet each Friday at dusk: fields emptied, shops shuttered, and Shabbat descended on Jerusalem. The stone is real — it waits in the Israel Museum, and here, restored to its corner.", hint: "At the southwest height, a stone announces Shabbat." },
];

const RIMON_POS = [
  [HALF - 18, 4.2, 0],
  [150, 2.8, 26],
  [-4, 12.6, 30],
  [-40, 15.4, -HALF + 34],
  [-HALF + 14, 2.6, -70],
  [-165, 82, 10],
  [-HALF + 30, 2.6, HALF - 30],
  [40, 26, HALF - 58],
];

// ────────────────────────── procedural textures ──────────────────────────
function makeCanvas(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const rnd = (a, b) => a + Math.random() * (b - a);

function ashlar({ base = [236, 230, 216], courses = 5, cols = 4, margin = true } = {}) {
  return makeCanvas(512, 512, (ctx, w, h) => {
    const ch = h / courses;
    for (let r = 0; r < courses; r++) {
      const off = (r % 2) * ((w / cols) / 2);
      for (let col = -1; col < cols + 1; col++) {
        const j = rnd(-7, 7);
        ctx.fillStyle = `rgb(${base[0] + j | 0},${base[1] + j | 0},${base[2] + j * 0.85 | 0})`;
        ctx.fillRect(col * (w / cols) + off + 2, r * ch + 2, w / cols - 4, ch - 4);
        if (margin) {
          ctx.strokeStyle = "rgba(140,128,100,0.5)";
          ctx.lineWidth = 5;
          ctx.strokeRect(col * (w / cols) + off + 8, r * ch + 8, w / cols - 16, ch - 16);
          ctx.fillStyle = "rgba(255,255,250,0.09)";
          ctx.fillRect(col * (w / cols) + off + 10, r * ch + 10, w / cols - 20, (ch - 20) / 2.4);
        }
      }
    }
    for (let i = 0; i < 2200; i++) {
      ctx.fillStyle = `rgba(${rnd(120, 170) | 0},${rnd(112, 158) | 0},${rnd(88, 128) | 0},${rnd(0.03, 0.09)})`;
      ctx.fillRect(rnd(0, w), rnd(0, h), rnd(1, 3), rnd(1, 3));
    }
    ctx.fillStyle = "rgba(105,95,70,0.55)";
    for (let r = 0; r <= courses; r++) ctx.fillRect(0, r * ch - 1.5, w, 3);
  });
}

function seaWaveMarble() {
  return makeCanvas(512, 512, (ctx, w, h) => {
    const bands = 9;
    for (let b = 0; b < bands; b++) {
      const isSea = b % 2 === 1;
      ctx.fillStyle = isSea ? "#cfe2da" : "#f6f2e7";
      ctx.beginPath();
      ctx.moveTo(0, (b / bands) * h);
      for (let x = 0; x <= w; x += 8)
        ctx.lineTo(x, (b / bands) * h + Math.sin(x * 0.028 + b * 2) * 7);
      ctx.lineTo(w, ((b + 1) / bands) * h + 10);
      ctx.lineTo(0, ((b + 1) / bands) * h + 10);
      ctx.closePath();
      ctx.fill();
      if (isSea) {
        ctx.strokeStyle = "rgba(120,160,150,0.35)";
        ctx.lineWidth = 1.4;
        for (let v = 0; v < 3; v++) {
          ctx.beginPath();
          for (let x = 0; x <= w; x += 6)
            ctx.lineTo(x, (b / bands) * h + 10 + v * 12 + Math.sin(x * 0.04 + v) * 4);
          ctx.stroke();
        }
      }
    }
    for (let v = 0; v < 16; v++) {
      ctx.strokeStyle = `rgba(170,165,140,${rnd(0.08, 0.2)})`;
      ctx.lineWidth = rnd(0.6, 1.6);
      ctx.beginPath();
      let x = rnd(0, w), y = 0;
      ctx.moveTo(x, y);
      while (y < h) { y += rnd(16, 46); x += rnd(-30, 30); ctx.lineTo(x, y); }
      ctx.stroke();
    }
  });
}

function marbleTex() {
  return makeCanvas(512, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#faf7ee"); g.addColorStop(0.5, "#f1ecdd"); g.addColorStop(1, "#f7f3e6");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let v = 0; v < 24; v++) {
      ctx.strokeStyle = `rgba(${rnd(160, 190) | 0},${rnd(150, 178) | 0},${rnd(125, 150) | 0},${rnd(0.1, 0.26)})`;
      ctx.lineWidth = rnd(0.6, 2);
      ctx.beginPath();
      let x = rnd(0, w), y = 0;
      ctx.moveTo(x, y);
      while (y < h) { y += rnd(14, 44); x += rnd(-32, 32); ctx.lineTo(x, y); }
      ctx.stroke();
    }
  });
}

function goldTex() {
  return makeCanvas(256, 256, (ctx, w, h) => {
    for (let x = 0; x < w; x++) {
      const v = 200 + Math.sin(x * 0.33) * 18 + rnd(-9, 9);
      ctx.fillStyle = `rgb(${v | 0},${v * 0.75 | 0},${v * 0.28 | 0})`;
      ctx.fillRect(x, 0, 1, h);
    }
    for (let i = 0; i < 340; i++) {
      ctx.fillStyle = `rgba(255,244,200,${rnd(0.06, 0.22)})`;
      ctx.fillRect(rnd(0, w), rnd(0, h), rnd(1, 5), 1);
    }
  });
}

function cedarTex() {
  return makeCanvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#6d4527"; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) {
      ctx.fillStyle = `rgba(${rnd(70, 130) | 0},${rnd(45, 80) | 0},${rnd(22, 45) | 0},${rnd(0.2, 0.5)})`;
      ctx.fillRect(0, y + Math.sin(y * 0.3) * 1.5, w, rnd(1, 2.4));
    }
    for (let k = 0; k < 8; k++) {
      ctx.strokeStyle = "rgba(48,28,14,0.5)";
      ctx.beginPath(); ctx.arc(rnd(0, w), rnd(0, h), rnd(3, 8), 0, 7); ctx.stroke();
    }
  });
}

function groundTexture() {
  return makeCanvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#c8b184"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = `rgba(${rnd(130, 212) | 0},${rnd(112, 186) | 0},${rnd(70, 136) | 0},${rnd(0.05, 0.2)})`;
      const s = rnd(1, 4);
      ctx.fillRect(rnd(0, w), rnd(0, h), s, s);
    }
    for (let i = 0; i < 130; i++) {
      ctx.fillStyle = `rgba(${rnd(88, 118) | 0},${rnd(104, 134) | 0},${rnd(48, 70) | 0},0.5)`;
      ctx.beginPath(); ctx.arc(rnd(0, w), rnd(0, h), rnd(2, 5), 0, 7); ctx.fill();
    }
  });
}

function pavingTex() {
  return makeCanvas(512, 512, (ctx, w, h) => {
    const n = 8, s = w / n;
    for (let r = 0; r < n; r++) for (let c2 = 0; c2 < n; c2++) {
      const j = rnd(-6, 6);
      ctx.fillStyle = `rgb(${234 + j | 0},${228 + j | 0},${210 + j | 0})`;
      ctx.fillRect(c2 * s + 1.5, r * s + 1.5, s - 3, s - 3);
    }
    ctx.fillStyle = "rgba(140,128,100,0.5)";
    for (let i = 0; i <= n; i++) { ctx.fillRect(0, i * s - 1, w, 2); ctx.fillRect(i * s - 1, 0, 2, h); }
    for (let i = 0; i < 1600; i++) {
      ctx.fillStyle = `rgba(170,158,120,${rnd(0.04, 0.09)})`;
      ctx.fillRect(rnd(0, w), rnd(0, h), 2, 2);
    }
  });
}

function cloudTex() {
  return makeCanvas(256, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 22; i++) {
      const g = ctx.createRadialGradient(rnd(30, w - 30), rnd(30, h - 30), 2, rnd(30, w - 30), rnd(30, h - 30), rnd(22, 52));
      g.addColorStop(0, "rgba(255,255,255,0.5)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  });
}

function fireSpriteTex() {
  return makeCanvas(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,240,190,1)");
    g.addColorStop(0.3, "rgba(255,170,60,0.85)");
    g.addColorStop(0.7, "rgba(220,70,10,0.35)");
    g.addColorStop(1, "rgba(180,40,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

function smokeSpriteTex() {
  return makeCanvas(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(200,196,188,0.55)");
    g.addColorStop(0.6, "rgba(180,176,168,0.25)");
    g.addColorStop(1, "rgba(160,156,148,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

function plaqueTex() {
  return makeCanvas(256, 96, (ctx, w, h) => {
    ctx.fillStyle = "#e8e0cc"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(150,138,108,${rnd(0.05, 0.15)})`;
      ctx.fillRect(rnd(0, w), rnd(0, h), 2, 2);
    }
    ctx.fillStyle = "#4a3c22";
    ctx.font = "bold 40px Georgia, serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("לבית התקיעה", w / 2, h / 2);
  });
}

// GLSL value noise shared by the flame shaders
const NOISE_GLSL = `
float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1,0)), f.x),
             mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int k = 0; k < 4; k++){ v += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return v;
}
`;

// ─────────────────────────────── component ───────────────────────────────
export default function Mikdash() {
  const mountRef = useRef(null);
  const apiRef = useRef({});
  const [found, setFound] = useState([]);
  const [fact, setFact] = useState(null);
  const [night, setNight] = useState(false);
  const [sound, setSound] = useState(true);
  const [hints, setHints] = useState(false);
  const [questMode, setQuestMode] = useState(true);
  const [walkMode, setWalkMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [noWebGL, setNoWebGL] = useState(false);

  const foundRef = useRef(found); foundRef.current = found;
  const questRef = useRef(questMode); questRef.current = questMode;
  const walkRef = useRef(walkMode); walkRef.current = walkMode;

  const closeFact = useCallback(() => setFact(null), []);
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(null), 2600);
  }, []);

  // The next wonder in sequence = first index not yet found
  const nextTarget = (() => {
    for (let i = 0; i < DISCOVERIES.length; i++) if (!found.includes(i)) return i;
    return -1;
  })();
  const nextRef = useRef(nextTarget); nextRef.current = nextTarget;

  // ─── persistent progress ───
  useEffect(() => {
    (async () => {
      try {
        if (window.storage) {
          const r = await window.storage.get(STORE_KEY);
          if (r && r.value) {
            const data = JSON.parse(r.value);
            if (Array.isArray(data.found)) setFound(data.found.filter((n) => n >= 0 && n < DISCOVERIES.length));
            if (typeof data.night === "boolean") setNight(data.night);
            if (typeof data.sound === "boolean") setSound(data.sound);
          }
        }
      } catch (err) { /* first visit — nothing saved yet */ }
      setStorageReady(true);
    })();
  }, []);
  useEffect(() => {
    if (!storageReady || !window.storage) return;
    window.storage.set(STORE_KEY, JSON.stringify({ found, night, sound })).catch(() => {});
  }, [found, night, sound, storageReady]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (err) {
      // No WebGL: an old device, a disabled setting, a headless browser. The
      // House cannot be drawn — say so rather than leaving a white page.
      setNoWebGL(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.5, 5000);
    scene.fog = new THREE.Fog(0xdde8ef, 850, 2100);

    // ═══════════ SKY (GLSL) ═══════════
    const skyUniforms = {
      uNight: { value: 0 },
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.55, 0.6, -0.42).normalize() },
      uMoonDir: { value: new THREE.Vector3(-0.5, 0.55, 0.45).normalize() },
    };
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(2000, 32, 20),
      new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyUniforms,
        vertexShader: `
          varying vec3 vDir;
          void main(){ vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          varying vec3 vDir;
          uniform float uNight; uniform float uTime;
          uniform vec3 uSunDir; uniform vec3 uMoonDir;
          float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
          void main(){
            vec3 d = normalize(vDir);
            float h = clamp(d.y, -0.06, 1.0);
            vec3 dayZen = vec3(0.30,0.55,0.83), dayMid = vec3(0.60,0.76,0.90), dayHor = vec3(0.94,0.88,0.76);
            vec3 day = mix(dayHor, mix(dayMid, dayZen, smoothstep(0.18,0.75,h)), smoothstep(0.0,0.22,h));
            vec3 nZen = vec3(0.012,0.02,0.075), nMid = vec3(0.04,0.06,0.15), nHor = vec3(0.13,0.14,0.22);
            vec3 nightC = mix(nHor, mix(nMid, nZen, smoothstep(0.15,0.7,h)), smoothstep(0.0,0.2,h));
            vec3 col = mix(day, nightC, uNight);
            float sdot = max(dot(d, uSunDir), 0.0);
            col += (pow(sdot,1500.0)*3.2 + pow(sdot,60.0)*0.75 + pow(sdot,8.0)*0.16) * vec3(1.0,0.92,0.74) * (1.0-uNight);
            float horizWarm = smoothstep(0.28,0.0,h) * pow(max(dot(normalize(vec3(d.x,0.0,d.z)), normalize(vec3(uSunDir.x,0.0,uSunDir.z))),0.0),3.0);
            col += horizWarm * vec3(0.28,0.16,0.05) * (1.0-uNight);
            float mdot = max(dot(d, uMoonDir), 0.0);
            col += (pow(mdot,3800.0)*2.4 + pow(mdot,120.0)*0.5 + pow(mdot,14.0)*0.07) * vec3(0.82,0.87,1.0) * uNight;
            vec3 sp = floor(d * 240.0);
            float star = step(0.9986, hash(sp));
            float tw = 0.55 + 0.45*sin(uTime*2.5 + hash(sp+1.7)*60.0);
            col += star * tw * (0.35 + hash(sp+3.1)*0.8) * vec3(0.95,0.97,1.0) * uNight * smoothstep(0.02,0.28,h);
            float band = exp(-pow((d.y-0.42+0.25*sin(atan(d.z,d.x))),2.0)*34.0);
            col += band * 0.045 * vec3(0.7,0.75,0.95) * uNight;
            col += (hash(d*1234.5)-0.5)*0.012;
            gl_FragColor = vec4(col, 1.0);
          }`,
      })
    );
    scene.add(sky);

    const cMap = cloudTex();
    const clouds = [];
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < 5; i++) {
        const m = new THREE.SpriteMaterial({ map: cMap, transparent: true, opacity: 0.85 - layer * 0.18, depthWrite: false, fog: false });
        const s = new THREE.Sprite(m);
        const sc = rnd(260, 480) - layer * 40;
        s.scale.set(sc, sc * 0.42, 1);
        s.position.set(rnd(-1500, 1500), 330 + layer * 130 + rnd(-30, 30), rnd(-1500, 1500));
        s.userData = { speed: 0.05 + layer * 0.05 + rnd(0, 0.05), mat: m, baseO: m.opacity };
        scene.add(s);
        clouds.push(s);
      }
    }

    // ═══════════ Lights ═══════════
    const hemi = new THREE.HemisphereLight(0xcfe0ff, 0xc4b18a, 0.85);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff0d2, 1.55);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -560, right: 560, top: 560, bottom: -560, near: 60, far: 2200 });
    scene.add(sun);

    // ═══════════ Materials ═══════════
    const whiteMap = ashlar(); whiteMap.repeat.set(3, 1.4);
    const white = new THREE.MeshStandardMaterial({ map: whiteMap, roughness: 0.8 });
    const megaMap2 = ashlar({ base: [228, 222, 206], cols: 3, courses: 3 });
    megaMap2.repeat.set(4, 2);
    const mega = new THREE.MeshStandardMaterial({ map: megaMap2, roughness: 0.85 });
    const waveMap = seaWaveMarble(); waveMap.repeat.set(1.6, 1);
    const wave = new THREE.MeshStandardMaterial({ map: waveMap, roughness: 0.55 });
    const marbleMap = marbleTex();
    const marble = new THREE.MeshStandardMaterial({ map: marbleMap, roughness: 0.45 });
    const goldMap = goldTex();
    const gold = new THREE.MeshStandardMaterial({ map: goldMap, metalness: 0.88, roughness: 0.26 });
    // gold plate: metallic but NOT self-emissive by day — no more "sun inside the House"
    const goldPlate = new THREE.MeshStandardMaterial({ map: goldMap, metalness: 0.95, roughness: 0.22, emissive: 0x1c1200, emissiveIntensity: 0 });
    const bronze = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, metalness: 0.75, roughness: 0.35 });
    const cedarMap = cedarTex(); cedarMap.repeat.set(2, 1);
    const cedar = new THREE.MeshStandardMaterial({ map: cedarMap, roughness: 0.7 });
    const silver = new THREE.MeshStandardMaterial({ color: 0xdde2e9, metalness: 0.96, roughness: 0.12 });
    const foundGold = new THREE.MeshStandardMaterial({ color: 0xffd24a, metalness: 0.9, roughness: 0.2, emissive: 0x8a6a00, emissiveIntensity: 0.55 });
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x201509, emissive: 0xffb347, emissiveIntensity: 0 });
    const stoneDarkM = new THREE.MeshStandardMaterial({ map: ashlar({ base: [206, 196, 172] }), roughness: 0.9 });

    const colliders = [];
    const addCollider = (minX, maxX, minZ, maxZ) => colliders.push({ minX, maxX, minZ, maxZ });

    const box = (w, h, d, mat, x, y, z, parent = scene) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    const cyl = (rt, rb, h, seg, mat, x, y, z, parent = scene) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
      m.position.set(x, y, z);
      m.castShadow = m.receiveShadow = true;
      parent.add(m);
      return m;
    };

    // ═══════════ Land + platform ═══════════
    const gTex = groundTexture(); gTex.repeat.set(10, 10);
    const land = new THREE.Mesh(new THREE.CylinderGeometry(1600, 1680, 40, 56), new THREE.MeshStandardMaterial({ map: gTex, roughness: 1 }));
    land.position.y = -34;
    land.receiveShadow = true;
    scene.add(land);
    const LAND_Y = -14;

    for (let i = 0; i < 15; i++) {
      const a = (i / 15) * Math.PI * 2 + rnd(-0.1, 0.1);
      const hill = new THREE.Mesh(new THREE.SphereGeometry(rnd(150, 300), 12, 8), new THREE.MeshStandardMaterial({ color: 0xb7a071, roughness: 1 }));
      hill.scale.y = rnd(0.22, 0.4);
      hill.position.set(Math.cos(a) * rnd(1200, 1450), LAND_Y - 8, Math.sin(a) * rnd(1200, 1450));
      hill.receiveShadow = true;
      scene.add(hill);
    }
    const oliveLeaf = new THREE.MeshStandardMaterial({ color: 0x6d7d4f, roughness: 0.95 });
    for (let i = 0; i < 70; i++) {
      const a = rnd(0, Math.PI * 2), r = rnd(460, 980);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (Math.abs(x) < HALF + 90 && Math.abs(z) < HALF + 110) continue;
      cyl(0.8, 1.2, rnd(5, 8), 6, cedar, x, LAND_Y + 3, z);
      const cr = new THREE.Mesh(new THREE.SphereGeometry(rnd(3.4, 6), 8, 6), oliveLeaf);
      cr.scale.y = 0.75;
      cr.position.set(x, LAND_Y + rnd(8, 11), z);
      cr.castShadow = true;
      scene.add(cr);
    }

    const SKIRT = 14;
    const skirt = (w, d, x, z) => box(w, SKIRT, d, mega, x, LAND_Y + SKIRT / 2, z);
    skirt(C + 78, 8, 0, -(HALF + 35));
    skirt(C + 78, 8, 0, HALF + 35);
    skirt(8, C + 78, -(HALF + 35), 0);
    skirt(8, C + 78, HALF + 35, 0);
    for (let p = -9; p <= 9; p++) {
      const pp = p * 26;
      box(4, SKIRT - 2, 1.4, white, pp, LAND_Y + SKIRT / 2, -(HALF + 39.4));
      box(4, SKIRT - 2, 1.4, white, pp, LAND_Y + SKIRT / 2, HALF + 39.4);
      box(1.4, SKIRT - 2, 4, white, -(HALF + 39.4), LAND_Y + SKIRT / 2, pp);
      box(1.4, SKIRT - 2, 4, white, HALF + 39.4, LAND_Y + SKIRT / 2, pp);
    }

    const pMap = pavingTex(); pMap.repeat.set(14, 14);
    const plaza = box(C + 78, 4, C + 78, new THREE.MeshStandardMaterial({ map: pMap, roughness: 0.88 }), 0, -2, 0);
    plaza.receiveShadow = true;

    // Monumental stairs (south + east)
    for (let s = 0; s < 12; s++) {
      const deep = s % 3 === 0 ? 6 : 3.4;
      box(150, 1.25, deep, marble, 0, LAND_Y + 13 - s * 1.2, HALF + 40 + s * 3.4);
    }
    for (let s = 0; s < 12; s++)
      box(4.5, 1.25, 110, marble, HALF + 40 + s * 3.4, LAND_Y + 13 - s * 1.2, 0);

    // ═══════════ Outer walls ═══════════
    const WALL_H = 16, WALL_T = 6, GATE_W = 25;
    box(WALL_T, WALL_H, C, white, -HALF, WALL_H / 2, 0);
    addCollider(-HALF - 4, -HALF + 4, -HALF, HALF);
    const seg = C / 2 - GATE_W / 2;
    box(WALL_T, WALL_H, seg, white, HALF, WALL_H / 2, -(GATE_W / 2 + seg / 2));
    box(WALL_T, WALL_H, seg, white, HALF, WALL_H / 2, GATE_W / 2 + seg / 2);
    addCollider(HALF - 4, HALF + 4, -HALF, -GATE_W / 2);
    addCollider(HALF - 4, HALF + 4, GATE_W / 2, HALF);
    box(seg, WALL_H, WALL_T, white, -(GATE_W / 2 + seg / 2), WALL_H / 2, -HALF);
    box(seg, WALL_H, WALL_T, white, GATE_W / 2 + seg / 2, WALL_H / 2, -HALF);
    addCollider(-HALF, -GATE_W / 2, -HALF - 4, -HALF + 4);
    addCollider(GATE_W / 2, HALF, -HALF - 4, -HALF + 4);
    box(seg, WALL_H, WALL_T, white, -(GATE_W / 2 + seg / 2), WALL_H / 2, HALF);
    box(seg, WALL_H, WALL_T, white, GATE_W / 2 + seg / 2, WALL_H / 2, HALF);
    addCollider(-HALF, -GATE_W / 2, HALF - 4, HALF + 4);
    addCollider(GATE_W / 2, HALF, HALF - 4, HALF + 4);
    const cren = (alongX, fixed) => {
      box(alongX ? C + 10 : WALL_T + 3, 1.6, alongX ? WALL_T + 3 : C + 10, marble, alongX ? 0 : fixed, WALL_H + 0.8, alongX ? fixed : 0);
      for (let i = -15; i <= 15; i++) {
        const p = i * 16;
        box(alongX ? 5 : WALL_T + 2, 3, alongX ? WALL_T + 2 : 5, marble, alongX ? p : fixed, WALL_H + 3, alongX ? fixed : p);
      }
    };
    cren(true, -HALF); cren(true, HALF); cren(false, -HALF); cren(false, HALF);
    [[-HALF, -HALF], [-HALF, HALF], [HALF, -HALF], [HALF, HALF]].forEach(([x, z]) => {
      box(20, 28, 20, mega, x, 14, z);
      addCollider(x - 11, x + 11, z - 11, z + 11);
      box(23, 2.2, 23, marble, x, 29.2, z);
      for (let i = -1; i <= 1; i++) {
        box(4.4, 3.4, 4.4, marble, x + i * 7.6, 31.9, z - 9.4);
        box(4.4, 3.4, 4.4, marble, x + i * 7.6, 31.9, z + 9.4);
        box(4.4, 3.4, 4.4, marble, x - 9.4, 31.9, z + i * 7.6);
        box(4.4, 3.4, 4.4, marble, x + 9.4, 31.9, z + i * 7.6);
      }
    });

    // ═══════════ Fire system (shader flames + particle sprites) ═══════════
    const fireTex = fireSpriteTex();
    const smokeTex = smokeSpriteTex();
    const makeFlame = (radius, height, segments = 20) => {
      const uniforms = { uTime: { value: 0 }, uIntensity: { value: 1 } };
      const mat = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        vertexShader: `
          uniform float uTime;
          varying float vH; varying vec2 vP;
          ${NOISE_GLSL}
          void main(){
            vec3 p = position;
            float ny = clamp((p.y + ${(height / 2).toFixed(1)}) / ${height.toFixed(1)}, 0.0, 1.0);
            vH = ny;
            // licking tongues: two noise fields pull the surface sideways, more at the top
            float n1 = fbm(vec2(p.x * 0.35 + uTime * 1.7, p.z * 0.35 - uTime * 2.2)) - 0.5;
            float n2 = fbm(vec2(p.z * 0.5 - uTime * 2.7, p.x * 0.5 + uTime * 1.4)) - 0.5;
            p.x += n1 * ${(radius * 1.15).toFixed(2)} * ny * (0.35 + ny);
            p.z += n2 * ${(radius * 1.15).toFixed(2)} * ny * (0.35 + ny);
            // tip stretch: flame licks upward irregularly
            p.y += (fbm(vec2(uTime * 2.6, p.x * 0.7)) - 0.35) * ${(height * 0.28).toFixed(2)} * ny * ny;
            vP = p.xz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: `
          uniform float uTime; uniform float uIntensity;
          varying float vH; varying vec2 vP;
          ${NOISE_GLSL}
          void main(){
            // internal turbulence scrolling upward through the flame body
            float body = fbm(vP * 0.55 + vec2(0.0, -uTime * 3.2));
            float a = (1.0 - vH);
            a = a * a * (0.55 + body * 0.9);
            a *= smoothstep(0.0, 0.12, vH) + 0.55;      // soften the very base
            a *= uIntensity;
            vec3 col = mix(vec3(1.0, 0.93, 0.55),        // white-yellow core
                           vec3(1.0, 0.45, 0.08), vH);   // orange mids
            col = mix(col, vec3(0.75, 0.12, 0.01), smoothstep(0.62, 1.0, vH)); // red tips
            col += body * 0.25;
            gl_FragColor = vec4(col * 1.35, clamp(a, 0.0, 1.0));
          }`,
      });
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, segments, 12, true), mat);
      mesh.frustumCulled = false;
      return { mesh, uniforms };
    };

    // altar fire: two nested shader cones + rising particle sprites + smoke
    const AX = -8;
    const IC = 210, IC_H = 10;
    const TOP = IC_H;
    const flameOuter = makeFlame(5.6, 13);
    flameOuter.mesh.position.set(AX, TOP + 20.5, 0);
    scene.add(flameOuter.mesh);
    const flameInner = makeFlame(3.1, 10);
    flameInner.mesh.position.set(AX, TOP + 19.4, 0);
    flameInner.uniforms.uIntensity.value = 1.5;
    scene.add(flameInner.mesh);

    const fireParticles = [];
    for (let i = 0; i < 34; i++) {
      const m = new THREE.SpriteMaterial({ map: fireTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
      const sp = new THREE.Sprite(m);
      sp.userData = { ph: rnd(0, 1), sp: rnd(0.35, 0.7), a: rnd(0, 6.28), r: rnd(0.5, 3.6), drift: rnd(-0.6, 0.6) };
      scene.add(sp);
      fireParticles.push(sp);
    }
    const smokeParticles = [];
    for (let i = 0; i < 16; i++) {
      const m = new THREE.SpriteMaterial({ map: smokeTex, depthWrite: false, transparent: true });
      const sp = new THREE.Sprite(m);
      sp.userData = { ph: rnd(0, 1), sp: rnd(0.1, 0.18), sway: rnd(2, 5), off: rnd(0, 6.28) };
      scene.add(sp);
      smokeParticles.push(sp);
    }
    // warm light: physical decay so it doesn't wash the gold facade into a "sun"
    const fireLight = new THREE.PointLight(0xff8c33, 1.0, 130, 2);
    fireLight.position.set(AX, TOP + 22, 0);
    scene.add(fireLight);

    // small torch flames reuse the sprite system
    const torchFires = [];
    const addTorch = (worldPos, parent = scene) => {
      const m = new THREE.SpriteMaterial({ map: fireTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
      const sp = new THREE.Sprite(m);
      sp.position.copy(worldPos);
      sp.scale.set(3, 4.4, 1);
      parent.add(sp);
      const tl = new THREE.PointLight(0xff9440, 0, 46, 2);
      tl.position.copy(worldPos); tl.position.y += 1.5;
      parent.add(tl);
      torchFires.push({ light: tl, flame: sp });
    };

    // ═══════════ Gatehouses ═══════════
    const makeGate = (x, z, rotY, sealed) => {
      const g = new THREE.Group();
      const GL = 50, GW = 25, GH = 24;
      for (const s of [-1, 1]) {
        box(GL, GH, 4, white, 0, GH / 2, s * (GW / 2), g);
        for (let c2 = 0; c2 < 3; c2++)
          box(9, GH * 0.68, 6.6, marble, -GL / 2 + 10 + c2 * 15, GH * 0.34, s * (GW / 2 + 4.5), g);
      }
      box(6, GH + 16, GW + 18, white, GL / 2 - 2, (GH + 16) / 2, 0, g);
      box(8, 2.8, GW + 22, marble, GL / 2 - 2, GH + 17.4, 0, g);
      for (let i = -3; i <= 3; i++) box(6, 3.2, 4.6, marble, GL / 2 - 2, GH + 20.4, i * 5.8, g);
      box(6.8, 6, GATE_W - 6, cedar, GL / 2 - 2, GH + 0.4, 0, g);
      box(7, 1.8, GATE_W - 2, gold, GL / 2 - 2, GH + 4, 0, g);
      if (sealed) {
        box(3.4, GH - 4, GATE_W - 8, white, GL / 2 - 0.4, (GH - 4) / 2, 0, g);
        for (let r = 0; r < 6; r++) box(3.8, 0.5, GATE_W - 8, stoneDarkM, GL / 2 - 0.4, 2.4 + r * 3.2, 0, g);
      } else {
        const d1 = box(0.8, GH - 6, (GATE_W - 8) / 2, cedar, GL / 2 + 1.8, (GH - 6) / 2, -(GATE_W - 8) / 4 - 1, g);
        d1.rotation.y = 0.62;
        const d2 = box(0.8, GH - 6, (GATE_W - 8) / 2, cedar, GL / 2 + 1.8, (GH - 6) / 2, (GATE_W - 8) / 4 + 1, g);
        d2.rotation.y = -0.62;
        for (let r = 0; r < 3; r++) for (const dd of [d1, d2]) {
          const stud = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 5), gold);
          stud.position.set(0.5, -4 + r * 5, 0);
          dd.add(stud);
        }
      }
      for (const s of [-1, 1]) {
        cyl(1, 1.4, 18, 8, bronze, GL / 2 + 2, 9, s * (GW / 2 + 6.5), g);
        const fr = new THREE.Mesh(new THREE.ConeGeometry(4.8, 5.6, 8), gold);
        fr.position.set(GL / 2 + 2, 20.4, s * (GW / 2 + 6.5));
        fr.castShadow = true;
        g.add(fr);
        cyl(1.6, 1, 1.6, 8, bronze, GL / 2 + 8, 7.4, s * (GW / 2 + 3), g);
        cyl(0.4, 0.5, 6.4, 6, bronze, GL / 2 + 8, 3.2, s * (GW / 2 + 3), g);
        addTorch(new THREE.Vector3(GL / 2 + 8, 9.4, s * (GW / 2 + 3)), g);
      }
      for (let st = 0; st < 7; st++) box(3, 0.9, GW + 8, marble, GL / 2 + 5 + st * 3, 3.1 - st * 0.45, 0, g);
      g.position.set(x, 0, z);
      g.rotation.y = rotY;
      scene.add(g);
      // collide with the gatehouse side walls (world space, axis-aligned per gate)
      if (rotY === 0) {
        addCollider(x - 25, x + 25, z - GW / 2 - 3, z - GW / 2 + 3);
        addCollider(x - 25, x + 25, z + GW / 2 - 3, z + GW / 2 + 3);
        if (sealed) addCollider(x + 22, x + 28, z - GW / 2, z + GW / 2);
      } else {
        addCollider(x - GW / 2 - 3, x - GW / 2 + 3, z - 25, z + 25);
        addCollider(x + GW / 2 - 3, x + GW / 2 + 3, z - 25, z + 25);
      }
    };
    makeGate(HALF - 20, 0, 0, true);
    makeGate(0, -HALF + 20, Math.PI / 2, false);
    makeGate(0, HALF - 20, -Math.PI / 2, false);

    // ═══════════ Royal Stoa ═══════════
    const stoa = new THREE.Group();
    const STOA_L = C - 130, STOA_W = 52, COL_H = 22;
    box(STOA_L, 2.4, STOA_W, marble, 0, 1.2, 0, stoa);
    const corinthian = (px, pz, parent, scale = 1) => {
      cyl(1.5 * scale, 1.8 * scale, COL_H * scale, 12, marble, px, 2.4 + (COL_H * scale) / 2, pz, parent);
      box(4.6 * scale, 1.3, 4.6 * scale, gold, px, 2.4 + COL_H * scale + 0.6, pz, parent);
      const volutes = new THREE.Mesh(new THREE.SphereGeometry(0.7 * scale, 6, 5), gold);
      volutes.position.set(px, 2.4 + COL_H * scale + 1.5, pz);
      parent.add(volutes);
    };
    const nCols = Math.floor(STOA_L / 17);
    for (let i = 0; i < nCols; i++) {
      const px = -STOA_L / 2 + 8.5 + i * 17;
      corinthian(px, -STOA_W / 2 + 5, stoa);
      corinthian(px, -STOA_W / 2 + 21, stoa, 1.18);
      corinthian(px, STOA_W / 2 - 21, stoa, 1.18);
      corinthian(px, STOA_W / 2 - 5, stoa);
    }
    box(STOA_L, 2.2, STOA_W, cedar, 0, 2.4 + COL_H + 2.2, 0, stoa);
    box(STOA_L, 1.4, STOA_W + 4, marble, 0, 2.4 + COL_H + 4, 0, stoa);
    const gable = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 15, STOA_L, 3, 1), cedar);
    gable.rotation.z = Math.PI / 2;
    gable.scale.set(1, 1, 0.6);
    gable.position.set(0, 2.4 + COL_H + 9.4, 0);
    gable.castShadow = true;
    stoa.add(gable);
    box(STOA_L + 6, 1, 6, gold, 0, 2.4 + COL_H + 14.6, 0, stoa);
    for (let i = 0; i < Math.floor(STOA_L / 12); i++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.4, 5), gold);
      sp.position.set(-STOA_L / 2 + 6 + i * 12, 2.4 + COL_H + 16.4, 0);
      stoa.add(sp);
    }
    stoa.position.set(0, 0, HALF - 58);
    scene.add(stoa);

    // ═══════════ Colonnades (N + E) ═══════════
    const colonnade = (cx, cz, len, rotY) => {
      const grp = new THREE.Group();
      const n = Math.floor(len / 18);
      for (let i = 0; i < n; i++) {
        const px = -len / 2 + 9 + i * 18;
        cyl(1.4, 1.7, 12, 10, marble, px, 6, 0, grp);
        box(4.2, 1.2, 4.2, gold, px, 12.7, 0, grp);
      }
      box(len, 1.8, 7.5, marble, 0, 14, 0, grp);
      const roof = box(len, 1, 10, cedar, 0, 15.3, -1, grp);
      roof.rotation.x = 0.1;
      for (let i = 0; i < Math.floor(n / 2); i++)
        box(6, 7.5, 1, cedar, -len / 2 + 18 + i * 36, 3.8, -5.6, grp);
      grp.position.set(cx, 0, cz);
      grp.rotation.y = rotY;
      scene.add(grp);
    };
    colonnade(0, -HALF + 36, C - 130, 0);
    colonnade(HALF - 62, 0, C - 170, Math.PI / 2);

    // ═══════════ Corner kitchen courts ═══════════
    const kitchenSmokes = [];
    [[-HALF + 30, -HALF + 30], [-HALF + 30, HALF - 30], [HALF - 30, -HALF + 30], [HALF - 30, HALF - 30]].forEach(([x, z]) => {
      box(40, 6.5, 3, stoneDarkM, x, 3.2, z - 20);
      box(40, 6.5, 3, stoneDarkM, x, 3.2, z + 20);
      box(3, 6.5, 40, stoneDarkM, x - 20, 3.2, z);
      box(3, 6.5, 40, stoneDarkM, x + 20, 3.2, z);
      cyl(3.6, 4.2, 3.2, 10, bronze, x, 1.6, z);
      const m = new THREE.SpriteMaterial({ map: smokeTex, depthWrite: false, transparent: true });
      const sm = new THREE.Sprite(m);
      sm.userData = { x, z, ph: rnd(0, 1) };
      scene.add(sm);
      kitchenSmokes.push(sm);
    });

    // ═══════════ Inner court ═══════════
    const inner = box(IC + 50, IC_H, IC, wave, -60, IC_H / 2, 0);
    inner.receiveShadow = true;
    const IC_E = -60 + (IC + 50) / 2; // = 70, eastern edge of inner court
    for (let s = 0; s < 15; s++) {
      const w = 70 - s * 2.4;
      box(2.6, IC_H / 15 + 0.15, w, marble, IC_E + (14 - s) * 2.6, IC_H - (s + 1) * (IC_H / 15), 0);
    }
    const par = (w, d, x, z) => {
      box(w, 2.8, d, white, x, IC_H + 1.4, z);
    };
    par(4, IC, -60 - (IC + 50) / 2, 0);
    par(IC + 50, 4, -60, -IC / 2);
    par(IC + 50, 4, -60, IC / 2);
    par(4, IC / 2 - 40, IC_E, -(20 + (IC / 2 - 40) / 2));
    par(4, IC / 2 - 40, IC_E, 20 + (IC / 2 - 40) / 2);
    // inner court parapet colliders (walk in via the eastern steps only)
    addCollider(-192, -188, -IC / 2, IC / 2);
    addCollider(-190, IC_E, -IC / 2 - 2, -IC / 2 + 2);
    addCollider(-190, IC_E, IC / 2 - 2, IC / 2 + 2);
    addCollider(IC_E - 2, IC_E + 2, -IC / 2, -20);
    addCollider(IC_E - 2, IC_E + 2, 20, IC / 2);

    // Nicanor gate + operable doors
    const NIC_X = IC_E;
    box(4, 24, 5, marble, NIC_X, IC_H + 12, -20);
    box(4, 24, 5, marble, NIC_X, IC_H + 12, 20);
    box(4, 4, 45, marble, NIC_X, IC_H + 26, 0);
    box(5, 2, 49, gold, NIC_X, IC_H + 29, 0);
    const nicanor = new THREE.Group();
    nicanor.position.set(NIC_X, IC_H, 0);
    nicanor.userData = { id: 14, open: 0, target: 0 };
    const mkDoor = (side) => {
      const geo = new THREE.BoxGeometry(1.2, 22, 17.5);
      geo.translate(0, 11, -side * 8.75);
      const door = new THREE.Mesh(geo, bronze);
      door.position.set(0, 0, side * 17.5);
      door.castShadow = true;
      nicanor.add(door);
      for (let r = 0; r < 3; r++) {
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 12), gold);
        disc.rotation.z = Math.PI / 2;
        disc.position.set(0.9, 5 + r * 6.5, -side * 8.75);
        door.add(disc);
      }
      return door;
    };
    const nicL = mkDoor(-1), nicR = mkDoor(1);
    scene.add(nicanor);

    for (let i = 0; i < 8; i++) {
      const tx = -20 + (i % 4) * 14, tz = -IC / 2 + 16 + Math.floor(i / 4) * 12;
      box(8, 0.9, 6, marble, tx, IC_H + 3.4, tz);
      box(6, 3, 4, stoneDarkM, tx, IC_H + 1.5, tz);
    }
    cyl(5, 3.4, 2.4, 14, bronze, -20, IC_H + 4.4, IC / 2 - 22);
    cyl(1.6, 2.4, 3.4, 10, bronze, -20, IC_H + 1.7, IC / 2 - 22);
    const laverWater = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 0.3, 14), new THREE.MeshStandardMaterial({ color: 0x59b7dd, metalness: 0.4, roughness: 0.1 }));
    laverWater.position.set(-20, IC_H + 5.5, IC / 2 - 22);
    scene.add(laverWater);

    // ═══════════ Altar body ═══════════
    box(34, 2, 34, stoneDarkM, AX, TOP + 1, 0);
    box(29, 4, 29, white, AX, TOP + 4, 0);
    box(25, 4, 25, white, AX, TOP + 8, 0);
    box(21, 4.5, 21, stoneDarkM, AX, TOP + 12.2, 0);
    addCollider(AX - 18, AX + 18, -18, 18);
    for (const hx of [-1, 1]) for (const hz of [-1, 1]) box(2.6, 3.2, 2.6, stoneDarkM, AX + hx * 9.4, TOP + 16, hz * 9.4);
    for (let i = 0; i < 5; i++) box(9 - i, 0.9, 1.4, cedar, AX, TOP + 14.8 + i * 0.5, -3 + i * 1.4);
    for (let s = 0; s < 10; s++) box(3, 1.25, 13, white, AX + 17 + s * 2.7, TOP + 13.4 - s * 1.34, 0);

    // ═══════════ THE HOUSE ═══════════
    const T = new THREE.Group();
    T.position.set(-150, IC_H, 0);
    scene.add(T);
    box(132, 6, 90, marble, -22, 3, 0, T);
    addCollider(-150 - 88, -150 + 44, -45, 45); // temple platform block
    for (let story = 0; story < 3; story++) {
      const w = 9 + story * 1.7;
      for (const s of [-1, 1]) {
        box(84, 10, w, white, -30, 6 + 5 + story * 10, s * (28 + w / 2), T);
        for (let wn = 0; wn < 6; wn++)
          box(3, 2.6, 0.6, windowMat, -62 + wn * 13, 6 + 5.6 + story * 10, s * (28 + w + 0.1), T);
      }
    }
    box(64, 60, 44, wave, -22, 6 + 30, 0, T);
    for (const s of [-1, 1]) for (let wn = 0; wn < 5; wn++) {
      box(5, 5.4, 1, gold, -44 + wn * 11, 6 + 47, s * 22.2, T);
      box(3.4, 3.6, 1.2, windowMat, -44 + wn * 11, 6 + 47, s * 22.4, T);
    }
    box(28, 64, 40, marble, -64, 6 + 32, 0, T);
    box(32, 3.2, 46, gold, -64, 6 + 65.6, 0, T);
    for (let i = -3; i <= 3; i++) box(3, 3, 3, gold, -64, 6 + 68.8, i * 6, T);
    box(13, 80, 56, white, 16, 6 + 40, 0, T);
    box(1.2, 76, 52, goldPlate, 23.2, 6 + 40, 0, T);
    box(17, 4, 62, gold, 16, 6 + 82, 0, T);
    for (let i = -5; i <= 5; i++) box(3.2, 3.2, 3.2, gold, 16, 6 + 85.6, i * 5.6, T);
    for (let i = -5; i <= 5; i++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.4, 3, 5), gold);
      sp.position.set(16, 6 + 88.6, i * 5.6);
      T.add(sp);
    }
    for (let i = -4; i <= 4; i++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.6, 5), gold);
      sp.position.set(-22 + i * 7.5, 6 + 64.8, 0);
      T.add(sp);
    }
    box(2.4, 32, 21, gold, 22.6, 6 + 16, 0, T);
    const dL = box(1.4, 27, 8.4, cedar, 23.3, 6 + 13.5, -4.6, T); dL.rotation.y = 0.35;
    const dR = box(1.4, 27, 8.4, cedar, 23.3, 6 + 13.5, 4.6, T); dR.rotation.y = -0.35;
    for (let v = -2; v <= 2; v++) {
      const arcSeg = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.38, 6, 10, Math.PI), gold);
      arcSeg.position.set(23.6, 6 + 33.6, v * 4.8);
      arcSeg.rotation.y = Math.PI / 2;
      T.add(arcSeg);
      const grapes = new THREE.Mesh(new THREE.SphereGeometry(1, 6, 5), gold);
      grapes.scale.y = 1.5;
      grapes.position.set(23.8, 6 + 31.2, v * 4.8 + 2.3);
      T.add(grapes);
    }
    const doorGlow = new THREE.PointLight(0xffc36a, 0, 70, 2);
    doorGlow.position.set(30, 6 + 12, 0);
    T.add(doorGlow);
    box(68, 2.8, 48, stoneDarkM, -22, 6 + 61.4, 0, T);
    box(72, 1.8, 52, gold, -22, 6 + 63.6, 0, T);
    for (const s of [-1, 1]) {
      cyl(3.3, 3.8, 44, 14, bronze, 30, 6 + 22, s * 32, T);
      // capitals: matte-finished gold caps, no more glowing orbs
      const capT = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.8, 4.5, 14), gold);
      capT.position.set(30, 6 + 46, s * 32);
      capT.castShadow = true;
      T.add(capT);
      for (let p = 0; p < 12; p++) {
        const a = (p / 12) * Math.PI * 2;
        const pom = new THREE.Mesh(new THREE.SphereGeometry(0.85, 6, 6), bronze);
        pom.position.set(30 + Math.cos(a) * 5.2, 6 + 42.8, s * 32 + Math.sin(a) * 5.2);
        T.add(pom);
      }
    }
    for (let s = 0; s < 12; s++) box(3.3, 1.2, 40, marble, 31 + 5 + s * 3.3, 6 - s * 0.55 - 0.55, 0, T);
    box(94, 22, 74, white, -142, 11, 0, T);
    box(98, 2.2, 78, marble, -142, 23.2, 0, T);
    addCollider(-150 - 189, -150 - 95, -39, 39); // western binyan
    for (const s of [-1, 1]) {
      box(104, 18, 24, white, -170, IC_H + 9, s * (IC / 2 + 27));
      box(108, 2, 27, marble, -170, IC_H + 19, s * (IC / 2 + 27));
      addCollider(-222, -118, s * (IC / 2 + 27) - 13, s * (IC / 2 + 27) + 13);
      for (let d = 0; d < 6; d++) box(5, 8.5, 1, cedar, -214 + d * 17.6, IC_H + 4.3, s * (IC / 2 + 27 - 12.6));
    }

    // ═══════════ River ═══════════
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x3fa8d8, transparent: true, opacity: 0.72, metalness: 0.4, roughness: 0.12 });
    const streams = [];
    streams.push(box(196, 0.5, 4, waterMat, -8, IC_H + 0.32, 30));
    streams.push(box(174, 0.5, 8, waterMat, 158, 0.5, 30));
    const s3 = box(360, 0.5, 18, waterMat, HALF + 210, LAND_Y + 0.6, 30);
    s3.rotation.y = -0.05;
    streams.push(s3);
    box(1.4, IC_H, 5, waterMat, 90.6, IC_H / 2, 30);
    box(1.4, 15, 8, waterMat, HALF + 39.5, LAND_Y + 7, 30);
    const sparkGeo = new THREE.BufferGeometry();
    const sparkArr = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i++) {
      sparkArr[i * 3] = rnd(100, 760);
      sparkArr[i * 3 + 1] = rnd(0.4, 1.2) + (sparkArr[i * 3] > HALF + 39 ? LAND_Y : 0);
      sparkArr[i * 3 + 2] = rnd(24, 40);
    }
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkArr, 3));
    const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xdff4ff, size: 1.7, transparent: true, opacity: 0.8 }));
    scene.add(sparks);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x4a7d3a, roughness: 0.9 });
    const fruitMat = new THREE.MeshStandardMaterial({ color: 0xd6552e, roughness: 0.6 });
    for (let t = 0; t < 11; t++) {
      const tx = 190 + t * 52 + (t % 2) * 16;
      const ty = tx > HALF + 39 ? LAND_Y : 0;
      for (const s of [-1, 1]) {
        cyl(1, 1.5, 9, 7, cedar, tx, ty + 4.5, 30 + s * (13 + (t % 3) * 4));
        const crown = new THREE.Mesh(new THREE.SphereGeometry(5 + (t % 3), 9, 7), leafMat);
        crown.position.set(tx, ty + 12, 30 + s * (13 + (t % 3) * 4));
        crown.castShadow = true;
        scene.add(crown);
        for (let f = 0; f < 4; f++) {
          const fr = new THREE.Mesh(new THREE.SphereGeometry(0.55, 5, 4), fruitMat);
          const a = rnd(0, 6.28);
          fr.position.set(tx + Math.cos(a) * 4, ty + 11 + rnd(-2, 2), 30 + s * (13 + (t % 3) * 4) + Math.sin(a) * 4);
          scene.add(fr);
        }
      }
    }

    // ═══════════ FIGURES: kohanim + Levites ═══════════
    const figures = [];
    const makeFigure = (robeColor, sashColor) => {
      const g = new THREE.Group();
      const robeMat = new THREE.MeshStandardMaterial({ color: robeColor, roughness: 0.85 });
      const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.35, 3.4, 9), robeMat);
      robe.position.y = 1.7;
      robe.castShadow = true;
      g.add(robe);
      const chest = new THREE.Mesh(new THREE.SphereGeometry(0.78, 8, 7), robeMat);
      chest.scale.y = 1.1;
      chest.position.y = 3.5;
      chest.castShadow = true;
      g.add(chest);
      const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.86, 0.35, 9), new THREE.MeshStandardMaterial({ color: sashColor, roughness: 0.6 }));
      sash.position.y = 2.95;
      g.add(sash);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 7), new THREE.MeshStandardMaterial({ color: 0xd9a877, roughness: 0.8 }));
      head.position.y = 4.55;
      head.castShadow = true;
      g.add(head);
      const migbaat = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.55, 8), new THREE.MeshStandardMaterial({ color: 0xf3efe2, roughness: 0.85 }));
      migbaat.position.y = 5.05;
      g.add(migbaat);
      for (const s of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.7, 6), robeMat);
        arm.position.set(0, 3.4, s * 0.9);
        arm.rotation.x = s * 0.25;
        g.add(arm);
        g.userData["arm" + (s === -1 ? "L" : "R")] = arm;
      }
      return g;
    };
    // Kohanim: walking loops in the inner court (white with techelet sash)
    const KOHEN_PATHS = [
      [[30, -70], [55, -30], [30, 40], [-40, 60], [-70, 20], [-60, -50]],
      [[-90, 40], [-60, 75], [0, 80], [40, 60], [10, 30], [-50, 10]],
      [[50, -80], [20, -95], [-30, -80], [-60, -40], [-30, -20], [20, -45]],
      [[-100, -30], [-80, -70], [-40, -90], [-10, -60], [-50, -35], [-85, -5]],
    ];
    KOHEN_PATHS.forEach((path, pi) => {
      for (let k = 0; k < 2; k++) {
        const f = makeFigure(0xf3efe2, 0x3a5f9e);
        f.userData.path = path;
        f.userData.t = (pi * 2 + k) / 8;
        f.userData.speed = rnd(0.016, 0.026);
        f.userData.kind = "kohen";
        scene.add(f);
        figures.push(f);
      }
    });
    // Levites: standing on the fifteen steps, swaying in song (white with gold sash)
    for (let l = 0; l < 8; l++) {
      const f = makeFigure(0xefe9d6, 0xb8912f);
      const step = 2 + l;
      const sx = IC_E + (14 - step) * 2.6;
      const sy = IC_H - (step + 1) * (IC_H / 15);
      f.position.set(sx, sy + 0.6, -28 + l * 8);
      f.rotation.y = Math.PI; // facing west, toward the House
      f.userData.kind = "levi";
      f.userData.ph = rnd(0, 6.28);
      scene.add(f);
      figures.push(f);
    }

    // ═══════════ SIXTEEN WONDERS ═══════════
    const clickables = [];
    const veiledSilver = silver.clone();
    veiledSilver.transparent = true;
    veiledSilver.opacity = 0.28;

    const rimonim = RIMON_POS.map((pos, i) => {
      const g = new THREE.Group();
      const already = false;
      const bodyMat = silver.clone();
      const body = new THREE.Mesh(new THREE.SphereGeometry(1.7, 18, 14), bodyMat);
      body.scale.set(1, 1.08, 1);
      body.castShadow = true;
      g.add(body);
      for (let c2 = 0; c2 < 6; c2++) {
        const a = (c2 / 6) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 5), bodyMat);
        spike.position.set(Math.cos(a) * 0.55, 1.95, Math.sin(a) * 0.55);
        spike.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4);
        g.add(spike);
      }
      g.position.set(pos[0], pos[1], pos[2]);
      g.userData = { id: i, baseY: pos[1] };
      scene.add(g);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.1, 8, 26), new THREE.MeshBasicMaterial({ color: 0xf0f4f9, transparent: true, opacity: 0.45 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(g.position);
      scene.add(ring);
      g.userData.ring = ring;
      clickables.push(g);
      void already;
      return g;
    });

    const fox = new THREE.Group();
    const foxFur = new THREE.MeshStandardMaterial({ color: 0xc4622d, roughness: 0.85 });
    const foxWhite = new THREE.MeshStandardMaterial({ color: 0xf0e4d4, roughness: 0.85 });
    const fb = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8), foxFur);
    fb.scale.set(1.6, 1, 1); fb.position.y = 2.4; fb.castShadow = true; fox.add(fb);
    const fh = new THREE.Mesh(new THREE.SphereGeometry(1.4, 9, 7), foxFur);
    fh.position.set(3.2, 3.6, 0); fh.castShadow = true; fox.add(fh);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 7), foxWhite);
    snout.rotation.z = -Math.PI / 2; snout.position.set(4.7, 3.3, 0); fox.add(snout);
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.5, 6), foxFur);
      ear.position.set(3.2, 5.2, s * 0.8); fox.add(ear);
    }
    const tail = new THREE.Mesh(new THREE.ConeGeometry(1, 4.4, 8), foxFur);
    tail.rotation.z = Math.PI / 2.4; tail.position.set(-4.2, 3, 0); fox.add(tail);
    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.7, 6, 5), foxWhite);
    tailTip.position.set(-6, 4, 0); fox.add(tailTip);
    for (let l = 0; l < 4; l++) cyl(0.35, 0.4, 2.4, 6, foxFur, -1.6 + (l % 2) * 3.4, 1.2, l < 2 ? -1 : 1, fox);
    fox.position.set(70, LAND_Y, HALF + 90);
    fox.rotation.y = -0.7;
    fox.userData = { id: 8, tail };
    scene.add(fox);
    clickables.push(fox);

    const harp = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.5, 10, 24, Math.PI * 1.25), gold);
    frame.rotation.z = -0.4; frame.position.y = 4.6; frame.castShadow = true; harp.add(frame);
    box(1, 8, 1, gold, -3.2, 3.8, 0, harp);
    const stringMat = new THREE.MeshBasicMaterial({ color: 0xfff6d8 });
    for (let st = 0; st < 8; st++) {
      const sm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5.6 - st * 0.35, 4), stringMat);
      sm.position.set(-2.4 + st * 0.8, 4.8, 0);
      harp.add(sm);
    }
    harp.position.set(IC_E + 14, IC_H * 0.45, -44);
    harp.rotation.y = 0.8;
    harp.scale.set(1.25, 1.25, 1.25);
    harp.userData = { id: 9 };
    scene.add(harp);
    clickables.push(harp);

    const shofar = new THREE.Group();
    box(6, 3.2, 6, marble, 0, 1.6, 0, shofar);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xcbb492, roughness: 0.5 });
    const hp1 = cyl(0.7, 1.6, 7, 9, hornMat, 0, 4.6, 0, shofar); hp1.rotation.z = 1;
    const hp2 = cyl(1.5, 2.4, 5, 9, hornMat, 3.6, 6.4, 0, shofar); hp2.rotation.z = 1.9;
    const bellEnd = cyl(2.4, 1.8, 1.6, 10, hornMat, 6.2, 6.9, 0, shofar); bellEnd.rotation.z = 1.9;
    shofar.position.set(-45, 0, HALF - 75);
    shofar.userData = { id: 10 };
    scene.add(shofar);
    clickables.push(shofar);

    const stoneGlowMat = new THREE.MeshStandardMaterial({ color: 0xf5e3b2, emissive: 0xffc75e, emissiveIntensity: 0.7, roughness: 0.4 });
    const shetiya = new THREE.Mesh(new THREE.SphereGeometry(6, 14, 10), stoneGlowMat);
    shetiya.scale.y = 0.42;
    shetiya.position.set(-150 - 195 - 12, 1.4, 0);
    shetiya.userData = { id: 11 };
    scene.add(shetiya);
    clickables.push(shetiya);
    const shetiyaLight = new THREE.PointLight(0xffc75e, 0.9, 60, 2);
    shetiyaLight.position.set(shetiya.position.x, 6, 0);
    scene.add(shetiyaLight);

    const men = new THREE.Group();
    cyl(0.55, 0.8, 10, 8, gold, 0, 5, 0, men);
    cyl(2.2, 2.6, 1, 10, gold, 0, 0.5, 0, men);
    const flameTips = [];
    [-4.8, -3.2, -1.6, 0, 1.6, 3.2, 4.8].forEach((bz) => {
      if (bz !== 0) {
        cyl(0.32, 0.36, 3.1, 6, gold, 0, 9.05, bz, men);
        const knop = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), gold);
        knop.position.set(0, 10, bz);
        men.add(knop);
      }
      cyl(0.55, 0.35, 0.9, 8, gold, 0, 10.6 + (bz === 0 ? 0.5 : 0), bz, men);
      const m = new THREE.SpriteMaterial({ map: fireTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
      const fl = new THREE.Sprite(m);
      fl.scale.set(1.4, 2.2, 1);
      fl.position.set(0, 12.2 + (bz === 0 ? 0.5 : 0), bz);
      men.add(fl);
      flameTips.push(fl);
    });
    box(0.5, 0.5, 10.2, gold, 0, 10, 0, men);
    men.scale.set(1.8, 1.8, 1.8);
    men.position.set(50, IC_H, 48);
    men.userData = { id: 12 };
    scene.add(men);
    clickables.push(men);
    const menLight = new THREE.PointLight(0xffc84d, 0, 60, 2);
    menLight.position.set(50, IC_H + 24, 48);
    scene.add(menLight);

    const ketoret = new THREE.Group();
    box(3.2, 5, 3.2, goldPlate, 0, 2.5, 0, ketoret);
    box(4, 0.7, 4, gold, 0, 5.2, 0, ketoret);
    for (const hx of [-1, 1]) for (const hz of [-1, 1]) box(0.6, 1, 0.6, gold, hx * 1.7, 5.9, hz * 1.7, ketoret);
    ketoret.position.set(-96, IC_H, 0);
    ketoret.userData = { id: 13 };
    scene.add(ketoret);
    clickables.push(ketoret);
    const ketoretState = { active: false };
    const ketoretPuffs = [];
    for (let i = 0; i < 12; i++) {
      const m = new THREE.SpriteMaterial({ map: smokeTex, depthWrite: false, transparent: true, opacity: 0, color: 0xf6f0e0 });
      const p = new THREE.Sprite(m);
      p.userData = { ph: i / 12 };
      scene.add(p);
      ketoretPuffs.push(p);
    }

    const plaqueGrp = new THREE.Group();
    box(9, 4.5, 2.2, mega, 0, 2.25, 0, plaqueGrp);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 3.2), new THREE.MeshStandardMaterial({ map: plaqueTex(), roughness: 0.85 }));
    face.position.set(0, 2.3, 1.15);
    plaqueGrp.add(face);
    plaqueGrp.position.set(-HALF + 10, 30.4, HALF - 10);
    plaqueGrp.rotation.y = Math.PI / 4;
    plaqueGrp.userData = { id: 15 };
    scene.add(plaqueGrp);
    clickables.push(plaqueGrp);

    const doves = [];
    for (let d = 0; d < 8; d++) {
      const dove = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 6), marble);
      body.scale.set(1.7, 0.8, 0.8); dove.add(body);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 4.6), marble);
      dove.add(wing);
      dove.userData = { a: (d / 8) * Math.PI * 2, r: 155 + d * 26, h: 118 + d * 8, sp: 0.13 + d * 0.018, wing };
      scene.add(dove);
      doves.push(dove);
    }

    // ═══════════ Audio ═══════════
    let audioCtx = null;
    const ensureAudio = () => {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      return audioCtx;
    };
    // The ambient bed and every event sound answer to one switch.
    const amb = {
      on: true, built: false, buf: null,
      master: null, wind: null, windF: null, fire: null, fireGain: null,
      songBus: null, song: null, songAt: 0, crackAt: 0,
    };
    const playShofar = () => {
      if (!amb.on) return;
      const ctx = ensureAudio(); const t0 = ctx.currentTime;
      const osc = ctx.createOscillator(), osc2 = ctx.createOscillator();
      const gain = ctx.createGain(), filt = ctx.createBiquadFilter();
      filt.type = "lowpass"; filt.frequency.value = 900; filt.Q.value = 4;
      osc.type = "sawtooth"; osc2.type = "square";
      [[osc, 146, 158, 230], [osc2, 147.5, 159, 232]].forEach(([o, f1, f2, f3]) => {
        o.frequency.setValueAtTime(f1, t0);
        o.frequency.linearRampToValueAtTime(f2, t0 + 0.15);
        o.frequency.setValueAtTime(f2, t0 + 1.15);
        o.frequency.linearRampToValueAtTime(f3, t0 + 1.28);
      });
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.28, t0 + 0.09);
      gain.gain.setValueAtTime(0.28, t0 + 1.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.1);
      osc.connect(filt); osc2.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
      osc.start(t0); osc2.start(t0); osc.stop(t0 + 2.2); osc2.stop(t0 + 2.2);
    };
    const playHarp = () => {
      if (!amb.on) return;
      const ctx = ensureAudio();
      const notes = [293.66, 311.13, 369.99, 392.0, 440.0, 587.33, 440.0, 369.99, 293.66];
      notes.forEach((f, i) => {
        const t0 = ctx.currentTime + i * 0.24;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "triangle"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
        o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + 1.5);
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.type = "sine"; o2.frequency.value = f * 2;
        g2.gain.setValueAtTime(0.0001, t0);
        g2.gain.exponentialRampToValueAtTime(0.07, t0 + 0.015);
        g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1);
        o2.connect(g2); g2.connect(ctx.destination); o2.start(t0); o2.stop(t0 + 1.2);
      });
    };
    const playTrumpet = () => {
      if (!amb.on) return;
      const ctx = ensureAudio();
      [[392, 0, 0.5], [523.25, 0.45, 0.9], [392, 1.3, 0.35], [523.25, 1.6, 1.3]].forEach(([f, dt, dur]) => {
        const t0 = ctx.currentTime + dt;
        const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
        fl.type = "lowpass"; fl.frequency.value = 1700; fl.Q.value = 2;
        o.type = "sawtooth"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.2, t0 + 0.04);
        g.gain.setValueAtTime(0.2, t0 + dur * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(fl); fl.connect(g); g.connect(ctx.destination);
        o.start(t0); o.stop(t0 + dur + 0.05);
      });
    };
    const playChime = () => {
      if (!amb.on) return;
      const ctx = ensureAudio();
      [660, 990, 1320].forEach((f, i) => {
        const t0 = ctx.currentTime + i * 0.12;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2);
        o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + 2.1);
      });
    };

    // ═══════════ Ambient bed: wind, the ma'aracha, the Levites' song ═══════════
    // Three synthesized voices mixed every frame by where the eye stands: wind
    // over the mountain (everywhere, stronger high up and at night), the fire
    // of the ma'aracha (near the altar), and the ascent of the Levites carried
    // across the courts (near the fifteen steps). Built lazily — a browser
    // holds an AudioContext suspended until the first gesture, so the House is
    // silent until the visitor touches it.
    const ALTAR_POS = new THREE.Vector3(AX, TOP + 20, 0);
    const STEPS_POS = new THREE.Vector3(IC_E + 18, IC_H, 0);

    // Brown noise — integrated white noise. Wind and fire share this spectrum;
    // filtering alone separates the mountain air from the hearth.
    const noiseBuf = (ctx, secs) => {
      const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * secs), ctx.sampleRate);
      const d = b.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        d[i] = last * 3.4;
      }
      return b;
    };
    const buildAmbience = () => {
      if (amb.built) return;
      const ctx = ensureAudio();
      amb.built = true;
      amb.buf = noiseBuf(ctx, 6);
      amb.master = ctx.createGain();
      amb.master.gain.value = amb.on ? 1 : 0;
      amb.master.connect(ctx.destination);

      const loop = (dest) => {
        const s = ctx.createBufferSource();
        s.buffer = amb.buf; s.loop = true; s.connect(dest); s.start();
        return s;
      };

      // wind: lowpassed noise whose cutoff breathes with the gusts
      amb.windF = ctx.createBiquadFilter();
      amb.windF.type = "lowpass"; amb.windF.frequency.value = 420; amb.windF.Q.value = 0.9;
      amb.wind = ctx.createGain(); amb.wind.gain.value = 0;
      amb.windF.connect(amb.wind); amb.wind.connect(amb.master);
      loop(amb.windF);

      // fire: the same noise band-limited to the roar of a hearth
      const fireF = ctx.createBiquadFilter();
      fireF.type = "bandpass"; fireF.frequency.value = 320; fireF.Q.value = 0.55;
      amb.fireGain = ctx.createGain(); amb.fireGain.gain.value = 0;
      fireF.connect(amb.fireGain); amb.fireGain.connect(amb.master);
      loop(fireF);

      // song: softened and set back — a short feedback delay reads as the
      // distance of stone courts between the singer and the ear
      amb.songBus = ctx.createBiquadFilter();
      amb.songBus.type = "lowpass"; amb.songBus.frequency.value = 1100;
      amb.song = ctx.createGain(); amb.song.gain.value = 0;
      const dl = ctx.createDelay(1), fb = ctx.createGain();
      dl.delayTime.value = 0.34; fb.gain.value = 0.3;
      dl.connect(fb); fb.connect(dl);
      amb.songBus.connect(amb.song); amb.songBus.connect(dl); dl.connect(amb.song);
      amb.song.connect(amb.master);
    };

    // Freygish (Ahava Raba) on D, two octaves — the mode the harp already
    // sings in. Phrases only ever ascend: fifteen steps, Shir HaMa'alot.
    const SONG_SCALE = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 261.63, 293.66, 311.13, 369.99, 392.0];
    const singPhrase = (ctx) => {
      const start = ctx.currentTime + 0.05;
      const n = 5 + Math.floor(Math.random() * 3);
      const root = Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const step = Math.min(SONG_SCALE.length - 1, root + i + (i === n - 1 ? 1 : 0));
        const t0 = start + i * 0.62;
        // two slightly detuned voices plus an octave — a choir, not a synth
        [[1, "triangle", 0.075], [1.006, "triangle", 0.06], [2, "sine", 0.026]].forEach(([mul, type, peak]) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = type; o.frequency.value = SONG_SCALE[step] * mul;
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(peak, t0 + 0.22);
          g.gain.setValueAtTime(peak, t0 + 0.4);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.95);
          o.connect(g); g.connect(amb.songBus); o.start(t0); o.stop(t0 + 1);
        });
      }
    };

    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const glide = (node, target, dt) => { node.gain.value += (target - node.gain.value) * Math.min(1, dt * 2.2); };
    // t = seconds since load, nightAmt = the eased day⇄night scalar
    const mixAmbience = (t, dt, nightAmt) => {
      if (!amb.built || !amb.on) return;
      const ctx = audioCtx;
      const p = camera.position;

      const gust = 0.55 + 0.45 * Math.sin(t * 0.11) * Math.sin(t * 0.043 + 1.7);
      const alt = clamp01((p.y - 10) / 240);
      amb.windF.frequency.value = 250 + gust * 400;
      glide(amb.wind, (0.05 + alt * 0.09) * (0.75 + 0.45 * nightAmt) * gust, dt);

      const fireAmt = clamp01(1 - (p.distanceTo(ALTAR_POS) - 24) / 130);
      glide(amb.fireGain, 0.19 * fireAmt, dt);
      if (fireAmt > 0.05 && t > amb.crackAt) {
        amb.crackAt = t + 0.06 + Math.random() * (0.45 / fireAmt);
        const t0 = ctx.currentTime;
        const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        s.buffer = amb.buf; s.playbackRate.value = 2 + Math.random() * 2.5;
        f.type = "bandpass"; f.frequency.value = 900 + Math.random() * 2600; f.Q.value = 5;
        g.gain.setValueAtTime(0.5 * fireAmt, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
        s.connect(f); f.connect(g); g.connect(amb.master);
        s.start(t0, Math.random() * 5, 0.12); s.stop(t0 + 0.13);
      }

      const songAmt = clamp01(1 - (p.distanceTo(STEPS_POS) - 30) / 200);
      glide(amb.song, songAmt, dt);
      if (songAmt > 0.07 && t > amb.songAt) {
        amb.songAt = t + 7 + Math.random() * 9;
        singPhrase(ctx);
      }
    };

    // ═══════════ Terrain height + collision for walk mode ═══════════
    const groundHeight = (x, z) => {
      // eastern inner-court steps: ramp from court edge down to the azarah floor
      if (z > -35 && z < 35 && x > IC_E && x < IC_E + 40)
        return Math.max(0, IC_H * (1 - (x - IC_E) / 40));
      // inner court
      if (x > -190 && x < IC_E && z > -IC / 2 && z < IC / 2) return IC_H;
      // altar east steps
      if (z > -7 && z < 7 && x > AX + 15 && x < AX + 45)
        return IC_H + Math.max(0, 13.4 - (x - (AX + 15)) / 2.7 * 1.34);
      // southern monumental stair
      if (x > -76 && x < 76 && z > HALF + 36 && z < HALF + 82)
        return Math.max(LAND_Y, -((z - (HALF + 36)) / 46) * 14);
      // eastern monumental stair
      if (z > -56 && z < 56 && x > HALF + 36 && x < HALF + 82)
        return Math.max(LAND_Y, -((x - (HALF + 36)) / 46) * 14);
      // stoa stylobate
      if (Math.abs(x) < STOA_L / 2 && z > HALF - 58 - STOA_W / 2 && z < HALF - 58 + STOA_W / 2) return 2.4;
      // plaza
      if (Math.abs(x) < HALF + 38 && Math.abs(z) < HALF + 38) return 0;
      return LAND_Y;
    };
    const resolveCollisions = (pos) => {
      const R = 1.4;
      for (const c2 of colliders) {
        if (pos.x > c2.minX - R && pos.x < c2.maxX + R && pos.z > c2.minZ - R && pos.z < c2.maxZ + R) {
          const dxMin = pos.x - (c2.minX - R), dxMax = (c2.maxX + R) - pos.x;
          const dzMin = pos.z - (c2.minZ - R), dzMax = (c2.maxZ + R) - pos.z;
          const m = Math.min(dxMin, dxMax, dzMin, dzMax);
          if (m === dxMin) pos.x = c2.minX - R;
          else if (m === dxMax) pos.x = c2.maxX + R;
          else if (m === dzMin) pos.z = c2.minZ - R;
          else pos.z = c2.maxZ + R;
        }
      }
    };

    // ═══════════ Camera control: orbit + first-person ═══════════
    const orbit = { theta: Math.PI * 0.2, phi: Math.PI * 0.37, radius: 700, target: new THREE.Vector3(-40, 30, 0), dragging: false, lastX: 0, lastY: 0, drift: 0.00072 };
    const player = {
      pos: new THREE.Vector3(180, 3.4, 0),
      yaw: Math.PI, pitch: 0,
      keys: {},
      touchLook: null, touchMove: null,
      moveVec: { f: 0, s: 0 },
    };
    const EYE = 3.4;

    const applyCamera = () => {
      if (walkRef.current) {
        camera.position.copy(player.pos);
        const dir = new THREE.Vector3(
          Math.cos(player.pitch) * Math.cos(player.yaw),
          Math.sin(player.pitch),
          Math.cos(player.pitch) * Math.sin(player.yaw)
        );
        camera.lookAt(player.pos.clone().add(dir));
      } else {
        const { theta, phi, radius, target } = orbit;
        camera.position.set(
          target.x + radius * Math.sin(phi) * Math.cos(theta),
          target.y + radius * Math.cos(phi),
          target.z + radius * Math.sin(phi) * Math.sin(theta)
        );
        camera.lookAt(target);
      }
    };
    apiRef.current.enterWalk = () => {
      player.pos.set(180, groundHeight(180, 0) + EYE, 0);
      player.yaw = Math.PI;
      player.pitch = 0;
    };

    const raycaster = new THREE.Raycaster();
    const mv = new THREE.Vector2();
    let moved = 0;
    const pxOf = (e) => (e.touches ? e.touches[0] : e.changedTouches ? e.changedTouches[0] : e);

    const onKey = (e, down) => {
      if (down && amb.on) buildAmbience();
      player.keys[e.code] = down;
      if (down && ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    };
    const kd = (e) => onKey(e, true), ku = (e) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    const onDown = (e) => {
      if (amb.on) buildAmbience();
      const p = pxOf(e);
      moved = 0;
      if (walkRef.current && e.touches) {
        // two-zone touch: left = move stick, right = look
        for (const t of e.changedTouches) {
          if (t.clientX < window.innerWidth * 0.42 && !player.touchMove)
            player.touchMove = { id: t.identifier, x: t.clientX, y: t.clientY };
          else if (!player.touchLook)
            player.touchLook = { id: t.identifier, x: t.clientX, y: t.clientY };
        }
        return;
      }
      orbit.dragging = true;
      orbit.lastX = p.clientX; orbit.lastY = p.clientY;
    };
    const onMove = (e) => {
      if (walkRef.current && e.touches) {
        for (const t of e.touches) {
          if (player.touchMove && t.identifier === player.touchMove.id) {
            player.moveVec.f = -(t.clientY - player.touchMove.y) / 60;
            player.moveVec.s = (t.clientX - player.touchMove.x) / 60;
          } else if (player.touchLook && t.identifier === player.touchLook.id) {
            player.yaw += (t.clientX - player.touchLook.x) * 0.006;
            player.pitch = Math.max(-1.2, Math.min(1.2, player.pitch - (t.clientY - player.touchLook.y) * 0.005));
            player.touchLook.x = t.clientX; player.touchLook.y = t.clientY;
          }
        }
        moved = 10;
        return;
      }
      if (!orbit.dragging) return;
      const p = pxOf(e);
      const dx = p.clientX - orbit.lastX, dy = p.clientY - orbit.lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      if (walkRef.current) {
        player.yaw += dx * 0.0045;
        player.pitch = Math.max(-1.2, Math.min(1.2, player.pitch - dy * 0.0035));
      } else {
        orbit.theta += dx * 0.005;
        orbit.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.02, orbit.phi - dy * 0.004));
      }
      orbit.lastX = p.clientX; orbit.lastY = p.clientY;
    };
    const findId = (obj) => {
      let o = obj;
      while (o) { if (o.userData && o.userData.id !== undefined) return o; o = o.parent; }
      return null;
    };
    const collect = (id) => {
      // quest gating: in quest mode, only the next wonder in sequence may be taken
      if (questRef.current && !foundRef.current.includes(id)) {
        const nxt = nextRef.current;
        if (id !== nxt) {
          apiRef.current.toast?.(`עוד לא — seek wonder ${nxt + 1} first: “${DISCOVERIES[nxt].hint}”`);
          return false;
        }
      }
      return true;
    };
    const onUp = (e) => {
      orbit.dragging = false;
      if (walkRef.current && e.changedTouches) {
        for (const t of e.changedTouches) {
          if (player.touchMove && t.identifier === player.touchMove.id) { player.touchMove = null; player.moveVec.f = 0; player.moveVec.s = 0; }
          if (player.touchLook && t.identifier === player.touchLook.id) player.touchLook = null;
        }
      }
      if (moved > 7) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const p = pxOf(e);
      mv.set(((p.clientX - rect.left) / rect.width) * 2 - 1, -((p.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(mv, camera);
      const hits = raycaster.intersectObjects(clickables, true);
      if (!hits.length) return;
      const holder = findId(hits[0].object);
      if (!holder) return;
      const id = holder.userData.id;
      if (!collect(id)) return;
      if (id <= 7) {
        rimonim[id].traverse((o) => { if (o.isMesh) o.material = foundGold; });
        if (rimonim[id].userData.ring) rimonim[id].userData.ring.material.color.set(0xffd24a);
      }
      if (id === 9) playHarp();
      if (id === 10) playShofar();
      if (id === 12) { flameTips.forEach((f, i) => setTimeout(() => { f.material.opacity = 0.95; }, i * 180)); menLight.intensity = 1.1; }
      if (id === 13) { ketoretState.active = true; playChime(); }
      if (id === 14) nicanor.userData.target = 1;
      if (id === 15) playTrumpet();
      apiRef.current.openFact?.(id);
    };
    const onWheel = (e) => {
      e.preventDefault();
      if (!walkRef.current) orbit.radius = Math.max(80, Math.min(1500, orbit.radius + e.deltaY * 0.65));
    };
    const el = renderer.domElement;
    el.addEventListener("mousedown", onDown);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseup", onUp);
    el.addEventListener("touchstart", onDown, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // ═══════════ Environment cycle ═══════════
    const env = { cur: 0, target: 0 };
    apiRef.current.setNight = (n) => { env.target = n ? 1 : 0; };
    apiRef.current.setSound = (on) => {
      amb.on = on;
      if (on) buildAmbience();
      if (amb.master) amb.master.gain.value = on ? 1 : 0;
    };
    apiRef.current.markFound = (arr) => {
      arr.forEach((id) => {
        if (id <= 7) {
          rimonim[id].traverse((o) => { if (o.isMesh) o.material = foundGold; });
          if (rimonim[id].userData.ring) rimonim[id].userData.ring.material.color.set(0xffd24a);
        }
        if (id === 12) { flameTips.forEach((f) => { f.material.opacity = 0.95; }); menLight.intensity = 1.1; }
        if (id === 13) ketoretState.active = true;
        if (id === 14) nicanor.userData.target = 1;
      });
    };
    const lerp = (a, b, t) => a + (b - a) * t;
    const dayFog = new THREE.Color(0xdde8ef), nightFog = new THREE.Color(0x0a1122);
    const dayHemiSky = new THREE.Color(0xcfe0ff), nightHemiSky = new THREE.Color(0x33405f);
    const dayHemiGnd = new THREE.Color(0xc4b18a), nightHemiGnd = new THREE.Color(0x191510);
    const daySunCol = new THREE.Color(0xfff0d2), nightSunCol = new THREE.Color(0x9fb2dd);

    let raf, lastT = performance.now();
    const t0 = performance.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const t = (now - t0) / 1000;
      skyUniforms.uTime.value = t;

      env.cur += (env.target - env.cur) * 0.022;
      const nAmt = env.cur, e2 = nAmt * nAmt * (3 - 2 * nAmt);
      skyUniforms.uNight.value = e2;
      const sunDir = new THREE.Vector3(lerp(0.55, -0.72, e2), lerp(0.6, -0.28, e2), lerp(-0.42, 0.3, e2)).normalize();
      skyUniforms.uSunDir.value.copy(sunDir);
      const moonDir = new THREE.Vector3(lerp(-0.9, -0.5, e2), lerp(-0.2, 0.55, e2), lerp(0.2, 0.45, e2)).normalize();
      skyUniforms.uMoonDir.value.copy(moonDir);
      sun.position.copy(e2 < 0.5 ? sunDir : moonDir).multiplyScalar(900);
      sun.intensity = lerp(1.55, 0.26, e2);
      sun.color.copy(daySunCol).lerp(nightSunCol, e2);
      hemi.intensity = lerp(0.85, 0.2, e2);
      hemi.color.copy(dayHemiSky).lerp(nightHemiSky, e2);
      hemi.groundColor.copy(dayHemiGnd).lerp(nightHemiGnd, e2);
      scene.fog.color.copy(dayFog).lerp(nightFog, e2);
      windowMat.emissiveIntensity = e2 * 1.6;
      doorGlow.intensity = e2 * 1.5;
      goldPlate.emissiveIntensity = e2 * 0.18;
      shetiyaLight.intensity = lerp(0.9, 1.6, e2);
      fireLight.intensity = lerp(1.0, 2.2, e2) + Math.sin(t * 13) * 0.12 + (vnoiseJS(t * 7) - 0.5) * 0.3;
      torchFires.forEach(({ light, flame }, ti) => {
        light.intensity = e2 * 1.1 + Math.sin(t * 9 + ti * 2.4) * 0.1 * e2;
        const fs = 0.3 + e2 * 0.8 + Math.sin(t * 11 + ti * 3.1) * 0.12 + (vnoiseJS(t * 5 + ti) - 0.5) * 0.2;
        flame.scale.set(3 * fs, 4.4 * fs, 1);
        flame.material.opacity = 0.35 + e2 * 0.6;
      });
      clouds.forEach((c2) => {
        c2.position.x += c2.userData.speed;
        if (c2.position.x > 1600) c2.position.x = -1600;
        c2.userData.mat.opacity = c2.userData.baseO * lerp(1, 0.28, e2);
        c2.userData.mat.color.setRGB(lerp(1, 0.35, e2), lerp(1, 0.4, e2), lerp(1, 0.55, e2));
      });

      // ── walk mode physics ──
      if (walkRef.current) {
        const k = player.keys;
        let f = player.moveVec.f, s = player.moveVec.s;
        if (k.KeyW || k.ArrowUp) f += 1;
        if (k.KeyS || k.ArrowDown) f -= 1;
        if (k.KeyA || k.ArrowLeft) s -= 1;
        if (k.KeyD || k.ArrowRight) s += 1;
        const mag = Math.hypot(f, s);
        if (mag > 0.01) {
          const speed = (k.ShiftLeft || k.ShiftRight ? 42 : 22) * dt / Math.max(1, mag);
          const fwd = new THREE.Vector3(Math.cos(player.yaw), 0, Math.sin(player.yaw));
          const right = new THREE.Vector3(-Math.sin(player.yaw), 0, Math.cos(player.yaw));
          const next = player.pos.clone()
            .addScaledVector(fwd, f * speed)
            .addScaledVector(right, s * speed);
          const gNow = groundHeight(player.pos.x, player.pos.z);
          const gNext = groundHeight(next.x, next.z);
          if (gNext - gNow <= 3.2) { // can't scale walls/platform faces
            player.pos.x = next.x; player.pos.z = next.z;
          }
          resolveCollisions(player.pos);
        }
        const gy = groundHeight(player.pos.x, player.pos.z) + EYE;
        player.pos.y += (gy - player.pos.y) * Math.min(1, dt * 10);
        // gentle head-bob while moving
        if (mag > 0.01) player.pos.y += Math.sin(t * 9) * 0.08;
      } else if (!orbit.dragging) {
        orbit.theta += orbit.drift;
      }
      applyCamera();

      // ── fire ──
      flameOuter.uniforms.uTime.value = t;
      flameInner.uniforms.uTime.value = t * 1.25;
      flameOuter.mesh.rotation.y = t * 0.4;
      flameInner.mesh.rotation.y = -t * 0.55;
      fireParticles.forEach((sp) => {
        const u = sp.userData;
        const life = ((t * u.sp + u.ph) % 1);
        const r = u.r * (1 - life * 0.75);
        sp.position.set(
          AX + Math.cos(u.a + t * 0.8) * r + u.drift * life * 3,
          TOP + 16.5 + life * 17,
          Math.sin(u.a + t * 0.8) * r
        );
        const sc = (1 - life) * rndCache(u.ph) * 3.4 + 0.5;
        sp.scale.set(sc, sc * 1.35, 1);
        sp.material.opacity = Math.sin(life * Math.PI) * 0.75;
      });
      smokeParticles.forEach((sp) => {
        const u = sp.userData;
        const life = ((t * u.sp + u.ph) % 1);
        sp.position.set(
          AX + Math.sin(t * 0.6 + u.off) * u.sway * life,
          TOP + 26 + life * 58,
          Math.cos(t * 0.5 + u.off) * u.sway * life
        );
        const sc = 4 + life * 16;
        sp.scale.set(sc, sc, 1);
        sp.material.opacity = Math.sin(life * Math.PI) * 0.24 * (1 - e2 * 0.4);
      });
      kitchenSmokes.forEach((sm) => {
        const cyc = (t * 0.14 + sm.userData.ph) % 1;
        sm.position.set(sm.userData.x + Math.sin(t + sm.userData.ph * 9) * cyc * 3, 6 + cyc * 26, sm.userData.z);
        const sc = 3 + cyc * 9;
        sm.scale.set(sc, sc, 1);
        sm.material.opacity = Math.sin(cyc * Math.PI) * 0.3;
      });

      // ── wonders idle ──
      const nxt = nextRef.current;
      rimonim.forEach((g, i) => {
        const isFound = foundRef.current.includes(i);
        const isNext = i === nxt;
        // in quest mode, unfound rimonim beyond the current target are veiled
        const veil = questRef.current && !isFound && !isNext;
        g.traverse((o) => {
          if (o.isMesh && !isFound) {
            o.material.transparent = veil;
            o.material.opacity = veil ? 0.22 : 1;
          }
        });
        g.position.y = g.userData.baseY + Math.sin(t * 1.8 + i * 1.3) * 0.4;
        g.rotation.y = t * 0.9 + i;
        const r = g.userData.ring;
        if (r) {
          r.visible = !veil;
          r.position.y = g.position.y - 1.6;
          r.rotation.z = t * 0.7;
          const pulse = isNext && !isFound ? 1 + Math.sin(t * 4) * 0.3 : 1 + Math.sin(t * 2.4 + i) * 0.12;
          r.scale.set(pulse, pulse, pulse);
          r.material.opacity = isNext && !isFound ? 0.75 : 0.45;
        }
      });

      streams.forEach((s, i) => { s.material.opacity = 0.6 + Math.sin(t * 2 + i) * 0.11; });
      sparks.material.opacity = 0.5 + Math.sin(t * 3) * 0.3;
      laverWater.position.y = IC_H + 5.5 + Math.sin(t * 2.2) * 0.06;

      fox.position.y = LAND_Y + Math.abs(Math.sin(t * 2.6)) * 0.25;
      fox.userData.tail.rotation.x = Math.sin(t * 3) * 0.28;
      fox.rotation.y = -0.7 + Math.sin(t * 0.4) * 0.35;

      flameTips.forEach((f, i) => {
        if (f.material.opacity > 0) {
          const fs = 1 + Math.sin(t * 10 + i * 2) * 0.22;
          f.scale.set(1.4 * fs, 2.2 * fs, 1);
        }
      });
      shetiya.material.emissiveIntensity = lerp(0.6, 1.05, e2) + Math.sin(t * 1.4) * 0.22;

      const nu = nicanor.userData;
      nu.open += (nu.target - nu.open) * 0.03;
      nicL.rotation.y = -nu.open * 1.75;
      nicR.rotation.y = nu.open * 1.75;

      if (ketoretState.active) {
        ketoretPuffs.forEach((p) => {
          const cyc = (t * 0.35 + p.userData.ph) % 1;
          p.position.set(ketoret.position.x, IC_H + 6.4 + cyc * 42, ketoret.position.z);
          p.material.opacity = 0.42 * Math.sin(cyc * Math.PI);
          const sc2 = 1.6 + cyc * 4;
          p.scale.set(sc2, sc2, 1);
        });
      }

      // ── figures ──
      figures.forEach((f) => {
        if (f.userData.kind === "kohen") {
          const path = f.userData.path;
          f.userData.t = (f.userData.t + f.userData.speed * dt) % 1;
          const total = path.length;
          const ft = f.userData.t * total;
          const i0 = Math.floor(ft) % total, i1 = (i0 + 1) % total;
          const frac = ft - Math.floor(ft);
          const x = lerp(path[i0][0], path[i1][0], frac);
          const z = lerp(path[i0][1], path[i1][1], frac);
          f.position.set(x, IC_H + Math.abs(Math.sin(t * 6 + f.userData.t * 40)) * 0.14, z);
          f.rotation.y = Math.atan2(-(path[i1][1] - path[i0][1]), path[i1][0] - path[i0][0]) + Math.PI / 2;
          const swing = Math.sin(t * 6 + f.userData.t * 40) * 0.3;
          if (f.userData.armL) f.userData.armL.rotation.x = swing - 0.25;
          if (f.userData.armR) f.userData.armR.rotation.x = -swing + 0.25;
        } else {
          // Levites sway in song
          f.rotation.z = Math.sin(t * 1.4 + f.userData.ph) * 0.06;
          f.position.y += 0; // fixed on step
          if (f.userData.armL) f.userData.armL.rotation.x = -0.9 + Math.sin(t * 2 + f.userData.ph) * 0.15;
          if (f.userData.armR) f.userData.armR.rotation.x = -0.9 + Math.cos(t * 2 + f.userData.ph) * 0.15;
        }
      });

      mixAmbience(t, dt, e2);

      doves.forEach((d) => {
        d.userData.a += d.userData.sp * 0.016;
        const { a, r, h, wing } = d.userData;
        d.position.set(-150 + Math.cos(a) * r, h + Math.sin(a * 3) * 7, Math.sin(a) * r);
        d.rotation.y = -a + Math.PI / 2;
        wing.rotation.x = Math.sin(t * 12 + r) * 0.6;
      });

      renderer.render(scene, camera);
    };
    // tiny JS value-noise for light flicker
    const rndTable = Array.from({ length: 256 }, () => Math.random());
    function vnoiseJS(x) {
      const i = Math.floor(x) & 255, f = x - Math.floor(x);
      const u = f * f * (3 - 2 * f);
      return rndTable[i] * (1 - u) + rndTable[(i + 1) & 255] * u;
    }
    const rcCache = {};
    function rndCache(k) { if (!(k in rcCache)) rcCache[k] = 0.6 + Math.random() * 0.7; return rcCache[k]; }

    applyCamera();
    animate();
    setLoaded(true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      el.remove();
      renderer.dispose();
      audioCtx?.close();
    };
  }, []);

  // wire imperative bridges after scene exists
  useEffect(() => {
    apiRef.current.openFact = (id) => {
      setFact(id);
      setFound((f) => (f.includes(id) ? f : [...f, id]));
    };
    apiRef.current.toast = showToast;
  }, [showToast]);
  useEffect(() => { apiRef.current.setNight?.(night); }, [night]);
  // Skip the mount call when sound is already on: building the bed here would
  // generate the noise buffer during first paint and open an AudioContext the
  // browser then refuses to start. The first gesture builds it instead.
  const soundInited = useRef(false);
  useEffect(() => {
    if (!soundInited.current) { soundInited.current = true; if (sound) return; }
    apiRef.current.setSound?.(sound);
  }, [sound]);
  useEffect(() => {
    // re-apply persisted finds visually once scene + storage both ready
    if (loaded && storageReady) apiRef.current.markFound?.(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, storageReady]);
  useEffect(() => { if (walkMode) apiRef.current.enterWalk?.(); }, [walkMode]);

  const allFound = found.length === DISCOVERIES.length;

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#0a1122", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Frank+Ruhl+Libre:wght@500;700;900&display=swap');
        @keyframes rise { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes glowPulse { 0%,100% { text-shadow:0 0 12px rgba(212,164,55,.4);} 50% { text-shadow:0 0 28px rgba(212,164,55,.95);} }
        @keyframes toastIn { from { opacity:0; transform:translate(-50%,10px);} to { opacity:1; transform:translate(-50%,0);} }
        .panel { animation: rise .45s cubic-bezier(.2,.8,.3,1) both; }
        .chip { transition: all .2s ease; }
        .chip:hover { transform: translateY(-1px); }
      `}</style>

      <div ref={mountRef} style={{ position: "absolute", inset: 0, cursor: walkMode ? "crosshair" : "grab" }} />

      {noWebGL && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center", color: "#eaddb4", background: "radial-gradient(circle at 50% 40%, #16203c, #070c18)" }}>
          <div style={{ maxWidth: 480 }}>
            <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 40, color: "#ffd97a", marginBottom: 14 }}>מִקְדָּשׁ</div>
            <div style={{ fontSize: 18, fontStyle: "italic", lineHeight: 1.6 }}>
              This browser cannot open a WebGL context, so the House cannot be drawn.
              Try a current desktop or mobile browser with hardware acceleration enabled.
            </div>
          </div>
        </div>
      )}

      <div style={{ position: "absolute", top: 18, left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
        <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 900, color: night ? "#f2e4bd" : "#3b3220", letterSpacing: ".02em", textShadow: night ? "0 2px 24px rgba(0,0,0,.7)" : "0 2px 18px rgba(255,255,255,.85)" }}>
          בֵּית הַמִּקְדָּשׁ
        </div>
        <div style={{ fontSize: "clamp(11px, 1.5vw, 15px)", fontStyle: "italic", color: night ? "#c9bd98" : "#6b5c3d", letterSpacing: ".24em", textTransform: "uppercase", marginTop: 2, textShadow: night ? "0 1px 10px rgba(0,0,0,.6)" : "none" }}>
          The Vision of Yechezkel · In the Grandeur of Herod's Stone
        </div>
      </div>

      {/* Quest banner */}
      {questMode && nextTarget >= 0 && (
        <div style={{ position: "absolute", top: 88, left: "50%", transform: "translateX(-50%)", pointerEvents: "none", background: "rgba(30,24,12,.78)", backdropFilter: "blur(6px)", border: "1px solid rgba(212,164,55,.4)", borderRadius: 999, padding: "8px 22px", color: "#eaddb4", fontSize: 14.5, fontStyle: "italic", maxWidth: "82vw", textAlign: "center", boxShadow: "0 4px 18px rgba(0,0,0,.3)" }}>
          <span style={{ fontFamily: "'Frank Ruhl Libre', serif", fontStyle: "normal", fontWeight: 700, marginRight: 8, color: "#ffd97a" }}>
            {found.length + 1} / 16
          </span>
          {DISCOVERIES[nextTarget].hint}
        </div>
      )}

      <div style={{ position: "absolute", top: 18, right: 16, display: "flex", flexDirection: "column", gap: 9, alignItems: "flex-end" }}>
        <div style={{ background: "rgba(30,24,12,.85)", backdropFilter: "blur(6px)", borderRadius: 14, padding: "8px 15px", color: "#f0e6cd", border: "1px solid rgba(212,164,55,.5)", boxShadow: "0 6px 24px rgba(0,0,0,.3)", textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", opacity: 0.7, fontFamily: "'Frank Ruhl Libre', serif" }}>נסתרות</div>
          <div style={{ fontSize: 21, fontWeight: 700, fontFamily: "'Frank Ruhl Libre', serif", ...(allFound ? { color: "#ffd24a", animation: "glowPulse 2s infinite" } : {}) }}>
            {found.length} / {DISCOVERIES.length}
          </div>
        </div>
        <button className="chip" onClick={() => setWalkMode((w) => !w)} style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: walkMode ? "linear-gradient(135deg,#f3e6c0,#e0cd97)" : "rgba(30,24,12,.85)", color: walkMode ? "#4a3a18" : "#e9d9a8", border: "1px solid rgba(212,164,55,.5)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          {walkMode ? "⬆ Overview" : "⇊ Walk the Courts"}
        </button>
        <button className="chip" onClick={() => setNight((n) => !n)} style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: night ? "linear-gradient(135deg,#f3e6c0,#e0cd97)" : "linear-gradient(135deg,#1a2440,#2c3a63)", color: night ? "#4a3a18" : "#e8ecf7", border: "1px solid rgba(212,164,55,.55)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          {night ? "☀ יום" : "☾ לילה"}
        </button>
        <button className="chip" onClick={() => setSound((s) => !s)} title={sound ? "Silence the courts" : "Let the courts sound"} style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: sound ? "linear-gradient(135deg,#f3e6c0,#e0cd97)" : "rgba(30,24,12,.85)", color: sound ? "#4a3a18" : "#e9d9a8", border: "1px solid rgba(212,164,55,.4)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          {sound ? "♪ קול" : "⃠ דממה"}
        </button>
        <button className="chip" onClick={() => setQuestMode((q) => !q)} style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: "rgba(30,24,12,.85)", color: "#e9d9a8", border: "1px solid rgba(212,164,55,.4)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          {questMode ? "מסע · Quest ✓" : "Free explore"}
        </button>
        <button className="chip" onClick={() => setHints((h) => !h)} style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: "rgba(30,24,12,.85)", color: "#e9d9a8", border: "1px solid rgba(212,164,55,.4)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          {hints ? "Hide hints" : "רמזים"}
        </button>
      </div>

      {hints && (
        <div className="panel" style={{ position: "absolute", top: 230, right: 16, width: 285, maxHeight: "48vh", overflowY: "auto", background: "rgba(28,22,10,.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(212,164,55,.4)", borderRadius: 16, padding: "16px 18px", color: "#e8dcba", boxShadow: "0 12px 40px rgba(0,0,0,.4)" }}>
          <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>שש עשרה נסתרות</div>
          <div style={{ fontSize: 12.5, fontStyle: "italic", opacity: 0.75, marginBottom: 10 }}>Eight silver rimonim, eight living wonders{questMode ? " — revealed in order" : ""}.</div>
          {DISCOVERIES.map((d, i) => {
            const done = found.includes(i);
            const lockedAhead = questMode && !done && i !== nextTarget;
            return (
              <div key={i} style={{ fontSize: 14, fontStyle: "italic", padding: "5px 0", opacity: done ? 0.42 : lockedAhead ? 0.35 : 1, textDecoration: done ? "line-through" : "none", borderBottom: i < DISCOVERIES.length - 1 ? "1px solid rgba(212,164,55,.14)" : "none" }}>
                {done ? "✓ " : `${i + 1}. `}{lockedAhead ? "· · · still veiled · · ·" : d.hint}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center", pointerEvents: "none", color: night ? "#bfb391" : "#5b4e33", fontSize: 13.5, fontStyle: "italic", textShadow: night ? "0 1px 8px rgba(0,0,0,.7)" : "0 1px 10px rgba(255,255,255,.8)" }}>
        {walkMode
          ? "WASD / arrows to walk · Shift to run · drag to look (mobile: left thumb walks, right thumb looks) · click wonders to collect"
          : "Drag to orbit · scroll to zoom · sixteen wonders hide in the white stone — some shine, some breathe, some sing"}
      </div>

      {toast && (
        <div style={{ position: "absolute", bottom: 76, left: "50%", transform: "translateX(-50%)", animation: "toastIn .3s ease both", background: "rgba(30,24,12,.92)", border: "1px solid rgba(212,164,55,.5)", borderRadius: 12, padding: "10px 20px", color: "#f0e2b6", fontSize: 14.5, fontStyle: "italic", maxWidth: "84vw", textAlign: "center", boxShadow: "0 8px 26px rgba(0,0,0,.4)", zIndex: 6 }}>
          {toast}
        </div>
      )}

      {allFound && fact === null && (
        <div className="panel" style={{ position: "absolute", bottom: 56, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, rgba(45,35,14,.95), rgba(76,58,20,.95))", border: "1px solid #d4a437", borderRadius: 16, padding: "18px 28px", color: "#ffe9ad", textAlign: "center", maxWidth: 500, boxShadow: "0 12px 44px rgba(0,0,0,.45)" }}>
          <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 21, fontWeight: 700 }}>כל הכבוד — all sixteen wonders found.</div>
          <div style={{ fontSize: 15.5, marginTop: 6, fontStyle: "italic", lineHeight: 1.5 }}>
            “One who has not seen Herod's building has never seen a beautiful building” (Bava Batra 4a) · “Greater shall be the glory of this latter House than the former, and in this place I will grant peace” (Chaggai 2:9)
          </div>
        </div>
      )}

      {fact !== null && (
        <div className="panel" onClick={closeFact} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(14,11,5,.5)", backdropFilter: "blur(4px)", cursor: "pointer", zIndex: 5 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ cursor: "default", maxWidth: 550, margin: 20, background: "linear-gradient(160deg, #fbf6e8, #efe3c4)", borderRadius: 20, border: "1px solid rgba(140,110,50,.5)", boxShadow: "0 28px 80px rgba(0,0,0,.5)", padding: "30px 34px", position: "relative" }}>
            <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", width: 44, height: 44, borderRadius: "50%", background: DISCOVERIES[fact].kind === "rimon" ? "linear-gradient(145deg, #f5f7fa, #b6bcc6)" : "radial-gradient(circle at 35% 30%, #ffe9ad, #d4a437)", boxShadow: "0 6px 18px rgba(0,0,0,.35), inset 0 2px 5px rgba(255,255,255,.8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, color: "#5a4718" }}>
              {DISCOVERIES[fact].kind === "rimon" ? "◉" : "✦"}
            </div>
            <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 21.5, fontWeight: 700, color: "#4a3a18", marginTop: 10, marginBottom: 11, lineHeight: 1.3 }}>
              {DISCOVERIES[fact].title}
            </div>
            <div style={{ fontSize: 17.5, lineHeight: 1.66, color: "#544729" }}>{DISCOVERIES[fact].text}</div>
            <button onClick={closeFact} style={{ marginTop: 20, fontFamily: "'Frank Ruhl Libre', serif", fontSize: 13.5, letterSpacing: ".13em", textTransform: "uppercase", background: "#4a3a18", color: "#f5e9c8", border: "none", borderRadius: 999, padding: "11px 28px", cursor: "pointer" }}>
              Continue the journey
            </button>
          </div>
        </div>
      )}

      {!loaded && !noWebGL && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#c9bd98", fontStyle: "italic", fontSize: 18 }}>
          Raising the white stone mountain…
        </div>
      )}
    </div>
  );
}
