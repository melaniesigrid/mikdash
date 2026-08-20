<div align="center">

# מִקְדָּשׁ · MIKDASH

**An explorable 3D Beit HaMikdash — the prophetic floor plan of Yechezkel 40–48
rendered in the grandeur of a monumental white-stone precinct, with thirty-six
hidden wonders drawn from Tanach, Talmud, and archaeology.**

[**→ Walk through it**](https://melaniesigrid.github.io/mikdash/)

[![React 18](https://img.shields.io/badge/React-18.3-61dafb?logo=react&logoColor=white)](https://react.dev)
[![Three.js r128](https://img.shields.io/badge/Three.js-r128-000000?logo=three.js&logoColor=white)](https://threejs.org)
[![Vite 5](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![WebGL](https://img.shields.io/badge/WebGL-GLSL_shaders-990000)](#the-graphics)
[![Zero assets](https://img.shields.io/badge/art_assets-0-brightgreen)](#everything-you-see-is-generated-at-runtime)
[![PBR](https://img.shields.io/badge/PBR-derived_normal_%2B_roughness-4c8)](#the-graphics)
[![GitHub Pages](https://img.shields.io/badge/deploy-GitHub_Actions_→_Pages-222?logo=githubactions&logoColor=white)](.github/workflows/deploy.yml)

</div>

> "מִצִּיּוֹן מִכְלַל יֹפִי אֱלֹהִים הוֹפִיעַ" — Tehillim 50:2
> "Out of Zion, the perfection of beauty, G-d shone forth."

---

## What this is

A 500 × 500 amah temple precinct you can walk through in a browser tab. Not a
render, not a video — a real-time WebGL scene where every wall is placed at the
measurement its source gives, and clicking a thing teaches you why it is there.

Two ways to be in it: **orbit** the House from above, or **walk** it at eye
height (3.4 amot) with collision, terrain, and stairs that actually climb.
Hidden inside are **thirty-six nistarot** — eighteen golden pomegranates and
eighteen pieces of architecture that turn out to have a story — each one
footnoted to a pasuk, a daf of gemara, Josephus, or a catalogued artifact.

**Nothing is downloaded but the code.** Every stone texture, every flame, the
sky, the marble, the gold, the shofar, the Levites' song — all of it is
computed on the visitor's machine at load. The entire experience ships as one
216 KB gzipped JavaScript file.

---

## At a glance

| | |
|---|---|
| **Live** | [melaniesigrid.github.io/mikdash](https://melaniesigrid.github.io/mikdash/) |
| **Version** | v3.13 — "The Levites' Steps Can Be Played" ([CHANGELOG](CHANGELOG.md)) · backlog in [TODO.md](TODO.md) |
| **Runtime dependencies** | 3 — `react`, `react-dom`, `three`. That's the whole list. |
| **Source** | 3,114 lines in one component, [`src/Mikdash.jsx`](src/Mikdash.jsx) |
| **Art assets shipped** | **0** — 14 canvas texture generators, 14 derived normal maps, 10 derived roughness maps, 2 GLSL shaders |
| **Audio files shipped** | **0** — 6 synthesized instruments, a 3-layer ambient bed, and 4 melodies as note data |
| **Bundle** | 780 KB raw / **218 KB gzipped**, single chunk, no CSS file |
| **Findable content** | 36 sourced teachings across 40 cited primary sources |
| **Planting** | 7 tree species, 108 in the grove + 18 on the river banks, none inside the courts (Devarim 16:21) |
| **Persistence** | `window.storage`, with a `localStorage` shim for the open web |
| **Deploy** | Push to `main` → GitHub Actions → Pages, no manual step |

---

## The stack

```
React 18.3          UI, quest state, the modal/toast/banner layer
  └─ refs ──────►   Three.js r128   scene graph, WebGLRenderer, raycasting
                      ├─ GLSL         sky dome + altar flame (custom ShaderMaterial)
                      ├─ <canvas>2D   every texture, drawn at runtime
                      ├─ PMREM        procedural environment map so metals aren't black
                      └─ WebAudio     6 instruments + a per-frame ambient mix
Vite 5.4            dev server, single-chunk production build
GitHub Actions      npm ci → vite build → upload-pages-artifact → deploy-pages
```

**Why one file, one component.** The Three.js scene is built once inside a
single `useEffect` that never re-runs. React state lives in React; the scene
reads it through refs (`foundRef`, `questRef`, `walkRef`, `nextRef`) and calls
back through an imperative handle (`apiRef.current.openFact`, `.toast`,
`.setNight`, `.markFound`, `.enterWalk`). No state change ever re-creates the
renderer — that's the difference between a scene that holds 60fps and one that
stutters every time a toast appears.

**Why Three r128 exactly.** The component was written against the r128 API and
avoids anything newer on purpose (no `CapsuleGeometry`, no `OrbitControls` —
the camera rig is hand-rolled so held buttons *glide* instead of stepping). It
runs fine on newer Three; the pin just means the pinned version is the tested
one.

---

## Everything you see is generated at runtime

There is no `/textures` folder. There is no `/audio` folder. `public/` holds a
sitemap and one social card, and that is all.

### The textures — 14 generators, all `<canvas>` 2D

| Generator | What it draws |
|---|---|
| `ashlar()` | Drafted-margin Herodian masonry — parametrized courses, columns, bevels |
| `pavingTex` | Court flagstone: courses of differing height, slabs of differing width, staggered, worn brighter where feet have polished them |
| `seaWaveMarble()` | The white-and-blue-green stone the gemara compares to the waves of the sea |
| `marbleTex` · `flutedTex` | Plain marble; column fluting in *n* bands |
| `goldTex` · `cedarTex` | Beaten gold plate; cedar grain for the Ulam doors |
| `groundTexture` | Judean dust — fine grain and faint streaks, with nothing large enough to be recognisable when it tiles 26 times across the plain |
| `envSkyTex` | An **equirectangular environment map** — sky, haze, hillside |
| `cloudTex` · `fireSpriteTex` · `smokeSpriteTex` · `blueSpriteTex` | Sprite atlases for clouds, embers, smoke, blue sparks |
| `plaqueTex` | The לבית התקיעה inscription, letter by letter |

That `envSkyTex` line hides a real bug fix worth knowing: **`metalness ≈ 1`
renders black without an environment map**, because a perfect mirror with
nothing to mirror reflects nothing. The gold-plated Ulam facade was a black
wall until a procedural equirect map was generated and pushed through
`PMREMGenerator`.

### The graphics

**Relief is derived, not drawn.** A colour map on its own gives a wall that is
a *photograph* of stone — the drafted margin is painted on, so it stays painted
on no matter where the sun is. What makes ashlar read as carved is the margin
catching light on one side and holding shadow on the other, and that needs a
normal map. Rather than ship one, `normalFromCanvas()` reads the canvas back,
treats luminance as height, and Sobels it into a tangent-space normal;
`roughFromCanvas()` remaps the same luminance into a narrow roughness band, so
the highlight breaks up across a surface instead of sliding over it. Fourteen
normal maps and ten roughness maps, all computed on the visitor's machine, all
guaranteed to match their colour map because they are made from it. Sampling
wraps, so relief tiles with the map instead of seaming at every repeat.

The flutes on the Royal Stoa columns are the extreme case: twenty-two grooves
drawn as gradient bands on a 512×32 strip, turned into relief that curves a
plain cylinder. It is the one place in the House where the derived map is doing
the entire job of geometry.

**The pipeline is linear.** `outputEncoding` was never set, which meant lighting
maths ran on sRGB numbers and got written out unconverted — the single reason
the courts read milky, with lifted shadows and flat midtones that no amount of
light tuning could fix. Canvas maps now declare `sRGBEncoding`; derived normal
and roughness maps stay linear because they are data, not colour; and both
hand-written shaders carry `#include <encodings_fragment>`, since three only
appends the output conversion to its own materials. Every colour that had been
picked by eye against the old output — the sky ramps, the fog, the hemisphere
and sun/moon colours, the foliage — was linearised to match.

**Occlusion is baked into vertex colours.** A wall used to meet the pavement at
a clean bright seam, because a sun plus a hemisphere fill has no way to know
that the foot of a wall sees less sky than its top. The honest fix is a
screen-space AO pass, but that means an `EffectComposer` and an import from
`three/examples/jsm`, which would end the `react` + `three` and nothing else
rule that lets this paste into an artifact. So `bakeAO()` darkens vertices
toward the foot of every box and cylinder over 16 amot tall, with the gradient
measured in world units — a 60-amah retaining wall and a 20-amah gate pier get
the same depth of shadow at the ground, rather than shadow proportional to how
tall they happen to be. No passes, no per-frame cost.

**Two custom `ShaderMaterial`s**, sharing one injected GLSL chunk
(`NOISE_GLSL` — hash, value noise, fbm):

1. **The sky dome.** Uniforms `uNight`, `uTime`, `uSunDir`, `uMoonDir`. Sun and
   moon travel real arcs; stars are hash-twinkled; there's a milky band and
   dithering to kill gradient banding on cheap panels.

2. **The altar fire** — four nested noise-displaced cones, and the stack *is*
   the trick:

   | Cone | Blending | Role |
   |---|---|---|
   | `flameCore` | normal | saturated amber body — the silhouette that reads against sunlit stone |
   | `flameHeart` | normal, `heartOnly` | the blue heart: alpha exists only where it burns blue, drawn **last** so additive tongues can't add white back into it |
   | `flameInner` / `flameOuter` | additive | glow, and the licking tongues |

   **Additive light fades as the day comes up.** Adding white to sunlit white
   stone gives you white. So `uDay` drives the balance: by day the fire reads
   as saturated body colour, by night as glow — and the same scalar lifts the
   solid cone's opacity from 0.34 to 1.0. Embers and sparks follow the rule.

**Day ⇄ night is one eased scalar.** `env.cur → env.target` drives *every*
light, fog colour, emissive value and sprite tint in the scene, every frame.
Nothing is ever toggled instantly.

**Filtering and shadows.** Anisotropy is read from `renderer.capabilities` and
capped at 8 — left at the default of 1, a 500-amah plaza and every colonnade
roof running away from the camera blur to grey a third of the way to the
horizon. The sun's shadow frustum is tightened to the built precinct (±430) and
its map goes to 4096 where the GPU's texture cap allows it; at the old 2048
over 1120 amot, one shadow texel covered half an amah, coarser than the stones
it was shadowing. `bias` and `normalBias` are set, which the normal maps made
necessary: acne that is invisible on flat shading crawls over relief.

**Lighting is tuned to survive a real sun.** ACES filmic tone mapping at
exposure 0.78, and every stone texture mixed a few percent *below* white
(ashlar base `218,211,194`) — with no headroom above 1.0, the drafted margins
and courses clip into a flat sheet. Day: sun 2.35 against ambient fill 0.62.
Night: 0.26 / 0.26. The fill did not come all the way back after the colour-space
fix, because some of what it was adding was exactly the flatness the pass set
out to remove: a shadowed wall should fall away, not sit at three-quarter
brightness.

**Day ⇄ night eases in real time, not frames.** The ramp was a fixed fraction
per frame, so the sun set two and a half times faster on a 144Hz laptop than a
60Hz one — and this is the animation every light, the fog, and every emissive
and sprite tint keys off. The constant is chosen so 60Hz behaves exactly as it
always did.

### The sound

An `AudioContext` created lazily on the first gesture (browsers keep it
suspended until then, so `buildAmbience()` is called from `onDown`/`onKey`).

- **Six synthesized instruments**: `playShofar` (tekiah), `playHarp` (a
  freygish arpeggio), `playTrumpet` (the Shabbat fanfare from the Trumpeting
  Stone), `playChime` (ketoret), `playFlute`, `playStep`.
- **A three-layer ambient bed, mixed per frame from camera position**: one
  brown-noise loop → lowpass = *wind* (rises with height and at night); the
  same loop → bandpass = *the fire of the ma'aracha* (near the altar); a
  delayed, lowpassed bus = *the Levites' song* (near the fifteen steps).
  Distances are measured to `ALTAR_POS` and `STEPS_POS`.
- **The fifteen steps are a fifteen-note instrument.** Each carries one degree
  of the Shir HaMa'alot ascent — click one and it rings its own note, flashes
  its own cloned material, and puffs dust.
- One ♪ / ⃠ control gates all of it, event sounds included.

### Walking it

`groundHeight(x, z)` is the single source of truth for walkable elevation and
includes all four stair ramps. `colliders[]` holds world-space AABBs registered
inline beside the geometry they guard (23 of them); `resolveCollisions()`
pushes the player out along the axis of minimum penetration. A step taller than
3.2 amot cannot be climbed. Desktop gets WASD/arrows + drag-look + Shift to
run; mobile gets dual-thumb controls.

---

## Current state (v3.13 — "The Levites' Steps Can Be Played")

| System | Status | Notes |
|---|---|---|
| Yechezkel floor plan (1 unit = 1 amah) | ✅ | 500×500 court, 3 gates, no west gate, sealed east gate |
| Monumental styling | ✅ | Drafted-margin ashlar, Royal Stoa, Hulda-style stairs, pilastered retaining walls, gold-plated Ulam facade, sea-wave marble, kalya orev spikes |
| Derived PBR relief | ✅ | 14 normal maps + 10 roughness maps Sobelled from the colour maps at load — carved stone, beaten gold, twenty-two column flutes made of nothing but normal map |
| Linear colour pipeline | ✅ | sRGB in, linear shading, sRGB out; both hand-written shaders carry `encodings_fragment`; every hand-picked colour relit to match |
| Baked ambient occlusion | ✅ | Vertex-colour grounding on every box and cylinder over 16 amot, in world units — no post-processing, no per-frame cost |
| Filtering + shadows | ✅ | Anisotropy from `capabilities` (cap 8), shadow frustum tightened to the precinct, 4096 map where the GPU allows, bias + normalBias |
| Landform | ✅ | Hills displaced by sinusoids in spherical coordinates; no canopy silhouette is a circle |
| Seven sourced species | ✅ | Palm, cypress, olive, pomegranate, fig, carob, almond — each cited; palm fronds arch on nested pivots, cypresses built from three leaning tiers |
| No tree in the azarah | ✅ | `plantable()` enforces Devarim 16:21 / Rambam Hilchot Avodah Zarah 6:9 across all 126 trees |
| Camels of the nations | ✅ | Yeshayahu 60:6, bearing gold and frankincense, couched below the southern stairs |
| Wind | ✅ | Vertex-shader sway on the merged grove; weight baked per vertex at merge time as height above each tree's own foot, squared, so canopies don't shear off their trunks. Per-species amplitude |
| Ground cover | ✅ | 216 bushes biased toward the precinct, a 108-bush fringe spilling over the paving edge to break the join, 108 half-buried stones — all merged and swayed |
| A paved azarah | ✅ | Its own plane at ~26 amot per tile. It had been the block's top face, carrying the wall's `repeat(1.6, 1)` across 260 amot |
| Dust in the air | ✅ | 18 drifting depth-tested sprites, peaking when the sun rakes low |
| Melodies on the steps | ✅ | Four public-domain melodies scheduled on the audio clock; the sounding note lights a key strip and its own tread in the courts. Copyrighted songs are deliberately excluded, and unverified transcriptions say so in the UI |
| A panel for the peace | ✅ | Yeshayahu 2:4 and 56:7, Micah 4:4, Rambam Hilchot Melachim 12:5, Tehillim 122:6 |
| Merged static geometry | ✅ | `mergeByMaterial()` bakes world transforms and concatenates by material — the grove drops from ~1300 draw calls to one per material, with no `examples/jsm` import |
| GLSL sky (day ⇄ night timelapse) | ✅ | Sun/moon arcs, hashed twinkling stars, milky band, dithering |
| GLSL fire (altar) | ✅ | Four nested cones, embers, blue sparks, smoke, warm + blue point lights |
| Daylight contrast | ✅ | ACES tone mapping, strong sun against low ambient fill, stone mixed below white so the courses survive direct sun |
| Metals | ✅ | Procedural equirect environment via `PMREMGenerator` |
| On-screen navigation | ✅ | Held buttons glide the camera: swing, tilt, zoom, home in orbit; turn and walk in first person. Arrow keys and WASD do the same in orbit |
| The fifteen steps sound | ✅ | Each step carries one degree of the ascent — click it and it rings, flashes, and puffs dust |
| Gold dust | ✅ | One sprite pool, thrown by anything worth celebrating; the counter pops when it ticks up |
| First-person walk mode | ✅ | WASD/arrows + drag-look, Shift to run, mobile dual-thumb controls, AABB collision, terrain height function |
| Animated figures | ✅ | 12 kohanim walking waypoint loops in the azarah; 6 Levites swaying on the fifteen steps — eighteen who answer when clicked |
| Thirty-six nistarot quest | ✅ | 18 rimonim + 18 wonders, sequential unlock with toast guidance + free-explore toggle |
| A ring of light on everything | ✅ | The rimonim float in one; the wonders, which are architecture and cannot float, carry one at their feet. Both hide once found |
| The Heichal is shut, and says so | ✅ | Striking the cedar doors answers — הַהֵיכָל סָגוּר — instead of leaving a visitor pressing at a wall |
| The pesichah (opening) | ✅ | A first-visit card that teaches the ring-of-light affordance and names where wonder #1 waits. Shown once, ever |
| First-step rescue | ✅ | 40s with nothing found and the beacon rises over wonder #1 unasked |
| Persistent progress | ✅ | `window.storage` key `mikdash-progress-v3` (found list + day/night pref), `localStorage` shim outside artifacts |
| WebAudio events | ✅ | Shofar tekiah, freygish harp arpeggio, Shabbat trumpet fanfare, ketoret chime, flute, step tones |
| Ambient bed | ✅ | Wind, fire, Levites' ascent — mixed per frame, one ♪ / ⃠ switch silences everything |
| Search + sharing surface | ✅ | Canonical URL, OG/Twitter cards, JSON-LD, sitemap, real prose inside `#root` for crawlers |
| Frame-rate independent easing | ✅ | The day/night ramp is time-based, so the sun sets at one speed on every machine |
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

---

## Textual sources — the "why" behind every shape

Forty primary sources. Nothing in this House is invented; where the sources
disagree, the Yechezkel plan wins, because that is the House this is.

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
| Palms carved on the gates and Heichal walls | Yechezkel 40:16, 26, 31; 41:18 |
| Cypress planted to beautify the Sanctuary | Yeshayahu 60:13 |
| No tree may be planted in the courtyard | Devarim 16:21; Rambam Hilchot Avodah Zarah 6:9 |
| Only trees of food on the river's banks | Yechezkel 47:12 |
| Carob, and planting for one's children | Ta'anit 23a |
| Almond — the menorah's cups, Aharon's staff | Shemot 25:33; Bamidbar 17:23 |
| Fig — each man under his vine and fig tree | Melachim I 5:5; Micah 4:4 |
| Camels bearing gold and frankincense | Yeshayahu 60:6; Keritot 6a; Vayikra 24:7 |
| Swords into plowshares, on this mountain | Yeshayahu 2:2–4; Micah 4:3–4 |
| A house of prayer for all peoples | Yeshayahu 56:7 |
| No famine, no war, no envy, in that time | Rambam Hilchot Melachim 12:5 |
| Pray for the peace of Jerusalem | Tehillim 122:6 |
| Two angels walk a person home on Shabbat eve | Shabbat 119b; Tikkunei Shabbat, Prague 1641 |
| The Levites played on the fifteen steps | Middot 2:5; Sukkah 51b |

### House rules

**The Divine Name.** In English the House's Maker is written **Hashem**, or
**G-d** where a translation needs the word. Never "God" spelled out.
Halachically this is a chumra, not an obligation — the seven Names that may not
be erased (Shulchan Aruch YD 276:9) are the Hebrew ones, and the Shach (YD
179:11) holds the erasure prohibition does not extend to other languages; a
screen is not writing at all by most contemporary poskim. But the cost of the
hyphen is zero and it makes the House comfortable for every visitor, so it is
the house style. The same rule bars any Hebrew Divine Name from appearing in
the source or the UI — quote pesukim around it, or use אלוקים / ה׳ if one is
ever unavoidable.

**Content rule.** All hidden-object language uses Jewish framing only —
*nistarot* (hidden things), *rimonim* (pomegranates), wonders. No "easter egg"
terminology anywhere in UI or code comments.

**The number rule.** Every countable collection in this House is a **multiple
of 18** — חי, life. Currently 36 nistarot (18 rimonim + 18 wonders), 18 figures
who answer (12 kohanim + 6 Levites), 18 doves. Thirty-six is חי twice and the
count of the hidden righteous, which is the right number for hidden things. The
next tier is 54. Two counts are fixed by their sources and are *not* subject to
this rule: the **fifteen** steps (Middot 2:5) and the **eleven** spices of the
ketoret (Keritot 6a) — a source always outranks the pattern.

**Ids are not indices.** `DISCOVERIES[0..15]` is the original circuit and must
never be reordered or inserted into: progress persists as a list of indices
under `mikdash-progress-v3`, so a shuffle would silently hand people the wrong
findings. New teachings are **appended**. That is why `RIMON_POS` carries an
explicit `id` per entry (ids 0–7 and 16–25) and the scene keeps a `rimonById`
lookup instead of indexing the array.

---

## Code architecture

[`src/Mikdash.jsx`](src/Mikdash.jsx), top to bottom:

1. **Constants** — `C`, `HALF`, `STORE_KEY`, `DISCOVERIES[36]`,
   `RIMON_POS[18]` (each `{ id, pos }`), `KOHEN_VOICES[12]`, `LEVI_VOICES[6]`.
2. **Procedural textures** — the 14 `<canvas>` generators listed above.
3. **`NOISE_GLSL`** — shared hash/value-noise/fbm chunk injected into shaders.
4. **Component setup** — renderer, scene, camera; persistent-storage load/save.
5. **Sky** — one `ShaderMaterial` dome. Day/night is a single scalar eased in
   the render loop (`env.cur → env.target`). Never toggle instantaneously —
   always animate `env.target`.
6. **Fire** — `makeFlame(radius, height, { solid, blue, heartOnly })` returns a
   noise-displaced open cone; the altar stacks four. Point lights (warm above,
   blue at the hearth) use `decay = 2` and short range — this is what fixed the
   earlier "sun inside the House" (over-bright emissive gold + un-decayed
   lights).
7. **Architecture** — land → skirt walls → plaza → stairs → outer walls →
   gates → Royal Stoa → colonnades → kitchens → inner court → Nicanor →
   altar → the House → river. Colliders are registered inline beside the
   geometry they guard.
8. **Figures** — `makeFigure(robeColor, sashColor)`; kohanim follow
   `KOHEN_PATHS` waypoint loops, Levites stand on steps and sway.
   **8b. Navigation** — `nav` holds a flag per direction; the render loop
   applies motion per frame so a long press glides instead of stepping. React
   only ever calls `apiRef.current.nav(key, on)`. A window-level `pointerup`
   releases every flag, so lifting a finger off a button cannot leave the
   camera drifting. `resetView()` returns to `HOME`.
9. **Wonders** — `clickables[]`; every findable object carries
   `userData.id ∈ [0..35]`. Picking walks up the parent chain (`findId`).
   `halos[]` lays a turning ring of light at the foot of every wonder that is
   not a rimon (a rimon floats inside its own ring), hidden once found. The
   cedar doors of the Ulam are in `clickables` too, carrying `userData.sealed`
   instead of an id — `onUp` checks for that first and answers with a toast.
   Quest gating lives in `collect(id)`. The fifteen steps are also in
   `clickables`, carrying `userData.step`. `burst(pos, opts)` drives one shared
   sprite pool for both.
10. **Audio** — lazy `AudioContext`; the six instruments, then `buildAmbience()`
    (persistent graph) and `mixAmbience(t, dt, nightAmt)` (per-frame gains from
    camera position). `amb.on` is the single mute.
11. **Walk mode** — `player` state, `groundHeight`, `resolveCollisions`,
    keyboard + dual-thumb touch input.
12. **Render loop** — environment easing, fire, wonders idle animation
    (including quest veiling of future rimonim), figures, doves, water.
13. **React UI** — the pesichah card, quest banner, counter, mode chips, hints
    panel (locked hints show "still veiled"), toast, fact modal, completion card.

### The first step

A visitor who cannot find wonder #1 never sees wonders 2–36, so the opening is
the one place where nothing is hidden. Three layers, each cheaper to ignore
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

Everything here keys off `found.length === 0`. Do not extend the ladder to
later wonders: by then the hint line and *Show me* are enough, and being led by
the hand stops being delight.

---

## Running it

```bash
git clone https://github.com/melaniesigrid/mikdash.git
cd mikdash
npm install
npm run dev        # vite dev server
npm run build      # → dist/, single chunk
npm run preview    # serve the production build locally
```

**Inside Claude artifacts:** paste `src/Mikdash.jsx` as a React artifact — it
uses only `react` and `three`, both available there. Progress persists through
the artifact storage API (`window.storage`).

**On the open web:** [`src/main.jsx`](src/main.jsx) shims `window.storage` over
`localStorage` before mounting, so the same component persists either way with
no branching inside it.

**Deploy:** every push to `main` builds and publishes to GitHub Pages via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Pages serves
under the repository name, so `vite.config.js` sets `base: "/mikdash/"` *for
builds only* — rename the repo and that string has to move with it, or every
asset 404s.

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

---

## Roadmap

**Next (v4) — going inside.** The most-asked-for thing, and the House does not
do it yet: the Heichal is solid geometry with a collider across the whole
platform, so a visitor can walk up to the doors and no further. Since v3.5 the
doors at least answer when struck. The work to open them:

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

**Non-goals:** depicting the interior of the Kodesh HaKodashim; any imagery of
Hashem; spelling out the Divine Name in English; combat or violence mechanics;
real-money anything.

---

## Contributing

- **Cite your measurements.** A pasuk / daf / Josephus § in a comment beside any
  dimension you add — the codebase should read like a sourced sefer.
- **Multiples of 18** for any new collection — see "The number rule" above.
- **Append, never insert**, into `DISCOVERIES`. Ids are persisted.
- Every new wonder needs: geometry, a `DISCOVERIES` entry (title in Hebrew +
  English, teaching text with source, hint), optional sound/animation payload in
  the `onUp` switch, and — if state must persist — handling in `markFound`.
- Test both modes (orbit + walk), both times of day, desktop + touch.

---

<div align="center">

*Built with reverence. May the study of the House count as its building —*
*ונשלמה פרים שפתינו.*

</div>
