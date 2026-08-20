# Changelog

## v3.10 — "Every Tree of Food" (0.3.10)

- **Seven species of tree, each one because a source puts it here.** Seventy
  identical grey-green lollipops is not a landscape, it is one tree stamped
  seventy times. Now: **תָּמָר** date palm — Yechezkel 40:16, 26, 31 carves
  תִּמֹרִים onto the gates themselves and 41:18 alternates them with cherubim
  along the Heichal walls, so the House wears palms and the hillside should have
  the tree they are cut from; **בְּרוֹשׁ** cypress — Yeshayahu 60:13, explicit
  about why it is planted, לְפָאֵר מְקוֹם מִקְדָּשִׁי, "to beautify the place
  of My sanctuary" (tidhar and te'ashur in the same verse are not securely
  identified, so only the berosh is drawn); **זַיִת** olive — Shemot 27:20,
  Zechariah 4:3; **רִמּוֹן** pomegranate — Shemot 28:33, Melachim I 7:20, and
  the tree the eighteen hidden rimonim come off; **תְּאֵנָה** fig — Melachim I
  5:5, Micah 4:4, each man under his vine and his fig tree; **חָרוּב** carob —
  Ta'anit 23a, Choni and the man planting for his children; **שָׁקֵד** almond
  in blossom — Shemot 25:33, the menorah's cups are מְשֻׁקָּדִים, and Bamidbar
  17:23. A hundred and eight of them, חי times six.
- **Devarim 16:21 is now enforced in code.** לֹא־תִטַּע לְךָ אֲשֵׁרָה
  כָּל־עֵץ אֵצֶל מִזְבַּח ה'. Rambam (Hilchot Avodah Zarah 6:9) reads כל עץ at
  its word: a tree planted anywhere in the azarah incurs lashes, even one
  planted for the House's honour. `plantable()` refuses the whole precinct
  footprint, so not one of the hundred and eight can stand inside the courts.
  Tehillim 92:14 — planted in the House of Hashem, they flourish in the courts
  of our G-d — has to be metaphor for exactly this reason.
- **The river is planted only with bearing trees.** Yechezkel 47:12 is specific:
  כָּל־עֵץ מַאֲכָל, every tree of food, its fruit renewed month by month. Date,
  pomegranate and fig cycle along the banks, nine a side, eighteen in all.
- **A palm frond is not a spoke.** Laid out flat and radiating, eleven of them
  read as a green asterisk from any raised camera, which is most of this scene.
  Each frond is now two segments on nested pivots — one group sets the compass
  bearing, the other how far the frond has bent under its own weight, with the
  outer segment carrying more bend than the inner. That is the arch, and the
  crown becomes a fountain instead of a star.
- **The cypress was a traffic cone.** One clean cone has no business being a
  tree. Three overlapping tiers now, each leaning and turned off the last.
- **Camels of the nations.** Yeshayahu 60:6 — שִׁפְעַת גְּמַלִּים תְּכַסֵּךְ,
  a multitude of camels shall cover you, bearing זָהָב וּלְבוֹנָה, gold and
  frankincense. The same chapter that sends the cypress, thirteen verses
  earlier. Both halves of that load already live in this House: the gold is on
  the facade, and the levonah is one of the ketoret's eleven spices (Keritot 6a)
  and the two spoonfuls beside the lechem hapanim (Vayikra 24:7). Three of them
  below the southern stairs, one couched and unloading, still in their panniers
  — outside the walls, because a camel has no business in the courts.
- **A geometry merger, so the grove costs almost nothing.** A hundred and eight
  trees built from primitives is about thirteen hundred meshes, and thirteen
  hundred draw calls a frame for scenery that never moves is indefensible. The
  usual answer is `BufferGeometryUtils.mergeBufferGeometries`, but that lives in
  `three/examples/jsm` and importing it would end the `react` + `three` and
  nothing else rule the whole component is built on. So `mergeByMaterial()`
  walks a group, bakes each mesh's world matrix into its vertices, and
  concatenates everything sharing a material into one buffer. The grove and the
  river banks go from ~1300 draw calls to one per material. The trade is frustum
  culling — a merged mesh spanning the ring is never culled — which at this
  count is overwhelmingly the better side of the bargain.
- **[TODO.md](TODO.md)** — the working backlog for beauty and life, with the
  rules that constrain it (no tree in the azarah, multiples of 18, append-only
  ids, no new runtime dependency) written at the top so they are checked before
  anything is added rather than after.


## v3.9 — "Carved, Not Printed" (0.3.9)

A lookdev pass. Nothing moved and nothing was added to the floor plan; what
changed is how the stone takes light.

- **Every surface was a photograph of itself.** Materials carried a colour map
  and one scalar roughness, so a drafted margin was *painted* on: it stayed
  painted no matter where the sun was, and a wall took the light back at
  exactly one sharpness from end to end. Both maps are now derived from the
  pixels already drawn — read the canvas back, treat luminance as height,
  Sobel it into a tangent-space normal, and remap the same luminance into a
  narrow roughness band. Fourteen colour maps, thirteen derived normal maps,
  eight derived roughness maps, and still no texture files: `heightFromCanvas`,
  `normalFromCanvas`, `roughFromCanvas` and `pbr()` in `Mikdash.jsx`. The
  sampling wraps, so relief tiles with the map instead of seaming at every
  repeat. The flutes on the Royal Stoa columns are now the only geometry in the
  House made entirely of normal map — twenty-two grooves on a plain cylinder.
- **The renderer was shading in the wrong colour space.** `outputEncoding` was
  never set, so lighting maths ran on sRGB numbers and was written out without
  conversion. That is what made the courts read milky: shadows lifted, midtones
  flattened, and no amount of light tuning could recover the contrast. The
  pipeline is now linear-in, sRGB-out — canvas maps declare `sRGBEncoding`,
  derived normal/roughness maps stay linear because they are data, and both
  hand-written shaders (sky, flame) got `#include <encodings_fragment>`, since
  three only appends the conversion to its own materials.
- **Everything hand-picked had to be relit.** Correct encoding brightens by
  roughly a stop and a half, so every colour chosen by eye against the old
  output was wrong: the sky's day and night ramps, the fog, the hemisphere and
  sun/moon colours, the olive and river-tree greens, the pomegranates and the
  hill tints are all linearised. Exposure came down 0.98 → 0.78 and the
  hemisphere fill came up 0.46 → 0.62 — not all the way back, because some of
  that lost fill was the flatness this pass set out to remove.
- **Nothing was sitting anywhere.** A wall met the pavement at a clean bright
  seam, because a sun plus a hemisphere has no way to know the foot of a wall
  sees less sky than its top. Screen-space AO would mean an `EffectComposer`
  and an import from `three/examples/jsm`, which would end this component's
  `react` + `three` and nothing else rule — so the occlusion is baked into
  vertex colours instead, on every box and cylinder over 16 amot tall, in world
  units so a 60-amah retaining wall and a 20-amah gate pier get the same depth
  of shadow at the ground. `goldPlate` and `windowMat` opt out: the day/night
  ramp mutates them every frame and a clone would stop receiving it.
- **The plaza was graph paper.** A perfect 8×8 grid with a hard joint at half
  opacity, every cell the same size and value, running dead straight to the
  horizon. Now courses of differing height, broken into slabs of differing
  width, staggered course to course, with thin warm joints and slabs worn
  brighter in the middle where feet have polished them.
- **The hillside broke out in orange peel.** The ground map scattered nine
  thousand hard specks, which is fine as colour — but once the terrain took a
  derived normal map every speck became a pebble. Rewritten as fine grain and
  faint short streaks, with no feature large enough to be recognisable when it
  tiles; tiling went 10 → 26 so drawn dust is not magnified twelve-fold into
  boulders. Its relief is nearly flat, because ground seen from above is.
- **The hills were marshmallows.** Smooth spheres in flat paint — a perfect
  silhouette, which is the one thing no landform has. Each is now displaced
  along its own radius by a sum of sinusoids in spherical coordinates: cheap,
  coherent, wraps without a seam, and the ridges catch the sun.
- **The trees were lollipops.** A sphere on a stick has a circular outline and
  nothing in a landscape does. Canopies are now three overlapping lobes at
  differing size, offset, squash and rotation, so no two trees in the grove are
  the same tree, and the trunks lean.
- **Grazing angles were mush.** Anisotropy was left at the default of 1 across
  a 500-amah plaza and every colonnade roof running away from the camera. Now
  read from `renderer.capabilities` and capped at 8.
- **Shadows.** 2048 over a 1120-amah frustum put one shadow texel every half
  amah — coarser than the stones it was shadowing. The frustum is tightened to
  the built precinct (±430) and the map goes to 4096 where the GPU's texture
  cap allows it. `bias` and `normalBias` are set, which the normal maps made
  necessary: acne that was invisible on flat shading crawls over relief.
- **The sun set at a different speed for every visitor.** The day/night ease
  was a fixed fraction *per frame*, so it ran two and a half times faster on a
  144Hz laptop than a 60Hz one — and this is the animation every light, the
  fog, and every emissive and sprite tint keys off. Now time-based, with the
  constant chosen so 60Hz behaves exactly as it always did.

Cost: about 0.2s of one-time map generation at load, and **+2 KB gzipped** —
the maps are computed on the visitor's machine, so the "no art assets" rule
survives the whole pass intact.


## v3.8 — "Out of the Roof" (0.3.8)

- **Wonder 8 was inside the roof.** The eighth rimon — גלי הים, "within the
  royal porch of a hundred columns" — sat at `[40, 26, HALF - 58]`, and the
  Royal Stoa's cedar roof deck fills y 25.5–27.7 across that whole footprint.
  The rimon was embedded in the slab: nothing to see, nothing to aim at, and
  in quest mode nothing after it could be collected either, because the quest
  gates on the next one in sequence. It now stands at `[36, 6, HALF - 35]` —
  in the outer aisle of the porch, centred between two columns, 3.6 above the
  stylobate so a walker meets it at head height, and low enough that the
  sightline under the roof edge clears at the default orbit elevation.

## v3.7 — "Findable From the Road" (0.3.7)

- **The House can be found by someone not already looking for it.** `index.html`
  carried a title and one description and nothing else: no canonical URL, no
  sharing card, no structured data, and — for a page whose entire body is an
  empty `#root` until React mounts WebGL — nothing at all for a crawler to
  read. Added the canonical link, Open Graph and Twitter card tags against a
  1200×630 capture of the courts, a JSON-LD `WebApplication` block, and a
  `sitemap.xml`. The `#root` div now ships prose describing the floor plan,
  the thirty-six nistarot and what a visitor can do, which React clears on
  first render — so the crawler and the first second of the page both say
  something, and `<noscript>` explains what is needed. Thirty-six replaces the
  stale "sixteen wonders" the description still claimed.


## v3.6 — "Out From Under the Rail" (0.3.6)

- **The top of the House no longer hides behind its own buttons.** The title,
  its subtitle, and the quest banner were each centered across the full
  viewport while the chip rail floats over the right 163px of it. Nothing
  reserved that column, so all three ran underneath it. Measured at 390px:
  the subtitle put 145px of itself behind the נסתרות counter, the title 22px,
  the banner 43px. It was never only a phone bug — the subtitle stayed buried
  until roughly 1100px, which covers most tablets and small laptops. Now the
  rail's column is reserved: on a narrow screen from the right only, since
  there is no room left to stay centered, and on a wide one from both sides,
  so the block still reads as centered. Verified clear from 320px to 1920px.

- **The hints list can be shut again.** רמזים opened a panel at `top: 230` with
  no `z-index`, rendered after the chip rail — so it painted straight over the
  "Hide hints" chip at `top: 251`, the only way to close it. On a desktop a
  stray click on the sliver above still worked; on a phone there is no Escape
  key and no tap-outside, so the panel was a trap. The rail now sits above the
  panel, the panel carries its own ×, and it is capped to clear the navigation
  pad — with a sideways phone standing the list beside the rail instead of
  below it. Hit-tested at 320, 390, 667, 844 and 1280 wide.

## v3.5 — "Thirty-Six" (0.3.5)

- **Thirty-six nistarot.** Twice chai, and the count of the hidden righteous.
  Twenty new teachings join the sixteen: ten more rimonim of silver (the ten
  miracles of Avot 5:5, the thirteen shofar-shaped chests, the Chamber of the
  Discreet, the Claimant's Stone, the Chamber of Hewn Stone, the ramp that is
  not steps, the shitin that descend to the deep, the Water Gate, Mount
  Moriah, the three festivals) and ten more wonders you can stand in front
  of — Ben Katin's wheel beside the laver, the golden vine over the doors of
  the House, the willows leaning on the altar, the flute of the water-drawing,
  a tree of Yechezkel 47 whose leaf is for healing, the Shulchan lifted up so
  the pilgrims could see the bread, the lottery box, the families' fig-wood,
  the red heifer at the far end of a causeway of arches, and the Western Wall
  that never fell, with notes still pressed into its joints.
- **Every number in the House is now a multiple of 18.** 36 hidden things, 18
  who answer when you click them (twelve kohanim at the stations of the
  morning avodah, six Levites on the steps — six new voices among them), 18
  doves overhead. The fifteen steps and the eleven spices keep their numbers:
  a source outranks a pattern.
- **A ring of light on every hidden thing.** The opening card always promised
  it; the wonders never had one, because architecture cannot float. Now the
  ring is laid at their feet instead, turning and pulsing brighter on the one
  the quest is asking for, and gone the moment it is found.
- **The Heichal answers.** Striking the cedar doors used to do nothing, so
  visitors pressed at them and concluded the House was broken. It says now:
  הַהֵיכָל סָגוּר — the Heichal is still shut, its inside is not built yet.
  Opening it is the top of the v4 roadmap, broken into real steps in README.
- **The pesichah card keeps its head above water on a phone.** Its gold seal
  was pinned at top:-38px, outside the card's own overflow-y:auto box, so it
  was clipped the moment the card grew tall enough to scroll — which on a
  phone is always. The seal is gone, and the title margin that reserved space
  for it with it. The discovery cards keep theirs.

## v3.4 — "The Opening" (0.3.4)

- **The first step is given, not hidden.** A visitor who never finds wonder #1
  never sees the other fifteen, so the opening no longer asks anything of them.
  On the first visit a pesichah card unrolls over the House — בֹּאוּ שְׁעָרָיו
  בְּתוֹדָה — naming the one thing the game never said out loud: *every hidden
  thing floats inside a slowly turning ring of gold light.* It says where the
  first one waits (inside the eastern gatehouse), and its button flies the
  camera there. Shown once, ever, and remembered alongside progress.
- **Two more rungs under it.** The banner's *Show me* gleams while nothing has
  been found. And after 40 seconds in quest mode with an empty count, the
  beacon rises over the first rimon unasked — "בֹּא וּרְאֵה — come and see."
  Both key off `found.length === 0` and go quiet the moment anything is found.
- **The kohanim answer.** Click any of the eight kohanim or four Levites and
  they speak from their station of the morning avodah — terumat hadeshen, the
  arrangement of the wood, the lottery after a kohen was pushed on the ramp,
  Ben Katin's wheel for the kiyor, the tamid, the water libation, the showbread
  still warm a week on, birkat kohanim. Every line carries its source, the way
  every dimension does. *(Was already in the tree; shipping here.)*
- **Columns worth looking at.** The Royal Stoa's columns are properly
  Corinthian now — a fluted shaft off a new procedural texture, an acanthus
  bell, an abacus, and volutes. Yachin and Boaz are rebuilt to Melachim I 7:
  a twelve-amah circumference (so the radius is 12/2π, not a guess), net-work
  and chain-work on the capitals, two rows of pomegranates, lily-work.
  *(Was already in the tree; shipping here.)*
- **The Divine Name.** English text now writes **Hashem** or **G-d**, never
  "God" spelled out — in the sixteen teachings, in the completion card, and as
  a documented house rule for anything added later.

## v3.3 — "Gold, Fire, and Fifteen Notes" (0.3.3)

- **The facade was black, and it was a bug.** A metal surface in three.js takes
  almost all of its colour from what it reflects, and there was no environment
  to reflect — so gold plate rendered black except where a light glinted off
  it. Added a procedural equirectangular environment (sky over haze over
  hillside) through `PMREMGenerator`, applied to every metal. The Ulam facade,
  the columns, the menorah and Nicanor's bronze all read as metal now.
- **A bigger fire, with more orange.** Six nested cones instead of four. The
  two new tongues are *solid* orange rather than additive — additive orange
  over sunlit white stone is just white, and orange was the point. Taller
  again, with more embers rising higher.
- **On-screen navigation.** A pad of held buttons that glide the camera:
  swing, tilt, zoom and home in orbit; turn and walk in first person. Arrow
  keys and WASD now drive the orbit camera too. Nothing sticks if you release
  outside the button.
- **Joy.** The fifteen steps are tuned — strike one and it sounds its degree of
  the ascent, flashes, and puffs dust. Every wonder found throws gold dust, and
  the counter pops as it ticks up.

## v3.2 — "Fire and Daylight" (0.3.2)

- **The day no longer washes out.** ACES tone mapping, a stronger sun against
  much less ambient fill, and stone mixed a few percent below white, so the
  drafted margins and courses survive direct sun instead of clipping to a flat
  white sheet.
- **A fire with a blue heart.** Four nested cones: a saturated amber body that
  gives the flame a silhouette in daylight, a blue heart whose geometry exists
  only where it burns blue, and two additive shells for glow and tongues. Blue
  sparks lift off the hearth, and a blue point light throws the heart's colour
  onto the altar stones beside the warm one above.
- **Fire that reads in both lights.** Additive glow *fades* as the day comes
  up — light added over sunlit white stone is just white — so by day the fire
  is body colour and by night it is glow. The flame is also half again as tall.

## v3.1 — "The Sound of the Courts" (0.3.1)

- **Ambient bed.** Three synthesized voices, mixed every frame by where the eye
  stands: wind over the mountain (everywhere, rising with height and with the
  night), the fire of the ma'aracha (near the altar, with crackle scheduled at
  a rate that follows proximity), and the Levites' ascent — always-rising
  freygish phrases through a delayed, lowpassed bus so stone courts stand
  between the singer and the ear. Nothing sounds until the first gesture.
- **One switch for sound.** A `♪ קול` / `⃠ דממה` chip mutes the bed and the four
  event sounds together, and the choice persists alongside quest progress.
- **Graceful failure without WebGL.** A device that cannot open a GL context
  now gets a Hebrew notice instead of a crashed component and a white page.
- **Deploys to GitHub Pages** on every push to `main`.

## v3 — "The Living Courts" (0.3.0)

- Yechezkel 40–48 floor plan in monumental white stone, GLSL sky and altar fire,
  first-person walk mode, animated kohanim and Levites, sixteen hidden wonders
  as a sequential quest, persistent progress, four WebAudio event sounds.
