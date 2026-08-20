# Changelog

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
