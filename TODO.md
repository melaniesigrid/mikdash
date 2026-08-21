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
- [x] **Wind moves the shadows too.** `swayPatch()` is lifted out of the
      surface material and compiled into a `customDepthMaterial` as well, so the
      gust in the depth pass is the identical arithmetic — not merely similar,
      because a shadow drawn from a slightly different gust reads as the tree
      floating off it.
- [x] **Ground cover.** 216 bushes biased toward the precinct, a 108-bush fringe
      spilling over the paving edge, 108 half-buried stones. Merged and swayed.
- [x] **Swifts.** 18 of them working the walls, visible on a parabola over the
      day/night ease so they peak at dusk and vanish at both noon and midnight.
- [x] **The fox moves.** Paces below the stairs, head down to the scent and up
      again, eased turn.
- [x] **A flock of sheep** on the approach road. Eighteen, grazing and
      drifting up the pilgrim road below the great stairs. Two draw calls: the
      whole animal merges to one geometry of wool and one of face and is
      instanced, which is also why a grazing sheep pitches its whole front end
      down rather than lowering a head — close enough at two hundred amot and
      free per frame.
- [x] **Terraced hillside.** Ten of the fifteen, in geometry rather than in
      paint, so the silhouette against the sky steps too. A terrace is a
      quantisation of height — but a quantisation cannot put a step where the
      mesh has no vertex to hold it, and at the original eighteen rows in phi
      there was less than one row per tread, so the first attempt came out
      exactly as smooth as it started. Ninety-six rows on the farmed ones.

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
- [x] **Gold got its anisotropy.** The GGX lobe is split into two roughnesses,
      wide along the hammer direction and tight across it, and mixed — the
      honest version of `MeshPhysicalMaterial.anisotropy`, which does not exist
      on r128. Everything it needs lives inside `BRDF_Specular_GGX` itself,
      because that is a function declared long before `main` and a variable set
      in `main` is not in scope there. Direct light only: the environment is
      prefiltered isotropically and there is nothing to do about that without a
      second PMREM.
- [x] **Dust in the air.** 18 drifting sprites, depth-tested, peaking when the
      sun rakes low. Watch the opacity floor if the sun angle ever changes.
- [ ] **Shadow softening with distance.** PCF is uniform now; contact shadows
      should be tight and distant ones soft.

## Sound

- [x] **Melodies on the fifteen steps**, with the sounding note lit on a key
      strip and on the tread itself. Public domain only.
- [x] **Tempo and articulation.** Every tune was set roughly a fifth under the
      speed it is actually sung at, and every note released over a fixed
      half-second past its own length — which at a quaver of a third of a second
      is three notes sounding at once for a whole run. A slur reads as slow
      however fast the clock is set. Tempi are the score's own now, and the
      release is tied to the note.
- [x] **All four transcriptions verified.** Hatikvah and Ma'oz Tzur were
      re-checked bar by bar against the LilyPond in their Wikipedia articles and
      are exactly right as they stood. Shalom Aleichem was not — what was there
      was from memory and was not Goldfarb's tune at all. The engraving turned
      up (sixteen bars, D minor, ♩=66) and it is entered note for note, dropped
      an octave to sit on the steps. The by-ear warning stays in the panel for
      whatever is added next.
- [x] **The words.** Every melody carries its text — Hebrew, transliteration,
      translation — and the stanza being sung lights as it goes. The spans are
      in beats and not seconds, so they follow the tune and not the clock and
      stay right at any tempo.
- [ ] **More melodies.** Eliyahu HaNavi, Adon Olam, Lecha Dodi (Alkabetz, Tzfat
      1540s) and Hava Nagila (Sadigura nigun via Idelsohn, ~1918) are all public
      domain and all fit the House.
- [ ] **Syllable-level sync.** The highlight is per stanza. Per syllable is one
      more column in the lyric data — a note index per syllable — and would let
      the word being sung light rather than the verse it is in. It is a lot of
      typing and no new machinery.
- [ ] **Licence the two that are missing.** *Yerushalayim shel Zahav* and
      *Dance Me to the End of Love* would both belong here. They need a
      mechanical/synchronisation licence from the publishers — ACUM for Shemer,
      Sony/ATV for Cohen — not a code change.

- [x] **The camels.** One low grumble from the dust when the camera is near,
      built the way the fire crackle is — the shared brown-noise buffer through
      a low resonant bandpass — with the pitch fall of an animal running out of
      breath. Rarely enough that hearing one twice in a minute is bad luck.
- [ ] **Footsteps in walk mode.** Different on marble, on paving, on dust — the
      surface is already known from `groundHeight()`.
- [x] **Wind bed follows the trees.** `gustAt()` is the JS twin of the shader's
      two sines, sampled at the camera and rectified for the ear.
- [x] **Distance-attenuate the fifteen steps.** Inverse-square in the tail,
      flat inside forty amot. To a floor of a third and never to nothing:
      somebody who presses play from the outer wall has to hear that they
      pressed it.

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

## Found while doing the above

- [ ] **The sky is barely in frame.** All of the work on it — the scattering,
      the terminator, the stars — is spent on a strip about a fifth of the
      height of the opening shot, because the camera sits high and looks down.
      Nothing here is wrong; the composition is simply not showing it. Worth a
      judgment call on the opening elevation, against the debug-camera guard
      below, which exists precisely because that value has been got wrong before.
- [ ] **The environment map is still the old sky.** `envSkyTex()` paints its own
      gradient by hand, so every metal in the House is reflecting a sky that no
      longer exists — and reflecting the same one at midnight as at noon.
      Rebaking the PMREM once per large change in sun height would cost one
      render and would put a sunset in the gold.
- [ ] **Mobile, again.** The terraced hills went from 18 rows in phi to 96 on
      ten of them, and the sheep added two instanced draws. Neither is large,
      but the mobile pass below is now further out of date than it was.

## The calendar, the chagim, and the ending

- [x] **A Hebrew calendar.** Molad, four dechiyot, RD day numbers. No table, no
      network, no dependency — right in a hundred years and right on a plane.
- [x] **The parshah.** The fourteen year-shapes and their merge decisions,
      derived rather than remembered, then checked parshah by parshah against
      sixty-five years of published luchot in both rites: 6,207 Shabbatot, no
      disagreements, 1939 to 2111.
- [x] **A birthday parshah calculator**, with the two rules that actually bite —
      a 30th in a month that has 29 days this year, and an Adar birthday in a
      leap year (Adar II, per the Rema).
- [x] **Seasons: the almond.** Flowers in Shevat and Adar, green the rest of the
      year. This was the "Seasons" idea below and it is now real.
- [x] **A chanukiah at the gate** on the eight nights, with tonight's count.
- [x] **The bikkurim ox on Shavuot**, gold horns and an olive wreath — the thing
      the kohen at the Chamber of the Bikkurim has been describing with nothing
      to point at.
- [x] **The moon's real phase**, off the Hebrew date, because the month is the
      moon and the day of it is the moon's age.
- [x] **An ending worth reaching**, and one that can be closed and reopened.
- [ ] **A sukkah on the plaza** for the seven days, with s'chach you can see the
      sky through. The one festival structure the House has no model for, and
      Sukkot is the chag this place is most associated with — Sukkah 51b on the
      Simchat Beit HaSho'evah is already quoted in the calendar panel.
- [ ] **Pesach.** Three shifts of the korban pesach and the doors shut on the
      first group (Pesachim 64b) is the single most crowded scene in the
      Talmud's memory of this court, and there is nothing here for it.
- [ ] **The Omer, waved.** The count is in the panel; the sheaf is not in the
      court. On the second day of Pesach it should be.
- [ ] **Rosh Hashanah and Yom Kippur.** The one day the Kohen Gadol goes behind
      the parochet is already wonder-shaped and has no day attached to it.
- [ ] **A Hebrew-date footer in the loading screen**, so the date is the first
      thing the House says rather than something behind a chip.

## Found while doing the calendar

- [ ] **`today` is read once a mount.** Nobody leaves this open across midnight,
      and if they do the House is wrong about the date for exactly as long as a
      reload takes to fix. A day-rollover timer is four lines if it ever matters.
- [ ] **Sunset, not midnight.** The Hebrew day begins in the evening, so from
      dusk until midnight the House is one day behind. It needs a location to
      do properly; a flat six-in-the-evening rule would be right most of the
      year for Jerusalem and wrong by an hour twice.
- [ ] **The chanukiah is thirty amot wide.** Scaled up until it reads from the
      opening view, which is a decision about פִּרְסוּמֵי נִיסָא and not about
      the object. If the opening shot ever comes down closer, this should shrink.

## Left on the table this pass

Written down at the end of the session that built the calendar and the ending,
while the reasoning was still in hand. Ordered by impact per hour, like
everything else here.

- [ ] **The chanukiah burns at noon.** It is lit the moment the House is built
      and never goes out, which is wrong twice: the mitzvah is from
      שְׁקִיעָה, and a flame in full sun reads as a sprite. It should come up
      with the torches on the day/night ease and be out by mid-morning. Four
      lines in the same loop that already flickers it.
- [ ] **`?bday=1987-03-14`.** The birthday result is the one thing in here
      somebody would want to send to somebody else, and there is no way to. The
      date override already proves the pattern — read it the same way, seed the
      input from it, and let the panel open itself when it is present.
- [ ] **The parshah should say where it is.** The panel gives the name and the
      book; a bar mitzvah wants Devarim 21:10–25:19. Fifty-four verse ranges is
      an afternoon of typing against a chumash and no new machinery at all.
- [ ] **A shofar you can actually blow.** `playShofar` is one blast and
      `tekiahGedolah` is one long one. תְּקִיעָה · שְׁבָרִים · תְּרוּעָה ·
      תְּקִיעָה גְדוֹלָה is the actual sequence, it is three more envelopes on
      voices that already exist, and clicking wonder 10 in Elul or on Rosh
      Hashanah is exactly when somebody would want it.
- [ ] **Meteor showers keep dates.** The rate is a flat one every twenty-six
      seconds. The Perseids peak in Av and the Leonids in Cheshvan, the calendar
      is already in the file, and raising the rate for those few nights costs
      one multiplier. Nobody would be told; the ones who noticed would be right.
- [ ] **Let some confetti stay.** It settles on the paving correctly and then
      fades out with the rest at twenty-two seconds. A dozen pieces left lying
      where they fell until the next reload would be a better memory of having
      finished than a card that can be reopened.
- [ ] **Verify the finale from inside walk mode.** The burst is sown into the
      camera frustum, which should be right from a standing eye as well as from
      orbit — but it has only been watched from orbit, and the near sixth of it
      is placed fourteen amot out, which is inside the room a visitor may be
      standing in.
- [ ] **The sheep should notice you.** They graze and drift on a fixed path and
      walk through a visitor in walk mode. A flock parts around a person; that
      is most of what a flock does.
- [ ] **A month is not a chag.** `chagOn` returns Elul for all twenty-nine days
      of it, so the ✦ sits on the chip and the toast fires every day for a
      month. Elul belongs in the panel and does not belong in the same band as
      Yom Kippur — it wants a second, quieter tier.
- [ ] **Move the sedra derivation into `tools/`.** The fourteen-row merge table
      was derived from published luchot and checked across 6,207 Shabbatot, and
      the script that did it lives nowhere. Anybody who doubts a row — and one
      day somebody will — should be able to re-run the check rather than take
      the comment's word for it. Same directory the `harp-test.html` decision
      below has been waiting on.
- [ ] **The lyric panel should follow the song.** The sung stanza lights, but on
      a long melody it lights below the fold and the reader never sees it. A
      `scrollIntoView` on the live stanza, guarded so it does not fight a
      visitor who is scrolling themselves.

## Ideas worth considering, not yet decided

- **The 54th tier.** The number rule's next step past 36 is 54 — eighteen more
  nistarot. There is no shortage of candidates (the lishkat ha-gazit's seating,
  the mikvaot under the courts, the chotam seals, Nikanor's other door).
- **A cameleer, or not.** Adding a human figure muddies "eighteen who answer" —
  a visitor who clicks him and gets nothing has been told a small lie. If he is
  added he should answer, which means the count goes to 36 figures.
- **Camel count.** Three reads as "a caravan arrived". Yeshayahu 60:6 says
  שִׁפְעַת גְּמַלִּים, a *multitude* — if this ever grows it should go to 18 and
  become a road of them coming up, not a parking lot.
