# TODO — the House, and what it still needs

Working backlog for beauty, life and craft. The roadmap in
[README.md](README.md#roadmap) holds the big structural moves (going inside the
Heichal, the avodah quest chain, the chagim). This file is the finer grain: the
things that make the place feel inhabited rather than modelled.

Ordered within each section by impact per hour. Anything marked ✅ is done and
kept here so the reasoning survives.

---

## Rules that constrain everything below

Before adding anything to this list, check it against these. They are not
preferences.

- **No tree, ever, in the azarah.** Devarim 16:21 — לֹא־תִטַּע לְךָ אֲשֵׁרָה
  כָּל־עֵץ אֵצֶל מִזְבַּח ה'. Rambam (Hilchot Avodah Zarah 6:9) reads כל עץ
  literally: a tree planted anywhere in the courtyard incurs lashes, even one
  planted for the House's beauty. `plantable()` enforces it in code.
- **Multiples of 18** for any countable collection — see the number rule in the
  README. Currently: 36 nistarot, 18 figures who answer, 18 doves, 18 river
  trees, 90 grove trees. Sourced counts (15 steps, 11 spices) outrank it.
- **Ids are append-only.** `DISCOVERIES` indices are persisted. Never insert,
  never reorder.
- **Cite the measurement.** A pasuk, daf or Josephus § in a comment beside any
  dimension added.
- **No new runtime dependency.** `react` + `three` and nothing else, so the
  component still pastes into an artifact. This is what ruled out an
  `EffectComposer` for ambient occlusion.

---

## Landscape and living things

- [x] **Seven tree species, each sourced** — date palm (Yechezkel 40:16 carves
      תִּמֹרִים on the gates), cypress (Yeshayahu 60:13, "to beautify the place
      of My sanctuary"), olive, pomegranate, fig, carob (Ta'anit 23a), almond
      in blossom (Shemot 25:33). Ninety of them, חי times five.
- [x] **Camels of the nations** — Yeshayahu 60:6, bearing gold and frankincense,
      couched below the southern stairs. Same chapter as the cypress.
- [x] **River banks planted only with food trees** — Yechezkel 47:12 says
      כָּל־עֵץ מַאֲכָל specifically. Eighteen, nine a side.
- [x] **Wind.** Vertex-shader sway on the merged grove, weight baked per vertex
      at merge time, amplitude per species. The cheap per-frond rotation this
      entry originally proposed was no longer possible once the grove merged —
      which is the better outcome.
- [ ] **Wind should move the shadows too.** The depth material is unpatched, so
      a swaying tree casts a still shadow. Needs `customDepthMaterial` carrying
      the same displacement.
- [x] **Ground cover.** 216 bushes biased toward the precinct, a 108-bush fringe
      spilling over the paving edge, 108 half-buried stones. Merged and swayed.
- [ ] **Birds beyond the doves.** Swifts over the walls at dusk. Jerusalem's
      swifts are a real and famous thing, and they are cheap: instanced quads on
      curved paths, only visible near sunset.
- [ ] **The fox should move.** Makkot 24b is a fox *emerging from* the Holy of
      Holies; it currently sits still. Even a slow head-turn would land it.
- [ ] **A flock of sheep** on the approach road. Pilgrims brought animals up;
      most korbanot walked to Jerusalem. Also solves the empty middle distance.
- [ ] **Terraced hillside.** The Judean hills around Jerusalem are terraced for
      olives and vines, and terracing would read instantly as "this place is
      farmed" rather than "this is a heightfield".

## Material and light

- [x] Derived normal + roughness maps from every colour map.
- [x] Linear colour pipeline (sRGB in, linear shading, sRGB out).
- [x] Vertex-baked ambient occlusion on walls and columns.
- [x] Water: scrolling ripple normal + sky reflection.
- [ ] **The azarah floor is the flattest surface left.** It is a large pale
      marble plane with almost no variation, and it is the most-looked-at floor
      in the House. Wants slab layout, wear polish along the walked lines, and a
      damp sheen near the laver.
- [ ] **Verify the water up close.** Confirmed at distance only. At a low angle
      the sky reflection is doing the work, and the ripple `repeat(9, 1.4)`
      could read as a conveyor belt. Needs a proper low camera pass.
- [ ] **Ashlar still tiles** on the longest retaining walls, at a period the eye
      can find. Widening the map to 1024×512 halved the frequency; the next step
      is a second detail normal at a non-aligning scale, which costs nothing but
      breaks the map/relief correspondence — needs a judgment call.
- [ ] **Gold wants anisotropy.** Beaten plate scatters along the hammer marks,
      not evenly. `MeshPhysicalMaterial` has `anisotropy` in newer three; on
      r128 this would need a custom `onBeforeCompile`.
- [ ] **Dust in the air.** A few large, very faint sprites low over the plaza,
      lit from behind at dawn and dusk. This is most of what sells heat and
      scale in film.
- [ ] **Shadow softening with distance.** PCF is uniform now; contact shadows
      should be tight and distant ones soft.

## Sound

- [ ] **The camels.** One low grunt, rarely, when the camera is near.
- [ ] **Footsteps in walk mode.** Different on marble, on paving, on dust — the
      surface is already known from `groundHeight()`.
- [ ] **Wind should follow the trees.** The ambient wind bed and the (not yet
      built) frond motion should share one gust signal, or they will disagree.
- [ ] **Distance-attenuate the fifteen steps.** They ring at full volume from
      anywhere in the precinct.

## Craft and correctness

- [ ] **`harp-test.html`, `elev.mjs`, `steps-elevation.svg`** are committed dev
      scratch. Decide: delete, or move under a `tools/` directory and gitignore
      the output.
- [ ] **A debug-camera guard.** A harp inspection rig shipped as the opening
      shot in `ff3a997` and reached production. `orbit` now spreads from `HOME`
      so they cannot diverge, but a cheap assertion — opening radius must exceed
      the precinct's half-diagonal — would have caught it before deploy.
- [ ] **Frame-rate independence audit.** The day/night ease was a fixed fraction
      per frame; the same bug shape likely exists in the dove flight, the
      figures' walk cycle and the fox. Anything using a bare per-frame constant
      instead of `dt`.
- [ ] **Mobile pass.** Shadow map now steps down on coarse pointers, but the
      tree count went up ninety-fold in mesh terms. Needs measuring on a real
      handset, not assumed.
- [ ] **Merge static geometry.** `BufferGeometryUtils.mergeBufferGeometries` for
      the colonnades and the grove; instanced columns; LOD on trees. The grove
      alone is several hundred draw calls that never change.

## Ideas worth considering, not yet decided

- **The 54th tier.** The number rule's next step past 36 is 54 — eighteen more
  nistarot. There is no shortage of candidates (the lishkat ha-gazit's seating,
  the mikvaot under the courts, the chotam seals, Nikanor's other door).
- **Seasons.** The almond blossoms in Shevat and nothing else in the land does;
  a date-aware scene could put it in flower for those weeks only.
- **A cameleer, or not.** Adding a human figure muddies "eighteen who answer" —
  a visitor who clicks him and gets nothing has been told a small lie. If he is
  added he should answer, which means the count goes to 36 figures.
- **Camel count.** Three reads as "a caravan arrived". Yeshayahu 60:6 says
  שִׁפְעַת גְּמַלִּים, a *multitude* — if this ever grows it should go to 18 and
  become a road of them coming up, not a parking lot.
