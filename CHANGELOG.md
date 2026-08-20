# Changelog

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
