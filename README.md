# מִקְדָּשׁ · MIKDASH

**An explorable 3D Beit HaMikdash — the prophetic floor plan of Yechezkel 40–48
rendered in the grandeur of a monumental white-stone precinct, with thirty-six
hidden wonders drawn from Tanach, Talmud, and archaeology.**

> "מִצִּיּוֹן מִכְלַל יֹפִי אֱלֹהִים הוֹפִיעַ" — Tehillim 50:2
> "Out of Zion, the perfection of beauty, G-d shone forth."

This README is the working design document. It documents everything a
contributor (human or AI) needs to continue building: the coordinate system,
the source texts behind every architectural decision, the code architecture,
and the roadmap toward a full game.

---

## Current state (v3.5 — "Thirty-Six")

One self-contained React component: `Mikdash.jsx` (React 18 + Three.js r128,
no other dependencies, no assets — every texture is generated procedurally at
runtime on `<canvas>`, every sound is synthesized with WebAudio, and the sky
and fire are GLSL shaders).

### Feature summary

| System | Status | Notes |
|---|---|---|
| Yechezkel floor plan (1 unit = 1 amah) | ✅ | 500×500 court, 3 gates, no west gate, sealed east gate |
| Monumental styling | ✅ | Drafted-margin ashlar, Royal Stoa, Hulda-style stairs, pilastered retaining walls, gold-plated Ulam facade, sea-wave marble, kalya orev spikes |
| GLSL sky (day ⇄ night timelapse) | ✅ | Sun/moon arcs, hashed twinkling stars, milky band, dithering |
| GLSL fire (altar) | ✅ | Four nested cones — an amber solid body, a blue heart, two additive glow shells — plus embers, blue sparks, smoke, and warm + blue point lights |
| Daylight contrast | ✅ | ACES tone mapping, a stronger sun against less ambient fill, stone mixed below white so the courses survive direct sun |
| Metals | ✅ | A procedural equirect environment (sky / haze / hillside) via `PMREMGenerator` — without it, `metalness ≈ 1` renders **black**, which is what the Ulam facade was doing |
| On-screen navigation | ✅ | Held buttons glide the camera: swing, tilt, zoom, home in orbit; turn and walk in first person. Arrow keys and WASD do the same in orbit |
| The fifteen steps sound | ✅ | Each step carries one degree of the ascent — click it and it rings, flashes, and puffs dust |
| Gold dust | ✅ | One sprite pool, thrown by anything worth celebrating; the counter pops when it ticks up |
| First-person walk mode | ✅ | WASD/arrows + drag-look, Shift to run, mobile dual-thumb controls, AABB collision, terrain height function |
| Animated figures | ✅ | 12 kohanim walking waypoint loops in the azarah; 6 Levites swaying on the fifteen steps — eighteen who answer when clicked |
| Thirty-six nistarot quest | ✅ | 18 rimonim + 18 wonders, sequential unlock with toast guidance + free-explore toggle |
| A ring of light on everything | ✅ | The rimonim float in one; the wonders, which are architecture and cannot float, carry one at their feet. Both hide once found |
| The Heichal is shut, and says so | ✅ | Striking the cedar doors answers — הַהֵיכָל סָגוּר — instead of leaving a visitor pressing at a wall. The interior is the next thing being built |
| The pesichah (opening) | ✅ | A first-visit card that teaches the ring-of-light affordance and names where wonder #1 waits; "Show me the first" flies the camera in. Shown once, ever |
| First-step rescue | ✅ | 40s with nothing found and the beacon rises over wonder #1 unasked; the banner's *Show me* gleams until the first find |
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
- **Light levels.** `renderer.toneMapping = ACESFilmic`, exposure `0.98`. Every
  stone texture is mixed a few percent below white (`ashlar` base `218,211,194`,
  marble `#e7e1d0`): with no headroom above 1.0 the drafted margins and courses
  clip into a flat sheet under a real sun. Day is a strong sun (2.35) against
  low ambient fill (0.46) so form reads; night is 0.26 / 0.17.
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
| Ten miracles in the Mikdash | Avot 5:5 |
| Thirteen shofar-shaped chests | Shekalim 6:5; 3:2 |
| Chamber of the Discreet | Shekalim 5:6; Rambam Matnot Aniyim 10:8 |
| The Claimant's Stone | Bava Metzia 28b |
| Chamber of Hewn Stone, the Sanhedrin | Middot 5:4; Sanhedrin 88b; Avodah Zarah 8b |
| A ramp and not steps | Shemot 20:23; Middot 3:3 |
| The shitin, from the six days of Creation | Sukkah 49a; Yoma 54a |
| Water Gate and the Shiloach flask | Middot 2:6; Sukkah 48b |
| Mount Moriah chosen before the building | Divrei HaYamim II 3:1; Bereishit Rabbah 14:8 |
| Aliyah la'regel, all Israel chaverim | Devarim 16:16; Shekalim 1:1; Chagigah 26a |
| Ben Katin's wheel and twelve spouts | Yoma 37a; Middot 3:6 |
| The golden vine over the entrance | Middot 3:8; Josephus, War 5.210 |
| Willows against the altar on Sukkot | Sukkah 45a |
| The flute of Simchat Beit HaSho'evah | Sukkah 51a |
| Trees of healing on the river's banks | Yechezkel 47:12; Sanhedrin 100a |
| The Shulchan lifted for the pilgrims | Menachot 29a; Chagigah 26b |
| The lottery that replaced the race | Yoma 22a; Tamid 1:2 |
| The wood offering and the fifteenth of Av | Ta'anit 26a, 28a, 30b |
| Red heifer, and the causeway of arches | Bamidbar 19; Parah 3:6; Yoma 14a |
| The Shechinah never left the Western Wall | Shemot Rabbah 2:2; Shir HaShirim Rabbah 2:9 |
| Eighteen who answer (kohanim + Levites) | Tamid 1–7; Bikkurim 3:2–4; Arachin 10b–11a; Ta'anit 27b |

**The Divine Name.** In English the House's Maker is written **Hashem**, or
**G-d** where a translation needs the word. Never "God" spelled out. Halachically
this is a chumra, not an obligation — the seven Names that may not be erased
(Shulchan Aruch YD 276:9) are the Hebrew ones, and the Shach (YD 179:11) holds
the erasure prohibition does not extend to other languages; a screen is not
writing at all by most contemporary poskim. But the cost of the hyphen is zero
and it makes the House comfortable for every visitor, so it is the house style.
The same rule bars any Hebrew Divine Name from appearing in the source or the UI
— quote pesukim around it, or use אלוקים / ה׳ if one is ever unavoidable.

**Content rule:** all hidden-object language uses Jewish framing only —
*nistarot* (hidden things), *rimonim* (pomegranates), wonders. No
"easter egg" terminology anywhere in UI or code comments.

**The number rule.** Every countable collection in this House is a **multiple of
18** — חי, life. Currently 36 nistarot (18 rimonim + 18 wonders), 18 figures who
answer (12 kohanim + 6 Levites), 18 doves. Thirty-six is חי twice and the count
of the hidden righteous, which is the right number for hidden things. The next
tier is 54. Two counts are fixed by their sources and are *not* subject to this
rule: the **fifteen** steps (Middot 2:5) and the **eleven** spices of the ketoret
(Keritot 6a) — a source always outranks the pattern.

**Ids are not indices.** `DISCOVERIES[0..15]` is the original circuit and must
never be reordered or inserted into: progress persists as a list of indices under
`mikdash-progress-v3`, so a shuffle would silently hand people the wrong findings.
New teachings are **appended**. That is why `RIMON_POS` carries an explicit `id`
per entry (ids 0–7 and 16–25) and the scene keeps a `rimonById` lookup instead of
indexing the array.

## Code architecture (single file, ordered top to bottom)

1. **Constants** — `C`, `HALF`, `STORE_KEY`, `DISCOVERIES[36]`,
   `RIMON_POS[18]` (each `{ id, pos }`), `KOHEN_VOICES[12]`, `LEVI_VOICES[6]`.
2. **Procedural textures** — `ashlar`, `seaWaveMarble`, `marbleTex`, `goldTex`,
   `cedarTex`, `groundTexture`, `pavingTex`, `cloudTex`, `fireSpriteTex`,
   `smokeSpriteTex`, `plaqueTex` (the לבית התקיעה inscription).
3. **`NOISE_GLSL`** — shared hash/value-noise/fbm chunk injected into shaders.
4. **Component setup** — renderer, scene, camera; persistent-storage load/save.
5. **Sky** — one `ShaderMaterial` dome; uniforms `uNight`, `uTime`, `uSunDir`,
   `uMoonDir`. Day/night is a single scalar eased in the render loop
   (`env.cur → env.target`), driving *every* light, fog, emissive and sprite
   tint. Never toggle instantaneously — always animate `env.target`.
6. **Fire** — `makeFlame(radius, height, { solid, blue, heartOnly })` returns a
   noise-displaced open cone. The altar stacks four of them, and the stack is
   the whole trick to a fire that works in both lights:

   | Cone | Blending | Role |
   |---|---|---|
   | `flameCore` | normal | saturated amber body — the silhouette that reads against sunlit stone |
   | `flameHeart` | normal, `heartOnly` | the blue heart: alpha exists only where it burns blue, drawn **last** so additive tongues cannot add white back into it |
   | `flameInner` / `flameOuter` | additive | the glow and the licking tongues |

   `uDay` (= `1 - e2`) drives the balance. **Additive light fades as the day
   comes up** — adding white to sunlit white stone yields white, so by day the
   fire must read as saturated body colour and by night as glow. The same
   scalar lifts the solid cone's opacity from 0.34 to 1.0. Embers and blue
   sparks follow the same rule. Point lights (warm above, blue at the hearth)
   use `decay = 2` and short range — this is what fixed the earlier "sun inside
   the House" (over-bright emissive gold + un-decayed lights).
7. **Architecture** — land → skirt walls → plaza → stairs → outer walls →
   gates → Royal Stoa → colonnades → kitchens → inner court → Nicanor →
   altar → the House → river. Colliders are registered inline beside the
   geometry they guard.
8. **Figures** — `makeFigure(robeColor, sashColor)`; kohanim follow
   `KOHEN_PATHS` waypoint loops, Levites stand on steps and sway.
8b. **Navigation** — `nav` holds a flag per direction; the render loop applies
    motion per frame so a long press glides instead of stepping. React only
    ever calls `apiRef.current.nav(key, on)`. A window-level `pointerup`
    releases every flag, so lifting a finger off a button cannot leave the
    camera drifting. `resetView()` returns to `HOME`.
9. **Wonders** — `clickables[]`; every findable object carries
   `userData.id ∈ [0..35]`. Picking walks up the parent chain (`findId`).
   `halos[]` lays a turning ring of light at the foot of every wonder that is
   not a rimon (a rimon floats inside its own ring), hidden once found. The
   cedar doors of the Ulam are in `clickables` too, carrying
   `userData.sealed` instead of an id — `onUp` checks for that first and
   answers with a toast.
   Quest gating lives in `collect(id)`. The fifteen steps are in `clickables`
   too, but carry `userData.step` instead of an id — `onUp` checks for that
   first, sounds the note, flashes the step's own cloned material and puffs
   dust. `burst(pos, opts)` drives one shared sprite pool for both.
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
13. **React UI** — the pesichah card, quest banner, counter, mode chips, hints
    panel (locked hints show "still veiled"), toast, fact modal, completion card.

### The first step
A visitor who cannot find wonder #1 never sees wonders 2–36, so the opening is
the one place where nothing is hidden. Three layers, each one cheaper to ignore
than the last:

1. **The pesichah card** (`opened` state, persisted in `STORE_KEY`) — shown once
   on the first visit, after `loaded` so the House fades in behind it. It names
   the affordance ("every hidden thing floats inside a slowly turning ring of
   gold light"), the controls, and where the first one waits. Its primary button
   calls `guideTo(0)`.
2. **The gleaming button** — the banner's *Show me* carries `.gleam` while
   `found.length === 0`, and only then.
3. **The unasked rescue** — a `setTimeout` that fires `guideTo(0)` after 40s of
   quest mode with nothing found. It is cleared the moment anything is found, so
   it can only ever fire for the first wonder.

Everything here keys off `found.length === 0`. Do not extend the ladder to later
wonders: by then the hint line and *Show me* are enough, and being led by the
hand stops being delight.

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

### Being found
`index.html` carries the whole search surface, because the rendered page has
none: a crawler that does not run scripts sees only `<div id="root">`. So the
static markup inside `#root` is real content — title, what the House is, what
waits in it — and React clears it on first render, which makes it a loading
screen for everyone else. Keep it accurate when the wonder count changes; it is
also the text Google shows.

Alongside it: `<link rel="canonical">`, Open Graph and Twitter card tags,
`schema.org/WebApplication` JSON-LD, and `public/og.png` (1200 × 630, a real
screenshot — regenerate it when the House changes noticeably). `public/`
contents are copied to the site root at build, so the sitemap publishes at
`/mikdash/sitemap.xml`.

**A robots.txt would do nothing here.** Crawlers only read it at the domain
root — `melaniesigrid.github.io/robots.txt` — which belongs to the user-site
repo, not this one. Nothing is blocked by default, so there is nothing to fix;
if this ever moves to its own domain, add one at the root then.

## Roadmap

**Next (v4) — going inside.** This is the most-asked-for thing and the House
does not do it yet: the Heichal is solid geometry with a collider across the
whole platform, so a visitor can walk up to the doors and no further. Since
v3.5 the doors at least answer when struck. The work to open them:

- [ ] Hollow the Heichal: replace the solid `wave` block with walls, floor and
      ceiling, and cut the doorway. The collider `addCollider(-238, -106, -45, 45)`
      has to become a wall-by-wall set, or a walker will still bounce off the
      inside of the House.
- [ ] Interior lighting: no daylight reaches it — the splayed windows
      (Melachim I 6:4, narrow outside and wide within) plus the menorah are the
      only sources. The environment easing (`env.cur → env.target`) drives every
      light in the scene, so an interior needs its own term or it will go dark
      with the sky.
- [ ] Furnish it: shulchan on the north, menorah on the south (Yoma 51b),
      the golden incense altar between them, and the paroches at the west.
- [ ] Stop at the paroches. The Kodesh HaKodashim stays closed — see non-goals.
      The paroches itself is the wall, and clicking it should teach why.
- [ ] Gate entry to quest order, and let a kohen walk in ahead of the visitor
      so nobody enters alone.
- [ ] Avodah quest chain: after the thirty-six, a sequence of 18 — follow a
      kohen through a morning's service (terumat hadeshen → arrangement of the
      ma'aracha → ketoret → menorah), learning each station.
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
of Hashem; spelling out the Divine Name in English; combat or violence mechanics; real-money anything.

## Contributing

- Measurements: cite a source (pasuk / daf / Josephus §) in a comment beside
  any dimension you add — the codebase should read like a sourced sefer.
- Multiples of 18 for any new collection — see "The number rule" above. Append
  new teachings to `DISCOVERIES`; never insert or reorder.
- Every new wonder needs: geometry, a `DISCOVERIES` entry (title in Hebrew +
  English, teaching text with source, hint), optional sound/animation payload
  in the `onUp` switch, and — if state must persist — handling in `markFound`.
- Test both modes (orbit + walk), both times of day, desktop + touch.

---

*Built with reverence. May the study of the House count as its building —*
*ונשלמה פרים שפתינו.*
