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
  trees, 108 grove trees, 216 + 108 bushes, 108 stones. Sourced counts (15
  steps, 11 spices) outrank it.
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
      in blossom (Shemot 25:33). A hundred and eight, חי times six.
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
- [x] **Swifts.** 18 of them working the walls, visible on a parabola over the
      day/night ease so they peak at dusk and vanish at both noon and midnight.
- [x] **The fox moves.** Paces below the stairs, head down to the scent and up
      again, eased turn.
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
- [x] **The azarah floor.** Root cause was a UV scale, not a material: the
      block's top face carried the wall's `repeat(1.6, 1)` across 260 amot. Now
      its own plane at ~26 amot per tile, with pale joints and a polish
      roughness map.
- [ ] **Wear and water on the court floor.** The slabs are uniform — no polish
      along the walked lines between Nicanor and the altar, no damp sheen near
      the laver. Both are what would make it read as *used*.
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
- [x] **Dust in the air.** 18 drifting sprites, depth-tested, peaking when the
      sun rakes low. Watch the opacity floor if the sun angle ever changes.
- [ ] **Shadow softening with distance.** PCF is uniform now; contact shadows
      should be tight and distant ones soft.

## Sound

- [x] **Melodies on the fifteen steps**, with the sounding note lit on a key
      strip and on the tread itself. Public domain only.
- [ ] **Verify the last transcription.** Hatikvah and Ma'oz Tzur have been
      re-entered note for note off the engraved scores in their Wikipedia
      articles and now carry `verified: true`. Shalom Aleichem is still from
      memory: Goldfarb's 1918 setting is public domain but no engraving of it
      has turned up to read from, so it stays flagged unverified in the UI.
      It is one line in `MELODIES`.
- [ ] **More melodies.** Eliyahu HaNavi, Adon Olam, Lecha Dodi (Alkabetz, Tzfat
      1540s) and Hava Nagila (Sadigura nigun via Idelsohn, ~1918) are all public
      domain and all fit the House.
- [ ] **Licence the two that are missing.** *Yerushalayim shel Zahav* and
      *Dance Me to the End of Love* would both belong here. They need a
      mechanical/synchronisation licence from the publishers — ACUM for Shemer,
      Sony/ATV for Cohen — not a code change.

- [ ] **The camels.** One low grunt, rarely, when the camera is near.
- [ ] **Footsteps in walk mode.** Different on marble, on paving, on dust — the
      surface is already known from `groundHeight()`.
- [x] **Wind bed follows the trees.** `gustAt()` is the JS twin of the shader's
      two sines, sampled at the camera and rectified for the ear.
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
- [x] **Frame-rate independence audit.** Found exactly one more: the doves, on a
      hard-coded 0.016. The kohanim were already correct. Everything else in the
      loop is driven from absolute `t`, which is inherently safe.
- [ ] **Mobile pass.** Shadow map now steps down on coarse pointers, but the
      tree count went up ninety-fold in mesh terms. Needs measuring on a real
      handset, not assumed.
- [x] **Merge the grove.** `mergeByMaterial()` — written locally rather than
      importing `BufferGeometryUtils`, which would have broken the no-new-import
      rule. ~1300 draw calls down to one per material.
- [ ] **Merge the rest.** The colonnades, the gate cells and the stair treads are
      all static and still one draw call each. Same helper applies; the only
      reason it has not been done is that some of them carry colliders and
      clickable ids, which merging would flatten.

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
