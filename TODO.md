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
- [ ] **A test that the House opens.** v3.34 was a blank page for two versions
      — a TDZ read in a dependency array, legal JavaScript that throws, so the
      build stayed green and the deploy succeeded on a screen with nothing on
      it. One headless mount asserting a single `<canvas>` exists, in the same
      Action that deploys, is the cheapest test in this repo and the only one
      that would have caught it. Every other check here guards a claim about
      the Mikdash; none of them guards the front door.
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

## Halacha — audited, fixed, and still open

Written down as a list because the question keeps being asked and the answer
should not have to be re-derived. Everything here was checked against a source,
not against a memory of a picture.

- [x] **The three vessels of the Heichal were standing in the open court.**
      Shemot 26:35 puts the Shulchan on the north side of the room and the
      Menorah opposite it on the south, both inside the tent; Shemot 30:6 sets
      the golden altar in front of the parochet between them. All three were out
      in the azarah, which is not a small licence. They are carried in by the
      kohanim once the thirty-sixth wonder is found — six bearers to a vessel,
      בַּכָּתֵף יִשָּׂאוּ (Bamidbar 7:9) — and each shrinks on the way to the size
      its own pasuk gives it. The real fix is the Heichal interior; this is the
      honest version of the answer until that is built.
- [x] **The kiyor was eighty amot from where Middot 3:6 puts it.** בֵּין הָאוּלָם
      וְלַמִּזְבֵּחַ מָשׁוּךְ כְּלַפֵּי הַדָּרוֹם — between the Ulam and the altar and
      drawn to the south. It was parked out by the southern wall, nowhere near
      either of the two things the mishnah measures it against. On the line now,
      with Ben Katin's wheel beside it where it belongs.
- [x] **The Levites' sash was gold**, which is not sourced anywhere. Divrei
      HaYamim II 5:12 dresses the singers מְלֻבָּשִׁים בּוּץ, in fine linen.
- [x] **The Menorah had a shamash and vertical branches** — see the entry below;
      fixed in v3.20.
- Checked and correct, so that nobody re-checks them: the slaughtering tables
      stand north of the altar (Middot 3:5); the Menorah, Shulchan and golden
      altar are in the right places *relative to one another*, south, north and
      between (Yoma 33b; Bava Batra 25b); no tree stands in the azarah and
      `plantable()` enforces it (Devarim 16:21; Rambam, Avodah Zarah 6:9); the
      chanukiah is outside the walls and its shamash is raised, which is right
      for a chanukiah and wrong only for a Menorah; the kohanim's sash carries
      techelet (Shemot 39:29).
- [ ] **Yachin and Boaz are Shlomo's.** Melachim I 7:21 stands them at the porch
      of the first House. Yechezkel's porch has none, and the Second Temple had
      none. They are sourced, and they are in the wrong House — the choice
      should either be defended in the plaque or the pillars should come down.
- [x] **The kiyor has no spouts.** Twelve now, one for each kohen of the daily
      offering (Yoma 37a) — the thing Ben Katin is actually remembered for was
      missing from the laver his wonder stands beside.
- [x] **No soreg.** Built: a lattice ten tefachim high round the court, with
      the חֵיל of ten amot between it and the platform on three sides (Middot
      2:3). The thirteen are not holes in it — מַלְכֵי יָוָן broke through and
      חָזְרוּ וּגְדָרוּם, they fenced them up again, so they are thirteen panels of
      plainer, later stone, each with a place laid in the pavement in front of
      it for one of the thirteen bowings. Three ways through: the eastern
      stair and the two gate axes.
- [ ] **The soreg does not stop anybody.** It is the one line in this precinct
      whose whole job is to say where a visitor halts, and you can walk through
      it. Colliders are axis-aligned boxes and the ring is four runs with three
      openings, so it is four calls and some arithmetic — but it would also be
      the first thing in this House that refuses a visitor, which is a decision
      and not a detail.
- [ ] **The soreg has no inscription.** The stone found in 1871 — ΜΗΘΕΝΑ
      ΑΛΛΟΓΕΝΗ ΕΙΣΠΟΡΕΥΕΣΘΑΙ — is the one object from this precinct anybody can
      still go and look at, and this House already says its wonders come from
      "Tanach, Talmud, or the spade of the archaeologist". A candidate for the
      54th tier if it ever comes.
- [x] **The altar is climbed from the east** (Yechezkel 43:17) rather than by
      Middot's southern ramp. Said out loud now, in the הכבש wonder that stands
      at the foot of it, so that a reader holding Middot sees a decision rather
      than a mistake.
- [x] **The altar was fourteen and a half amot tall and none of its numbers was
      anybody's.** Rebuilt on Middot 3:1: thirty-two square on the ground, up
      one and in one to the יְסוֹד, up five and in one to the סוֹבֵב, up three
      more — nine amot to the hearth, horns an amah at each corner, twenty-four
      by twenty-four of hearth inside them. The ramp is Middot 3:3's thirty-two
      by sixteen, and it is one unbroken incline: the wonder standing at its
      foot is called *A Ramp, and Not Steps* and quotes Shemot 20:23, and the
      ramp under it had been built out of ten visible steps. The fire, its two
      lights and its sparks were all hung off the old height and now hang off
      the hearth.
- [x] **The lamps are cups, not נֵרוֹת.** Each has a spout now, and the spout is
      what carries Bamidbar 8:2 — six turned in toward the middle lamp and the
      middle one turned west to the Kodesh.
- [ ] **The altar's flame is theatrical.** Twenty amot of fire over a nine-amah
      altar. It is the signature image of the House and it is not a measurement;
      if anything ever makes it read as a claim, it should come down to the four
      or five amot a woodpile actually throws.


## Found while doing the above

- [x] **The Menorah had a shamash.** The middle lamp stood half a tefach above
      the other six and the seven branches were vertical rods hung off a
      crossbar — a chanukiah's silhouette on the Mikdash's Menorah. Rebuilt from
      the sources: eighteen tefachim by Menachot 28b's own walk up the shaft, six
      straight diagonal branches (Rashi on Shemot 25:32, בַּאֲלַכְסוֹן, and
      Rambam's drawing in his own hand), all seven lamps in one row at one height
      (Rambam, Beit HaBechirah 3:10), and twenty-two gevi'im, eleven kaftorim and
      nine perachim distributed as the daf distributes them. The ornament count
      is not decoration — it is the check that the shape is right.
- [ ] **The Menorah's spread is a choice, not a source.** Nothing in the Gemara
      or in Rambam gives the distance between the lamps. Three tefachim apart
      was chosen because it makes the Menorah as wide as it is tall and the row
      of seven even; parallel branches at a single angle would put the outer
      three at two tefachim and leave a gap of five and a half beside the shaft.
      If a source turns up, it outranks the choice.
- [x] **The eighteen who answer had one line each.** Four now — seventy-two,
      which is חי times four — and they come round in order rather than
      shuffling, because a shuffle can hand you the same line twice running,
      which is the exact thing the change is for. Psalms and Shir HaShirim are
      among them, quoted where they were actually said: Tehillim 122 in the
      mouth of the bikkurim procession, 84 with the swifts on the walls, 134
      from the men who stand here at night, and the spices of Shir HaShirim 4
      from the man who can smell the ketoret from Jericho.

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
- [x] **A Hebrew-date footer in the loading screen**, so the date is the first
      thing the House says rather than something behind a chip. It carries the
      chag when there is one and the parshah of the coming Shabbat always, and
      on every day that is not a chag the toast that used to stay silent says
      the parshah instead — which is the question this House is asked more than
      any other, and it was answerable only by opening a panel.

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

- [x] **The chanukiah burns at noon.** Fixed, and on the sun's own height
      rather than on the day/night ease — Shabbat 21b puts the mitzvah at
      משתשקע החמה, which is a fact about the sun and not about the position of
      a slider. The flames are hidden outright in daylight rather than merely
      dimmed, because an additive sprite at low opacity over a lit court is a
      smudge on the gold.
- [x] **`?bday=1987-03-14`.** Read the same way `?date=` is, and the לוּחַ
      opens itself behind the teaching card when it is there. The address bar
      keeps the date as it is typed, so the link in the bar is always the link
      to the result on screen, and there is a button beside it that copies it.
- [ ] **The parshah should say where it is.** The panel gives the name and the
      book; a bar mitzvah wants Devarim 21:10–25:19. Fifty-four verse ranges is
      an afternoon of typing against a chumash and no new machinery at all.
- [x] **A shofar you can actually blow.** One blast is now a primitive with
      three arguments — when, how long, and whether it breaks up to the fifth
      at the end — and תשר״ת is built out of it: a tekiah, three shevarim, nine
      teruot and the gedolah. In Elul and on Rosh Hashanah wonder 10 gives the
      whole order; on Yom Kippur it gives one blast and it is the long one, the
      tekiah gedolah at the close of Ne'ilah; every other day it is the single
      tekiah it has always been.
- [x] **Meteor showers keep dates** — Gregorian dates, which is the correction
      this entry needed. A shower is the earth crossing a comet's dust and an
      orbit is a solar fact: the Perseids are in the second week of August
      whatever the Hebrew month happens to be doing, and keying them to Av would
      have been a nicer sentence than it was a fact. Seven of them, with the
      rate falling off either side of the peak, and the לוּחַ says which one is
      running. The multipliers are deliberately not ZHRs — one meteor every
      twenty-six seconds over a whole hemisphere is already generous, and a real
      Geminid ratio on top of it would fill the sky.
- [x] **Let some confetti stay.** One piece in every thirty-six, which is
      eighteen of them. The clearing had to move from the material's opacity
      into the instance scale — six hundred and forty-eight instances share one
      material and a material cannot fade some of them and keep the rest — and
      a leaf shrinking over five seconds at that distance reads as the wind
      taking it, which is the truer thing for it to do anyway.
- [ ] **Verify the finale from inside walk mode.** The burst is sown into the
      camera frustum, which should be right from a standing eye as well as from
      orbit — but it has only been watched from orbit, and the near sixth of it
      is placed fourteen amot out, which is inside the room a visitor may be
      standing in.
- [ ] **The sheep should notice you.** They graze and drift on a fixed path and
      walk through a visitor in walk mode. A flock parts around a person; that
      is most of what a flock does.
- [x] **A month is not a chag.** `chagOn` carries a tier now. A season keeps
      no ✦, announces itself on the first of the month and then stops talking,
      and sits in the panel in a plain frame instead of the gold one — because
      standing Elul and Yom Kippur in the same card says they are the same kind
      of day.
- [ ] **Move the sedra derivation into `tools/`.** The fourteen-row merge table
      was derived from published luchot and checked across 6,207 Shabbatot, and
      the script that did it lives nowhere. Anybody who doubts a row — and one
      day somebody will — should be able to re-run the check rather than take
      the comment's word for it. Same directory the `harp-test.html` decision
      below has been waiting on.
- [x] **The lyric panel follows the song.** `scrollIntoView` with `block:
      "nearest"`, so a stanza already in view is left exactly where it is, and a
      hand on the wheel or a finger on the glass wins for four seconds — a panel
      that scrolls itself back every two bars is worse than one that never
      scrolled at all.

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
