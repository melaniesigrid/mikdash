# מִקְדָּשׁ · MIKDASH

**An explorable 3D Beit HaMikdash — the prophetic floor plan of Yechezkel 40–48
rendered in the grandeur of Herod's white-stone expansion, with sixteen hidden
wonders drawn from Tanach, Talmud, and archaeology.**

> "מי שלא ראה בנין הורדוס לא ראה בנין נאה מימיו" — Bava Batra 4a
> "One who has not seen Herod's building has never seen a beautiful building in his life."

This README is the working design document. It documents everything a
contributor (human or AI) needs to continue building: the coordinate system,
the source texts behind every architectural decision, the code architecture,
and the roadmap toward a full game.

---

## Current state (v3.1 — "The Sound of the Courts")

One self-contained React component: `Mikdash.jsx` (React 18 + Three.js r128,
no other dependencies, no assets — every texture is generated procedurally at
runtime on `<canvas>`, every sound is synthesized with WebAudio, and the sky
and fire are GLSL shaders).

### Feature summary

| System | Status | Notes |
|---|---|---|
| Yechezkel floor plan (1 unit = 1 amah) | ✅ | 500×500 court, 3 gates, no west gate, sealed east gate |
| Herodian styling | ✅ | Drafted-margin ashlar, Royal Stoa, Hulda-style stairs, pilastered retaining walls, gold-plated Ulam facade, sea-wave marble, kalya orev spikes |
| GLSL sky (day ⇄ night timelapse) | ✅ | Sun/moon arcs, hashed twinkling stars, milky band, dithering |
| GLSL fire (altar) | ✅ | fbm-noise vertex displacement + scrolling body turbulence, additive particles, smoke sprites, decay-2 point light |
| First-person walk mode | ✅ | WASD/arrows + drag-look, Shift to run, mobile dual-thumb controls, AABB collision, terrain height function |
| Animated figures | ✅ | 8 kohanim walking waypoint loops in the azarah; 8 Levites swaying on the fifteen steps |
| Sixteen wonders quest | ✅ | Sequential unlock with toast guidance + free-explore toggle |
| Persistent progress | ✅ | `window.storage` key `mikdash-progress-v3` (found list + day/night pref) |
| WebAudio events | ✅ | Shofar tekiah, freygish harp arpeggio, Shabbat trumpet fanfare, ketoret chime |
| Ambient bed | ✅ | Wind (height + night), fire of the ma'aracha (near the altar), Levites' ascent (near the fifteen steps) — mixed per frame, one ♪ / ⃠ switch silences everything |
| Graceful no-WebGL | ✅ | A device that cannot open a GL context gets a Hebrew notice, not a white page |

---

## Coordinate system & scale

- **1 world unit = 1 amah (cubit).** Player eye height = 3.4 (≈ human scale).
- **+X = east** (the sealed gate, the river's direction, the Ulam facade).
- **−X = west** (Kodesh HaKodashim, the unbroken wall, Even HaShetiya).
- **±Z = south/north.** The Royal Stoa runs along +Z (south); the fox waits
  below the southern stairs.
- Ground levels: surrounding land `LAND_Y = −14`; plaza `0`; Royal Stoa
  stylobate `2.4`; inner court (azarah) `IC_H = 10`; Temple platform `IC_H + 6`.
- `groundHeight(x, z)` in the component is the single source of truth for
  walkable elevation (includes all four stair ramps). `colliders[]` holds
  world-space AABBs; `resolveCollisions` pushes the player out along the axis
  of minimum penetration. A step taller than 3.2 amot cannot be climbed.

## Textual sources (the "why" behind every shape)

| Element | Source |
|---|---|
| 500×500 court, gate layout, cells, palm ornaments | Yechezkel 40 |
| No western gate ("Shechinah is in the west") | Bava Batra 25a |
| Sealed eastern gate | Yechezkel 44:1–3 |
| Altar "Har'el," eastern steps | Yechezkel 43:13–17 |
| Three-story side chambers, splayed windows | Yechezkel 41; Melachim I 6 |
| Western binyan | Yechezkel 41:12 |
| River from the threshold, healing trees | Yechezkel 47 |
| Corner kitchen courts | Yechezkel 46:21–24 |
| Fifteen steps of the Levites / Shir HaMa'alot | Middot 2:5; Sukkah 51b |
| Nicanor's bronze doors and their sea miracle | Yoma 38a |
| White + blue-green "waves of the sea" marble | Bava Batra 4a; Sukkah 51b |
| Gold-plated facade "like a snow-clad mountain" | Josephus, War 5.222–224 |
| Kalya orev (gold roof spikes vs. ravens) | Middot 4:6 |
| Ketoret: eleven spices, chelbenah, ma'aleh ashan | Keritot 6a |
| Menorah as testimony (Ner Ma'aravi) | Shabbat 22b |
| Even HaShetiya, world woven from it | Yoma 54b |
| Rabbi Akiva's fox | Makkot 24b |
| Trumpeting Stone inscription (real artifact, 1968) | Israel Museum, IAA 78-1439 |
| Great shofar of ingathering | Yeshayahu 27:13 |
| Fire from Heaven vs. built by Mashiach | Rambam Hilchot Melachim 11; Rashi/Tanchuma |

**Content rule:** all hidden-object language uses Jewish framing only —
*nistarot* (hidden things), *rimonim* (pomegranates), wonders. No
"easter egg" terminology anywhere in UI or code comments. Hidden-content
counts stay in **multiples of 8** (currently 16 = 8 rimonim + 8 wonders;
next tier would be 24).

## Code architecture (single file, ordered top to bottom)

1. **Constants** — `C`, `HALF`, `STORE_KEY`, `DISCOVERIES[16]`, `RIMON_POS[8]`.
2. **Procedural textures** — `ashlar`, `seaWaveMarble`, `marbleTex`, `goldTex`,
   `cedarTex`, `groundTexture`, `pavingTex`, `cloudTex`, `fireSpriteTex`,
   `smokeSpriteTex`, `plaqueTex` (the לבית התקיעה inscription).
3. **`NOISE_GLSL`** — shared hash/value-noise/fbm chunk injected into shaders.
4. **Component setup** — renderer, scene, camera; persistent-storage load/save.
5. **Sky** — one `ShaderMaterial` dome; uniforms `uNight`, `uTime`, `uSunDir`,
   `uMoonDir`. Day/night is a single scalar eased in the render loop
   (`env.cur → env.target`), driving *every* light, fog, emissive and sprite
   tint. Never toggle instantaneously — always animate `env.target`.
6. **Fire** — `makeFlame(radius, height)` returns a noise-displaced open cone
   with additive fragment shading (white-yellow core → orange → red tips,
   scrolling fbm body). The altar uses two nested flames + 34 fire sprites +
   16 smoke sprites. Torches are single sprites via `addTorch`. Point lights
   use `decay = 2` and short range — this is what fixed the earlier
   "sun inside the House" (over-bright emissive gold + un-decayed lights).
7. **Architecture** — land → skirt walls → plaza → stairs → outer walls →
   gates → Royal Stoa → colonnades → kitchens → inner court → Nicanor →
   altar → the House → river. Colliders are registered inline beside the
   geometry they guard.
8. **Figures** — `makeFigure(robeColor, sashColor)`; kohanim follow
   `KOHEN_PATHS` waypoint loops, Levites stand on steps and sway.
9. **Wonders** — `clickables[]`; every findable object carries
   `userData.id ∈ [0..15]`. Picking walks up the parent chain (`findId`).
   Quest gating lives in `collect(id)`.
10. **Audio** — lazily created `AudioContext`; `playShofar`, `playHarp`,
    `playTrumpet`, `playChime`. Then the **ambient bed**: `buildAmbience()`
    wires a persistent graph (brown-noise loop → lowpass = wind; the same
    loop → bandpass = fire; a delayed, lowpassed bus = song), and
    `mixAmbience(t, dt, nightAmt)` sets the three gains every frame from
    `camera.position`. Distances are measured to `ALTAR_POS` and `STEPS_POS`.
    Nothing sounds before the first gesture — browsers hold an
    `AudioContext` suspended until then, so `buildAmbience()` is called from
    `onDown` and `onKey`. `amb.on` is the single mute: it gates the four
    event sounds and zeroes `amb.master`.
11. **Walk mode** — `player` state, `groundHeight`, `resolveCollisions`,
    keyboard + dual-thumb touch input.
12. **Render loop** — environment easing, fire, wonders idle animation
    (including quest veiling of future rimonim), figures, doves, water.
13. **React UI** — quest banner, counter, mode chips, hints panel (locked
    hints show "still veiled"), toast, fact modal, completion card.

### React ⇄ Three bridges
State lives in React; the scene reads it through refs (`foundRef`, `questRef`,
`walkRef`, `nextRef`) and calls back through `apiRef.current`
(`openFact`, `toast`, `setNight`, `markFound`, `enterWalk`). Keep this pattern:
the Three effect runs exactly once; never re-create the scene on state change.

## Running it

**In Claude artifacts:** paste `Mikdash.jsx` as a React artifact — it uses only
`react` and `three`, both available. Progress persists via the artifact
storage API (`window.storage`); outside artifacts it degrades gracefully
(guarded, no crash, simply no persistence — swap in `localStorage` there).

**Locally:**
```bash
npm create vite@latest mikdash -- --template react
cd mikdash && npm i three@0.128.0
# drop Mikdash.jsx into src/, render <Mikdash /> from App.jsx
npm run dev
```
Note: written against three r128 API (works fine on newer, but
`CapsuleGeometry` was intentionally avoided and controls are custom — no
`OrbitControls` import needed).

**Deployed:** every push to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. Pages serves the site under the repository
name, so `vite.config.js` sets `base: "/mikdash/"` for builds only — rename the
repo and that string has to move with it, or every asset 404s.

## Roadmap

**Next (v4):**
- [ ] Avodah quest chain: after the sixteen, a second sequence of 8 —
      follow a kohen through a morning's service (terumat hadeshen → arrangement
      of the ma'aracha → ketoret → menorah), learning each station.
- [ ] Interior of the Heichal (currently sealed): shulchan, menorah, incense
      altar, the paroches; entry permitted only in quest order.
- [x] Ambient audio bed: wind, distant Levite song (generated), fire crackle. *(v3.1)*
- [ ] Shadow/perf pass: merge static geometry with `BufferGeometryUtils`,
      instanced columns, LOD for olive trees.

**Later (v5+):**
- [ ] Real-time clock integration: at local Friday dusk the trumpet sounds
      from the Trumpeting Stone and the scene shifts to Shabbat lighting.
- [ ] Shared leaderboard of completed journeys via `window.storage`
      (`shared: true`) — first-name + completion count only.
- [ ] Chagim scenes: sukkot on the plaza, Simchat Beit HaSho'eva at night
      (golden lamps, juggling torches — Sukkah 51a), Pesach crowds.
- [ ] Accessibility: reduced-motion mode, captions for all sounds,
      full keyboard picking.
- [ ] Localization: full Hebrew UI toggle; Russian, Spanish, French, German.

**Non-goals:** depicting the interior of the Kodesh HaKodashim; any imagery
of Hashem; combat or violence mechanics; real-money anything.

## Contributing

- Measurements: cite a source (pasuk / daf / Josephus §) in a comment beside
  any dimension you add — the codebase should read like a sourced sefer.
- Multiples of 8 for any new collection of hidden content.
- Every new wonder needs: geometry, a `DISCOVERIES` entry (title in Hebrew +
  English, teaching text with source, hint), optional sound/animation payload
  in the `onUp` switch, and — if state must persist — handling in `markFound`.
- Test both modes (orbit + walk), both times of day, desktop + touch.

---

*Built with reverence. May the study of the House count as its building —*
*ונשלמה פרים שפתינו.*
