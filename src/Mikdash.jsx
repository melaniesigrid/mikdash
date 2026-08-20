import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";

/*
  ═══════════════════════════════════════════════════════════════════════════
   בֵּית הַמִּקְדָּשׁ — MIKDASH: an explorable Temple
   v3.5 — "Thirty-Six"

   · Yechezkel 40–48 floor plan at 1 unit = 1 amah, in monumental white stone
   · GLSL sky (day ⇄ night timelapse), GLSL noise-displaced altar fire
     with a blue heart, built to read against sunlit stone as well as night
   · First-person walk mode with collision + ground-height terrain
   · Kohanim walking the inner court, Levites swaying on the fifteen steps
   · Thirty-six hidden nistarot — chai doubled: 18 silver rimonim and 18
     living wonders — that unlock IN SEQUENCE as a quest, with a free-explore
     toggle. Every countable collection in this House is a multiple of 18.
   · A synthesized ambient bed — wind over the mountain, the fire of the
     ma'aracha, the Levites' ascent — mixed by where the eye stands
   · On-screen navigation pad — orbit, tilt, zoom, walk — for anyone who
     would rather not drag or scroll
   · The fifteen steps are tuned: strike one and it sounds its degree of the
     ascent, and every wonder found throws gold dust
   · Progress persists across sessions via window.storage

   See README.md in this repository for the full design document.
  ═══════════════════════════════════════════════════════════════════════════
*/

const C = 500, HALF = C / 2;
const STORE_KEY = "mikdash-progress-v3";

const DISCOVERIES = [
  { kind: "rimon", title: "שער הקדים — The Sealed Eastern Gate", text: "“This gate shall remain shut; it shall not be opened… because Hashem, the G-d of Israel, has entered through it” (Yechezkel 44:2). Tradition binds this to Sha'ar HaRachamim — the Gate of Mercy sealed in Jerusalem's eastern wall, waiting.", hint: "Where mercy waits behind stone, inside the eastern gatehouse." },
  { kind: "rimon", title: "מים חיים — The Living Waters", text: "Yechezkel 47: a trickle from beneath the threshold becomes ankle-deep, knee-deep, then a river no one can cross — sweetening even the Dead Sea. Chazal read it as Torah itself: water that heals wherever it flows, fruit for food and leaves for healing (47:12).", hint: "Follow what begins as a trickle, east across the court." },
  { kind: "rimon", title: "הראל — The Altar Called ‘Mountain of G-d’", text: "Yechezkel 43:15 names the hearth 'Har'el' — Mountain of G-d. Uniquely, this altar is climbed by steps facing east (43:17), and must be inaugurated for seven days before the first regular offering rises.", hint: "At the foot of the mountain that burns." },
  { kind: "rimon", title: "קנה המדה — The Measuring Reed", text: "The vision arrives as a blueprint: a man 'whose appearance was like bronze' measures every wall with a reed of six long cubits (40:5). The Vilna Gaon wrote treatises reconstructing the plan — and the Midrash promises: one who studies the Temple's design, it is as if he built it.", hint: "Among the northern columns, something measures you back." },
  { kind: "rimon", title: "שכינה במערב — No Western Gate", text: "Gates open east, north, and south — never west. 'The Shechinah is in the west' (Bava Batra 25a): the wall behind the Holy of Holies stays unbroken. Nothing passes behind the Presence.", hint: "Along the one wall where no gate dares open." },
  { kind: "rimon", title: "אש מן השמים — Built by Fire or by Hands?", text: "Rambam (Hilchot Melachim 11) rules that Mashiach builds the final Temple. Rashi and Midrash Tanchuma teach it descends whole, built of fire, from Heaven. The chassidic masters reconcile them: we build from below, and Heaven completes what our hands begin.", hint: "The highest gold guards the smallest silver." },
  { kind: "rimon", title: "בית תפילה לכל העמים — A House for All Nations", text: "These courts span 500×500 amot — far beyond the largest sacred precinct the ancient world ever raised. Yeshayahu 56:7: 'My House shall be called a house of prayer for all nations.' The enlarged floor plan is that promise drawn in stone.", hint: "A kitchen court in the far southwest keeps a secret." },
  { kind: "rimon", title: "גלי הים — Marble Like the Waves of the Sea", text: "Bava Batra 4a: the Temple was built of stones of blue-green and white marble. Its builder wished to plate it all in gold — the Sages told him: leave it, it is more beautiful as it is, for it looks like the waves of the sea. And Sukkah 51b: 'One who has not seen it has never seen a magnificent building.'", hint: "Within the royal porch of a hundred columns." },
  { kind: "wonder", title: "השועל של רבי עקיבא — Rabbi Akiva's Fox", text: "Makkot 24b: the sages saw a fox slip out of the ruined Holy of Holies and wept — but Rabbi Akiva laughed. 'Just as Uriah's prophecy of ruin came true, so will Zechariah's: elders will yet sit in the streets of Jerusalem.' They answered: 'Akiva, you have comforted us.' Here the fox walks outside the walls — the ruin behind him, the promise standing before him.", hint: "Something small and russet waits below the southern stairs." },
  { kind: "wonder", title: "כינור של לויים — The Harp of the Levites", text: "On the fifteen steps between the courts the Levites stood with harps, lyres and cymbals — one step for each Shir HaMa'alot. David's kinor, say Chazal, hung above his bed and played by itself when the north wind moved through it at midnight (Berachot 3b). Touch it and it remembers its song.", hint: "An instrument rests where the singers stand — it still remembers." },
  { kind: "wonder", title: "שופר גדול — The Great Shofar", text: "“And it shall be on that day: a great shofar will be sounded, and the lost shall come from Assyria and the outcasts from Egypt, and they will bow to Hashem on the holy mountain in Jerusalem” (Yeshayahu 27:13). This is the shofar of ingathering — the sound before the silence of the Kodesh.", hint: "A ram's horn waits on marble near the southern gate. Dare to sound it." },
  { kind: "wonder", title: "אבן השתייה — The Foundation Stone", text: "Yoma 54b: 'The world was woven outward from the Even HaShetiya' — the stone beneath the Holy of Holies, from which creation was drawn like thread from a spindle. On Yom Kippur the Kohen Gadol placed the incense upon it. Its glow seeps from beneath the western ground: the world's first light, still warm.", hint: "The world began behind the House. Seek warmth in the western ground." },
  { kind: "wonder", title: "מנורת זהב — Light the Menorah", text: "Shabbat 22b asks: does He need our light? The Ner Ma'aravi that burned beyond its oil was 'testimony to all who enter the world that the Shechinah dwells in Israel.' You have kindled seven flames. The Sfat Emes teaches: every soul is a wick — the fire descends when the vessel is prepared.", hint: "Seven branches of gold stand cold. They wait for you." },
  { kind: "wonder", title: "קטורת — The Eleven Spices", text: "Keritot 6a counts eleven spices in the ketoret — including chelbenah, foul-smelling alone, deliberately included: a fast that excludes the sinners of Israel is no fast at all. And the house of Avtinas guarded one secret: ma'aleh ashan, the herb that made the smoke rise in a single straight column, unbent by any wind.", hint: "A small golden table before the House holds eleven fragrances. Wake them." },
  { kind: "wonder", title: "שערי ניקנור — The Doors That Crossed the Sea", text: "Yoma 38a: Nicanor brought two bronze doors from Alexandria. A storm rose; the sailors threw one into the sea — and it surfaced beneath the ship at Akko (some say the sea simply refused to keep it). All the Temple's gates were later plated gold, except Nicanor's: the miracle-bronze gleamed like gold on its own. You have just opened them.", hint: "Bronze that crossed the sea guards the top of the fifteen steps." },
  { kind: "wonder", title: "לבית התקיעה — The Trumpeting Stone", text: "In 1968, archaeologists at the Temple Mount's southwest corner found a fallen parapet stone carved: 'לבית התקיעה להב…' — 'To the place of trumpeting, to procl[aim]…' From that height a kohen sounded the trumpet each Friday at dusk: fields emptied, shops shuttered, and Shabbat descended on Jerusalem. The stone is real — it waits in the Israel Museum, and here, restored to its corner.", hint: "At the southwest height, a stone announces Shabbat." },
  // ── The deeper eighteen. Ids 0–15 are the opening circuit and never move —
  // progress is stored by index, so anything new is appended, never inserted.
  { kind: "rimon", title: "עשרה נסים — Ten Miracles in the House", text: "Avot 5:5 counts them: no woman ever miscarried from the scent of the sacred meat, and the meat never spoiled; no fly was seen in the slaughterhouse; the Kohen Gadol never became impure on Yom Kippur; rain never put out the fire of the woodpile; no wind ever bent the column of smoke; no disqualification was ever found in the omer, the two loaves, or the showbread; the people stood pressed together and bowed with room to spare; no snake or scorpion ever injured anyone in Jerusalem; and no one ever said to his fellow, “the place is too narrow for me to stay the night in Jerusalem.”", hint: "Ten of them — and one waits high above the golden ridge of the Royal Stoa." },
  { kind: "rimon", title: "שלושה עשר שופרות — The Thirteen Chests", text: "Shekalim 6:5: thirteen chests stood in the Mikdash, each with a mouth narrow above and wide below — shaped like a shofar, so that no hand could reach back in and take out what had been given. Each was labeled for its purpose: the shekalim, the bird-offerings, the incense, the gold of the kapporet, freewill gifts. And the men who emptied them wore garments with no hem, no cuff and no fold, so that no one could ever suspect them (Shekalim 3:2).", hint: "Among the northern columns, thirteen mouths that opened only downward." },
  { kind: "rimon", title: "לשכת חשאים — The Chamber of the Discreet", text: "Shekalim 5:6: in it the discreet would place their gifts in secret, and the poor of good family would take from it in secret. The Rambam ranks this second only to a loan that prevents poverty: the giver does not know who receives, and the receiver does not know who gave (Hilchot Matnot Aniyim 10:8). A whole room built so that no one would ever have to say thank you.", hint: "In the far northeastern kitchen court, a gift that no one signed." },
  { kind: "rimon", title: "אבן הטוען — The Claimant's Stone", text: "Bava Metzia 28b: there was a stone in Jerusalem — whoever had lost something went there, and whoever had found something went there. The finder stood and announced, the loser stood and gave the identifying signs, and took back what was his. An entire city's honesty, organized around one rock in the open air.", hint: "On the eastern pavement, a plain stone that gives back what was lost." },
  { kind: "rimon", title: "לשכת הגזית — The Chamber of Hewn Stone", text: "Middot 5:4: the Great Sanhedrin sat in the Chamber of Hewn Stone — seventy-one elders in a half-circle, so that each one could see the faces of all the others. From here Torah went out to all Israel (Sanhedrin 88b). And when murderers grew many, the Sanhedrin rose and left the chamber, so that capital cases could no longer be tried (Avodah Zarah 8b): they would rather leave the room than kill in it.", hint: "Along the southern edge of the inner court, where seventy-one sat in a half circle." },
  { kind: "rimon", title: "הכבש — A Ramp, and Not Steps", text: "“Do not ascend My altar by steps, so that your nakedness not be uncovered upon it” (Shemot 20:23) — so the altar is climbed by a ramp of thirty-two amot (Middot 3:3). Rashi asks what nakedness a robed kohen could uncover, and answers: the stones have no feelings, and still the Torah asks that they not be treated dismissively. How much more so a human being, who is in the image of his Maker.", hint: "At the foot of the long incline that climbs the burning mountain." },
  { kind: "rimon", title: "השיתין — The Drains Beneath the Altar", text: "Sukkah 49a: the shitin — the shafts beneath the altar's southwestern corner into which the libations poured — were created during the six days of Creation, and they descend to the deep. Nearby, a kohen once noticed one paving stone that sat differently from its fellows; before he could finish telling his friend, his soul left him, and they knew for certain that the Ark had been hidden underneath (Yoma 54a; Shekalim 6:2).", hint: "At the altar's southwestern corner, where the wine goes down and does not come back." },
  { kind: "rimon", title: "שער המים — The Water Gate", text: "Middot 2:6 names the gates of the azarah, and through this one they carried up the golden flask drawn from the Shiloach for the water libation of Sukkot (Sukkah 48b). Its name, says the Talmud, is also a promise: from beneath this threshold the future water will come out (Yechezkel 47:1). What was carried in each dawn will one day flow out on its own.", hint: "South of the inner court, where the flask was carried up each dawn of Sukkot." },
  { kind: "rimon", title: "הר המוריה — Mount Moriah", text: "“And Shlomo began to build the House of Hashem in Jerusalem on Mount Moriah, where He appeared to David his father” (Divrei HaYamim II 3:1). Here Avraham bound Yitzchak and named the place “Hashem will see”; here Yaakov slept and saw the ladder; here, say Chazal, the dust of Adam was taken from the very ground of his atonement (Bereishit Rabbah 14:8). The mountain was chosen long before the first stone was cut.", hint: "From the eastern stairs, turn and look back at the mountain itself." },
  { kind: "rimon", title: "שלוש רגלים — Three Times a Year", text: "“Three times a year all your males shall appear before Hashem your G-d in the place He will choose” (Devarim 16:16). The roads and the mikvaot were repaired in Adar for the pilgrims (Shekalim 1:1); Jerusalem's houses were never rented out, because the city belonged to everyone who came; and for the days of the festival all of Israel counted as chaverim, trusted as pure (Chagigah 26a). A city that grew to fit whoever arrived.", hint: "On the broad southern stairs, worn smooth by the feet of three festivals." },
  { kind: "wonder", title: "מוכני בן קטין — The Wheel of the Laver", text: "Yoma 37a: Ben Katin made a wheel for the kiyor, so that it could be lowered into its well overnight — water left standing until morning would have been disqualified, and the kohanim would have had nothing to sanctify their hands with at dawn. He also made it twelve spouts, one for each kohen of the daily offering (Middot 3:6). A man is remembered forever in the Mishnah for a piece of hardware that let the work begin on time.", hint: "Beside the bronze laver, an axle and a wheel still remember one man's name." },
  { kind: "wonder", title: "גפן של זהב — The Golden Vine", text: "Middot 3:8: a vine of gold stood over the entrance of the Heichal, trained upon posts. Whoever donated a leaf, a berry or a whole cluster brought it and hung it there, and the kohanim hammered it onto the vine. Josephus (War 5.210) says the clusters hung the height of a man. It grew the way nothing else grows — only by being given away.", hint: "Above the cedar doors of the House, something is growing that no rain ever fed." },
  { kind: "wonder", title: "ערבה — The Willows of the Altar", text: "Sukkah 45a: they brought willow branches eleven amot tall from Motza in the valley below, and stood them upright against the sides of the altar with their tops bent over it, and circled the altar once on each day of Sukkot and seven times on the seventh. The willow has no taste and no fragrance — no Torah and no good deeds, says the Midrash — and it is the one branch that leans directly on the altar.", hint: "Tall branches lean against the altar: the plant with neither taste nor scent." },
  { kind: "wonder", title: "חליל — The Flute of the Water-Drawing", text: "Sukkah 51a: whoever has not seen the rejoicing of Beit HaSho'evah has never seen rejoicing in his life. The flute was played for five and six days together; golden lamps with four bowls each lit the courtyards of Jerusalem until there was no courtyard without light; pious men danced with burning torches, juggling them; and the Levites stood on the fifteen steps with harps, lyres, cymbals and every instrument of song. They did not sleep for the whole festival.", hint: "By the fifteen steps a flute is waiting for a night nobody sleeps through." },
  { kind: "wonder", title: "עלהו לתרופה — Leaves for Healing", text: "Yechezkel 47:12: on both banks of the river every tree of food will grow; its leaf will not wither and its fruit will not fail; each month it bears new fruit, because its waters come out from the Mikdash — its fruit for food, and its leaf for healing. Chazal read לתרופה as two words: to unlock what is shut, and to loosen the tongue of the mute (Sanhedrin 100a).", hint: "At the river's edge, one tree whose leaf was never meant for eating." },
  { kind: "wonder", title: "שולחן לחם הפנים — The Table Lifted Up", text: "Menachot 29a and Chagigah 26b: on each of the three festivals the kohanim lifted the golden Shulchan and showed the pilgrims the showbread upon it, saying — see how beloved you are before Hashem: it is taken up as warm as it was on the day it was set down. Twelve loaves, two stacks of six, and in all those years no week's bread ever went stale.", hint: "Before the House stands a golden table, raised so the crowd could see the bread." },
  { kind: "wonder", title: "הקלפי — The Lottery", text: "Yoma 22a: at first, whoever wished simply ran up the ramp, and the swifter of the two won the service. Once two ran together, and one pushed the other, and he fell and broke his leg. When the court saw the danger, they instituted the lottery: the officer named a number, and they counted around the circle by raised fingers (Tamid 1:2). Even the eagerness to serve needed a fence around it.", hint: "In the court a wooden box holds the fairest way ever found to hand out honour." },
  { kind: "wonder", title: "קרבן עצים — The Offering of Wood", text: "Ta'anit 26a lists the nine days on which named families brought wood for the altar. Ta'anit 28a tells why they were honoured: an enemy government once posted watchmen on the roads so that no one could bring wood up to Jerusalem, and men hollowed logs into ladder-rungs and carried them past the guards, saying they were going to fetch chicks from a dovecote. The last of those days, the fifteenth of Av, is called one of the two happiest days Israel ever had (Ta'anit 30b).", hint: "Split fig-logs are stacked in the court, and every stack was carried by a family." },
  { kind: "wonder", title: "פרה אדומה — The Red Heifer and the Causeway", text: "Bamidbar 19: the ashes of a heifer entirely red, that never bore a yoke, purify whoever touched the dead — and make impure the pure kohen who prepares them. Shlomo said: I thought I could become wise in it, but it is far from me (Yoma 14a). Parah 3:6: it was burned on Har HaMishcha, and a causeway was built from the Temple Mount across to it, arches upon arches, an arch above each pier, for fear of a grave hidden in the ground below.", hint: "East, beyond the sealed gate, a raised causeway crosses to something russet and red." },
  { kind: "wonder", title: "הכותל המערבי — The Wall That Remained", text: "Shemot Rabbah 2:2: the Shechinah has never departed from the Western Wall. Shir HaShirim Rabbah 2:9 reads “behold, He stands behind our wall” — behind the western wall of the Mikdash — because Hashem swore to it that it would never be destroyed. Herod's great courses are still standing at the western retaining wall, and the notes pressed into their joints are still being written today.", hint: "Outside the western retaining wall, great courses still stand — and people still write to them." },
];

// Eighteen who answer — twelve kohanim at the stations of the morning avodah
// and six Levites on the steps. Every line carries its source, like every
// dimension does.
const KOHEN_VOICES = [
  { name: "תרומת הדשן", role: "The lifting of the ashes",
    text: "Before first light I went up in linen and lifted one shovelful of ash from the fire, and set it down beside the altar. Vayikra 6:3–4. The day's first act is to carry away what yesterday burned.", src: "Vayikra 6:3–4 · Tamid 1:2" },
  { name: "סידור המערכה", role: "The arrangement of the wood",
    text: "Two logs of fig-wood, laid so the air runs between them — a great arrangement for the offerings and a second beside it for the ketoret. The fire never goes out: אש תמיד תוקד.", src: "Vayikra 6:6 · Yoma 26b · Tamid 2:3" },
  { name: "הפייס", role: "The lottery",
    text: "Once we raced up the ramp for the honour of the service, until one kohen was pushed and broke his leg. From that day we draw lots. Even eagerness needs a fence.", src: "Yoma 22a · Tamid 1:2" },
  { name: "הכיור", role: "The laver",
    text: "Hands and feet before any service. Ben Katin made a wheel for the kiyor so it could be lowered into the water overnight — water left standing would have made it unfit by morning.", src: "Shemot 30:19 · Yoma 37a · Middot 3:6" },
  { name: "התמיד", role: "The daily offering",
    text: "One lamb at dawn and one between the evenings, every day, in every generation. Ben Zoma said the whole Torah hangs on this verse — not on any grand principle, but on the offering that simply does not stop.", src: "Bamidbar 28:3–4 · Ein Yaakov, Introduction" },
  { name: "ניסוך המים", role: "The water libation",
    text: "Drawn from the Shiloach in a flask of gold and poured at dawn through the silver bowl at the altar's corner. For Sukkot the whole city came out with torches, and no one slept.", src: "Sukkah 48a–b · Sukkah 51a" },
  { name: "לחם הפנים", role: "The showbread",
    text: "Twelve loaves set out each Shabbat and lifted the next — and they came away as warm as the hour they were baked. That warmth was the sign, week after week, that the House was not empty.", src: "Vayikra 24:5–9 · Chagigah 26b · Menachot 29a" },
  { name: "ברכת כהנים", role: "The priestly blessing",
    text: "We stand on the steps of the Ulam, hands lifted and fingers parted, and say the Name as it is written. Not our blessing — we are only the hands. וְשָׂמוּ אֶת שְׁמִי, and I shall bless them.", src: "Bamidbar 6:23–27 · Sotah 38a" },
  { name: "פתיחת השערים", role: "The opening of the gates",
    text: "It takes several of us to draw back the great door, and they say the sound of it carries as far as Jericho. Nothing about this House was built to be done quietly, or alone.", src: "Tamid 3:7–8 · Yoma 39b" },
  { name: "הטבת הנרות", role: "The trimming of the lamps",
    text: "I clean the cups and lay fresh wicks and oil, the same measure in each. And still the westernmost lamp is burning when I come back at dusk — from it I kindle all the rest.", src: "Tamid 3:9 · Shabbat 22b" },
  { name: "בגדי כהונה", role: "The garments",
    text: "Four garments of white linen, and nothing on me that is my own — not my family's wealth, not my name. While the garments are upon us the priesthood is upon us; without them, we are ordinary men.", src: "Shemot 28:2 · Zevachim 17b" },
  { name: "ביכורים", role: "The first fruits",
    text: "They come up with the ox before them, its horns overlaid with gold and an olive wreath on its head, and a flute playing all the way. The craftsmen of Jerusalem stand up as they pass — work stops for farmers carrying figs.", src: "Bikkurim 3:2–4" },
];

const LEVI_VOICES = [
  { name: "שיר המעלות", role: "On the fifteen steps",
    text: "Fifteen steps between the courts and fifteen songs of ascent — one for each. We stood upon them with harps and lyres and cymbals. Try them: they still hold their notes.", src: "Middot 2:5 · Sukkah 51b" },
  { name: "כינור", role: "The harp of the Sanctuary",
    text: "The kinor of the Sanctuary carried seven strings, and in the days of Mashiach it will carry eight. One more string, for a song we cannot yet sing.", src: "Arachin 13b" },
  { name: "שיר של יום", role: "The song of the day",
    text: "Every day has its psalm, sung over the wine libation, and the trumpets sound between its parts while all Israel bows. Today is not the same song as yesterday.", src: "Tamid 7:3–4" },
  { name: "אין שירה", role: "No song without an offering",
    text: "There is no song except over a sacrifice, and no sacrifice complete without song. The two were never meant to stand apart.", src: "Arachin 11a" },
  { name: "מעמדות", role: "The men who stand by",
    text: "A person's offering cannot be brought while he is not standing over it — so all Israel was divided into watches, and while one watch served here the rest read the account of Creation at home. Nobody was meant to be absent from this.", src: "Ta'anit 26a · Ta'anit 27b" },
  { name: "המגרפה", role: "The instrument no one could speak over",
    text: "When it sounded, no one in Jerusalem could hear his fellow speak. Three things it announced: a kohen entering to burn the ketoret, his brothers coming to bow, and the Levites rising to sing.", src: "Tamid 3:8 · Arachin 10b–11a" },
];

// Eighteen rimonim of silver — chai. Each carries the id of its teaching in
// DISCOVERIES, because the ten deeper ones were appended after the wonders and
// their ids are not their place in this list.
const RIMON_POS = [
  { id: 0, pos: [HALF - 18, 4.2, 0] },
  { id: 1, pos: [150, 2.8, 26] },
  { id: 2, pos: [-4, 12.6, 30] },
  { id: 3, pos: [-40, 15.4, -HALF + 34] },
  { id: 4, pos: [-HALF + 14, 2.6, -70] },
  { id: 5, pos: [-165, 82, 10] },
  { id: 6, pos: [-HALF + 30, 2.6, HALF - 30] },
  { id: 7, pos: [36, 6, HALF - 35] },        // in the porch's outer aisle — the roof deck fills 25.5–27.7
  { id: 16, pos: [40, 46, HALF - 58] },       // above the ridge of the Royal Stoa
  { id: 17, pos: [-90, 8, -HALF + 36] },      // the northern colonnade
  { id: 18, pos: [HALF - 30, 5, -HALF + 30] },// the northeastern kitchen court
  { id: 19, pos: [200, 5, -40] },             // the eastern pavement
  { id: 20, pos: [-40, 16, 97] },             // southern edge of the azarah
  { id: 21, pos: [28, 17, 8] },               // the foot of the altar ramp
  { id: 22, pos: [-28, 13, 20] },             // the altar's southwestern corner
  { id: 23, pos: [-20, 12, 116] },            // south of the inner court
  { id: 24, pos: [300, 2, -34] },             // the eastern stairs
  { id: 25, pos: [30, 2, HALF + 50] },        // the southern pilgrim stairs
];

// ────────────────────────── procedural textures ──────────────────────────
// Set from renderer.capabilities once the context exists. Every texture is
// tuned through here, so nothing can be left on the default anisotropy of 1 —
// which is what turns a 500-amah plaza into grey mush at a grazing angle.
let MAX_ANISO = 1;

function makeCanvas(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = MAX_ANISO;
  // Everything drawn on a 2D canvas comes out in sRGB. Say so, or three feeds
  // those bytes to the lighting maths as though they were already linear and
  // every shaded midtone lands too bright — the milky, contrast-free look.
  // Derived normal/roughness maps are *data*, not colour, and stay linear.
  t.encoding = THREE.sRGBEncoding;
  return t;
}
const rnd = (a, b) => a + Math.random() * (b - a);

// ─────────────────────────────────────────────────────────────────────────────
// Derived PBR maps
//
// A colour map on its own gives a wall that is a *photograph* of stone: the
// drafted margin is painted on, so it stays painted on no matter where the sun
// is. What makes ashlar read as carved is the margin catching light on one
// side and holding shadow on the other, and that needs a normal map.
//
// Rather than ship one, derive it from the pixels already drawn: read the
// canvas back, treat luminance as height, and Sobel it into a tangent-space
// normal. The margins are drawn darker than the boss, so they fall away; the
// speckle becomes grain. One generator feeds both maps, so a texture and its
// relief can never drift apart.
// ─────────────────────────────────────────────────────────────────────────────
function heightFromCanvas(canvas) {
  const w = canvas.width, h = canvas.height;
  const d = canvas.getContext("2d").getImageData(0, 0, w, h).data;
  const out = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    // Weight by alpha: a sprite's transparent surround must not read as a pit.
    const a = d[o + 3] / 255;
    out[i] = ((d[o] * 0.299 + d[o + 1] * 0.587 + d[o + 2] * 0.114) / 255) * a + (1 - a) * 0.5;
  }
  return { w, h, data: out };
}

function dataTex(bytes, w, h) {
  const t = new THREE.DataTexture(bytes, w, h, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = MAX_ANISO;
  t.needsUpdate = true;
  return t;
}

function normalFromCanvas(canvas, strength = 2.4) {
  const { w, h, data } = heightFromCanvas(canvas);
  // Wrapped sampling — the map tiles, so its relief has to tile with it or
  // every repeat boundary shows up as a seam of hard lighting.
  const at = (x, y) => data[((y % h) + h) % h * w + (((x % w) + w) % w)];
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1))
               - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
      const dy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1))
               - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
      let nx = -dx * strength, ny = -dy * strength;
      const inv = 1 / Math.sqrt(nx * nx + ny * ny + 1);
      const o = (y * w + x) * 4;
      out[o] = (nx * inv * 0.5 + 0.5) * 255;
      out[o + 1] = (ny * inv * 0.5 + 0.5) * 255;
      out[o + 2] = (inv * 0.5 + 0.5) * 255;
      out[o + 3] = 255;
    }
  }
  return dataTex(out, w, h);
}

// Uniform roughness is what makes CG stone look like painted plastic: the whole
// wall takes the sun back at exactly the same sharpness. Real ashlar does not —
// the chiselled margin scatters, the dressed boss is smoother, and weathering
// is blotchy. Remap luminance into a narrow roughness band and the highlight
// starts to break up across a surface instead of sliding over it.
function roughFromCanvas(canvas, lo = 0.42, hi = 0.92) {
  const { w, h, data } = heightFromCanvas(canvas);
  const out = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = (hi - (hi - lo) * data[i]) * 255;
    const o = i * 4;
    out[o] = out[o + 1] = out[o + 2] = v;   // three reads roughness from .g
    out[o + 3] = 255;
  }
  return dataTex(out, w, h);
}

// Build a standard material whose relief is derived from its own colour map,
// with repeat/offset copied across so the three maps can never slide apart.
function pbr(map, {
  bump = 2.4, normalScale = 1, rough = null, roughness = 0.8, ...rest
} = {}) {
  const normalMap = normalFromCanvas(map.image, bump);
  normalMap.repeat.copy(map.repeat);
  normalMap.offset.copy(map.offset);
  const opts = { map, normalMap, normalScale: new THREE.Vector2(normalScale, normalScale), roughness, ...rest };
  if (rough) {
    const roughnessMap = roughFromCanvas(map.image, rough[0], rough[1]);
    roughnessMap.repeat.copy(map.repeat);
    roughnessMap.offset.copy(map.offset);
    opts.roughnessMap = roughnessMap;
    opts.roughness = 1;   // scalar multiplies the map — keep the map authoritative
  }
  return new THREE.MeshStandardMaterial(opts);
}

function ashlar({ base = [218, 211, 194], courses = 5, cols = 4, margin = true } = {}) {
  return makeCanvas(512, 512, (ctx, w, h) => {
    const ch = h / courses;
    for (let r = 0; r < courses; r++) {
      const off = (r % 2) * ((w / cols) / 2);
      for (let col = -1; col < cols + 1; col++) {
        const j = rnd(-7, 7);
        ctx.fillStyle = `rgb(${base[0] + j | 0},${base[1] + j | 0},${base[2] + j * 0.85 | 0})`;
        ctx.fillRect(col * (w / cols) + off + 2, r * ch + 2, w / cols - 4, ch - 4);
        if (margin) {
          ctx.strokeStyle = "rgba(140,128,100,0.5)";
          ctx.lineWidth = 5;
          ctx.strokeRect(col * (w / cols) + off + 8, r * ch + 8, w / cols - 16, ch - 16);
          ctx.fillStyle = "rgba(255,255,250,0.09)";
          ctx.fillRect(col * (w / cols) + off + 10, r * ch + 10, w / cols - 20, (ch - 20) / 2.4);
        }
      }
    }
    for (let i = 0; i < 2200; i++) {
      ctx.fillStyle = `rgba(${rnd(120, 170) | 0},${rnd(112, 158) | 0},${rnd(88, 128) | 0},${rnd(0.03, 0.09)})`;
      ctx.fillRect(rnd(0, w), rnd(0, h), rnd(1, 3), rnd(1, 3));
    }
    ctx.fillStyle = "rgba(105,95,70,0.55)";
    for (let r = 0; r <= courses; r++) ctx.fillRect(0, r * ch - 1.5, w, 3);
  });
}

function seaWaveMarble() {
  return makeCanvas(512, 512, (ctx, w, h) => {
    const bands = 9;
    for (let b = 0; b < bands; b++) {
      const isSea = b % 2 === 1;
      ctx.fillStyle = isSea ? "#cfe2da" : "#f6f2e7";
      ctx.beginPath();
      ctx.moveTo(0, (b / bands) * h);
      for (let x = 0; x <= w; x += 8)
        ctx.lineTo(x, (b / bands) * h + Math.sin(x * 0.028 + b * 2) * 7);
      ctx.lineTo(w, ((b + 1) / bands) * h + 10);
      ctx.lineTo(0, ((b + 1) / bands) * h + 10);
      ctx.closePath();
      ctx.fill();
      if (isSea) {
        ctx.strokeStyle = "rgba(120,160,150,0.35)";
        ctx.lineWidth = 1.4;
        for (let v = 0; v < 3; v++) {
          ctx.beginPath();
          for (let x = 0; x <= w; x += 6)
            ctx.lineTo(x, (b / bands) * h + 10 + v * 12 + Math.sin(x * 0.04 + v) * 4);
          ctx.stroke();
        }
      }
    }
    for (let v = 0; v < 16; v++) {
      ctx.strokeStyle = `rgba(170,165,140,${rnd(0.08, 0.2)})`;
      ctx.lineWidth = rnd(0.6, 1.6);
      ctx.beginPath();
      let x = rnd(0, w), y = 0;
      ctx.moveTo(x, y);
      while (y < h) { y += rnd(16, 46); x += rnd(-30, 30); ctx.lineTo(x, y); }
      ctx.stroke();
    }
  });
}

function marbleTex() {
  return makeCanvas(512, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#e7e1d0"); g.addColorStop(0.5, "#ddd6c2"); g.addColorStop(1, "#e3ddcb");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let v = 0; v < 24; v++) {
      ctx.strokeStyle = `rgba(${rnd(160, 190) | 0},${rnd(150, 178) | 0},${rnd(125, 150) | 0},${rnd(0.1, 0.26)})`;
      ctx.lineWidth = rnd(0.6, 2);
      ctx.beginPath();
      let x = rnd(0, w), y = 0;
      ctx.moveTo(x, y);
      while (y < h) { y += rnd(14, 44); x += rnd(-32, 32); ctx.lineTo(x, y); }
      ctx.stroke();
    }
  });
}

function goldTex() {
  return makeCanvas(256, 256, (ctx, w, h) => {
    for (let x = 0; x < w; x++) {
      const v = 200 + Math.sin(x * 0.33) * 18 + rnd(-9, 9);
      ctx.fillStyle = `rgb(${v | 0},${v * 0.75 | 0},${v * 0.28 | 0})`;
      ctx.fillRect(x, 0, 1, h);
    }
    for (let i = 0; i < 340; i++) {
      ctx.fillStyle = `rgba(255,244,200,${rnd(0.06, 0.22)})`;
      ctx.fillRect(rnd(0, w), rnd(0, h), rnd(1, 5), 1);
    }
  });
}

function cedarTex() {
  return makeCanvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#6d4527"; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) {
      ctx.fillStyle = `rgba(${rnd(70, 130) | 0},${rnd(45, 80) | 0},${rnd(22, 45) | 0},${rnd(0.2, 0.5)})`;
      ctx.fillRect(0, y + Math.sin(y * 0.3) * 1.5, w, rnd(1, 2.4));
    }
    for (let k = 0; k < 8; k++) {
      ctx.strokeStyle = "rgba(48,28,14,0.5)";
      ctx.beginPath(); ctx.arc(rnd(0, w), rnd(0, h), rnd(3, 8), 0, 7); ctx.stroke();
    }
  });
}

// Judean dust. The first version scattered nine thousand hard 1-4px squares
// and a hundred hard-edged discs, which is fine as *colour* — but once the
// terrain took a derived normal map, every one of those specks became a pebble
// and the whole hillside broke out in orange peel. Ground at this scale wants
// the opposite: large soft tonal drift, a little windblown streaking, and
// grain fine enough to stay grain.
function groundTexture() {
  return makeCanvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#c6ae80"; ctx.fillRect(0, 0, w, h);
    // No large-scale features. This map tiles 26 times across the plain, and
    // anything bigger than a few pixels becomes a stamp the eye can follow —
    // broad mottling here read as a checkerboard stretching to the horizon.
    // Large-scale variation is the job of the terrain and the haze; the map's
    // job is grain. Streaks stay faint and short for the same reason.
    ctx.lineCap = "round";
    for (let i = 0; i < 120; i++) {
      ctx.strokeStyle = `rgba(${rnd(150, 190) | 0},${rnd(132, 172) | 0},${rnd(96, 132) | 0},${rnd(0.02, 0.05)})`;
      ctx.lineWidth = rnd(2, 6);
      ctx.beginPath();
      let x = rnd(0, w), y = rnd(0, h);
      ctx.moveTo(x, y);
      for (let k = 0; k < 3; k++) { x += rnd(8, 22); y += rnd(-5, 5); ctx.lineTo(x, y); }
      ctx.stroke();
    }
    // Fine grain, low contrast — texture the eye reads as dust, not gravel.
    for (let i = 0; i < 14000; i++) {
      ctx.fillStyle = `rgba(${rnd(150, 205) | 0},${rnd(132, 182) | 0},${rnd(94, 140) | 0},${rnd(0.02, 0.07)})`;
      ctx.fillRect(rnd(0, w), rnd(0, h), 1, 1);
    }
    // Sparse stones, soft enough to survive being turned into relief.
    for (let i = 0; i < 40; i++) {
      const x = rnd(0, w), y = rnd(0, h), r = rnd(2.5, 6);
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0.5, x, y, r);
      g.addColorStop(0, "rgba(206,194,166,0.5)");
      g.addColorStop(1, "rgba(126,112,84,0.28)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
  });
}

// Court paving. The first version was a perfect 8x8 grid with a hard 2px
// joint at half opacity, which read as graph paper the moment the camera came
// down to the plaza — a dead-straight lattice running to the horizon, every
// cell the same size and nearly the same value.
//
// Herodian paving is not a grid. It is courses of differing height, each
// course broken into slabs of differing width, with the breaks staggered from
// one course to the next. Joints are thin, warm and soft rather than black,
// and slabs vary enough in tone to read individually. That is what is drawn
// here — and the wider tonal spread also gives the derived normal map real
// slabs to lift instead of a lattice to emboss.
function pavingTex() {
  return makeCanvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "rgb(196,188,168)"; ctx.fillRect(0, 0, w, h);   // joint bed
    const rows = [];
    for (let y = 0; y < h; ) { const ch = rnd(44, 82); rows.push([y, Math.min(ch, h - y)]); y += ch; }
    for (const [y, ch] of rows) {
      // Stagger every course so no joint runs more than one course deep.
      let x = -rnd(0, 70);
      while (x < w) {
        const sw = rnd(48, 118);
        const j = rnd(-13, 13);
        const g = ctx.createLinearGradient(x, y, x + sw, y + ch);
        // Each slab is dressed slightly differently, and worn brighter in the
        // middle where feet have polished it.
        g.addColorStop(0, `rgb(${208 + j | 0},${201 + j | 0},${182 + j | 0})`);
        g.addColorStop(0.55, `rgb(${220 + j | 0},${214 + j | 0},${196 + j | 0})`);
        g.addColorStop(1, `rgb(${203 + j | 0},${196 + j | 0},${176 + j | 0})`);
        ctx.fillStyle = g;
        ctx.fillRect(x + 1.2, y + 1.2, sw - 2.4, ch - 2.4);
        // A soft inner shadow on two sides seats the slab into its bed.
        ctx.strokeStyle = "rgba(150,140,116,0.30)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x + 1.6, y + ch - 2); ctx.lineTo(x + 1.6, y + 1.6); ctx.lineTo(x + sw - 2, y + 1.6);
        ctx.stroke();
        x += sw;
      }
    }
    // Wear, grit and the odd chip.
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(${rnd(168, 206) | 0},${rnd(158, 198) | 0},${rnd(126, 168) | 0},${rnd(0.03, 0.08)})`;
      ctx.fillRect(rnd(0, w), rnd(0, h), rnd(1, 2.5), rnd(1, 2.5));
    }
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = `rgba(146,136,110,${rnd(0.10, 0.2)})`;
      ctx.beginPath(); ctx.arc(rnd(0, w), rnd(0, h), rnd(1.5, 4), 0, 7); ctx.fill();
    }
  });
}

function cloudTex() {
  return makeCanvas(256, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 22; i++) {
      const g = ctx.createRadialGradient(rnd(30, w - 30), rnd(30, h - 30), 2, rnd(30, w - 30), rnd(30, h - 30), rnd(22, 52));
      g.addColorStop(0, "rgba(255,255,255,0.5)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  });
}

function fireSpriteTex() {
  return makeCanvas(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,240,190,1)");
    g.addColorStop(0.3, "rgba(255,170,60,0.85)");
    g.addColorStop(0.7, "rgba(220,70,10,0.35)");
    g.addColorStop(1, "rgba(180,40,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

// A metal surface in three.js takes almost all of its colour from what it
// reflects. With no environment there is nothing to reflect, so gold plate
// renders black except where a light happens to glint off it — which is
// exactly what the Ulam facade was doing. This is that environment: sky over
// haze over Judean hillside, in one equirectangular strip.
// Vertical flutes. A cylinder's UV runs u around the circumference, so bands
// drawn across the canvas become grooves around the shaft.
function flutedTex(bands = 22) {
  return makeCanvas(512, 32, (ctx, w, h) => {
    ctx.fillStyle = "#ded7c4"; ctx.fillRect(0, 0, w, h);
    const bw = w / bands;
    for (let i = 0; i < bands; i++) {
      const g = ctx.createLinearGradient(i * bw, 0, (i + 1) * bw, 0);
      g.addColorStop(0, "rgba(104,95,74,0.62)");
      g.addColorStop(0.42, "rgba(255,253,244,0.55)");
      g.addColorStop(0.58, "rgba(255,253,244,0.4)");
      g.addColorStop(1, "rgba(104,95,74,0.62)");
      ctx.fillStyle = g; ctx.fillRect(i * bw, 0, bw, h);
    }
  });
}

function envSkyTex() {
  const t = makeCanvas(256, 128, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0.0, "#4d80c8");
    g.addColorStop(0.38, "#a9c6e4");
    g.addColorStop(0.5, "#f2e8d2");
    g.addColorStop(0.56, "#d8c399");
    g.addColorStop(1.0, "#8f7a55");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const sun = ctx.createRadialGradient(w * 0.68, h * 0.24, 1, w * 0.68, h * 0.24, 34);
    sun.addColorStop(0, "rgba(255,252,236,1)");
    sun.addColorStop(1, "rgba(255,246,222,0)");
    ctx.fillStyle = sun; ctx.fillRect(0, 0, w, h);
  });
  t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

function blueSpriteTex() {
  return makeCanvas(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(232,250,255,1)");
    g.addColorStop(0.28, "rgba(120,200,255,0.85)");
    g.addColorStop(0.65, "rgba(40,110,255,0.32)");
    g.addColorStop(1, "rgba(10,40,180,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

function smokeSpriteTex() {
  return makeCanvas(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(150,146,140,0.62)");
    g.addColorStop(0.6, "rgba(120,117,112,0.3)");
    g.addColorStop(1, "rgba(96,94,90,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

function plaqueTex() {
  return makeCanvas(256, 96, (ctx, w, h) => {
    ctx.fillStyle = "#e8e0cc"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(150,138,108,${rnd(0.05, 0.15)})`;
      ctx.fillRect(rnd(0, w), rnd(0, h), 2, 2);
    }
    ctx.fillStyle = "#4a3c22";
    ctx.font = "bold 40px Georgia, serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("לבית התקיעה", w / 2, h / 2);
  });
}

// GLSL value noise shared by the flame shaders
const NOISE_GLSL = `
float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1,0)), f.x),
             mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int k = 0; k < 4; k++){ v += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return v;
}
`;

// ─────────────────────────────── component ───────────────────────────────
export default function Mikdash() {
  const mountRef = useRef(null);
  const apiRef = useRef({});
  const [found, setFound] = useState([]);
  const [fact, setFact] = useState(null);
  const [night, setNight] = useState(false);
  const [sound, setSound] = useState(true);
  const [hints, setHints] = useState(false);
  const [questMode, setQuestMode] = useState(true);
  const [walkMode, setWalkMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [noWebGL, setNoWebGL] = useState(false);
  const [speech, setSpeech] = useState(null);
  // The pesichah — the opening card. Shown once, ever; the first visit is the
  // only one that needs it, and a returning visitor should land straight in
  // the courts. Persisted alongside progress.
  const [opened, setOpened] = useState(false);

  const foundRef = useRef(found); foundRef.current = found;
  const questRef = useRef(questMode); questRef.current = questMode;
  const walkRef = useRef(walkMode); walkRef.current = walkMode;

  const closeFact = useCallback(() => setFact(null), []);
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(null), 2600);
  }, []);

  // The next wonder in sequence = first index not yet found
  const nextTarget = (() => {
    for (let i = 0; i < DISCOVERIES.length; i++) if (!found.includes(i)) return i;
    return -1;
  })();
  const nextRef = useRef(nextTarget); nextRef.current = nextTarget;

  // ─── persistent progress ───
  useEffect(() => {
    (async () => {
      try {
        if (window.storage) {
          const r = await window.storage.get(STORE_KEY);
          if (r && r.value) {
            const data = JSON.parse(r.value);
            if (Array.isArray(data.found)) setFound(data.found.filter((n) => n >= 0 && n < DISCOVERIES.length));
            if (typeof data.night === "boolean") setNight(data.night);
            if (typeof data.sound === "boolean") setSound(data.sound);
            if (data.opened) setOpened(true);
          }
        }
      } catch (err) { /* first visit — nothing saved yet */ }
      setStorageReady(true);
    })();
  }, []);
  useEffect(() => {
    if (!storageReady || !window.storage) return;
    window.storage.set(STORE_KEY, JSON.stringify({ found, night, sound, opened })).catch(() => {});
  }, [found, night, sound, opened, storageReady]);

  // ─── the first step is the hardest ───
  // Once the pesichah is closed, a visitor who has found nothing after 40s is
  // shown the way unasked: the beacon rises over the first rimon on its own.
  // Only ever for the first one — after that the hint line is enough.
  useEffect(() => {
    if (!opened || !loaded || found.length > 0 || !questMode) return;
    const t = setTimeout(() => {
      if (apiRef.current.guideTo?.(0)) showToast("בֹּא וּרְאֵה — come and see. There, inside the eastern gate.");
    }, 40000);
    return () => clearTimeout(t);
  }, [opened, loaded, found.length, questMode, showToast]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      // Without a tone curve, sunlit white stone runs past 1.0 and clips to a
      // flat white sheet — no ashlar, no drafted margins, and an additive
      // flame in front of it has nothing left to add to. ACES rolls the
      // highlights off instead, so the stone keeps its courses and the fire
      // keeps its hue over them.
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      // Lighting has to happen in linear space and be converted to sRGB on the
      // way out. Without this the whole pipeline shades on sRGB numbers, which
      // is why the courts read milky: shadows lift, midtones flatten, and no
      // amount of light tuning recovers the contrast.
      renderer.outputEncoding = THREE.sRGBEncoding;
      // Correct encoding brightens everything, so the exposure comes back down.
      renderer.toneMappingExposure = 0.78;
    } catch (err) {
      // No WebGL: an old device, a disabled setting, a headless browser. The
      // House cannot be drawn — say so rather than leaving a white page.
      setNoWebGL(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Grazing angles are most of this scene — a 500-amah plaza, colonnade
    // roofs running away from the camera, stairs seen edge-on. At the default
    // anisotropy of 1 all of it blurs to grey a third of the way to the
    // horizon. Read the real cap rather than assuming 16.
    MAX_ANISO = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.5, 5000);
    // Fog colour is consumed linearly, so the old pale blue encoded out almost
    // white and flattened the horizon into the sky. Linearised, and warmed a
    // little towards the dust it is supposed to be hanging in.
    scene.fog = new THREE.Fog(0x86a0b4, 900, 2500);

    // ═══════════ SKY (GLSL) ═══════════
    const skyUniforms = {
      uNight: { value: 0 },
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.55, 0.6, -0.42).normalize() },
      uMoonDir: { value: new THREE.Vector3(-0.5, 0.55, 0.45).normalize() },
    };
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(2000, 32, 20),
      new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyUniforms,
        vertexShader: `
          varying vec3 vDir;
          void main(){ vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          varying vec3 vDir;
          uniform float uNight; uniform float uTime;
          uniform vec3 uSunDir; uniform vec3 uMoonDir;
          float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
          void main(){
            vec3 d = normalize(vDir);
            float h = clamp(d.y, -0.06, 1.0);
            // These were picked by eye when the renderer wrote whatever it was
            // handed. Now the output is encoded to sRGB, so the same numbers
            // come out roughly a stop and a half brighter — the horizon went to
            // a white wash. Linearised (≈ x^2.2) they land where they were
            // originally judged to look right.
            vec3 dayZen = vec3(0.070,0.268,0.666), dayMid = vec3(0.325,0.552,0.792), dayHor = vec3(0.873,0.757,0.552);
            vec3 day = mix(dayHor, mix(dayMid, dayZen, smoothstep(0.18,0.75,h)), smoothstep(0.0,0.22,h));
            vec3 nZen = vec3(0.0008,0.0022,0.0035), nMid = vec3(0.0035,0.006,0.016), nHor = vec3(0.012,0.014,0.035);
            vec3 nightC = mix(nHor, mix(nMid, nZen, smoothstep(0.15,0.7,h)), smoothstep(0.0,0.2,h));
            vec3 col = mix(day, nightC, uNight);
            float sdot = max(dot(d, uSunDir), 0.0);
            col += (pow(sdot,1500.0)*3.2 + pow(sdot,60.0)*0.75 + pow(sdot,8.0)*0.16) * vec3(1.0,0.92,0.74) * (1.0-uNight);
            float horizWarm = smoothstep(0.28,0.0,h) * pow(max(dot(normalize(vec3(d.x,0.0,d.z)), normalize(vec3(uSunDir.x,0.0,uSunDir.z))),0.0),3.0);
            col += horizWarm * vec3(0.28,0.16,0.05) * (1.0-uNight);
            float mdot = max(dot(d, uMoonDir), 0.0);
            col += (pow(mdot,3800.0)*2.4 + pow(mdot,120.0)*0.5 + pow(mdot,14.0)*0.07) * vec3(0.82,0.87,1.0) * uNight;
            vec3 sp = floor(d * 240.0);
            float star = step(0.9986, hash(sp));
            float tw = 0.55 + 0.45*sin(uTime*2.5 + hash(sp+1.7)*60.0);
            col += star * tw * (0.35 + hash(sp+3.1)*0.8) * vec3(0.95,0.97,1.0) * uNight * smoothstep(0.02,0.28,h);
            float band = exp(-pow((d.y-0.42+0.25*sin(atan(d.z,d.x))),2.0)*34.0);
            col += band * 0.045 * vec3(0.7,0.75,0.95) * uNight;
            col += (hash(d*1234.5)-0.5)*0.012;
            gl_FragColor = vec4(col, 1.0);
            // A ShaderMaterial writes gl_FragColor raw — three only appends the
            // output conversion to its own materials. Without this include the
            // sky alone would stay in the old space and sit visibly darker than
            // the House standing against it.
            #include <encodings_fragment>
          }`,
      })
    );
    scene.add(sky);

    const cMap = cloudTex();
    const clouds = [];
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < 5; i++) {
        const m = new THREE.SpriteMaterial({ map: cMap, transparent: true, opacity: 0.85 - layer * 0.18, depthWrite: false, fog: false });
        const s = new THREE.Sprite(m);
        const sc = rnd(260, 480) - layer * 40;
        s.scale.set(sc, sc * 0.42, 1);
        s.position.set(rnd(-1500, 1500), 330 + layer * 130 + rnd(-30, 30), rnd(-1500, 1500));
        s.userData = { speed: 0.05 + layer * 0.05 + rnd(0, 0.05), mat: m, baseO: m.opacity };
        scene.add(s);
        clouds.push(s);
      }
    }

    // ═══════════ Lights ═══════════
    const hemi = new THREE.HemisphereLight(0xcfe0ff, 0xc4b18a, 0.85);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff0d2, 1.55);
    sun.castShadow = true;
    // Shadow texel budget. The old 2048 map spread over a 1120-amah frustum
    // put one texel every half-amah, which is coarser than the stones it was
    // meant to shadow. Desktop-class GPUs get 4096; anything with a small
    // texture cap (mobile) stays at 2048 rather than failing to allocate.
    const shadowRes = renderer.capabilities.maxTextureSize >= 8192 ? 4096 : 2048;
    sun.shadow.mapSize.set(shadowRes, shadowRes);
    // Tightened to the built precinct plus its stairs. Every amah of frustum
    // spent on empty hillside is a texel not spent on the House.
    Object.assign(sun.shadow.camera, { left: -430, right: 430, top: 430, bottom: -430, near: 60, far: 2200 });
    // Now that the stone carries a normal map, shadow acne shows up as a moiré
    // crawling over every wall. normalBias offsets the lookup along the surface
    // normal, which fixes acne on curved and angled faces without the
    // peter-panning that a large depth bias alone would cause.
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.9;
    scene.add(sun);

    // ═══════════ Materials ═══════════
    const whiteMap = ashlar(); whiteMap.repeat.set(3, 1.4);
    // Hero surface: every outer wall and most of the precinct. Deep bump so
    // the drafted margins hold a shadow line, and a roughness map so the sun
    // does not slide across a whole wall at one sharpness.
    const white = pbr(whiteMap, { bump: 3.2, normalScale: 1.15, rough: [0.55, 0.95] });
    const megaMap2 = ashlar({ base: [211, 205, 189], cols: 3, courses: 3 });
    megaMap2.repeat.set(4, 2);
    // Megalithic courses: fewer, larger stones, so the relief reads from
    // further out and can afford to be stronger still.
    const mega = pbr(megaMap2, { bump: 3.8, normalScale: 1.3, rough: [0.6, 0.98] });
    const waveMap = seaWaveMarble(); waveMap.repeat.set(1.6, 1);
    // Polished marble: the wave banding is a colour change, not a carving, so
    // the relief stays shallow. The roughness map is what sells it — the
    // blue-green bands take the sun back sharper than the white.
    const wave = pbr(waveMap, { bump: 1.1, normalScale: 0.55, rough: [0.18, 0.5] });
    const marbleMap = marbleTex();
    const marble = pbr(marbleMap, { bump: 1.0, normalScale: 0.5, rough: [0.22, 0.55] });
    const goldMap = goldTex();
    // Beaten plate, not machined sheet: the hammer marks are what make gold
    // read as gold. Without relief a metal surface is a perfect mirror of the
    // environment map and reads as flat yellow paint.
    const gold = pbr(goldMap, { bump: 1.9, normalScale: 0.8, metalness: 0.88, rough: [0.16, 0.42] });
    // gold plate: metallic but NOT self-emissive by day — no more "sun inside the House"
    const goldPlate = pbr(goldMap, { bump: 1.9, normalScale: 0.7, metalness: 0.95, rough: [0.12, 0.36], emissive: 0x1c1200, emissiveIntensity: 0 });
    const bronze = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, metalness: 0.75, roughness: 0.35 });
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const eqTex = envSkyTex();
    const envMap = pmrem.fromEquirectangular(eqTex).texture;
    eqTex.dispose(); pmrem.dispose();
    const cedarMap = cedarTex(); cedarMap.repeat.set(2, 1);
    // Grain you can rake light across.
    const cedar = pbr(cedarMap, { bump: 2.6, normalScale: 0.9, rough: [0.5, 0.85] });
    const silver = new THREE.MeshStandardMaterial({ color: 0xdde2e9, metalness: 0.96, roughness: 0.12 });
    const foundGold = new THREE.MeshStandardMaterial({ color: 0xffd24a, metalness: 0.9, roughness: 0.2, emissive: 0x8a6a00, emissiveIntensity: 0.55 });
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x201509, emissive: 0xffb347, emissiveIntensity: 0 });
    const stoneDarkM = pbr(ashlar({ base: [206, 196, 172] }), { bump: 3.0, normalScale: 1.05, rough: [0.6, 0.96] });
    // The flutes are drawn as gradient bands, so their derived normal curves a
    // flat cylinder into twenty-two real grooves — the one place where the
    // derived map is doing the whole job of geometry.
    const fluted = pbr(flutedTex(), { bump: 2.2, normalScale: 1.4, rough: [0.35, 0.68] });
    // only the metals take the environment — the stone is lit and tuned already
    const metals = [gold, goldPlate, bronze, silver, foundGold];
    metals.forEach((m) => { m.envMap = envMap; m.envMapIntensity = 1; });

    // ═══════════ Grounding (vertex-baked ambient occlusion) ═══════════
    //
    // The last thing that made the courts read as computer graphics was that
    // nothing was *sitting* anywhere. A wall met the pavement at a clean bright
    // seam, because a directional light plus a hemisphere fill has no way to
    // know that the foot of a wall sees less sky than its top.
    //
    // The honest fix is a screen-space AO pass, but that means an
    // EffectComposer and importing from `three/examples/jsm`, and this
    // component is deliberately `react` + `three` and nothing else so it can be
    // pasted into an artifact. So bake it instead: darken vertices toward the
    // foot of every wall and column. One attribute, no passes, no per-frame
    // cost — and because the gradient is in world units, a 60-amah retaining
    // wall and a 20-amah gate pier get the same depth of shadow at the ground
    // rather than a shadow proportional to how tall they happen to be.
    const AO_REACH = 11;      // amot the darkening climbs from the foot
    const AO_FLOOR = 0.55;    // brightness at the very bottom
    const AO_MIN_H = 16;      // below this a box is a slab or a stair tread —
                              // it would be uniformly dimmed, not grounded

    // Cloning is per-material and cached, but two materials are mutated every
    // frame by the day/night easing (goldPlate and windowMat take an emissive
    // ramp). A clone would silently stop receiving those updates, so dynamic
    // and metal materials opt out and simply go un-occluded.
    const aoCache = new WeakMap();
    const aoExempt = new Set([gold, goldPlate, bronze, silver, foundGold, windowMat]);
    const aoMat = (m) => {
      if (aoExempt.has(m)) return m;
      let v = aoCache.get(m);
      if (!v) { v = m.clone(); v.vertexColors = true; aoCache.set(m, v); }
      return v;
    };
    // Writing the attribute is always safe: a material without vertexColors
    // ignores it, so an exempt material costs nothing but the buffer.
    const bakeAO = (geo, h) => {
      const pos = geo.attributes.position;
      const col = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const foot = pos.getY(i) + h / 2;                       // 0 at the base
        const t = Math.min(1, Math.max(0, foot / AO_REACH));
        // Squared falloff: tight and dark in the crease, gone by knee height,
        // which is how contact shadow actually behaves.
        const shade = AO_FLOOR + (1 - AO_FLOOR) * (t * t);
        col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = shade;
      }
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    };

    const colliders = [];
    const addCollider = (minX, maxX, minZ, maxZ) => colliders.push({ minX, maxX, minZ, maxZ });

    const box = (w, h, d, mat, x, y, z, parent = scene) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const grounded = h >= AO_MIN_H;
      if (grounded) bakeAO(geo, h);
      const m = new THREE.Mesh(geo, grounded ? aoMat(mat) : mat);
      m.position.set(x, y, z);
      m.castShadow = m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    const cyl = (rt, rb, h, seg, mat, x, y, z, parent = scene) => {
      const geo = new THREE.CylinderGeometry(rt, rb, h, seg);
      const grounded = h >= AO_MIN_H;
      if (grounded) bakeAO(geo, h);
      const m = new THREE.Mesh(geo, grounded ? aoMat(mat) : mat);
      m.position.set(x, y, z);
      m.castShadow = m.receiveShadow = true;
      parent.add(m);
      return m;
    };

    // ═══════════ Land + platform ═══════════
    // 26 repeats over a 3200-amah disc puts one tile every ~123 amot. At the
    // old 10 the drawn grain was being magnified twelve-fold, so dust read as
    // boulders. Relief stays very low: ground seen from above is lit almost
    // flat, and any real bump here just reads as noise.
    const gTex = groundTexture(); gTex.repeat.set(26, 26);
    const land = new THREE.Mesh(new THREE.CylinderGeometry(1600, 1680, 40, 56), pbr(gTex, { bump: 1.1, normalScale: 0.22, roughness: 1 }));
    land.position.y = -34;
    land.receiveShadow = true;
    scene.add(land);
    const LAND_Y = -14;

    // The hills used to be smooth spheres in flat paint, which from the plaza
    // read as marshmallows parked on the horizon: a perfect silhouette is the
    // one thing no landform has. Displace each vertex along its own radius by
    // a sum of sinusoids in spherical coordinates — cheap, coherent, and it
    // wraps, so no seam — then recompute normals so the ridges catch the sun.
    const hillMat = (tint) => {
      const t = groundTexture(); t.repeat.set(4, 3);
      return pbr(t, { bump: 1.1, normalScale: 0.3, roughness: 1, color: tint });
    };
    // Three shared materials: enough variety to break the ring, few enough to
    // stay cheap. Cooler and darker than the near ground so the fog can lift
    // them off it — aerial perspective is most of what makes distance read.
    const hillMats = [hillMat(0xe4d3ad), hillMat(0xd6c6a2), hillMat(0xefdfba)];
    for (let i = 0; i < 15; i++) {
      const a = (i / 15) * Math.PI * 2 + rnd(-0.14, 0.14);
      const r = rnd(150, 300);
      const geo = new THREE.SphereGeometry(r, 32, 18);
      const pos = geo.attributes.position;
      // One random phase set per hill, so no two share a ridge line.
      const p1 = rnd(0, 6.28), p2 = rnd(0, 6.28), p3 = rnd(0, 6.28);
      const v = new THREE.Vector3();
      for (let k = 0; k < pos.count; k++) {
        v.fromBufferAttribute(pos, k);
        const th = Math.atan2(v.z, v.x), ph = Math.acos(Math.max(-1, Math.min(1, v.y / r)));
        const d =
          Math.sin(th * 3 + p1) * Math.sin(ph * 2 + p1) * 0.13 +
          Math.sin(th * 5 - p2) * Math.sin(ph * 3 + p2) * 0.07 +
          Math.sin(th * 9 + p3) * Math.sin(ph * 5 - p3) * 0.035;
        v.multiplyScalar(1 + d);
        pos.setXYZ(k, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      const hill = new THREE.Mesh(geo, hillMats[i % hillMats.length]);
      hill.scale.y = rnd(0.2, 0.38);
      hill.position.set(Math.cos(a) * rnd(1180, 1460), LAND_Y - 10, Math.sin(a) * rnd(1180, 1460));
      hill.receiveShadow = true;
      scene.add(hill);
    }
    // One sphere on a stick is the oldest tell in real-time graphics: the
    // silhouette is a circle, and nothing in a landscape has a circular
    // outline. Three overlapping lobes at different sizes, offsets and
    // squashes cost two extra draws and break that outline completely — and
    // because each lobe is placed with the same rnd() the rest of the House
    // uses, no two trees in the grove are the same tree.
    const makeCanopy = (radius, mat, lobes = 3) => {
      const g = new THREE.Group();
      for (let l = 0; l < lobes; l++) {
        const rr = radius * (l === 0 ? 1 : rnd(0.52, 0.82));
        const lobe = new THREE.Mesh(new THREE.SphereGeometry(rr, 9, 7), mat);
        if (l > 0) {
          const a = rnd(0, Math.PI * 2), d = radius * rnd(0.42, 0.78);
          lobe.position.set(Math.cos(a) * d, rnd(-0.25, 0.5) * radius, Math.sin(a) * d);
        }
        lobe.scale.set(rnd(0.9, 1.15), rnd(0.62, 0.85), rnd(0.9, 1.15));
        lobe.rotation.set(rnd(0, 0.5), rnd(0, 6.28), rnd(0, 0.5));
        lobe.castShadow = true;
        g.add(lobe);
      }
      return g;
    };
    // Olive: grey-green, and dark. Authored by eye before the renderer encoded
    // its output, so linearised here along with every other hand-picked colour
    // that was reading a stop and a half too pale.
    const oliveLeaf = new THREE.MeshStandardMaterial({ color: 0x283514, roughness: 0.95 });
    for (let i = 0; i < 70; i++) {
      const a = rnd(0, Math.PI * 2), r = rnd(460, 980);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (Math.abs(x) < HALF + 90 && Math.abs(z) < HALF + 110) continue;
      const trunk = cyl(0.8, 1.2, rnd(5, 8), 6, cedar, x, LAND_Y + 3, z);
      trunk.rotation.z = rnd(-0.13, 0.13);   // nothing in a grove stands plumb
      const cr = makeCanopy(rnd(3.4, 6), oliveLeaf);
      cr.position.set(x, LAND_Y + rnd(8, 11), z);
      scene.add(cr);
    }

    const SKIRT = 14;
    const skirt = (w, d, x, z) => box(w, SKIRT, d, mega, x, LAND_Y + SKIRT / 2, z);
    skirt(C + 78, 8, 0, -(HALF + 35));
    skirt(C + 78, 8, 0, HALF + 35);
    skirt(8, C + 78, -(HALF + 35), 0);
    skirt(8, C + 78, HALF + 35, 0);
    for (let p = -9; p <= 9; p++) {
      const pp = p * 26;
      box(4, SKIRT - 2, 1.4, white, pp, LAND_Y + SKIRT / 2, -(HALF + 39.4));
      box(4, SKIRT - 2, 1.4, white, pp, LAND_Y + SKIRT / 2, HALF + 39.4);
      box(1.4, SKIRT - 2, 4, white, -(HALF + 39.4), LAND_Y + SKIRT / 2, pp);
      box(1.4, SKIRT - 2, 4, white, HALF + 39.4, LAND_Y + SKIRT / 2, pp);
    }

    const pMap = pavingTex(); pMap.repeat.set(14, 14);
    // The plaza is the largest single surface a visitor ever stands on, and
    // the one most often seen at a grazing angle. Its joints need to survive
    // both.
    const plaza = box(C + 78, 4, C + 78, pbr(pMap, { bump: 3.4, normalScale: 1.1, rough: [0.55, 0.95] }), 0, -2, 0);
    plaza.receiveShadow = true;

    // Monumental stairs (south + east)
    for (let s = 0; s < 12; s++) {
      const deep = s % 3 === 0 ? 6 : 3.4;
      box(150, 1.25, deep, marble, 0, LAND_Y + 13 - s * 1.2, HALF + 40 + s * 3.4);
    }
    for (let s = 0; s < 12; s++)
      box(4.5, 1.25, 110, marble, HALF + 40 + s * 3.4, LAND_Y + 13 - s * 1.2, 0);

    // ═══════════ Outer walls ═══════════
    const WALL_H = 16, WALL_T = 6, GATE_W = 25;
    box(WALL_T, WALL_H, C, white, -HALF, WALL_H / 2, 0);
    addCollider(-HALF - 4, -HALF + 4, -HALF, HALF);
    const seg = C / 2 - GATE_W / 2;
    box(WALL_T, WALL_H, seg, white, HALF, WALL_H / 2, -(GATE_W / 2 + seg / 2));
    box(WALL_T, WALL_H, seg, white, HALF, WALL_H / 2, GATE_W / 2 + seg / 2);
    addCollider(HALF - 4, HALF + 4, -HALF, -GATE_W / 2);
    addCollider(HALF - 4, HALF + 4, GATE_W / 2, HALF);
    box(seg, WALL_H, WALL_T, white, -(GATE_W / 2 + seg / 2), WALL_H / 2, -HALF);
    box(seg, WALL_H, WALL_T, white, GATE_W / 2 + seg / 2, WALL_H / 2, -HALF);
    addCollider(-HALF, -GATE_W / 2, -HALF - 4, -HALF + 4);
    addCollider(GATE_W / 2, HALF, -HALF - 4, -HALF + 4);
    box(seg, WALL_H, WALL_T, white, -(GATE_W / 2 + seg / 2), WALL_H / 2, HALF);
    box(seg, WALL_H, WALL_T, white, GATE_W / 2 + seg / 2, WALL_H / 2, HALF);
    addCollider(-HALF, -GATE_W / 2, HALF - 4, HALF + 4);
    addCollider(GATE_W / 2, HALF, HALF - 4, HALF + 4);
    const cren = (alongX, fixed) => {
      box(alongX ? C + 10 : WALL_T + 3, 1.6, alongX ? WALL_T + 3 : C + 10, marble, alongX ? 0 : fixed, WALL_H + 0.8, alongX ? fixed : 0);
      for (let i = -15; i <= 15; i++) {
        const p = i * 16;
        box(alongX ? 5 : WALL_T + 2, 3, alongX ? WALL_T + 2 : 5, marble, alongX ? p : fixed, WALL_H + 3, alongX ? fixed : p);
      }
    };
    cren(true, -HALF); cren(true, HALF); cren(false, -HALF); cren(false, HALF);
    [[-HALF, -HALF], [-HALF, HALF], [HALF, -HALF], [HALF, HALF]].forEach(([x, z]) => {
      box(20, 28, 20, mega, x, 14, z);
      addCollider(x - 11, x + 11, z - 11, z + 11);
      box(23, 2.2, 23, marble, x, 29.2, z);
      for (let i = -1; i <= 1; i++) {
        box(4.4, 3.4, 4.4, marble, x + i * 7.6, 31.9, z - 9.4);
        box(4.4, 3.4, 4.4, marble, x + i * 7.6, 31.9, z + 9.4);
        box(4.4, 3.4, 4.4, marble, x - 9.4, 31.9, z + i * 7.6);
        box(4.4, 3.4, 4.4, marble, x + 9.4, 31.9, z + i * 7.6);
      }
    });

    // ═══════════ Fire system (shader flames + particle sprites) ═══════════
    const fireTex = fireSpriteTex();
    const smokeTex = smokeSpriteTex();
    // A flame is built from three nested cones. `solid` swaps additive
    // blending for normal blending: additive light can only ever brighten what
    // is behind it, so over sunlit white stone it disappears — the solid cone
    // is what gives the fire a silhouette in daylight. `blue` sets how much of
    // the base burns blue, which is where a real flame is hottest.
    const makeFlame = (radius, height, { segments = 20, solid = false, blue = 0, heartOnly = false, orange = false, alphaScale = 1 } = {}) => {
      const uniforms = {
        uTime: { value: 0 }, uIntensity: { value: 1 },
        uDay: { value: 1 }, uBlue: { value: blue },
      };
      const mat = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: solid ? THREE.NormalBlending : THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        vertexShader: `
          uniform float uTime;
          varying float vH; varying vec2 vP;
          ${NOISE_GLSL}
          void main(){
            vec3 p = position;
            float ny = clamp((p.y + ${(height / 2).toFixed(1)}) / ${height.toFixed(1)}, 0.0, 1.0);
            vH = ny;
            // licking tongues: two noise fields pull the surface sideways, more at the top
            float n1 = fbm(vec2(p.x * 0.35 + uTime * 1.7, p.z * 0.35 - uTime * 2.2)) - 0.5;
            float n2 = fbm(vec2(p.z * 0.5 - uTime * 2.7, p.x * 0.5 + uTime * 1.4)) - 0.5;
            p.x += n1 * ${(radius * 1.15).toFixed(2)} * ny * (0.35 + ny);
            p.z += n2 * ${(radius * 1.15).toFixed(2)} * ny * (0.35 + ny);
            // tip stretch: flame licks upward irregularly
            p.y += (fbm(vec2(uTime * 2.6, p.x * 0.7)) - 0.35) * ${(height * 0.28).toFixed(2)} * ny * ny;
            vP = p.xz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: `
          uniform float uTime; uniform float uIntensity; uniform float uDay; uniform float uBlue;
          varying float vH; varying vec2 vP;
          ${NOISE_GLSL}
          void main(){
            // internal turbulence scrolling upward through the flame body
            float body = fbm(vP * 0.55 + vec2(0.0, -uTime * 3.2));
            float a = (1.0 - vH);
            a = a * a * (0.55 + body * 0.9);
            a *= smoothstep(0.0, 0.12, vH) + 0.55;      // soften the very base
            a *= uIntensity;

            ${solid
              ? `// the solid body carries saturated amber, not white: over sunlit
                 // stone it is colour, not brightness, that reads
                 vec3 col = mix(vec3(${orange ? "1.00, 0.56, 0.10" : "1.00, 0.74, 0.24"}),
                                vec3(${orange ? "0.96, 0.26, 0.02" : "0.98, 0.34, 0.04"}), smoothstep(0.10, 0.55, vH));
                 col = mix(col, vec3(0.60, 0.07, 0.01), smoothstep(0.55, 1.0, vH));
                 float heartSpan = 0.62;`
              : `${orange
                     // the outer tongues: no white at all, orange from root to tip
                     ? `vec3 col = mix(vec3(1.0, 0.63, 0.13), vec3(1.0, 0.31, 0.03), smoothstep(0.04, 0.52, vH));
                        col = mix(col, vec3(0.74, 0.08, 0.01), smoothstep(0.52, 1.0, vH));`
                     // the glow keeps the white-yellow core → orange mids → red tips,
                     // and warms toward saturated orange as the day comes up
                     : `vec3 col = mix(mix(vec3(1.0, 0.93, 0.55), vec3(1.0, 0.60, 0.14), uDay),
                                       vec3(1.0, 0.45, 0.08), smoothstep(0.06, 0.60, vH));
                        col = mix(col, vec3(0.78, 0.11, 0.01), smoothstep(0.60, 1.0, vH));`}
                 float heartSpan = 0.40;`}

            // the blue heart: hottest, breathing with the turbulence. The heart
            // cone carries it as a band that clears the woodpile — at the very
            // foot of the flame the logs would hide it.
            ${heartOnly
              ? `float heart = uBlue * smoothstep(0.04, 0.30, vH) * (1.0 - smoothstep(0.46, 0.88, vH)) * (0.82 + body * 0.5);`
              : `float heart = uBlue * pow(1.0 - smoothstep(0.0, heartSpan, vH), 1.4) * (0.72 + body * 0.55);`}
            heart = clamp(heart, 0.0, 1.0);
            vec3 hot = mix(vec3(0.42, 0.88, 1.26), vec3(0.10, 0.38, 1.32), smoothstep(0.25, 0.95, heart));
            col = mix(col, hot, heart);
            // a thin blue-white lip where the heart gives way to the warm body
            col += vec3(0.16, 0.38, 0.66) * uBlue
                 * smoothstep(heartSpan * 0.72, heartSpan, vH)
                 * (1.0 - smoothstep(heartSpan, heartSpan + 0.16, vH)) * 0.85;
            col += body * 0.18;

            ${solid
              ? `a = pow(1.0 - vH, 1.6) * (0.62 + body * 0.5);
                 a *= smoothstep(0.0, 0.10, vH) + 0.40;
                 ${heartOnly ? "a *= clamp(heart * 1.15, 0.0, 1.0) * (0.5 + body * 0.75);" : ""}
                 gl_FragColor = vec4(col * mix(1.0, 0.9, uDay),
                   clamp(a * uIntensity, 0.0, 1.0) * mix(${heartOnly ? "0.74" : "0.34"}, 1.0, uDay) * ${alphaScale.toFixed(2)});`
              : `gl_FragColor = vec4(col * mix(1.15, 0.5, uDay), clamp(a * mix(1.0, 0.38, uDay), 0.0, 1.0));`}
            #include <encodings_fragment>
          }`,
      });
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, segments, 12, true), mat);
      mesh.frustumCulled = false;
      return { mesh, uniforms };
    };

    // altar fire: two nested shader cones + rising particle sprites + smoke
    const AX = -8;
    const IC = 210, IC_H = 10;
    const TOP = IC_H;
    // renderOrder is explicit: three cones share a centre, and distance
    // sorting alone would let them swap places as the camera turns.
    // Six cones. Each is a shell, so stacking them is how the fire gets its
    // depth: a body you cannot see through, a heart, and four glow shells at
    // different sizes turning at different speeds so the tongues never repeat.
    const flames = [];
    const addFlame = (radius, height, opts, { y, order, ts, rot, intensity = 1 }) => {
      const f = makeFlame(radius, height, opts);
      f.mesh.position.set(AX, TOP + y, 0);
      f.mesh.renderOrder = order;
      f.uniforms.uIntensity.value = intensity;
      scene.add(f.mesh);
      flames.push({ uniforms: f.uniforms, mesh: f.mesh, ts, rot });
      return f;
    };
    addFlame(4.9, 14.5, { solid: true, blue: 0.2 }, { y: 21.4, order: 1, ts: 1.1, rot: 0.72 });
    addFlame(4.6, 16.0, { blue: 0.55 }, { y: 22.6, order: 2, ts: 1.25, rot: -0.55, intensity: 1.5 });
    addFlame(6.3, 18.5, { solid: true, orange: true, alphaScale: 0.52 }, { y: 23.5, order: 2, ts: 0.85, rot: 0.31, intensity: 1.15 });
    addFlame(7.3, 20.0, { solid: true, orange: true, alphaScale: 0.36 }, { y: 24.2, order: 2, ts: 1.45, rot: -0.23, intensity: 0.95 });
    addFlame(8.2, 21.5, { blue: 0.16 }, { y: 24.8, order: 3, ts: 1.0, rot: 0.4 });
    // drawn last: additive tongues painted over the heart would add white to
    // it and the blue would be gone by night
    addFlame(2.1, 16.5, { segments: 16, solid: true, blue: 1, heartOnly: true, alphaScale: 0.88 },
             { y: 23.0, order: 5, ts: 1.6, rot: -0.95, intensity: 1.3 });

    const fireParticles = [];
    for (let i = 0; i < 54; i++) {
      const m = new THREE.SpriteMaterial({ map: fireTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
      const sp = new THREE.Sprite(m);
      sp.userData = { ph: rnd(0, 1), sp: rnd(0.3, 0.68), a: rnd(0, 6.28), r: rnd(0.5, 4.6), drift: rnd(-0.7, 0.7) };
      scene.add(sp);
      fireParticles.push(sp);
    }
    // sparks off the blue heart: short-lived, low, and cooler than the embers
    const blueTex = blueSpriteTex();
    const blueSparks = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.SpriteMaterial({ map: blueTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
      const sp = new THREE.Sprite(m);
      sp.userData = { ph: rnd(0, 1), sp: rnd(0.7, 1.35), a: rnd(0, 6.28), r: rnd(0.3, 2.1) };
      scene.add(sp);
      blueSparks.push(sp);
    }

    const smokeParticles = [];
    for (let i = 0; i < 20; i++) {
      const m = new THREE.SpriteMaterial({ map: smokeTex, depthWrite: false, transparent: true });
      const sp = new THREE.Sprite(m);
      sp.userData = { ph: rnd(0, 1), sp: rnd(0.1, 0.18), sway: rnd(2, 5), off: rnd(0, 6.28) };
      scene.add(sp);
      smokeParticles.push(sp);
    }
    // Gold dust. One pool of sprites, thrown by anything worth celebrating —
    // a wonder found, a step struck.
    const dustPool = [];
    for (let i = 0; i < 60; i++) {
      const m = new THREE.SpriteMaterial({ map: fireTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
      const sp = new THREE.Sprite(m);
      sp.visible = false;
      scene.add(sp);
      dustPool.push(sp);
    }
    let dustNext = 0;
    const burst = (pos, { count = 26, speed = 13, tint = 0xffd24a, size = 2.1, rise = 1.6 } = {}) => {
      for (let i = 0; i < count; i++) {
        const sp = dustPool[(dustNext = (dustNext + 1) % dustPool.length)];
        sp.visible = true;
        sp.position.copy(pos);
        sp.material.color.setHex(tint);
        sp.userData = {
          v: new THREE.Vector3(rnd(-1, 1), rnd(0.35, 1) * rise, rnd(-1, 1)).normalize().multiplyScalar(speed * rnd(0.35, 1)),
          life: 1, sc: rnd(0.55, 1) * size,
        };
      }
    };

    // warm light: physical decay so it doesn't wash the gold facade into a "sun"
    const fireLight = new THREE.PointLight(0xff8c33, 1.0, 130, 2);
    fireLight.position.set(AX, TOP + 25, 0);
    scene.add(fireLight);
    // the heart throws its own colour onto the hearth stones
    const fireBlueLight = new THREE.PointLight(0x3f7dff, 0.7, 62, 2);
    fireBlueLight.position.set(AX, TOP + 16.8, 0);
    scene.add(fireBlueLight);

    // small torch flames reuse the sprite system
    const torchFires = [];
    const addTorch = (worldPos, parent = scene) => {
      const m = new THREE.SpriteMaterial({ map: fireTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
      const sp = new THREE.Sprite(m);
      sp.position.copy(worldPos);
      sp.scale.set(3, 4.4, 1);
      parent.add(sp);
      const tl = new THREE.PointLight(0xff9440, 0, 46, 2);
      tl.position.copy(worldPos); tl.position.y += 1.5;
      parent.add(tl);
      torchFires.push({ light: tl, flame: sp });
    };

    // ═══════════ Gatehouses ═══════════
    const makeGate = (x, z, rotY, sealed) => {
      const g = new THREE.Group();
      const GL = 50, GW = 25, GH = 24;
      for (const s of [-1, 1]) {
        box(GL, GH, 4, white, 0, GH / 2, s * (GW / 2), g);
        for (let c2 = 0; c2 < 3; c2++)
          box(9, GH * 0.68, 6.6, marble, -GL / 2 + 10 + c2 * 15, GH * 0.34, s * (GW / 2 + 4.5), g);
      }
      box(6, GH + 16, GW + 18, white, GL / 2 - 2, (GH + 16) / 2, 0, g);
      box(8, 2.8, GW + 22, marble, GL / 2 - 2, GH + 17.4, 0, g);
      for (let i = -3; i <= 3; i++) box(6, 3.2, 4.6, marble, GL / 2 - 2, GH + 20.4, i * 5.8, g);
      box(6.8, 6, GATE_W - 6, cedar, GL / 2 - 2, GH + 0.4, 0, g);
      box(7, 1.8, GATE_W - 2, gold, GL / 2 - 2, GH + 4, 0, g);
      if (sealed) {
        box(3.4, GH - 4, GATE_W - 8, white, GL / 2 - 0.4, (GH - 4) / 2, 0, g);
        for (let r = 0; r < 6; r++) box(3.8, 0.5, GATE_W - 8, stoneDarkM, GL / 2 - 0.4, 2.4 + r * 3.2, 0, g);
      } else {
        const d1 = box(0.8, GH - 6, (GATE_W - 8) / 2, cedar, GL / 2 + 1.8, (GH - 6) / 2, -(GATE_W - 8) / 4 - 1, g);
        d1.rotation.y = 0.62;
        const d2 = box(0.8, GH - 6, (GATE_W - 8) / 2, cedar, GL / 2 + 1.8, (GH - 6) / 2, (GATE_W - 8) / 4 + 1, g);
        d2.rotation.y = -0.62;
        for (let r = 0; r < 3; r++) for (const dd of [d1, d2]) {
          const stud = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 5), gold);
          stud.position.set(0.5, -4 + r * 5, 0);
          dd.add(stud);
        }
      }
      for (const s of [-1, 1]) {
        cyl(1, 1.4, 18, 8, bronze, GL / 2 + 2, 9, s * (GW / 2 + 6.5), g);
        const fr = new THREE.Mesh(new THREE.ConeGeometry(4.8, 5.6, 8), gold);
        fr.position.set(GL / 2 + 2, 20.4, s * (GW / 2 + 6.5));
        fr.castShadow = true;
        g.add(fr);
        cyl(1.6, 1, 1.6, 8, bronze, GL / 2 + 8, 7.4, s * (GW / 2 + 3), g);
        cyl(0.4, 0.5, 6.4, 6, bronze, GL / 2 + 8, 3.2, s * (GW / 2 + 3), g);
        addTorch(new THREE.Vector3(GL / 2 + 8, 9.4, s * (GW / 2 + 3)), g);
      }
      for (let st = 0; st < 7; st++) box(3, 0.9, GW + 8, marble, GL / 2 + 5 + st * 3, 3.1 - st * 0.45, 0, g);
      g.position.set(x, 0, z);
      g.rotation.y = rotY;
      scene.add(g);
      // collide with the gatehouse side walls (world space, axis-aligned per gate)
      if (rotY === 0) {
        addCollider(x - 25, x + 25, z - GW / 2 - 3, z - GW / 2 + 3);
        addCollider(x - 25, x + 25, z + GW / 2 - 3, z + GW / 2 + 3);
        if (sealed) addCollider(x + 22, x + 28, z - GW / 2, z + GW / 2);
      } else {
        addCollider(x - GW / 2 - 3, x - GW / 2 + 3, z - 25, z + 25);
        addCollider(x + GW / 2 - 3, x + GW / 2 + 3, z - 25, z + 25);
      }
    };
    makeGate(HALF - 20, 0, 0, true);
    makeGate(0, -HALF + 20, Math.PI / 2, false);
    makeGate(0, HALF - 20, -Math.PI / 2, false);

    // ═══════════ Royal Stoa ═══════════
    const stoa = new THREE.Group();
    const STOA_L = C - 130, STOA_W = 52, COL_H = 22;
    box(STOA_L, 2.4, STOA_W, marble, 0, 1.2, 0, stoa);
    // Josephus (Antiquities 15.413) measures these by the arms of three men
    // just meeting around one — a shaft near 12 amot in circumference. Slimmed
    // to a Corinthian 8:1 and fluted; the old ones were 4:1 pillars.
    const corinthian = (px, pz, parent, scale = 1) => {
      const h = COL_H * scale, r = 1.28 * scale;
      cyl(r * 1.5, r * 1.62, 0.9 * scale, 14, marble, px, 2.4 + 0.45 * scale, pz, parent);   // base
      cyl(r, r * 1.14, h, 16, fluted, px, 2.4 + 0.9 * scale + h / 2, pz, parent);            // fluted shaft
      const top = 2.4 + 0.9 * scale + h;
      cyl(r * 1.34, r * 1.02, 1.5 * scale, 14, gold, px, top + 0.75 * scale, pz, parent);    // acanthus bell
      box(3.6 * scale, 0.9, 3.6 * scale, gold, px, top + 1.9 * scale, pz, parent);           // abacus
      for (const c of [-1, 1]) {
        const volute = new THREE.Mesh(new THREE.TorusGeometry(0.5 * scale, 0.15 * scale, 5, 12), gold);
        volute.position.set(px + c * 1.35 * scale, top + 1.45 * scale, pz);
        parent.add(volute);
      }
    };
    const nCols = Math.floor(STOA_L / 17);
    for (let i = 0; i < nCols; i++) {
      const px = -STOA_L / 2 + 8.5 + i * 17;
      corinthian(px, -STOA_W / 2 + 5, stoa);
      corinthian(px, -STOA_W / 2 + 21, stoa, 1.18);
      corinthian(px, STOA_W / 2 - 21, stoa, 1.18);
      corinthian(px, STOA_W / 2 - 5, stoa);
    }
    box(STOA_L, 2.2, STOA_W, cedar, 0, 2.4 + COL_H + 2.2, 0, stoa);
    box(STOA_L, 1.4, STOA_W + 4, marble, 0, 2.4 + COL_H + 4, 0, stoa);
    const gable = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 15, STOA_L, 3, 1), cedar);
    gable.rotation.z = Math.PI / 2;
    gable.scale.set(1, 1, 0.6);
    gable.position.set(0, 2.4 + COL_H + 9.4, 0);
    gable.castShadow = true;
    stoa.add(gable);
    box(STOA_L + 6, 1, 6, gold, 0, 2.4 + COL_H + 14.6, 0, stoa);
    for (let i = 0; i < Math.floor(STOA_L / 12); i++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.4, 5), gold);
      sp.position.set(-STOA_L / 2 + 6 + i * 12, 2.4 + COL_H + 16.4, 0);
      stoa.add(sp);
    }
    stoa.position.set(0, 0, HALF - 58);
    scene.add(stoa);

    // ═══════════ Colonnades (N + E) ═══════════
    const colonnade = (cx, cz, len, rotY) => {
      const grp = new THREE.Group();
      const n = Math.floor(len / 18);
      for (let i = 0; i < n; i++) {
        const px = -len / 2 + 9 + i * 18;
        cyl(1.5, 1.6, 0.7, 12, marble, px, 0.35, 0, grp);        // base
        cyl(1.02, 1.18, 12, 14, fluted, px, 6.7, 0, grp);         // fluted shaft, ~5.5:1
        cyl(1.32, 1.04, 0.75, 12, marble, px, 13.1, 0, grp);      // echinus
        box(3.1, 0.65, 3.1, gold, px, 13.8, 0, grp);              // abacus
      }
      box(len, 1.8, 7.5, marble, 0, 14, 0, grp);
      const roof = box(len, 1, 10, cedar, 0, 15.3, -1, grp);
      roof.rotation.x = 0.1;
      for (let i = 0; i < Math.floor(n / 2); i++)
        box(6, 7.5, 1, cedar, -len / 2 + 18 + i * 36, 3.8, -5.6, grp);
      grp.position.set(cx, 0, cz);
      grp.rotation.y = rotY;
      scene.add(grp);
    };
    colonnade(0, -HALF + 36, C - 130, 0);
    colonnade(HALF - 62, 0, C - 170, Math.PI / 2);

    // ═══════════ Corner kitchen courts ═══════════
    const kitchenSmokes = [];
    [[-HALF + 30, -HALF + 30], [-HALF + 30, HALF - 30], [HALF - 30, -HALF + 30], [HALF - 30, HALF - 30]].forEach(([x, z]) => {
      box(40, 6.5, 3, stoneDarkM, x, 3.2, z - 20);
      box(40, 6.5, 3, stoneDarkM, x, 3.2, z + 20);
      box(3, 6.5, 40, stoneDarkM, x - 20, 3.2, z);
      box(3, 6.5, 40, stoneDarkM, x + 20, 3.2, z);
      cyl(3.6, 4.2, 3.2, 10, bronze, x, 1.6, z);
      const m = new THREE.SpriteMaterial({ map: smokeTex, depthWrite: false, transparent: true });
      const sm = new THREE.Sprite(m);
      sm.userData = { x, z, ph: rnd(0, 1) };
      scene.add(sm);
      kitchenSmokes.push(sm);
    });

    // ═══════════ Inner court ═══════════
    const inner = box(IC + 50, IC_H, IC, wave, -60, IC_H / 2, 0);
    inner.receiveShadow = true;
    const IC_E = -60 + (IC + 50) / 2; // = 70, eastern edge of inner court
    // Fifteen steps, fifteen Shir HaMa'alot — so each one is tuned and can be
    // struck. Each gets its own material so it can flash when it sounds.
    const stepMeshes = [];
    for (let s = 0; s < 15; s++) {
      const w = 70 - s * 2.4;
      const mat = marble.clone();
      mat.emissive = new THREE.Color(0xffd24a);
      mat.emissiveIntensity = 0;
      const st = box(2.6, IC_H / 15 + 0.15, w, mat, IC_E + (14 - s) * 2.6, IC_H - (s + 1) * (IC_H / 15), 0);
      st.userData.step = 14 - s;   // the lowest step is the lowest note
      stepMeshes.push(st);
    }
    const par = (w, d, x, z) => {
      box(w, 2.8, d, white, x, IC_H + 1.4, z);
    };
    par(4, IC, -60 - (IC + 50) / 2, 0);
    par(IC + 50, 4, -60, -IC / 2);
    par(IC + 50, 4, -60, IC / 2);
    par(4, IC / 2 - 40, IC_E, -(20 + (IC / 2 - 40) / 2));
    par(4, IC / 2 - 40, IC_E, 20 + (IC / 2 - 40) / 2);
    // inner court parapet colliders (walk in via the eastern steps only)
    addCollider(-192, -188, -IC / 2, IC / 2);
    addCollider(-190, IC_E, -IC / 2 - 2, -IC / 2 + 2);
    addCollider(-190, IC_E, IC / 2 - 2, IC / 2 + 2);
    addCollider(IC_E - 2, IC_E + 2, -IC / 2, -20);
    addCollider(IC_E - 2, IC_E + 2, 20, IC / 2);

    // Nicanor gate + operable doors
    const NIC_X = IC_E;
    box(4, 24, 5, marble, NIC_X, IC_H + 12, -20);
    box(4, 24, 5, marble, NIC_X, IC_H + 12, 20);
    box(4, 4, 45, marble, NIC_X, IC_H + 26, 0);
    box(5, 2, 49, gold, NIC_X, IC_H + 29, 0);
    const nicanor = new THREE.Group();
    nicanor.position.set(NIC_X, IC_H, 0);
    nicanor.userData = { id: 14, open: 0, target: 0 };
    const mkDoor = (side) => {
      const geo = new THREE.BoxGeometry(1.2, 22, 17.5);
      geo.translate(0, 11, -side * 8.75);
      const door = new THREE.Mesh(geo, bronze);
      door.position.set(0, 0, side * 17.5);
      door.castShadow = true;
      nicanor.add(door);
      for (let r = 0; r < 3; r++) {
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 12), gold);
        disc.rotation.z = Math.PI / 2;
        disc.position.set(0.9, 5 + r * 6.5, -side * 8.75);
        door.add(disc);
      }
      return door;
    };
    const nicL = mkDoor(-1), nicR = mkDoor(1);
    scene.add(nicanor);

    for (let i = 0; i < 8; i++) {
      const tx = -20 + (i % 4) * 14, tz = -IC / 2 + 16 + Math.floor(i / 4) * 12;
      box(8, 0.9, 6, marble, tx, IC_H + 3.4, tz);
      box(6, 3, 4, stoneDarkM, tx, IC_H + 1.5, tz);
    }
    cyl(5, 3.4, 2.4, 14, bronze, -20, IC_H + 4.4, IC / 2 - 22);
    cyl(1.6, 2.4, 3.4, 10, bronze, -20, IC_H + 1.7, IC / 2 - 22);
    const laverWater = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 0.3, 14), new THREE.MeshStandardMaterial({ color: 0x59b7dd, metalness: 0.4, roughness: 0.1 }));
    laverWater.position.set(-20, IC_H + 5.5, IC / 2 - 22);
    scene.add(laverWater);

    // ═══════════ Altar body ═══════════
    box(34, 2, 34, stoneDarkM, AX, TOP + 1, 0);
    box(29, 4, 29, white, AX, TOP + 4, 0);
    box(25, 4, 25, white, AX, TOP + 8, 0);
    box(21, 4.5, 21, stoneDarkM, AX, TOP + 12.2, 0);
    addCollider(AX - 18, AX + 18, -18, 18);
    for (const hx of [-1, 1]) for (const hz of [-1, 1]) box(2.6, 3.2, 2.6, stoneDarkM, AX + hx * 9.4, TOP + 16, hz * 9.4);
    for (let i = 0; i < 5; i++) box(9 - i, 0.9, 1.4, cedar, AX, TOP + 14.8 + i * 0.5, -3 + i * 1.4);
    for (let s = 0; s < 10; s++) box(3, 1.25, 13, white, AX + 17 + s * 2.7, TOP + 13.4 - s * 1.34, 0);

    // ═══════════ THE HOUSE ═══════════
    const T = new THREE.Group();
    T.position.set(-150, IC_H, 0);
    scene.add(T);
    box(132, 6, 90, marble, -22, 3, 0, T);
    addCollider(-150 - 88, -150 + 44, -45, 45); // temple platform block
    for (let story = 0; story < 3; story++) {
      const w = 9 + story * 1.7;
      for (const s of [-1, 1]) {
        box(84, 10, w, white, -30, 6 + 5 + story * 10, s * (28 + w / 2), T);
        for (let wn = 0; wn < 6; wn++)
          box(3, 2.6, 0.6, windowMat, -62 + wn * 13, 6 + 5.6 + story * 10, s * (28 + w + 0.1), T);
      }
    }
    box(64, 60, 44, wave, -22, 6 + 30, 0, T);
    for (const s of [-1, 1]) for (let wn = 0; wn < 5; wn++) {
      box(5, 5.4, 1, gold, -44 + wn * 11, 6 + 47, s * 22.2, T);
      box(3.4, 3.6, 1.2, windowMat, -44 + wn * 11, 6 + 47, s * 22.4, T);
    }
    box(28, 64, 40, marble, -64, 6 + 32, 0, T);
    box(32, 3.2, 46, gold, -64, 6 + 65.6, 0, T);
    for (let i = -3; i <= 3; i++) box(3, 3, 3, gold, -64, 6 + 68.8, i * 6, T);
    box(13, 80, 56, white, 16, 6 + 40, 0, T);
    box(1.2, 76, 52, goldPlate, 23.2, 6 + 40, 0, T);
    box(17, 4, 62, gold, 16, 6 + 82, 0, T);
    for (let i = -5; i <= 5; i++) box(3.2, 3.2, 3.2, gold, 16, 6 + 85.6, i * 5.6, T);
    for (let i = -5; i <= 5; i++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.4, 3, 5), gold);
      sp.position.set(16, 6 + 88.6, i * 5.6);
      T.add(sp);
    }
    for (let i = -4; i <= 4; i++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.6, 5), gold);
      sp.position.set(-22 + i * 7.5, 6 + 64.8, 0);
      T.add(sp);
    }
    box(2.4, 32, 21, gold, 22.6, 6 + 16, 0, T);
    const dL = box(1.4, 27, 8.4, cedar, 23.3, 6 + 13.5, -4.6, T); dL.rotation.y = 0.35;
    const dR = box(1.4, 27, 8.4, cedar, 23.3, 6 + 13.5, 4.6, T); dR.rotation.y = -0.35;
    for (let v = -2; v <= 2; v++) {
      const arcSeg = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.38, 6, 10, Math.PI), gold);
      arcSeg.position.set(23.6, 6 + 33.6, v * 4.8);
      arcSeg.rotation.y = Math.PI / 2;
      T.add(arcSeg);
      const grapes = new THREE.Mesh(new THREE.SphereGeometry(1, 6, 5), gold);
      grapes.scale.y = 1.5;
      grapes.position.set(23.8, 6 + 31.2, v * 4.8 + 2.3);
      T.add(grapes);
    }
    const doorGlow = new THREE.PointLight(0xffc36a, 0, 70, 2);
    doorGlow.position.set(30, 6 + 12, 0);
    T.add(doorGlow);
    box(68, 2.8, 48, stoneDarkM, -22, 6 + 61.4, 0, T);
    box(72, 1.8, 52, gold, -22, 6 + 63.6, 0, T);
    // ── יכין ובעז — Yachin and Boaz ──
    // Melachim I 7:15: "eighteen amot the height of one pillar, and a line of
    // twelve amot went about it" — so the shaft is 18 tall and 12 in
    // circumference, r = 12/2π ≈ 1.91. 7:16: the kotéret upon it, five amot.
    // 7:17: net-work and chain-work upon the capitals. 7:20: two rows of
    // pomegranates. 7:19: lily-work, four amot. 7:21: set at the porch of the
    // Heichal, the right called Yachin and the left Boaz.
    const PILLAR_R = 12 / (Math.PI * 2);
    const PILLAR_H = 18, CAP_H = 5, PILLAR_BASE = 6;
    for (const s of [-1, 1]) {
      const pz = s * 16, px = 31;
      // pedestal
      box(6, 1.4, 6, stoneDarkM, px, PILLAR_BASE + 0.7, pz, T);
      const shaftY = PILLAR_BASE + 1.4;
      cyl(PILLAR_R, PILLAR_R * 1.04, PILLAR_H, 20, bronze, px, shaftY + PILLAR_H / 2, pz, T);
      // gullah — the bowl of the capital
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(PILLAR_R * 1.5, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), bronze);
      bowl.position.set(px, shaftY + PILLAR_H + PILLAR_R * 0.5, pz);
      bowl.rotation.x = Math.PI;
      bowl.castShadow = true;
      T.add(bowl);
      // sevachot ug'dilim — seven strands of net-work and chain-work over it
      for (let n = 0; n < 7; n++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(PILLAR_R * (1.5 - n * 0.055), 0.075, 5, 20), gold);
        ring.position.set(px, shaftY + PILLAR_H + 0.35 + n * 0.34, pz);
        ring.rotation.x = Math.PI / 2;
        T.add(ring);
      }
      // two rows of pomegranates around the capital
      for (let row = 0; row < 2; row++) {
        for (let q = 0; q < 20; q++) {
          const a = (q / 20) * Math.PI * 2 + row * 0.157;
          const rr = PILLAR_R * (1.52 - row * 0.1);
          const pom = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), gold);
          pom.position.set(px + Math.cos(a) * rr, shaftY + PILLAR_H + 2.5 + row * 0.72, pz + Math.sin(a) * rr);
          T.add(pom);
        }
      }
      // ma'aseh shushan — the lily-work crowning it, four amot
      const lily = new THREE.Mesh(new THREE.CylinderGeometry(PILLAR_R * 1.85, PILLAR_R * 0.95, 4, 20, 1, true), gold);
      lily.position.set(px, shaftY + PILLAR_H + CAP_H - 1.4, pz);
      lily.material = gold;
      T.add(lily);
      const lipRing = new THREE.Mesh(new THREE.TorusGeometry(PILLAR_R * 1.85, 0.16, 6, 22), gold);
      lipRing.position.set(px, shaftY + PILLAR_H + CAP_H + 0.6, pz);
      lipRing.rotation.x = Math.PI / 2;
      T.add(lipRing);
    }
    for (let s = 0; s < 12; s++) box(3.3, 1.2, 40, marble, 31 + 5 + s * 3.3, 6 - s * 0.55 - 0.55, 0, T);
    box(94, 22, 74, white, -142, 11, 0, T);
    box(98, 2.2, 78, marble, -142, 23.2, 0, T);
    addCollider(-150 - 189, -150 - 95, -39, 39); // western binyan
    for (const s of [-1, 1]) {
      box(104, 18, 24, white, -170, IC_H + 9, s * (IC / 2 + 27));
      box(108, 2, 27, marble, -170, IC_H + 19, s * (IC / 2 + 27));
      addCollider(-222, -118, s * (IC / 2 + 27) - 13, s * (IC / 2 + 27) + 13);
      for (let d = 0; d < 6; d++) box(5, 8.5, 1, cedar, -214 + d * 17.6, IC_H + 4.3, s * (IC / 2 + 27 - 12.6));
    }

    // ═══════════ River ═══════════
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x3fa8d8, transparent: true, opacity: 0.72, metalness: 0.4, roughness: 0.12 });
    const streams = [];
    streams.push(box(196, 0.5, 4, waterMat, -8, IC_H + 0.32, 30));
    streams.push(box(174, 0.5, 8, waterMat, 158, 0.5, 30));
    const s3 = box(360, 0.5, 18, waterMat, HALF + 210, LAND_Y + 0.6, 30);
    s3.rotation.y = -0.05;
    streams.push(s3);
    box(1.4, IC_H, 5, waterMat, 90.6, IC_H / 2, 30);
    box(1.4, 15, 8, waterMat, HALF + 39.5, LAND_Y + 7, 30);
    const sparkGeo = new THREE.BufferGeometry();
    const sparkArr = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i++) {
      sparkArr[i * 3] = rnd(100, 760);
      sparkArr[i * 3 + 1] = rnd(0.4, 1.2) + (sparkArr[i * 3] > HALF + 39 ? LAND_Y : 0);
      sparkArr[i * 3 + 2] = rnd(24, 40);
    }
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkArr, 3));
    const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xdff4ff, size: 1.7, transparent: true, opacity: 0.8 }));
    scene.add(sparks);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1b3312, roughness: 0.9 });
    const fruitMat = new THREE.MeshStandardMaterial({ color: 0xae1706, roughness: 0.6 });
    for (let t = 0; t < 11; t++) {
      const tx = 190 + t * 52 + (t % 2) * 16;
      const ty = tx > HALF + 39 ? LAND_Y : 0;
      for (const s of [-1, 1]) {
        cyl(1, 1.5, 9, 7, cedar, tx, ty + 4.5, 30 + s * (13 + (t % 3) * 4));
        const crown = makeCanopy(5 + (t % 3), leafMat);
        crown.position.set(tx, ty + 12, 30 + s * (13 + (t % 3) * 4));
        scene.add(crown);
        for (let f = 0; f < 4; f++) {
          const fr = new THREE.Mesh(new THREE.SphereGeometry(0.55, 5, 4), fruitMat);
          const a = rnd(0, 6.28);
          fr.position.set(tx + Math.cos(a) * 4, ty + 11 + rnd(-2, 2), 30 + s * (13 + (t % 3) * 4) + Math.sin(a) * 4);
          scene.add(fr);
        }
      }
    }

    // ═══════════ FIGURES: kohanim + Levites ═══════════
    const figures = [];
    const makeFigure = (robeColor, sashColor) => {
      const g = new THREE.Group();
      const robeMat = new THREE.MeshStandardMaterial({ color: robeColor, roughness: 0.85 });
      const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.35, 3.4, 9), robeMat);
      robe.position.y = 1.7;
      robe.castShadow = true;
      g.add(robe);
      const chest = new THREE.Mesh(new THREE.SphereGeometry(0.78, 8, 7), robeMat);
      chest.scale.y = 1.1;
      chest.position.y = 3.5;
      chest.castShadow = true;
      g.add(chest);
      const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.86, 0.35, 9), new THREE.MeshStandardMaterial({ color: sashColor, roughness: 0.6 }));
      sash.position.y = 2.95;
      g.add(sash);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 7), new THREE.MeshStandardMaterial({ color: 0xd9a877, roughness: 0.8 }));
      head.position.y = 4.55;
      head.castShadow = true;
      g.add(head);
      const migbaat = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.55, 8), new THREE.MeshStandardMaterial({ color: 0xf3efe2, roughness: 0.85 }));
      migbaat.position.y = 5.05;
      g.add(migbaat);
      for (const s of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.7, 6), robeMat);
        arm.position.set(0, 3.4, s * 0.9);
        arm.rotation.x = s * 0.25;
        g.add(arm);
        g.userData["arm" + (s === -1 ? "L" : "R")] = arm;
      }
      return g;
    };
    // Kohanim: walking loops in the inner court (white with techelet sash)
    const KOHEN_PATHS = [
      [[30, -70], [55, -30], [30, 40], [-40, 60], [-70, 20], [-60, -50]],
      [[-90, 40], [-60, 75], [0, 80], [40, 60], [10, 30], [-50, 10]],
      [[50, -80], [20, -95], [-30, -80], [-60, -40], [-30, -20], [20, -45]],
      [[-100, -30], [-80, -70], [-40, -90], [-10, -60], [-50, -35], [-85, -5]],
      [[-120, 62], [-152, 30], [-124, -18], [-92, -52], [-126, -78], [-158, -40]],
      [[58, -18], [40, 22], [0, 62], [-40, 88], [8, 70], [48, 30]],
    ];
    KOHEN_PATHS.forEach((path, pi) => {
      for (let k = 0; k < 2; k++) {
        const f = makeFigure(0xf3efe2, 0x3a5f9e);
        f.userData.path = path;
        f.userData.t = (pi * 2 + k) / (KOHEN_PATHS.length * 2);
        f.userData.speed = rnd(0.016, 0.026);
        f.userData.kind = "kohen";
        f.userData.voice = KOHEN_VOICES[(pi * 2 + k) % KOHEN_VOICES.length];
        scene.add(f);
        figures.push(f);
      }
    });
    // Levites: standing on the fifteen steps, swaying in song (white with gold sash)
    for (let l = 0; l < 6; l++) {
      const f = makeFigure(0xefe9d6, 0xb8912f);
      const step = 2 + l * 2;
      const sx = IC_E + (14 - step) * 2.6;
      const sy = IC_H - (step + 1) * (IC_H / 15);
      f.position.set(sx, sy + 0.6, -30 + l * 12);
      f.rotation.y = Math.PI; // facing west, toward the House
      f.userData.kind = "levi";
      f.userData.voice = LEVI_VOICES[l % LEVI_VOICES.length];
      f.userData.ph = rnd(0, 6.28);
      scene.add(f);
      figures.push(f);
    }

    // ═══════════ THIRTY-SIX NISTAROT ═══════════
    const clickables = [];
    clickables.push(...stepMeshes);
    clickables.push(...figures);   // the kohanim and Levites will answer
    const veiledSilver = silver.clone();
    veiledSilver.transparent = true;
    veiledSilver.opacity = 0.28;

    const rimonim = RIMON_POS.map(({ id, pos }) => {
      const g = new THREE.Group();
      const already = false;
      const bodyMat = silver.clone();
      const body = new THREE.Mesh(new THREE.SphereGeometry(1.7, 18, 14), bodyMat);
      body.scale.set(1, 1.08, 1);
      body.castShadow = true;
      g.add(body);
      for (let c2 = 0; c2 < 6; c2++) {
        const a = (c2 / 6) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 5), bodyMat);
        spike.position.set(Math.cos(a) * 0.55, 1.95, Math.sin(a) * 0.55);
        spike.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4);
        g.add(spike);
      }
      g.position.set(pos[0], pos[1], pos[2]);
      g.userData = { id, baseY: pos[1] };
      scene.add(g);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.1, 8, 26), new THREE.MeshBasicMaterial({ color: 0xf0f4f9, transparent: true, opacity: 0.45 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(g.position);
      scene.add(ring);
      g.userData.ring = ring;
      clickables.push(g);
      void already;
      return g;
    });
    // Ids are not indices any more — the deeper rimonim carry ids 16–25.
    const rimonById = {};
    rimonim.forEach((g) => { rimonById[g.userData.id] = g; });

    const fox = new THREE.Group();
    const foxFur = new THREE.MeshStandardMaterial({ color: 0xc4622d, roughness: 0.85 });
    const foxWhite = new THREE.MeshStandardMaterial({ color: 0xf0e4d4, roughness: 0.85 });
    const fb = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8), foxFur);
    fb.scale.set(1.6, 1, 1); fb.position.y = 2.4; fb.castShadow = true; fox.add(fb);
    const fh = new THREE.Mesh(new THREE.SphereGeometry(1.4, 9, 7), foxFur);
    fh.position.set(3.2, 3.6, 0); fh.castShadow = true; fox.add(fh);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 7), foxWhite);
    snout.rotation.z = -Math.PI / 2; snout.position.set(4.7, 3.3, 0); fox.add(snout);
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.5, 6), foxFur);
      ear.position.set(3.2, 5.2, s * 0.8); fox.add(ear);
    }
    const tail = new THREE.Mesh(new THREE.ConeGeometry(1, 4.4, 8), foxFur);
    tail.rotation.z = Math.PI / 2.4; tail.position.set(-4.2, 3, 0); fox.add(tail);
    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.7, 6, 5), foxWhite);
    tailTip.position.set(-6, 4, 0); fox.add(tailTip);
    for (let l = 0; l < 4; l++) cyl(0.35, 0.4, 2.4, 6, foxFur, -1.6 + (l % 2) * 3.4, 1.2, l < 2 ? -1 : 1, fox);
    fox.position.set(70, LAND_Y, HALF + 90);
    fox.rotation.y = -0.7;
    fox.userData = { id: 8, tail };
    scene.add(fox);
    clickables.push(fox);

    // ═══════════ כִּנּוֹר — the harp of the Levites ═══════════
    //
    // Arachin 13b: the kinnor of the Mikdash was strung with seven; the kinnor
    // of the days of Mashiach with eight; and of the World to Come, with ten.
    // So this one carries seven — and gains its eighth, the octave above the
    // lowest string, at the moment somebody finds it.
    //
    // Every member is placed off two lines: the soundboard the strings are
    // pinned into, and the harmonic curve they hang from. Nothing is positioned
    // by eye, which is the difference between strings that meet wood at both
    // ends and strings that float in the middle of a frame.
    const harp = new THREE.Group();
    const SB0 = new THREE.Vector2(-2.7, 1.2), SB1 = new THREE.Vector2(3.1, 5.2);  // soundboard: bass foot → treble shoulder
    const NK0 = new THREE.Vector2(-3.1, 9.6), NK1 = new THREE.Vector2(3.2, 6.4);  // harmonic curve, over the same span
    const boardAt = (u) => new THREE.Vector2(SB0.x + (SB1.x - SB0.x) * u, SB0.y + (SB1.y - SB0.y) * u);
    const neckAt = (u) => new THREE.Vector2(
      NK0.x + (NK1.x - NK0.x) * u,
      NK0.y + (NK1.y - NK0.y) * u + Math.sin(u * Math.PI) * 1.35   // it arches; a harmonic curve is not a chord
    );
    // one tapered member of the frame, laid between two points of it
    const limb = (a, b, rt, rb, seg, mat, z = 0) => {
      const dx = b.x - a.x, dy = b.y - a.y;
      const m = cyl(rt, rb, Math.hypot(dx, dy), seg, mat, (a.x + b.x) / 2, (a.y + b.y) / 2, z, harp);
      m.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;             // a cylinder points +Y; aim it down the member
      return m;
    };
    const bDir = SB1.clone().sub(SB0).normalize();
    const bN = new THREE.Vector2(-bDir.y, bDir.x);                 // the soundboard's normal, pointing at the neck
    // the soundbox: an octagonal cedar body slung under the board, fattest at the bass
    limb(SB0.clone().addScaledVector(bN, -1.35).addScaledVector(bDir, -0.55),
         SB1.clone().addScaledVector(bN, -0.75).addScaledVector(bDir, 0.4), 0.82, 1.7, 8, cedar);
    limb(SB0, SB1, 0.14, 0.19, 6, gold);                           // the rib the strings are pinned along
    cyl(1.05, 1.3, 0.5, 8, gold, -1.95, 0.2, 0, harp);             // and the foot it stands on
    // the rose cut into the belly, where a soundbox is opened so it can sing
    const rc = boardAt(0.36).addScaledVector(bN, -0.85);
    const rose = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 6, 14), gold);
    rose.position.set(rc.x, rc.y, 1.0); harp.add(rose);
    // the forepillar, carrying the whole pull of the strings down to the foot
    limb(new THREE.Vector2(-3.5, 0.3), NK0, 0.42, 0.62, 8, gold);
    // the neck, walked along the curve in twelve tapering courses
    for (let i = 0; i < 12; i++) {
      const u0 = i / 12, u1 = (i + 1) / 12;
      limb(neckAt(u0), neckAt(u1), 0.5 - u1 * 0.22, 0.5 - u0 * 0.22, 8, gold);
    }
    // a pomegranate finial over the pillar, like everything else golden here
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), gold);
    finial.position.set(NK0.x, NK0.y + 0.55, 0); harp.add(finial);
    for (let c = 0; c < 4; c++) {
      const a = c * Math.PI / 2;
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.48, 5), gold);
      crown.position.set(NK0.x + Math.cos(a) * 0.25, NK0.y + 1.16, Math.sin(a) * 0.25);
      crown.rotation.z = -Math.cos(a) * 0.42; crown.rotation.x = Math.sin(a) * 0.42;
      harp.add(crown);
    }
    // Freygish on D — the same mode the fifteen steps are tuned to, so the harp
    // and the ascent answer each other. The eighth string is the octave.
    const HARP_TUNING = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 261.63, 293.66];
    const stringMat = new THREE.MeshStandardMaterial({ color: 0xfff1c4, metalness: 0.85, roughness: 0.22 });
    stringMat.envMap = envMap; metals.push(stringMat);
    const harpStrings = [];
    for (let st = 0; st < 8; st++) {
      const u = 0.085 + st * 0.125;
      const top = neckAt(u), bot = boardAt(u);
      const sm = limb(top, bot, 0.055, 0.055, 6, stringMat);
      sm.castShadow = false;
      const peg = cyl(0.1, 0.1, 1.5, 6, bronze, top.x, top.y, 0, harp);
      peg.rotation.x = Math.PI / 2;
      sm.userData = { amp: 0, ph: st * 1.7, peg };
      harpStrings.push(sm);
      if (st === 7) { sm.visible = false; peg.visible = false; }   // the eighth is still waiting
    }
    const revealEighth = () => {
      harpStrings[7].visible = true;
      harpStrings[7].userData.peg.visible = true;
    };
    harp.position.set(IC_E + 14, IC_H * 0.45, -44);
    harp.rotation.y = 0.8;
    harp.scale.set(1.25, 1.25, 1.25);
    harp.userData = { id: 9 };
    scene.add(harp);
    clickables.push(harp);

    const shofar = new THREE.Group();
    box(6, 3.2, 6, marble, 0, 1.6, 0, shofar);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xcbb492, roughness: 0.5 });
    const hp1 = cyl(0.7, 1.6, 7, 9, hornMat, 0, 4.6, 0, shofar); hp1.rotation.z = 1;
    const hp2 = cyl(1.5, 2.4, 5, 9, hornMat, 3.6, 6.4, 0, shofar); hp2.rotation.z = 1.9;
    const bellEnd = cyl(2.4, 1.8, 1.6, 10, hornMat, 6.2, 6.9, 0, shofar); bellEnd.rotation.z = 1.9;
    shofar.position.set(-45, 0, HALF - 75);
    shofar.userData = { id: 10 };
    scene.add(shofar);
    clickables.push(shofar);

    const stoneGlowMat = new THREE.MeshStandardMaterial({ color: 0xf5e3b2, emissive: 0xffc75e, emissiveIntensity: 0.7, roughness: 0.4 });
    const shetiya = new THREE.Mesh(new THREE.SphereGeometry(6, 14, 10), stoneGlowMat);
    shetiya.scale.y = 0.42;
    shetiya.position.set(-150 - 195 - 12, 1.4, 0);
    shetiya.userData = { id: 11 };
    scene.add(shetiya);
    clickables.push(shetiya);
    const shetiyaLight = new THREE.PointLight(0xffc75e, 0.9, 60, 2);
    shetiyaLight.position.set(shetiya.position.x, 6, 0);
    scene.add(shetiyaLight);

    const men = new THREE.Group();
    cyl(0.55, 0.8, 10, 8, gold, 0, 5, 0, men);
    cyl(2.2, 2.6, 1, 10, gold, 0, 0.5, 0, men);
    const flameTips = [];
    [-4.8, -3.2, -1.6, 0, 1.6, 3.2, 4.8].forEach((bz) => {
      if (bz !== 0) {
        cyl(0.32, 0.36, 3.1, 6, gold, 0, 9.05, bz, men);
        const knop = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), gold);
        knop.position.set(0, 10, bz);
        men.add(knop);
      }
      cyl(0.55, 0.35, 0.9, 8, gold, 0, 10.6 + (bz === 0 ? 0.5 : 0), bz, men);
      const m = new THREE.SpriteMaterial({ map: fireTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
      const fl = new THREE.Sprite(m);
      fl.scale.set(1.4, 2.2, 1);
      fl.position.set(0, 12.2 + (bz === 0 ? 0.5 : 0), bz);
      men.add(fl);
      flameTips.push(fl);
    });
    box(0.5, 0.5, 10.2, gold, 0, 10, 0, men);
    men.scale.set(1.8, 1.8, 1.8);
    men.position.set(50, IC_H, 48);
    men.userData = { id: 12 };
    scene.add(men);
    clickables.push(men);
    const menLight = new THREE.PointLight(0xffc84d, 0, 60, 2);
    menLight.position.set(50, IC_H + 24, 48);
    scene.add(menLight);

    const ketoret = new THREE.Group();
    box(3.2, 5, 3.2, goldPlate, 0, 2.5, 0, ketoret);
    box(4, 0.7, 4, gold, 0, 5.2, 0, ketoret);
    for (const hx of [-1, 1]) for (const hz of [-1, 1]) box(0.6, 1, 0.6, gold, hx * 1.7, 5.9, hz * 1.7, ketoret);
    ketoret.position.set(-96, IC_H, 0);
    ketoret.userData = { id: 13 };
    scene.add(ketoret);
    clickables.push(ketoret);
    const ketoretState = { active: false };
    const ketoretPuffs = [];
    for (let i = 0; i < 12; i++) {
      const m = new THREE.SpriteMaterial({ map: smokeTex, depthWrite: false, transparent: true, opacity: 0, color: 0xf6f0e0 });
      const p = new THREE.Sprite(m);
      p.userData = { ph: i / 12 };
      scene.add(p);
      ketoretPuffs.push(p);
    }

    const plaqueGrp = new THREE.Group();
    box(9, 4.5, 2.2, mega, 0, 2.25, 0, plaqueGrp);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 3.2), new THREE.MeshStandardMaterial({ map: plaqueTex(), roughness: 0.85 }));
    face.position.set(0, 2.3, 1.15);
    plaqueGrp.add(face);
    plaqueGrp.position.set(-HALF + 10, 30.4, HALF - 10);
    plaqueGrp.rotation.y = Math.PI / 4;
    plaqueGrp.userData = { id: 15 };
    scene.add(plaqueGrp);
    clickables.push(plaqueGrp);


    // ═══════════ The ten deeper wonders (ids 26–35) ═══════════
    // Each one stands beside the thing it teaches about: the laver, the facade,
    // the altar, the river, the western retaining wall. Measurements carry
    // their source in a comment, like every other dimension in this House.

    // 26 · מוכני בן קטין — the wheel that lowered the kiyor into its well each
    // night, so that morning water would not be pasul (Yoma 37a; Middot 3:6).
    const mukhani = new THREE.Group();
    mukhani.position.set(-20, IC_H, IC / 2 - 14);
    for (const s2 of [-1, 1]) box(1.1, 8, 1.1, cedar, s2 * 3.6, 4, 0, mukhani);
    box(9, 1, 1.2, cedar, 0, 8.4, 0, mukhani);
    const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.3, 8, 22), bronze);
    wheelRim.rotation.y = Math.PI / 2;
    wheelRim.position.y = 6.4;
    mukhani.add(wheelRim);
    for (let sp = 0; sp < 6; sp++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5, 5), bronze);
      spoke.position.y = 6.4;
      spoke.rotation.x = (sp / 6) * Math.PI;
      mukhani.add(spoke);
    }
    const axle = cyl(0.3, 0.3, 8.4, 8, bronze, 0, 6.4, 0, mukhani);
    axle.rotation.z = Math.PI / 2;
    const crank = cyl(0.24, 0.24, 2.2, 6, bronze, 3.1, 5.1, 0, mukhani);
    crank.rotation.z = Math.PI / 2;
    cyl(0.13, 0.13, 5.6, 5, bronze, 0, 3.5, 1.9, mukhani);   // the rope, gone slack
    cyl(2.6, 2.9, 1.4, 12, stoneDarkM, 0, 0.7, 0, mukhani);  // the mouth of its well
    mukhani.userData = { id: 26 };
    scene.add(mukhani);
    clickables.push(mukhani);

    // 27 · גפן של זהב — the golden vine over the entrance of the Heichal, grown
    // only by donation: a leaf, a berry, a whole cluster (Middot 3:8;
    // Josephus, War 5.210 — clusters the height of a man). Hung on the House
    // itself, so it rides in the temple group T.
    const vine = new THREE.Group();
    vine.position.set(24.4, 6 + 41, 0);
    box(0.9, 0.9, 26, gold, 0, 0, 0, vine);              // the pole it was trained on
    for (let v = -3; v <= 3; v++) {
      const stem = cyl(0.16, 0.22, 3.4, 5, gold, 0, -1.7, v * 3.8, vine);
      stem.rotation.x = v * 0.06;
      for (let lf = 0; lf < 3; lf++) {                    // leaves, hammered on
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.62, 6, 5), gold);
        leaf.scale.set(1, 0.18, 1.3);
        leaf.rotation.y = lf * 1.1 + v;
        leaf.position.set(0, -0.6 - lf * 1.1, v * 3.8 + (lf % 2 ? 0.7 : -0.7));
        vine.add(leaf);
      }
      if (v % 2 === 0) {                                  // a cluster, man-high
        for (let b = 0; b < 9; b++) {
          const berry = new THREE.Mesh(new THREE.SphereGeometry(0.42, 6, 5), gold);
          const rowY = Math.floor(b / 3);
          berry.position.set((b % 3 - 1) * 0.55 * (1 - rowY * 0.25), -3.6 - rowY * 0.8, v * 3.8 + (rowY % 2 ? 0.3 : -0.3));
          vine.add(berry);
        }
      }
    }
    vine.userData = { id: 27 };
    T.add(vine);
    clickables.push(vine);

    // 28 · ערבה — willow branches eleven amot tall from Motza, stood against the
    // sides of the altar with their heads bent over it (Sukkah 45a).
    const willowMat = new THREE.MeshStandardMaterial({ color: 0x7f9159, roughness: 0.95 });
    const aravah = new THREE.Group();
    aravah.position.set(AX, TOP, 18.6);
    for (let b = 0; b < 7; b++) {
      const bx = -12 + b * 4;
      const branch = cyl(0.14, 0.3, 11, 5, willowMat, bx, 5.4, 0, aravah);   // eleven amot
      branch.rotation.x = 0.26;
      for (let lf = 0; lf < 5; lf++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.5, 5, 4), willowMat);
        leaf.scale.set(0.35, 1.5, 0.35);
        leaf.rotation.z = (lf % 2 ? 1 : -1) * 0.5;
        leaf.position.set(bx + (lf % 2 ? 0.6 : -0.6), 3 + lf * 1.7, -0.7 - lf * 0.45);
        aravah.add(leaf);
      }
    }
    aravah.userData = { id: 28 };
    scene.add(aravah);
    clickables.push(aravah);

    // 29 · חליל — the flute of the Simchat Beit HaSho'evah, left at the foot of
    // the fifteen steps with a torch beside it (Sukkah 51a).
    const chalil = new THREE.Group();
    chalil.position.set(IC_E + 40, 0, -30);
    box(11, 1.2, 4.4, marble, 0, 3.2, 0, chalil);
    for (const s2 of [-1, 1]) box(1.6, 2.6, 3.6, marble, s2 * 4, 1.3, 0, chalil);
    const flutePipe = cyl(0.42, 0.46, 7.4, 9, cedar, 0.6, 4.1, 0, chalil);
    flutePipe.rotation.x = Math.PI / 2;
    for (let hI = 0; hI < 6; hI++) {
      const hole = new THREE.Mesh(new THREE.SphereGeometry(0.13, 5, 4), stoneDarkM);
      hole.position.set(0.6, 4.5, -2.2 + hI * 0.9);
      chalil.add(hole);
    }
    cyl(0.3, 0.36, 6.5, 6, cedar, -3.4, 7, 1.4, chalil);            // the torch they juggled
    const torchHead = cyl(0.9, 0.5, 1.5, 8, bronze, -3.4, 10.6, 1.4, chalil);
    void torchHead;
    chalil.userData = { id: 29 };
    scene.add(chalil);
    clickables.push(chalil);

    // 30 · עלהו לתרופה — one of the trees of Yechezkel 47:12, whose leaf is not
    // for eating: new fruit every month, and the leaf for healing.
    const healTree = new THREE.Group();
    healTree.position.set(240, 0, 46);
    cyl(1.2, 2, 12, 8, cedar, 0, 6, 0, healTree);
    const crownH = new THREE.Mesh(new THREE.SphereGeometry(7.4, 10, 8), leafMat);
    crownH.position.y = 15;
    crownH.castShadow = true;
    healTree.add(crownH);
    for (let f2 = 0; f2 < 12; f2++) {
      const a2 = (f2 / 12) * Math.PI * 2;
      const fr = new THREE.Mesh(new THREE.SphereGeometry(0.8, 6, 5), fruitMat);
      fr.position.set(Math.cos(a2) * 6, 13 + (f2 % 3) * 2.2, Math.sin(a2) * 6);
      healTree.add(fr);
    }
    const healLeafMat = new THREE.MeshStandardMaterial({ color: 0x9fd48a, emissive: 0x2e5a22, emissiveIntensity: 0.5, roughness: 0.8 });
    for (let lf = 0; lf < 9; lf++) {
      const a2 = (lf / 9) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(1.1, 6, 5), healLeafMat);
      leaf.scale.set(1, 0.2, 1.5);
      leaf.rotation.y = a2;
      leaf.position.set(Math.cos(a2) * 8.2, 17.5 + Math.sin(a2 * 2) * 1.2, Math.sin(a2) * 8.2);
      healTree.add(leaf);
    }
    healTree.userData = { id: 30 };
    scene.add(healTree);
    clickables.push(healTree);

    // 31 · שולחן לחם הפנים — the Shulchan lifted up on the festivals so the
    // pilgrims could see the bread (Menachot 29a; Chagigah 26b). Twelve loaves
    // in two stacks of six (Vayikra 24:6), on the platform before the Ulam.
    const shulchan = new THREE.Group();
    shulchan.position.set(-114, IC_H + 6, -26);
    box(10, 0.9, 5.5, goldPlate, 0, 4.6, 0, shulchan);
    box(10.6, 0.5, 6.1, gold, 0, 5.1, 0, shulchan);            // the zer, the crown around it
    for (const hx of [-1, 1]) for (const hz of [-1, 1]) box(0.7, 4.6, 0.7, gold, hx * 4.2, 2.3, hz * 2.1, shulchan);
    for (const st of [-1, 1]) for (let lo = 0; lo < 6; lo++)
      box(2.4, 0.55, 3.6, marble, st * 2.7, 5.7 + lo * 0.6, 0, shulchan);   // six and six
    for (const st of [-1, 1]) {
      const bowl = cyl(0.7, 0.5, 0.7, 8, gold, st * 2.7, 9.6, 0, shulchan); // the two bowls of levonah
      void bowl;
    }
    shulchan.userData = { id: 31 };
    scene.add(shulchan);
    clickables.push(shulchan);

    // 32 · הקלפי — the lottery box that replaced the race up the ramp
    // (Yoma 22a; Tamid 1:2).
    const kalpi = new THREE.Group();
    kalpi.position.set(26, IC_H, -46);
    box(5, 3.4, 5, stoneDarkM, 0, 1.7, 0, kalpi);
    box(3.6, 2.8, 3.6, cedar, 0, 4.8, 0, kalpi);
    const lid = box(4.2, 0.5, 4.2, cedar, 0, 6.4, 0, kalpi);
    lid.rotation.z = 0.12;
    cyl(0.4, 0.4, 0.5, 8, gold, 0, 6.8, 0, kalpi);
    kalpi.userData = { id: 32 };
    scene.add(kalpi);
    clickables.push(kalpi);

    // 33 · קרבן עצים — the wood the families carried up, split fig-logs for the
    // ma'aracha (Ta'anit 26a, 28a; Tamid 2:3 — fig, because it does not smoke).
    const etzim = new THREE.Group();
    etzim.position.set(-14, IC_H, -64);
    for (let row = 0; row < 3; row++) {
      for (let lg = 0; lg < 4 - row; lg++) {
        const log = cyl(0.85, 0.95, 9, 7, cedar, 0, 0.9 + row * 1.7, -2.4 + lg * 1.7 + row * 0.85, etzim);
        log.rotation.z = Math.PI / 2;
      }
    }
    const leaning = cyl(0.8, 0.9, 9, 7, cedar, 3.4, 2.6, 3.4, etzim);
    leaning.rotation.set(0, 0.4, 1.2);
    etzim.userData = { id: 33 };
    scene.add(etzim);
    clickables.push(etzim);

    // 34 · פרה אדומה — burned on Har HaMishcha, reached by a causeway of arches
    // upon arches, an arch above each pier, against a grave in the depths
    // (Parah 3:6; Bamidbar 19).
    const CWAY_Z = -74, CWAY_Y = LAND_Y + 21;
    for (let a2 = 0; a2 < 6; a2++) {
      const px = 330 + a2 * 30;
      box(6, 21, 6, mega, px, LAND_Y + 10.5, CWAY_Z);        // pier, up to the deck
      const arch = new THREE.Mesh(new THREE.TorusGeometry(12, 1.5, 6, 14, Math.PI), mega);
      arch.position.set(px + 15, LAND_Y + 6.5, CWAY_Z);      // an arch above each pier
      scene.add(arch);
    }
    box(200, 3, 14, marble, 425, CWAY_Y, CWAY_Z);
    for (let r2 = -6; r2 <= 6; r2++) box(4, 2.4, 1.2, white, 425 + r2 * 15, CWAY_Y + 2.7, CWAY_Z + 7);
    const mound = new THREE.Mesh(new THREE.SphereGeometry(70, 14, 9), new THREE.MeshStandardMaterial({ color: 0xa89769, roughness: 1 }));
    mound.scale.y = 0.22;
    mound.position.set(560, LAND_Y - 5, CWAY_Z);
    mound.receiveShadow = true;
    scene.add(mound);
    const parah = new THREE.Group();
    parah.position.set(536, LAND_Y + 9, CWAY_Z);
    const redHide = new THREE.MeshStandardMaterial({ color: 0x9c3b22, roughness: 0.9 });
    const pBody = new THREE.Mesh(new THREE.SphereGeometry(3.2, 10, 8), redHide);
    pBody.scale.set(1.75, 1, 1); pBody.position.y = 6.4; pBody.castShadow = true; parah.add(pBody);
    const pNeck = cyl(1.5, 1.9, 3, 8, redHide, 4.9, 6.6, 0, parah);
    pNeck.rotation.z = -0.5;
    const pHead = new THREE.Mesh(new THREE.SphereGeometry(1.5, 9, 7), redHide);
    pHead.scale.set(1.5, 1, 0.95); pHead.position.set(7.4, 6.2, 0); parah.add(pHead);
    for (const s2 of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), redHide);
      ear.scale.set(0.5, 0.6, 1.5);
      ear.position.set(6.6, 7, s2 * 1.5);
      parah.add(ear);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.34, 2.2, 6), redHide);
      horn.position.set(7, 7.9, s2 * 0.9);
      horn.rotation.z = -s2 * 0.15;
      horn.rotation.x = -s2 * 0.5;
      parah.add(horn);
    }
    for (let l2 = 0; l2 < 4; l2++)
      cyl(0.55, 0.6, 6.4, 6, redHide, -2.8 + (l2 % 2) * 5.4, 3.2, l2 < 2 ? -1.6 : 1.6, parah);
    const pTail = cyl(0.3, 0.12, 4, 5, redHide, -5.9, 5.6, 0, parah);
    pTail.rotation.z = 0.5;
    parah.rotation.y = -2.3;
    parah.scale.set(1.8, 1.8, 1.8);   // she has to read as a heifer from the Mount
    parah.userData = { id: 34 };
    scene.add(parah);
    clickables.push(parah);

    // 35 · הכותל המערבי — the western retaining wall, whose courses are still
    // standing, with notes pressed into the joints (Shemot Rabbah 2:2).
    const kotel = new THREE.Group();
    kotel.position.set(-(HALF + 46), LAND_Y, 0);
    for (let course = 0; course < 6; course++) {
      const ch = course < 2 ? 5.2 : 4.2;
      const cy2 = course < 2 ? 2.6 + course * 5.2 : 10.4 + (course - 2) * 4.2 + 2.1;
      for (let blk = -2; blk <= 2; blk++)
        box(7, ch - 0.35, 26 - course * 1.2, mega, (course % 2) * 0.6, cy2, blk * 26.6 + (course % 2 ? 4 : 0), kotel);
    }
    // notes, pressed into the joints — still being written
    const noteMat = new THREE.MeshStandardMaterial({ color: 0xf7f2e2, roughness: 0.95 });
    for (let n2 = 0; n2 < 24; n2++) {
      const note = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.45), noteMat);
      note.position.set(-3.7, 3.4 + (n2 % 6) * 4.4, -32 + (n2 % 12) * 5.6 + (n2 % 3));
      note.rotation.x = rnd(-0.3, 0.3);
      kotel.add(note);
    }
    box(30, 1, 120, marble, -18, 0.5, 0, kotel);   // the pavement people stand on
    kotel.userData = { id: 35 };
    scene.add(kotel);
    clickables.push(kotel);
    addCollider(-(HALF + 50), -(HALF + 42), -66, 66);

    // The cedar doors of the Heichal are shut — and now they say so when they
    // are struck, instead of leaving a visitor pressing at a wall. The inside
    // of the House is the next thing being built; see the roadmap in README.
    dL.userData.sealed = true;
    dR.userData.sealed = true;
    clickables.push(dL, dR);

    // ═══════════ Halos ═══════════
    // The pesichah promises that every hidden thing floats inside a slowly
    // turning ring of gold light. The rimonim carry their own ring; the
    // wonders are architecture and cannot float, so the ring is laid at their
    // feet instead — same promise, same colour, sized to whatever it marks.
    const halos = [];
    const addHalo = (obj, radius, yOff = 0.6) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, Math.max(0.13, radius * 0.04), 8, 30),
        new THREE.MeshBasicMaterial({ color: 0xffd97a, transparent: true, opacity: 0.36, depthWrite: false })
      );
      ring.rotation.x = Math.PI / 2;
      const wp = obj.getWorldPosition(new THREE.Vector3());
      ring.position.set(wp.x, wp.y + yOff, wp.z);
      scene.add(ring);
      halos.push({ ring, id: obj.userData.id, base: ring.position.y });
    };
    addHalo(fox, 8, 0.4);
    addHalo(harp, 7, -2.2);
    addHalo(shofar, 7, 0.4);
    addHalo(shetiya, 9, 1.2);
    addHalo(men, 13, 0.4);
    addHalo(ketoret, 6, 0.4);
    addHalo(nicanor, 24, 0.5);
    addHalo(plaqueGrp, 7, 0.4);
    addHalo(mukhani, 5.5);
    addHalo(vine, 6, -5.5);
    addHalo(aravah, 9, 6.6);
    addHalo(chalil, 6);
    addHalo(healTree, 9);
    addHalo(shulchan, 6);
    addHalo(kalpi, 4.5);
    addHalo(etzim, 7);
    addHalo(parah, 12, -0.6);
    addHalo(kotel, 13, 1.2);

    const doves = [];
    for (let d = 0; d < 18; d++) {
      const dove = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 6), marble);
      body.scale.set(1.7, 0.8, 0.8); dove.add(body);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 4.6), marble);
      dove.add(wing);
      dove.userData = { a: (d / 18) * Math.PI * 2, r: 150 + d * 13, h: 112 + d * 4, sp: 0.13 + d * 0.008, wing };
      scene.add(dove);
      doves.push(dove);
    }

    // ═══════════ Audio ═══════════
    let audioCtx = null;
    const ensureAudio = () => {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      return audioCtx;
    };
    // The ambient bed and every event sound answer to one switch.
    const amb = {
      on: true, built: false, buf: null,
      master: null, wind: null, windF: null, fire: null, fireGain: null,
      songBus: null, song: null, songAt: 0, crackAt: 0,
    };
    const playShofar = () => {
      if (!amb.on) return;
      const ctx = ensureAudio(); const t0 = ctx.currentTime;
      const osc = ctx.createOscillator(), osc2 = ctx.createOscillator();
      const gain = ctx.createGain(), filt = ctx.createBiquadFilter();
      filt.type = "lowpass"; filt.frequency.value = 900; filt.Q.value = 4;
      osc.type = "sawtooth"; osc2.type = "square";
      [[osc, 146, 158, 230], [osc2, 147.5, 159, 232]].forEach(([o, f1, f2, f3]) => {
        o.frequency.setValueAtTime(f1, t0);
        o.frequency.linearRampToValueAtTime(f2, t0 + 0.15);
        o.frequency.setValueAtTime(f2, t0 + 1.15);
        o.frequency.linearRampToValueAtTime(f3, t0 + 1.28);
      });
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.28, t0 + 0.09);
      gain.gain.setValueAtTime(0.28, t0 + 1.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.1);
      osc.connect(filt); osc2.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
      osc.start(t0); osc2.start(t0); osc.stop(t0 + 2.2); osc2.stop(t0 + 2.2);
    };
    // ── The kinnor: a plucked string, not an oscillator ──
    //
    // Karplus-Strong. Fill a ring one wavelength long with noise, then read it
    // round and round, averaging each sample with the one behind it as it goes.
    // The high partials die first and the fundamental last, which is what a
    // stretched string actually does — and it falls out of four lines of
    // arithmetic instead of a stack of oscillators.
    //
    // It is rendered into a buffer in JS rather than built from a DelayNode,
    // because a WebAudio delay cannot hold a loop shorter than one render
    // quantum: every string above ~344 Hz would have come out flat. Costs a
    // few hundred microseconds per pitch and is cached, so the eight strings
    // of the frame are computed once and then plucked for free.
    const ksCache = new Map();
    const ksString = (ctx, freq) => {
      const key = freq.toFixed(2);
      const hit = ksCache.get(key);
      if (hit) return hit;
      const sr = ctx.sampleRate;
      const n = Math.max(2, Math.round(sr / freq));
      // low strings ring on; the treble is gone in a second and a half
      const secs = Math.max(1.5, Math.min(3.6, 3.6 * Math.pow(180 / freq, 0.55)));
      const len = Math.floor(sr * secs);
      const buf = ctx.createBuffer(1, len, sr);
      const out = buf.getChannelData(0);
      const ring = new Float32Array(n);
      for (let i = 0; i < n; i++) ring[i] = Math.random() * 2 - 1;
      // a string is plucked over a finger's width, not at a point: smoothing the
      // excitation once is the difference between an attack and a click
      for (let i = 0; i < n; i++) ring[i] = (ring[i] + ring[(i + 1) % n]) * 0.5;
      const rho = Math.pow(0.02, 1 / (freq * secs));   // loss per trip round the ring
      const blend = 0.72;                              // gut would be lower; this is a strung metal harp
      let p = 0, prev = 0;
      for (let i = 0; i < len; i++) {
        const v = ring[p];
        out[i] = v;
        ring[p] = rho * (blend * v + (1 - blend) * prev);
        prev = v;
        if (++p === n) p = 0;
      }
      // ends: 1 ms on, 60 ms off, so neither the pluck nor the buffer clicks
      const fi = Math.floor(sr * 0.001), fo = Math.floor(sr * 0.06);
      for (let i = 0; i < fi; i++) out[i] *= i / fi;
      for (let i = 0; i < fo; i++) out[len - 1 - i] *= i / fo;
      ksCache.set(key, buf);
      return buf;
    };
    // The soundbox the strings are sitting on: a broad resonance where the cedar
    // body would sing, and a roll-off above it, so the notes sound like they are
    // coming out of something and not out of nothing.
    let harpChain = null;
    const harpBus = (ctx) => {
      if (harpChain) return harpChain;
      const body = ctx.createBiquadFilter();
      body.type = "peaking"; body.frequency.value = 250; body.Q.value = 0.85; body.gain.value = 5;
      const air = ctx.createBiquadFilter();
      air.type = "highshelf"; air.frequency.value = 5000; air.gain.value = -7;
      const out = ctx.createGain(); out.gain.value = amb.on ? 1 : 0;
      body.connect(air); air.connect(out); out.connect(ctx.destination);
      harpChain = { in: body, out };
      return harpChain;
    };
    // The phrase: a roll up the frame fast enough that every string is still
    // sounding under the next, then a fall back over a bass that has not
    // stopped, closing on the open fifth. [string, seconds, force]
    const HARP_PHRASE = [
      [0, 0.00, 0.55], [1, 0.10, 0.60], [2, 0.19, 0.67], [3, 0.28, 0.74],
      [4, 0.37, 0.82], [6, 0.46, 0.90], [7, 0.55, 1.00],
      [4, 0.94, 0.70], [2, 1.18, 0.60], [0, 1.44, 0.85], [4, 1.48, 0.44],
    ];
    const playHarp = (level = 1) => {
      if (!amb.on) return;
      const ctx = ensureAudio();
      const bus = harpBus(ctx);
      const t0 = ctx.currentTime + 0.02;
      const eighth = harpStrings[7].visible;
      // Below full force this is the wind on the frame, not a hand on it: the
      // roll alone, no melody after it.
      const phrase = level < 0.9 ? HARP_PHRASE.slice(0, 7) : HARP_PHRASE;
      phrase.forEach(([si, dt, vel]) => {
        const idx = si === 7 && !eighth ? 6 : si;    // seven strings until the eighth is found
        const src = ctx.createBufferSource();
        src.buffer = ksString(ctx, HARP_TUNING[idx]);
        const g = ctx.createGain();
        g.gain.value = 0.3 * vel * level;
        src.connect(g);
        // strung across the frame: the long strings to the left of the player
        if (ctx.createStereoPanner) {
          const pan = ctx.createStereoPanner();
          pan.pan.value = -0.42 + idx * 0.12;
          g.connect(pan); pan.connect(bus.in);
        } else g.connect(bus.in);
        src.start(t0 + dt);
        // and the string it came from blurs while it sounds
        setTimeout(() => { harpStrings[idx].userData.amp = Math.min(1, vel * level); }, dt * 1000 + 20);
      });
    };
    const playTrumpet = () => {
      if (!amb.on) return;
      const ctx = ensureAudio();
      [[392, 0, 0.5], [523.25, 0.45, 0.9], [392, 1.3, 0.35], [523.25, 1.6, 1.3]].forEach(([f, dt, dur]) => {
        const t0 = ctx.currentTime + dt;
        const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
        fl.type = "lowpass"; fl.frequency.value = 1700; fl.Q.value = 2;
        o.type = "sawtooth"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.2, t0 + 0.04);
        g.gain.setValueAtTime(0.2, t0 + dur * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(fl); fl.connect(g); g.connect(ctx.destination);
        o.start(t0); o.stop(t0 + dur + 0.05);
      });
    };
    const playChime = () => {
      if (!amb.on) return;
      const ctx = ensureAudio();
      [660, 990, 1320].forEach((f, i) => {
        const t0 = ctx.currentTime + i * 0.12;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2);
        o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + 2.1);
      });
    };

    // The chalil of the water-drawing: a breathy pipe, ornamented, over a drone.
    const playFlute = () => {
      if (!amb.on) return;
      const ctx = ensureAudio();
      const drone = ctx.createOscillator(), dg = ctx.createGain();
      drone.type = "sine"; drone.frequency.value = 146.83;
      dg.gain.setValueAtTime(0.0001, ctx.currentTime);
      dg.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.3);
      dg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.4);
      drone.connect(dg); dg.connect(ctx.destination);
      drone.start(); drone.stop(ctx.currentTime + 3.5);
      const tune = [587.33, 523.25, 466.16, 523.25, 587.33, 698.46, 587.33, 523.25, 440.0, 466.16, 523.25];
      tune.forEach((f, i) => {
        const t0 = ctx.currentTime + i * 0.23 + (i > 5 ? 0.1 : 0);
        const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
        fl.type = "lowpass"; fl.frequency.value = 2200;
        o.type = "sine"; o.frequency.setValueAtTime(f * 0.985, t0);
        o.frequency.linearRampToValueAtTime(f, t0 + 0.05);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
        o.connect(fl); fl.connect(g); g.connect(ctx.destination);
        o.start(t0); o.stop(t0 + 0.45);
      });
    };

    // fifteen degrees of the ascent, freygish on D — the mode the harp sings in
    const STEP_SCALE = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 261.63, 293.66,
                        311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 587.33];
    const playStep = (i) => {
      if (!amb.on) return;
      const ctx = ensureAudio(); const t0 = ctx.currentTime;
      const f = STEP_SCALE[Math.max(0, Math.min(14, i))];
      [[1, "triangle", 0.17], [2, "sine", 0.055], [3, "sine", 0.02]].forEach(([mul, type, peak]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.value = f * mul;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.7);
        o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + 1.8);
      });
    };

    // ═══════════ Ambient bed: wind, the ma'aracha, the Levites' song ═══════════
    // Three synthesized voices mixed every frame by where the eye stands: wind
    // over the mountain (everywhere, stronger high up and at night), the fire
    // of the ma'aracha (near the altar), and the ascent of the Levites carried
    // across the courts (near the fifteen steps). Built lazily — a browser
    // holds an AudioContext suspended until the first gesture, so the House is
    // silent until the visitor touches it.
    const ALTAR_POS = new THREE.Vector3(AX, TOP + 20, 0);
    const STEPS_POS = new THREE.Vector3(IC_E + 18, IC_H, 0);

    // Brown noise — integrated white noise. Wind and fire share this spectrum;
    // filtering alone separates the mountain air from the hearth.
    const noiseBuf = (ctx, secs) => {
      const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * secs), ctx.sampleRate);
      const d = b.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        d[i] = last * 3.4;
      }
      return b;
    };
    const buildAmbience = () => {
      // ensureAudio() runs first, above the built guard, and that ordering is
      // the whole point: a context opened before the visitor has touched
      // anything comes back suspended, and only a resume() inside a real
      // gesture starts it. Guarding above this call strands that context
      // suspended for the rest of the session — the bed built, wired, silent.
      const ctx = ensureAudio();
      if (amb.built) return;
      amb.built = true;
      amb.buf = noiseBuf(ctx, 6);
      amb.master = ctx.createGain();
      amb.master.gain.value = amb.on ? 1 : 0;
      amb.master.connect(ctx.destination);

      const loop = (dest) => {
        const s = ctx.createBufferSource();
        s.buffer = amb.buf; s.loop = true; s.connect(dest); s.start();
        return s;
      };

      // wind: lowpassed noise whose cutoff breathes with the gusts
      amb.windF = ctx.createBiquadFilter();
      amb.windF.type = "lowpass"; amb.windF.frequency.value = 420; amb.windF.Q.value = 0.9;
      amb.wind = ctx.createGain(); amb.wind.gain.value = 0;
      amb.windF.connect(amb.wind); amb.wind.connect(amb.master);
      loop(amb.windF);

      // fire: the same noise band-limited to the roar of a hearth
      const fireF = ctx.createBiquadFilter();
      fireF.type = "bandpass"; fireF.frequency.value = 320; fireF.Q.value = 0.55;
      amb.fireGain = ctx.createGain(); amb.fireGain.gain.value = 0;
      fireF.connect(amb.fireGain); amb.fireGain.connect(amb.master);
      loop(fireF);

      // song: softened and set back — a short feedback delay reads as the
      // distance of stone courts between the singer and the ear
      amb.songBus = ctx.createBiquadFilter();
      amb.songBus.type = "lowpass"; amb.songBus.frequency.value = 1100;
      amb.song = ctx.createGain(); amb.song.gain.value = 0;
      const dl = ctx.createDelay(1), fb = ctx.createGain();
      dl.delayTime.value = 0.34; fb.gain.value = 0.3;
      dl.connect(fb); fb.connect(dl);
      amb.songBus.connect(amb.song); amb.songBus.connect(dl); dl.connect(amb.song);
      amb.song.connect(amb.master);
    };

    // Freygish (Ahava Raba) on D, two octaves — the mode the harp already
    // sings in. Phrases only ever ascend: fifteen steps, Shir HaMa'alot.
    const SONG_SCALE = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 261.63, 293.66, 311.13, 369.99, 392.0];
    const singPhrase = (ctx) => {
      const start = ctx.currentTime + 0.05;
      const n = 5 + Math.floor(Math.random() * 3);
      const root = Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const step = Math.min(SONG_SCALE.length - 1, root + i + (i === n - 1 ? 1 : 0));
        const t0 = start + i * 0.62;
        // two slightly detuned voices plus an octave — a choir, not a synth
        [[1, "triangle", 0.075], [1.006, "triangle", 0.06], [2, "sine", 0.026]].forEach(([mul, type, peak]) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = type; o.frequency.value = SONG_SCALE[step] * mul;
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(peak, t0 + 0.22);
          g.gain.setValueAtTime(peak, t0 + 0.4);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.95);
          o.connect(g); g.connect(amb.songBus); o.start(t0); o.stop(t0 + 1);
        });
      }
    };

    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const glide = (node, target, dt) => { node.gain.value += (target - node.gain.value) * Math.min(1, dt * 2.2); };
    // t = seconds since load, nightAmt = the eased day⇄night scalar
    const mixAmbience = (t, dt, nightAmt) => {
      if (!amb.built || !amb.on) return;
      const ctx = audioCtx;
      const p = camera.position;

      const gust = 0.55 + 0.45 * Math.sin(t * 0.11) * Math.sin(t * 0.043 + 1.7);
      const alt = clamp01((p.y - 10) / 240);
      amb.windF.frequency.value = 250 + gust * 400;
      glide(amb.wind, (0.05 + alt * 0.09) * (0.75 + 0.45 * nightAmt) * gust, dt);

      const fireAmt = clamp01(1 - (p.distanceTo(ALTAR_POS) - 24) / 130);
      glide(amb.fireGain, 0.19 * fireAmt, dt);
      if (fireAmt > 0.05 && t > amb.crackAt) {
        amb.crackAt = t + 0.06 + Math.random() * (0.45 / fireAmt);
        const t0 = ctx.currentTime;
        const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        s.buffer = amb.buf; s.playbackRate.value = 2 + Math.random() * 2.5;
        f.type = "bandpass"; f.frequency.value = 900 + Math.random() * 2600; f.Q.value = 5;
        g.gain.setValueAtTime(0.5 * fireAmt, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
        s.connect(f); f.connect(g); g.connect(amb.master);
        s.start(t0, Math.random() * 5, 0.12); s.stop(t0 + 0.13);
      }

      // Carried, not local: the ascent should reach the far side of the court
      // and the opening view from above, where the old 200-amah falloff put it
      // at exactly zero. 800 keeps the near mix as it was and lengthens the
      // tail — faint from the sky, full on the steps.
      const songAmt = clamp01(1 - (p.distanceTo(STEPS_POS) - 30) / 800);
      glide(amb.song, songAmt, dt);
      if (songAmt > 0.07 && t > amb.songAt) {
        amb.songAt = t + 7 + Math.random() * 9;
        singPhrase(ctx);
      }
    };

    // ═══════════ Terrain height + collision for walk mode ═══════════
    const groundHeight = (x, z) => {
      // eastern inner-court steps: ramp from court edge down to the azarah floor
      if (z > -35 && z < 35 && x > IC_E && x < IC_E + 40)
        return Math.max(0, IC_H * (1 - (x - IC_E) / 40));
      // inner court
      if (x > -190 && x < IC_E && z > -IC / 2 && z < IC / 2) return IC_H;
      // altar east steps
      if (z > -7 && z < 7 && x > AX + 15 && x < AX + 45)
        return IC_H + Math.max(0, 13.4 - (x - (AX + 15)) / 2.7 * 1.34);
      // southern monumental stair
      if (x > -76 && x < 76 && z > HALF + 36 && z < HALF + 82)
        return Math.max(LAND_Y, -((z - (HALF + 36)) / 46) * 14);
      // eastern monumental stair
      if (z > -56 && z < 56 && x > HALF + 36 && x < HALF + 82)
        return Math.max(LAND_Y, -((x - (HALF + 36)) / 46) * 14);
      // stoa stylobate
      if (Math.abs(x) < STOA_L / 2 && z > HALF - 58 - STOA_W / 2 && z < HALF - 58 + STOA_W / 2) return 2.4;
      // plaza
      if (Math.abs(x) < HALF + 38 && Math.abs(z) < HALF + 38) return 0;
      return LAND_Y;
    };
    const resolveCollisions = (pos) => {
      const R = 1.4;
      for (const c2 of colliders) {
        if (pos.x > c2.minX - R && pos.x < c2.maxX + R && pos.z > c2.minZ - R && pos.z < c2.maxZ + R) {
          const dxMin = pos.x - (c2.minX - R), dxMax = (c2.maxX + R) - pos.x;
          const dzMin = pos.z - (c2.minZ - R), dzMax = (c2.maxZ + R) - pos.z;
          const m = Math.min(dxMin, dxMax, dzMin, dzMax);
          if (m === dxMin) pos.x = c2.minX - R;
          else if (m === dxMax) pos.x = c2.maxX + R;
          else if (m === dzMin) pos.z = c2.minZ - R;
          else pos.z = c2.maxZ + R;
        }
      }
    };

    // ═══════════ Wayfinding ═══════════
    // A pillar of light over whatever the quest is asking for, and — in orbit
    // mode — a camera that swings over to it. The beacon only ever marks the
    // wonder you are already being asked to find, so it gives nothing away.
    const beacon = new THREE.Group();
    const beaconBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 3.6, 150, 14, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffc14a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, side: THREE.DoubleSide, fog: false })
    );
    beaconBeam.position.y = 75;
    beaconBeam.renderOrder = 20;
    beacon.add(beaconBeam);
    const beaconRing = new THREE.Mesh(
      new THREE.TorusGeometry(5.5, 0.45, 8, 30),
      new THREE.MeshBasicMaterial({ color: 0xffd97a, transparent: true, opacity: 0, depthWrite: false, depthTest: false, fog: false })
    );
    beaconRing.renderOrder = 21;
    beaconRing.rotation.x = Math.PI / 2;
    beaconRing.position.y = 0.8;
    beacon.add(beaconRing);
    beacon.visible = false;
    beacon.frustumCulled = false;
    scene.add(beacon);
    const guide = { until: -1, active: false, t: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), rFrom: 0, rTo: 0 };
    let nowT = 0;

    // ═══════════ Camera control: orbit + first-person ═══════════
    const orbit = { theta: Math.PI * 0.2, phi: Math.PI * 0.37, radius: 700, target: new THREE.Vector3(-40, 30, 0), dragging: false, lastX: 0, lastY: 0, drift: 0.00072 };
    const player = {
      pos: new THREE.Vector3(180, 3.4, 0),
      yaw: Math.PI, pitch: 0,
      keys: {},
      touchLook: null, touchMove: null,
      moveVec: { f: 0, s: 0 },
    };
    const EYE = 3.4;
    // On-screen navigation. Held buttons set a flag and the render loop moves
    // the camera per frame, so a long press glides instead of stepping.
    const nav = { l: 0, r: 0, u: 0, d: 0, in: 0, out: 0 };
    const HOME = { theta: Math.PI * 0.2, phi: Math.PI * 0.37, radius: 700, target: new THREE.Vector3(-40, 30, 0) };
    apiRef.current.nav = (k, on) => { if (k in nav) nav[k] = on ? 1 : 0; };
    apiRef.current.guideTo = (id) => {
      let obj = null;
      for (let i = 0; i < clickables.length; i++) {
        const c = clickables[i];
        if (c.userData && c.userData.id === id) { obj = c; break; }
      }
      if (!obj) return false;
      const p = obj.getWorldPosition(new THREE.Vector3());
      beacon.position.set(p.x, p.y - 8, p.z);
      beacon.visible = true;
      guide.until = nowT + 11;
      if (!walkRef.current) {
        guide.active = true; guide.t = 0;
        guide.from.copy(orbit.target); guide.to.copy(p);
        guide.rFrom = orbit.radius; guide.rTo = 200;
      }
      return true;
    };
    apiRef.current.resetView = () => {
      orbit.theta = HOME.theta; orbit.phi = HOME.phi; orbit.radius = HOME.radius;
      orbit.target.copy(HOME.target);
    };

    const applyCamera = () => {
      if (walkRef.current) {
        camera.position.copy(player.pos);
        const dir = new THREE.Vector3(
          Math.cos(player.pitch) * Math.cos(player.yaw),
          Math.sin(player.pitch),
          Math.cos(player.pitch) * Math.sin(player.yaw)
        );
        camera.lookAt(player.pos.clone().add(dir));
      } else {
        const { theta, phi, radius, target } = orbit;
        camera.position.set(
          target.x + radius * Math.sin(phi) * Math.cos(theta),
          target.y + radius * Math.cos(phi),
          target.z + radius * Math.sin(phi) * Math.sin(theta)
        );
        camera.lookAt(target);
      }
    };
    apiRef.current.enterWalk = () => {
      player.pos.set(180, groundHeight(180, 0) + EYE, 0);
      player.yaw = Math.PI;
      player.pitch = 0;
    };

    const raycaster = new THREE.Raycaster();
    const mv = new THREE.Vector2();
    let moved = 0;
    const pxOf = (e) => (e.touches ? e.touches[0] : e.changedTouches ? e.changedTouches[0] : e);

    const onKey = (e, down) => {
      if (down && amb.on) buildAmbience();
      player.keys[e.code] = down;
      if (down && ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    };
    const kd = (e) => onKey(e, true), ku = (e) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    const onDown = (e) => {
      if (amb.on) buildAmbience();
      guide.active = false;
      const p = pxOf(e);
      moved = 0;
      if (walkRef.current && e.touches) {
        // two-zone touch: left = move stick, right = look
        for (const t of e.changedTouches) {
          if (t.clientX < window.innerWidth * 0.42 && !player.touchMove)
            player.touchMove = { id: t.identifier, x: t.clientX, y: t.clientY };
          else if (!player.touchLook)
            player.touchLook = { id: t.identifier, x: t.clientX, y: t.clientY };
        }
        return;
      }
      orbit.dragging = true;
      orbit.lastX = p.clientX; orbit.lastY = p.clientY;
    };
    const onMove = (e) => {
      if (walkRef.current && e.touches) {
        for (const t of e.touches) {
          if (player.touchMove && t.identifier === player.touchMove.id) {
            player.moveVec.f = -(t.clientY - player.touchMove.y) / 60;
            player.moveVec.s = (t.clientX - player.touchMove.x) / 60;
          } else if (player.touchLook && t.identifier === player.touchLook.id) {
            player.yaw += (t.clientX - player.touchLook.x) * 0.006;
            player.pitch = Math.max(-1.2, Math.min(1.2, player.pitch - (t.clientY - player.touchLook.y) * 0.005));
            player.touchLook.x = t.clientX; player.touchLook.y = t.clientY;
          }
        }
        moved = 10;
        return;
      }
      if (!orbit.dragging) return;
      const p = pxOf(e);
      const dx = p.clientX - orbit.lastX, dy = p.clientY - orbit.lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      if (walkRef.current) {
        player.yaw += dx * 0.0045;
        player.pitch = Math.max(-1.2, Math.min(1.2, player.pitch - dy * 0.0035));
      } else {
        orbit.theta += dx * 0.005;
        orbit.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.02, orbit.phi - dy * 0.004));
      }
      orbit.lastX = p.clientX; orbit.lastY = p.clientY;
    };
    let stepsHeard = false;
    const findVoice = (obj) => {
      let o = obj;
      while (o) { if (o.userData && o.userData.voice) return o.userData.voice; o = o.parent; }
      return null;
    };
    const findId = (obj) => {
      let o = obj;
      while (o) { if (o.userData && o.userData.id !== undefined) return o; o = o.parent; }
      return null;
    };
    const collect = (id) => {
      // quest gating: in quest mode, only the next wonder in sequence may be taken
      if (questRef.current && !foundRef.current.includes(id)) {
        const nxt = nextRef.current;
        if (id !== nxt) {
          apiRef.current.toast?.(`עוד לא — seek wonder ${nxt + 1} first: “${DISCOVERIES[nxt].hint}”`);
          return false;
        }
      }
      return true;
    };
    const onUp = (e) => {
      orbit.dragging = false;
      if (walkRef.current && e.changedTouches) {
        for (const t of e.changedTouches) {
          if (player.touchMove && t.identifier === player.touchMove.id) { player.touchMove = null; player.moveVec.f = 0; player.moveVec.s = 0; }
          if (player.touchLook && t.identifier === player.touchLook.id) player.touchLook = null;
        }
      }
      if (moved > 7) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const p = pxOf(e);
      mv.set(((p.clientX - rect.left) / rect.width) * 2 - 1, -((p.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(mv, camera);
      const hits = raycaster.intersectObjects(clickables, true);
      if (!hits.length) return;
      const struck = hits[0].object.userData.step;
      if (struck !== undefined) {
        playStep(struck);
        hits[0].object.material.emissiveIntensity = 0.85;
        burst(hits[0].point, { count: 7, speed: 5.5, size: 0.9, tint: 0xfff0b8 });
        if (!stepsHeard) {
          stepsHeard = true;
          apiRef.current.toast?.("שיר המעלות — every one of the fifteen steps remembers its note.");
        }
        return;
      }
      if (hits[0].object.userData.sealed) {
        apiRef.current.toast?.("הַהֵיכָל סָגוּר — the Heichal is still shut. Its inside is not built yet.");
        return;
      }
      const voice = findVoice(hits[0].object);
      if (voice) { apiRef.current.speak?.(voice); return; }
      const holder = findId(hits[0].object);
      if (!holder) return;
      const id = holder.userData.id;
      if (!collect(id)) return;
      if (rimonById[id]) {
        rimonById[id].traverse((o) => { if (o.isMesh) o.material = foundGold; });
        if (rimonById[id].userData.ring) rimonById[id].userData.ring.material.color.set(0xffd24a);
      }
      if (id === 9) { revealEighth(); playHarp(); }
      if (id === 10) playShofar();
      if (id === 12) { flameTips.forEach((f, i) => setTimeout(() => { f.material.opacity = 0.95; }, i * 180)); menLight.intensity = 1.1; }
      if (id === 13) { ketoretState.active = true; playChime(); }
      if (id === 14) nicanor.userData.target = 1;
      if (id === 15) playTrumpet();
      if (id === 26) playChime();
      if (id === 29) playFlute();
      if (id === 31) playChime();
      if (id === 35) playShofar();
      // every wonder found throws gold dust
      burst(holder.getWorldPosition(new THREE.Vector3()), { count: 30, speed: 15 });
      apiRef.current.openFact?.(id);
    };
    const onWheel = (e) => {
      e.preventDefault();
      if (!walkRef.current) orbit.radius = Math.max(80, Math.min(1500, orbit.radius + e.deltaY * 0.65));
    };
    const el = renderer.domElement;
    el.addEventListener("mousedown", onDown);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseup", onUp);
    el.addEventListener("touchstart", onDown, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // ═══════════ Environment cycle ═══════════
    const env = { cur: 0, target: 0 };
    apiRef.current.setNight = (n) => { env.target = n ? 1 : 0; };
    apiRef.current.setSound = (on) => {
      amb.on = on;
      if (on) buildAmbience();
      if (amb.master) amb.master.gain.value = on ? 1 : 0;
      // the harp is the one voice that can still be ringing when the switch is
      // thrown — three seconds of string does not care about a guard clause
      if (harpChain) harpChain.out.gain.value = on ? 1 : 0;
    };
    apiRef.current.markFound = (arr) => {
      arr.forEach((id) => {
        if (rimonById[id]) {
          rimonById[id].traverse((o) => { if (o.isMesh) o.material = foundGold; });
          if (rimonById[id].userData.ring) rimonById[id].userData.ring.material.color.set(0xffd24a);
        }
        if (id === 12) { flameTips.forEach((f) => { f.material.opacity = 0.95; }); menLight.intensity = 1.1; }
        if (id === 9) revealEighth();
        if (id === 13) ketoretState.active = true;
        if (id === 14) nicanor.userData.target = 1;
      });
    };
    const lerp = (a, b, t) => a + (b - a) * t;
    // Light and fog colours are consumed linearly, and every one of these was
    // picked by eye back when the renderer wrote its buffer out untouched. Left
    // alone they now read a stop and a half pale — which is what put a milky
    // film over the far courts and washed the horizon into the sky. Linearised
    // (≈ x^2.2), the sun keeps its warmth, the moon keeps its blue, and the
    // haze goes back to being haze.
    const dayFog = new THREE.Color(0x86a0b4), nightFog = new THREE.Color(0x010309);
    const dayHemiSky = new THREE.Color(0xa0bdff), nightHemiSky = new THREE.Color(0x080d1d);
    const dayHemiGnd = new THREE.Color(0x8e7241), nightHemiGnd = new THREE.Color(0x020101);
    const daySunCol = new THREE.Color(0xffdea5), nightSunCol = new THREE.Color(0x5a74ba);

    const harpAt = harp.position.clone();
    let harpNext = 18;                        // the north wind is not waiting at the door
    let raf, lastT = performance.now();
    const t0 = performance.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const t = (now - t0) / 1000;
      nowT = t;
      skyUniforms.uTime.value = t;

      // Frame-rate independent. A fixed 0.022 per frame meant the sun set
      // two and a half times faster on a 144Hz laptop than on a 60Hz one, and
      // crawled on anything struggling — the one animation in the House that
      // everything else keys off (every light, the fog, every emissive and
      // sprite tint) was running at a different speed for every visitor.
      // The constant is chosen so 60Hz behaves exactly as it always did.
      env.cur += (env.target - env.cur) * (1 - Math.exp(-dt * 1.334));
      const nAmt = env.cur, e2 = nAmt * nAmt * (3 - 2 * nAmt);
      skyUniforms.uNight.value = e2;
      const sunDir = new THREE.Vector3(lerp(0.55, -0.72, e2), lerp(0.6, -0.28, e2), lerp(-0.42, 0.3, e2)).normalize();
      skyUniforms.uSunDir.value.copy(sunDir);
      const moonDir = new THREE.Vector3(lerp(-0.9, -0.5, e2), lerp(-0.2, 0.55, e2), lerp(0.2, 0.45, e2)).normalize();
      skyUniforms.uMoonDir.value.copy(moonDir);
      sun.position.copy(e2 < 0.5 ? sunDir : moonDir).multiplyScalar(900);
      sun.intensity = lerp(2.35, 0.26, e2);
      sun.color.copy(daySunCol).lerp(nightSunCol, e2);
      // Linearised hemisphere colours carry roughly a third less luminance, so
      // the fill comes back up — but not all the way. Some of that lost fill is
      // exactly the flatness this pass is trying to remove: a shadowed wall
      // should fall away, not sit at three-quarter brightness.
      hemi.intensity = lerp(0.62, 0.26, e2);
      hemi.color.copy(dayHemiSky).lerp(nightHemiSky, e2);
      hemi.groundColor.copy(dayHemiGnd).lerp(nightHemiGnd, e2);
      scene.fog.color.copy(dayFog).lerp(nightFog, e2);
      windowMat.emissiveIntensity = e2 * 1.6;
      doorGlow.intensity = e2 * 1.5;
      goldPlate.emissiveIntensity = e2 * 0.18;
      // at night there is far less sky for the gold to reflect
      const envI = lerp(1.05, 0.26, e2);
      for (let mi = 0; mi < metals.length; mi++) metals[mi].envMapIntensity = envI;
      shetiyaLight.intensity = lerp(0.9, 1.6, e2);
      fireLight.intensity = lerp(1.3, 2.4, e2) + Math.sin(t * 13) * 0.12 + (vnoiseJS(t * 7) - 0.5) * 0.3;
      fireBlueLight.intensity = lerp(0.85, 1.45, e2) + (vnoiseJS(t * 11 + 40) - 0.5) * 0.35;
      torchFires.forEach(({ light, flame }, ti) => {
        light.intensity = e2 * 1.1 + Math.sin(t * 9 + ti * 2.4) * 0.1 * e2;
        const fs = 0.3 + e2 * 0.8 + Math.sin(t * 11 + ti * 3.1) * 0.12 + (vnoiseJS(t * 5 + ti) - 0.5) * 0.2;
        flame.scale.set(3 * fs, 4.4 * fs, 1);
        flame.material.opacity = 0.35 + e2 * 0.6;
      });
      clouds.forEach((c2) => {
        c2.position.x += c2.userData.speed;
        if (c2.position.x > 1600) c2.position.x = -1600;
        c2.userData.mat.opacity = c2.userData.baseO * lerp(1, 0.28, e2);
        c2.userData.mat.color.setRGB(lerp(1, 0.35, e2), lerp(1, 0.4, e2), lerp(1, 0.55, e2));
      });

      // ── walk mode physics ──
      if (walkRef.current) {
        const k = player.keys;
        let f = player.moveVec.f, s = player.moveVec.s;
        if (k.KeyW || k.ArrowUp) f += 1;
        if (k.KeyS || k.ArrowDown) f -= 1;
        if (k.KeyA || k.ArrowLeft) s -= 1;
        if (k.KeyD || k.ArrowRight) s += 1;
        f += nav.u - nav.d;                       // the on-screen arrows walk
        player.yaw += (nav.r - nav.l) * dt * 1.9; // and turn
        const mag = Math.hypot(f, s);
        if (mag > 0.01) {
          const speed = (k.ShiftLeft || k.ShiftRight ? 42 : 22) * dt / Math.max(1, mag);
          const fwd = new THREE.Vector3(Math.cos(player.yaw), 0, Math.sin(player.yaw));
          const right = new THREE.Vector3(-Math.sin(player.yaw), 0, Math.cos(player.yaw));
          const next = player.pos.clone()
            .addScaledVector(fwd, f * speed)
            .addScaledVector(right, s * speed);
          const gNow = groundHeight(player.pos.x, player.pos.z);
          const gNext = groundHeight(next.x, next.z);
          if (gNext - gNow <= 3.2) { // can't scale walls/platform faces
            player.pos.x = next.x; player.pos.z = next.z;
          }
          resolveCollisions(player.pos);
        }
        const gy = groundHeight(player.pos.x, player.pos.z) + EYE;
        player.pos.y += (gy - player.pos.y) * Math.min(1, dt * 10);
        // gentle head-bob while moving
        if (mag > 0.01) player.pos.y += Math.sin(t * 9) * 0.08;
      } else {
        // orbit mode: the same arrows swing and tilt, and the keyboard joins in
        const k = player.keys;
        const nx = nav.r - nav.l + (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0);
        const ny = nav.d - nav.u + (k.ArrowDown || k.KeyS ? 1 : 0) - (k.ArrowUp || k.KeyW ? 1 : 0);
        const nz = nav.in - nav.out + (k.Equal || k.NumpadAdd ? 1 : 0) - (k.Minus || k.NumpadSubtract ? 1 : 0);
        if (nx) orbit.theta += nx * dt * 0.8;
        if (ny) orbit.phi = Math.max(0.1, Math.min(1.46, orbit.phi + ny * dt * 0.6));
        if (nz) orbit.radius = Math.max(80, Math.min(1500, orbit.radius - nz * dt * 560));
        if (!orbit.dragging && !nx && !ny && !nz) orbit.theta += orbit.drift;
      }
      if (beacon.visible) {
        const left = guide.until - t;
        if (left <= 0) beacon.visible = false;
        else {
          const fade = Math.min(1, left / 1.6) * (0.55 + 0.45 * Math.sin(t * 4.2));
          beaconBeam.material.opacity = 0.2 * fade;
          beaconRing.material.opacity = 0.8 * fade;
          const rs = 1 + 0.22 * Math.sin(t * 3.1);
          beaconRing.scale.set(rs, rs, 1);
          beacon.rotation.y = t * 0.55;
        }
      }
      if (guide.active) {
        guide.t = Math.min(1, guide.t + dt * 0.85);
        const ge = guide.t * guide.t * (3 - 2 * guide.t);
        orbit.target.lerpVectors(guide.from, guide.to, ge);
        orbit.radius = guide.rFrom + (guide.rTo - guide.rFrom) * ge;
        if (guide.t >= 1) guide.active = false;
      }
      applyCamera();

      // ── fire ──
      const day = 1 - e2;
      for (let fi = 0; fi < flames.length; fi++) {
        const f = flames[fi];
        f.uniforms.uTime.value = t * f.ts;
        f.uniforms.uDay.value = day;
        f.mesh.rotation.y = t * f.rot;
      }
      blueSparks.forEach((sp) => {
        const u = sp.userData;
        const life = (t * u.sp + u.ph) % 1;
        const r = u.r * (1 - life * 0.55);
        sp.position.set(
          AX + Math.cos(u.a + t * 1.6) * r,
          TOP + 15.8 + life * 7.5,
          Math.sin(u.a + t * 1.6) * r
        );
        const sc = (1 - life * 0.8) * 1.5 + 0.25;
        sp.scale.set(sc, sc * 1.5, 1);
        sp.material.opacity = Math.sin(life * Math.PI) * lerp(0.34, 0.9, e2);
      });
      fireParticles.forEach((sp) => {
        const u = sp.userData;
        const life = ((t * u.sp + u.ph) % 1);
        const r = u.r * (1 - life * 0.75);
        sp.position.set(
          AX + Math.cos(u.a + t * 0.8) * r + u.drift * life * 3,
          TOP + 16.5 + life * 24,
          Math.sin(u.a + t * 0.8) * r
        );
        const sc = (1 - life) * rndCache(u.ph) * 4.1 + 0.5;
        sp.scale.set(sc, sc * 1.35, 1);
        sp.material.opacity = Math.sin(life * Math.PI) * lerp(0.2, 0.78, e2);
      });
      smokeParticles.forEach((sp) => {
        const u = sp.userData;
        const life = ((t * u.sp + u.ph) % 1);
        sp.position.set(
          AX + Math.sin(t * 0.6 + u.off) * u.sway * life,
          TOP + 33 + life * 58,
          Math.cos(t * 0.5 + u.off) * u.sway * life
        );
        const sc = 4 + life * 16;
        sp.scale.set(sc, sc, 1);
        sp.material.opacity = Math.sin(life * Math.PI) * lerp(0.42, 0.16, e2);
      });
      for (let i = 0; i < dustPool.length; i++) {
        const sp = dustPool[i];
        if (!sp.visible) continue;
        const u = sp.userData;
        u.life -= dt * 0.8;
        if (u.life <= 0) { sp.visible = false; sp.material.opacity = 0; continue; }
        u.v.y -= dt * 11;                       // gold dust falls back to the court
        sp.position.addScaledVector(u.v, dt);
        const sc = u.sc * (0.35 + u.life);
        sp.scale.set(sc, sc, 1);
        sp.material.opacity = Math.min(1, u.life * 1.5);
      }
      for (let i = 0; i < stepMeshes.length; i++) {
        const m = stepMeshes[i].material;
        if (m.emissiveIntensity > 0.001) m.emissiveIntensity *= Math.pow(0.02, dt);
        else m.emissiveIntensity = 0;
      }

      kitchenSmokes.forEach((sm) => {
        const cyc = (t * 0.14 + sm.userData.ph) % 1;
        sm.position.set(sm.userData.x + Math.sin(t + sm.userData.ph * 9) * cyc * 3, 6 + cyc * 26, sm.userData.z);
        const sc = 3 + cyc * 9;
        sm.scale.set(sc, sc, 1);
        sm.material.opacity = Math.sin(cyc * Math.PI) * 0.3;
      });

      // ── wonders idle ──
      const nxt = nextRef.current;
      rimonim.forEach((g, i) => {
        const rid = g.userData.id;
        const isFound = foundRef.current.includes(rid);
        const isNext = rid === nxt;
        // in quest mode, unfound rimonim beyond the current target are veiled
        const veil = questRef.current && !isFound && !isNext;
        g.traverse((o) => {
          if (o.isMesh && !isFound) {
            o.material.transparent = veil;
            o.material.opacity = veil ? 0.22 : 1;
          }
        });
        g.position.y = g.userData.baseY + Math.sin(t * 1.8 + i * 1.3) * 0.4;
        g.rotation.y = t * 0.9 + i;
        const r = g.userData.ring;
        if (r) {
          r.visible = !veil;
          r.position.y = g.position.y - 1.6;
          r.rotation.z = t * 0.7;
          const pulse = isNext && !isFound ? 1 + Math.sin(t * 4) * 0.3 : 1 + Math.sin(t * 2.4 + i) * 0.12;
          r.scale.set(pulse, pulse, pulse);
          r.material.opacity = isNext && !isFound ? 0.75 : 0.45;
        }
      });

      // the ring of light at the foot of every wonder still unfound
      halos.forEach((h, i) => {
        const isFound = foundRef.current.includes(h.id);
        h.ring.visible = !isFound;
        if (isFound) return;
        const isNext = h.id === nxt;
        h.ring.rotation.z = t * 0.6 + i;
        h.ring.position.y = h.base + Math.sin(t * 1.5 + i) * 0.5;
        const pulse = isNext ? 1 + Math.sin(t * 4) * 0.07 : 1;
        h.ring.scale.set(pulse, pulse, pulse);
        h.ring.material.opacity = isNext ? 0.8 : 0.3;
      });

      aravah.rotation.z = Math.sin(t * 0.9) * 0.012;   // the willows, moving a little

      streams.forEach((s, i) => { s.material.opacity = 0.6 + Math.sin(t * 2 + i) * 0.11; });
      sparks.material.opacity = 0.5 + Math.sin(t * 3) * 0.3;
      laverWater.position.y = IC_H + 5.5 + Math.sin(t * 2.2) * 0.06;

      fox.position.y = LAND_Y + Math.abs(Math.sin(t * 2.6)) * 0.25;
      fox.userData.tail.rotation.x = Math.sin(t * 3) * 0.28;
      fox.rotation.y = -0.7 + Math.sin(t * 0.4) * 0.35;

      // A sounding string is a blur, not a line. Swell the radius and shiver it
      // out of the plane of the frame, then let both fall away on the same
      // curve the note is decaying on.
      for (let si = 0; si < harpStrings.length; si++) {
        const sd = harpStrings[si].userData;
        if (sd.amp > 0.004) {
          sd.amp *= Math.exp(-dt * 2.4);
          const w = 1 + sd.amp * 8;
          harpStrings[si].scale.set(w, 1, w);
          harpStrings[si].position.z = Math.sin(t * 42 + sd.ph) * sd.amp * 0.42;
        } else if (sd.amp !== 0) {
          sd.amp = 0;
          harpStrings[si].scale.set(1, 1, 1);
          harpStrings[si].position.z = 0;
        }
      }
      // Berachot 3b: a kinor hung above David's bed, and when midnight came the
      // north wind blew through it and it played of itself. So does this one —
      // only in the dark, only for somebody standing near enough to hear it,
      // and never twice inside half a minute.
      if (amb.on && e2 > 0.86 && t > harpNext && camera.position.distanceTo(harpAt) < 260) {
        harpNext = t + 24 + Math.random() * 22;
        playHarp(0.4);
      }

      flameTips.forEach((f, i) => {
        if (f.material.opacity > 0) {
          const fs = 1 + Math.sin(t * 10 + i * 2) * 0.22;
          f.scale.set(1.4 * fs, 2.2 * fs, 1);
        }
      });
      shetiya.material.emissiveIntensity = lerp(0.6, 1.05, e2) + Math.sin(t * 1.4) * 0.22;

      const nu = nicanor.userData;
      nu.open += (nu.target - nu.open) * 0.03;
      nicL.rotation.y = -nu.open * 1.75;
      nicR.rotation.y = nu.open * 1.75;

      if (ketoretState.active) {
        ketoretPuffs.forEach((p) => {
          const cyc = (t * 0.35 + p.userData.ph) % 1;
          p.position.set(ketoret.position.x, IC_H + 6.4 + cyc * 42, ketoret.position.z);
          p.material.opacity = 0.42 * Math.sin(cyc * Math.PI);
          const sc2 = 1.6 + cyc * 4;
          p.scale.set(sc2, sc2, 1);
        });
      }

      // ── figures ──
      figures.forEach((f) => {
        if (f.userData.kind === "kohen") {
          const path = f.userData.path;
          f.userData.t = (f.userData.t + f.userData.speed * dt) % 1;
          const total = path.length;
          const ft = f.userData.t * total;
          const i0 = Math.floor(ft) % total, i1 = (i0 + 1) % total;
          const frac = ft - Math.floor(ft);
          const x = lerp(path[i0][0], path[i1][0], frac);
          const z = lerp(path[i0][1], path[i1][1], frac);
          f.position.set(x, IC_H + Math.abs(Math.sin(t * 6 + f.userData.t * 40)) * 0.14, z);
          f.rotation.y = Math.atan2(-(path[i1][1] - path[i0][1]), path[i1][0] - path[i0][0]) + Math.PI / 2;
          const swing = Math.sin(t * 6 + f.userData.t * 40) * 0.3;
          if (f.userData.armL) f.userData.armL.rotation.x = swing - 0.25;
          if (f.userData.armR) f.userData.armR.rotation.x = -swing + 0.25;
        } else {
          // Levites sway in song
          f.rotation.z = Math.sin(t * 1.4 + f.userData.ph) * 0.06;
          f.position.y += 0; // fixed on step
          if (f.userData.armL) f.userData.armL.rotation.x = -0.9 + Math.sin(t * 2 + f.userData.ph) * 0.15;
          if (f.userData.armR) f.userData.armR.rotation.x = -0.9 + Math.cos(t * 2 + f.userData.ph) * 0.15;
        }
      });

      mixAmbience(t, dt, e2);

      doves.forEach((d) => {
        d.userData.a += d.userData.sp * 0.016;
        const { a, r, h, wing } = d.userData;
        d.position.set(-150 + Math.cos(a) * r, h + Math.sin(a * 3) * 7, Math.sin(a) * r);
        d.rotation.y = -a + Math.PI / 2;
        wing.rotation.x = Math.sin(t * 12 + r) * 0.6;
      });

      renderer.render(scene, camera);
    };
    // tiny JS value-noise for light flicker
    const rndTable = Array.from({ length: 256 }, () => Math.random());
    function vnoiseJS(x) {
      const i = Math.floor(x) & 255, f = x - Math.floor(x);
      const u = f * f * (3 - 2 * f);
      return rndTable[i] * (1 - u) + rndTable[(i + 1) & 255] * u;
    }
    const rcCache = {};
    function rndCache(k) { if (!(k in rcCache)) rcCache[k] = 0.6 + Math.random() * 0.7; return rcCache[k]; }

    applyCamera();
    animate();
    setLoaded(true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      el.remove();
      renderer.dispose();
      audioCtx?.close();
    };
  }, []);

  // wire imperative bridges after scene exists
  useEffect(() => {
    apiRef.current.openFact = (id) => {
      setFact(id);
      setFound((f) => (f.includes(id) ? f : [...f, id]));
    };
    apiRef.current.toast = showToast;
    apiRef.current.speak = (v) => setSpeech(v);
  }, [showToast]);
  useEffect(() => { apiRef.current.setNight?.(night); }, [night]);
  // Skip the mount call when sound is already on: building the bed here would
  // generate the noise buffer during first paint and open an AudioContext the
  // browser then refuses to start. The first gesture builds it instead.
  const soundInited = useRef(false);
  useEffect(() => {
    if (!soundInited.current) { soundInited.current = true; if (sound) return; }
    apiRef.current.setSound?.(sound);
  }, [sound]);
  useEffect(() => {
    // re-apply persisted finds visually once scene + storage both ready
    if (loaded && storageReady) apiRef.current.markFound?.(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, storageReady]);
  useEffect(() => { if (walkMode) apiRef.current.enterWalk?.(); }, [walkMode]);

  // A held button sets a flag the render loop reads, so pressing glides the
  // camera instead of stepping it. The window-level release is the safety net:
  // lift a finger outside the button and nothing keeps moving.
  const NAV_KEYS = ["l", "r", "u", "d", "in", "out"];
  useEffect(() => {
    const release = () => NAV_KEYS.forEach((k) => apiRef.current.nav?.(k, false));
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const hold = (k) => ({
    onPointerDown: (e) => { e.preventDefault(); apiRef.current.nav?.(k, true); },
    onPointerUp: () => apiRef.current.nav?.(k, false),
    onPointerLeave: () => apiRef.current.nav?.(k, false),
    onContextMenu: (e) => e.preventDefault(),
  });
  const navStyle = {
    width: 40, height: 40, display: "grid", placeItems: "center",
    fontFamily: "'Frank Ruhl Libre', serif", fontSize: 16, lineHeight: 1,
    background: "rgba(30,24,12,.82)", color: "#e9d9a8",
    border: "1px solid rgba(212,164,55,.42)", borderRadius: 12,
    cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)",
    userSelect: "none", touchAction: "none", padding: 0,
  };

  const allFound = found.length === DISCOVERIES.length;

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#0a1122", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Frank+Ruhl+Libre:wght@500;700;900&display=swap');
        @keyframes rise { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes glowPulse { 0%,100% { text-shadow:0 0 12px rgba(212,164,55,.4);} 50% { text-shadow:0 0 28px rgba(212,164,55,.95);} }
        @keyframes toastIn { from { opacity:0; transform:translate(-50%,10px);} to { opacity:1; transform:translate(-50%,0);} }
        .panel { animation: rise .45s cubic-bezier(.2,.8,.3,1) both; }
        .chip { transition: all .2s ease; }
        .chip:hover { transform: translateY(-1px); }
        .navbtn { transition: transform .12s ease, background .15s ease, border-color .15s ease; }
        .navbtn:hover { transform: translateY(-1px); background: rgba(58,46,20,.92); border-color: rgba(212,164,55,.75); }
        .navbtn:active { transform: translateY(1px) scale(.96); background: linear-gradient(135deg,#f3e6c0,#e0cd97); color: #4a3a18; }
        .navbtn:focus-visible { outline: 2px solid #ffd97a; outline-offset: 2px; }
        /* The hints list stops short of the screen bottom — and on a phone,
           short of the on-screen navigation pad it would otherwise hide under. */
        .hints-panel { max-height: max(150px, min(48vh, calc(100vh - 324px))); }
        @media (max-width: 720px) {
          .hints-panel { max-height: max(150px, min(48vh, calc(100vh - 570px))); }
        }
        /* A phone held sideways has no room below the chips: stand the list
           beside them instead, between the chip column and the navigation pad. */
        @media (max-height: 560px) {
          .hints-panel { top: 74px !important; bottom: 14px; right: 178px !important;
            width: min(285px, calc(100vw - 210px)) !important; max-height: none; }
        }
        @keyframes countPop { 0% { transform: scale(1); } 38% { transform: scale(1.32); color: #ffd97a; } 100% { transform: scale(1); } }
        @keyframes gleam { 0%,100% { box-shadow: 0 0 0 0 rgba(255,217,122,0); } 50% { box-shadow: 0 0 0 5px rgba(255,217,122,.18); } }
        @keyframes veilIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scrollOpen { from { opacity:0; transform: translateY(22px) scale(.965); } to { opacity:1; transform: translateY(0) scale(1); } }
        @keyframes lineIn { from { opacity:0; transform: translateX(-8px); } to { opacity:1; transform: translateX(0); } }
        .gleam { animation: gleam 2.6s ease-in-out infinite; }
        .pesichah-veil { animation: veilIn .9s ease both; }
        .pesichah { animation: scrollOpen .8s cubic-bezier(.2,.85,.3,1) both .12s; }
        .pesichah-line { animation: lineIn .55s ease both; }
        @media (prefers-reduced-motion: reduce) {
          .gleam, .pesichah-veil, .pesichah, .pesichah-line { animation: none !important; }
        }

        /* ─── The seal ─── an arched gate-tablet, not a disc: the same profile
           as the openings of Yechezkel's gatehouse, struck in gold or silver
           and standing on a threshold stone. */
        .seal { position:absolute; top:-32px; left:50%; transform:translateX(-50%);
          width:52px; height:62px; border-radius:26px 26px 6px 6px;
          display:flex; align-items:center; justify-content:center;
          font-size:19px; color:#5a4718; text-shadow:0 1px 0 rgba(255,255,255,.6);
          background:linear-gradient(158deg,#fff6d8 0%,#f2d68f 20%,#d9ac41 52%,#b3841f 76%,#eccb79 100%);
          box-shadow:0 10px 24px rgba(0,0,0,.38), 0 0 0 1px rgba(110,84,26,.45),
                     inset 0 1px 0 rgba(255,255,255,.9), inset 0 -3px 6px rgba(120,88,20,.35);
          z-index:2; }
        .seal::before { content:""; position:absolute; inset:4px; border-radius:22px 22px 3px 3px;
          border:1px solid rgba(96,70,16,.34); box-shadow:inset 0 1px 0 rgba(255,255,255,.45); }
        .seal::after { content:""; position:absolute; left:50%; bottom:-7px; transform:translateX(-50%);
          width:76px; height:7px; border-radius:2px;
          background:linear-gradient(90deg,transparent,rgba(190,152,68,.9) 16%,rgba(255,238,190,.95) 50%,rgba(190,152,68,.9) 84%,transparent);
          box-shadow:0 2px 7px rgba(0,0,0,.28); }
        .seal-silver { color:#465060;
          background:linear-gradient(158deg,#ffffff 0%,#eef1f5 20%,#c2c9d3 52%,#939cab 76%,#e2e7ee 100%);
          box-shadow:0 10px 24px rgba(0,0,0,.38), 0 0 0 1px rgba(90,100,115,.4),
                     inset 0 1px 0 rgba(255,255,255,.95), inset 0 -3px 6px rgba(80,92,108,.32); }
        .seal-silver::before { border-radius:22px 22px 3px 3px; border-color:rgba(80,92,108,.35); }
        .seal-silver::after { background:linear-gradient(90deg,transparent,rgba(150,160,174,.9) 16%,rgba(244,247,251,.95) 50%,rgba(150,160,174,.9) 84%,transparent); }

        /* ─── Keeping the top out from under the rail ─── the title, its
           subtitle, and the quest banner are all centered across the whole
           viewport, while the chip rail floats over the right 163px of it.
           Nothing reserved that column, so all three ran underneath it: at
           390px the subtitle put 145px of itself behind the נסתרות counter,
           and measured across widths the subtitle stayed buried until about
           1100px — this was never only a phone bug.

           Two tiers, because the phone has no room to stay centered:
           narrow reserves the rail on the right only and lets the three sit
           in the column that is left; wide reserves it on both sides, so the
           block still reads as centered and clears the rail either way.
           The banner keeps its shrink-to-fit pill on wide screens — capping
           max-width does the job there, where pinning left AND right would
           stretch the pill across the page. */
        @media (max-width: 720px) {
          .topbar { padding:0 168px 0 14px; }
          .quest-banner { left:14px !important; right:168px !important;
            transform:none !important; max-width:none !important; }
        }
        @media (min-width: 721px) {
          .topbar { padding:0 170px; }
          .quest-banner { max-width:calc(100vw - 340px) !important; }
        }

        /* ─── Framed cards ─── parchment grain, an inner rule, and reinforced
           corners, so a card reads as a plaque rather than a rounded box. */
        .card-frame { position:relative; }
        .card-frame::before { content:""; position:absolute; inset:0; border-radius:inherit;
          pointer-events:none; opacity:.5; mix-blend-mode:multiply;
          background:repeating-linear-gradient(112deg, rgba(140,110,50,.038) 0 2px, transparent 2px 9px); }
        .card-frame::after { content:""; position:absolute; inset:11px; border-radius:10px;
          pointer-events:none; border:1px solid rgba(140,110,50,.2);
          background-image:
            linear-gradient(rgba(150,118,52,.55),rgba(150,118,52,.55)), linear-gradient(rgba(150,118,52,.55),rgba(150,118,52,.55)),
            linear-gradient(rgba(150,118,52,.55),rgba(150,118,52,.55)), linear-gradient(rgba(150,118,52,.55),rgba(150,118,52,.55)),
            linear-gradient(rgba(150,118,52,.55),rgba(150,118,52,.55)), linear-gradient(rgba(150,118,52,.55),rgba(150,118,52,.55)),
            linear-gradient(rgba(150,118,52,.55),rgba(150,118,52,.55)), linear-gradient(rgba(150,118,52,.55),rgba(150,118,52,.55));
          background-size:18px 1.5px, 1.5px 18px, 18px 1.5px, 1.5px 18px, 18px 1.5px, 1.5px 18px, 18px 1.5px, 1.5px 18px;
          background-position:left top, left top, right top, right top, left bottom, left bottom, right bottom, right bottom;
          background-repeat:no-repeat; }

        /* the little arched tiles that carry the pesichah's three teachings */
        .glyph-tile { flex:0 0 28px; height:31px; border-radius:14px 14px 4px 4px;
          display:flex; align-items:center; justify-content:center; font-size:13.5px; color:#8a6d24;
          background:linear-gradient(160deg, rgba(255,246,217,.95), rgba(228,207,152,.8));
          border:1px solid rgba(140,110,50,.42);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.85), 0 1px 3px rgba(90,70,20,.18); }
      `}</style>

      <div ref={mountRef} style={{ position: "absolute", inset: 0, cursor: walkMode ? "crosshair" : "grab" }} />

      {noWebGL && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center", color: "#eaddb4", background: "radial-gradient(circle at 50% 40%, #16203c, #070c18)" }}>
          <div style={{ maxWidth: 480 }}>
            <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 40, color: "#ffd97a", marginBottom: 14 }}>מִקְדָּשׁ</div>
            <div style={{ fontSize: 18, fontStyle: "italic", lineHeight: 1.6 }}>
              This browser cannot open a WebGL context, so the House cannot be drawn.
              Try a current desktop or mobile browser with hardware acceleration enabled.
            </div>
          </div>
        </div>
      )}

      <div className="topbar" style={{ position: "absolute", top: 18, left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
        <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 900, color: night ? "#f2e4bd" : "#3b3220", letterSpacing: ".02em", textShadow: night ? "0 2px 24px rgba(0,0,0,.7)" : "0 2px 18px rgba(255,255,255,.85)" }}>
          בֵּית הַמִּקְדָּשׁ
        </div>
        <div style={{ fontSize: "clamp(11px, 1.5vw, 15px)", fontStyle: "italic", color: night ? "#c9bd98" : "#6b5c3d", letterSpacing: ".24em", textTransform: "uppercase", marginTop: 2, textShadow: night ? "0 1px 10px rgba(0,0,0,.6)" : "none" }}>
          The Vision of Yechezkel · In the Grandeur of White Stone and Gold
        </div>
      </div>

      {/* Quest banner */}
      {questMode && nextTarget >= 0 && (
        <div className="quest-banner" style={{ position: "absolute", top: 88, left: "50%", transform: "translateX(-50%)", pointerEvents: "none", background: "rgba(30,24,12,.78)", backdropFilter: "blur(6px)", border: "1px solid rgba(212,164,55,.4)", borderRadius: 999, padding: "8px 22px", color: "#eaddb4", fontSize: 14.5, fontStyle: "italic", maxWidth: "82vw", textAlign: "center", boxShadow: "0 4px 18px rgba(0,0,0,.3)" }}>
          <span style={{ fontFamily: "'Frank Ruhl Libre', serif", fontStyle: "normal", fontWeight: 700, marginRight: 8, color: "#ffd97a" }}>
            {found.length + 1} / {DISCOVERIES.length}
          </span>
          {DISCOVERIES[nextTarget].hint}
          <button
            onClick={() => {
              if (!apiRef.current.guideTo?.(nextTarget)) return;
              showToast(walkMode ? "Follow the pillar of light." : "There — where the light stands.");
            }}
            className={found.length === 0 ? "gleam" : undefined}
            style={{ pointerEvents: "auto", marginLeft: 12, fontFamily: "'Frank Ruhl Libre', serif", fontStyle: "normal", fontSize: 12, letterSpacing: ".08em", background: "rgba(212,164,55,.22)", color: "#ffd97a", border: "1px solid rgba(212,164,55,.55)", borderRadius: 999, padding: "4px 12px", cursor: "pointer" }}
            title="Mark it with a pillar of light"
          >
            ⌖ הראה לי · Show me
          </button>
        </div>
      )}

      <div style={{ position: "absolute", top: 18, right: 16, display: "flex", flexDirection: "column", gap: 9, alignItems: "flex-end", zIndex: 4 }}>
        <div style={{ background: "rgba(30,24,12,.85)", backdropFilter: "blur(6px)", borderRadius: 14, padding: "8px 15px", color: "#f0e6cd", border: "1px solid rgba(212,164,55,.5)", boxShadow: "0 6px 24px rgba(0,0,0,.3)", textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", opacity: 0.7, fontFamily: "'Frank Ruhl Libre', serif" }}>נסתרות</div>
          <div key={found.length} style={{ fontSize: 21, fontWeight: 700, fontFamily: "'Frank Ruhl Libre', serif", animation: "countPop .55s ease", ...(allFound ? { color: "#ffd24a", animation: "countPop .55s ease, glowPulse 2s infinite .55s" } : {}) }}>
            {found.length} / {DISCOVERIES.length}
          </div>
        </div>
        <button className="chip" onClick={() => setWalkMode((w) => !w)} style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: walkMode ? "linear-gradient(135deg,#f3e6c0,#e0cd97)" : "rgba(30,24,12,.85)", color: walkMode ? "#4a3a18" : "#e9d9a8", border: "1px solid rgba(212,164,55,.5)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          {walkMode ? "⬆ Overview" : "⇊ Walk the Courts"}
        </button>
        <button className="chip" onClick={() => setNight((n) => !n)} style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: night ? "linear-gradient(135deg,#f3e6c0,#e0cd97)" : "linear-gradient(135deg,#1a2440,#2c3a63)", color: night ? "#4a3a18" : "#e8ecf7", border: "1px solid rgba(212,164,55,.55)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          {night ? "☀ יום" : "☾ לילה"}
        </button>
        <button className="chip" onClick={() => setSound((s) => !s)} title={sound ? "Silence the courts" : "Let the courts sound"} style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: sound ? "linear-gradient(135deg,#f3e6c0,#e0cd97)" : "rgba(30,24,12,.85)", color: sound ? "#4a3a18" : "#e9d9a8", border: "1px solid rgba(212,164,55,.4)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          {sound ? "♪ קול" : "⃠ דממה"}
        </button>
        <button className="chip" onClick={() => setQuestMode((q) => !q)} style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: "rgba(30,24,12,.85)", color: "#e9d9a8", border: "1px solid rgba(212,164,55,.4)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          {questMode ? "מסע · Quest ✓" : "Free explore"}
        </button>
        <button className="chip" onClick={() => setHints((h) => !h)} style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: "rgba(30,24,12,.85)", color: "#e9d9a8", border: "1px solid rgba(212,164,55,.4)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          {hints ? "Hide hints" : "רמזים"}
        </button>
      </div>

      {/* On-screen navigation, for anyone who would rather not drag or scroll */}
      <div style={{ position: "absolute", left: 16, bottom: 58, display: "grid", gridTemplateColumns: "repeat(3, 40px)", gap: 6, zIndex: 5 }}>
        <div />
        <button className="navbtn" style={navStyle} {...hold("u")} title={walkMode ? "Walk forward" : "Tilt up"} aria-label={walkMode ? "Walk forward" : "Tilt up"}>▲</button>
        <div />
        <button className="navbtn" style={navStyle} {...hold("l")} title={walkMode ? "Turn left" : "Swing left"} aria-label={walkMode ? "Turn left" : "Swing left"}>◀</button>
        {walkMode ? <div /> : (
          <button className="navbtn" style={navStyle} onClick={() => apiRef.current.resetView?.()} title="Back to the opening view" aria-label="Back to the opening view">⌂</button>
        )}
        <button className="navbtn" style={navStyle} {...hold("r")} title={walkMode ? "Turn right" : "Swing right"} aria-label={walkMode ? "Turn right" : "Swing right"}>▶</button>
        <div />
        <button className="navbtn" style={navStyle} {...hold("d")} title={walkMode ? "Walk back" : "Tilt down"} aria-label={walkMode ? "Walk back" : "Tilt down"}>▼</button>
        <div />
        {!walkMode && (
          <>
            <button className="navbtn" style={navStyle} {...hold("out")} title="Zoom out" aria-label="Zoom out">−</button>
            <div />
            <button className="navbtn" style={navStyle} {...hold("in")} title="Zoom in" aria-label="Zoom in">+</button>
          </>
        )}
      </div>

      {hints && (
        <div className="panel hints-panel" style={{ position: "absolute", top: 296, right: 16, width: "min(285px, calc(100vw - 32px))", boxSizing: "border-box", overflowY: "auto", WebkitOverflowScrolling: "touch", background: "rgba(28,22,10,.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(212,164,55,.4)", borderRadius: 16, padding: "16px 18px", color: "#e8dcba", boxShadow: "0 12px 40px rgba(0,0,0,.4)", zIndex: 3 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
            <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 700, fontSize: 15 }}>שלושים ושש נסתרות</div>
            <button
              onClick={() => setHints(false)}
              title="Close the hints"
              aria-label="Close the hints"
              style={{ flex: "0 0 auto", width: 30, height: 30, marginTop: -3, marginRight: -6, lineHeight: 1, fontSize: 16, background: "rgba(212,164,55,.14)", color: "#e9d9a8", border: "1px solid rgba(212,164,55,.4)", borderRadius: 999, cursor: "pointer", touchAction: "manipulation" }}
            >×</button>
          </div>
          <div style={{ fontSize: 12.5, fontStyle: "italic", opacity: 0.75, marginBottom: 10 }}>Eighteen silver rimonim, eighteen living wonders — chai, twice over{questMode ? ", revealed in order" : ""}.</div>
          {DISCOVERIES.map((d, i) => {
            const done = found.includes(i);
            const lockedAhead = questMode && !done && i !== nextTarget;
            return (
              <div key={i} style={{ fontSize: 14, fontStyle: "italic", padding: "5px 0", opacity: done ? 0.42 : lockedAhead ? 0.35 : 1, textDecoration: done ? "line-through" : "none", borderBottom: i < DISCOVERIES.length - 1 ? "1px solid rgba(212,164,55,.14)" : "none" }}>
                {done ? "✓ " : `${i + 1}. `}{lockedAhead ? "· · · still veiled · · ·" : d.hint}
                {!lockedAhead && !done && (
                  <button
                    onClick={() => apiRef.current.guideTo?.(i)}
                    title="Mark it with a pillar of light"
                    style={{ marginLeft: 8, fontStyle: "normal", fontSize: 11.5, background: "rgba(212,164,55,.18)", color: "#ffd97a", border: "1px solid rgba(212,164,55,.45)", borderRadius: 999, padding: "2px 9px", cursor: "pointer" }}
                  >⌖ show me</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center", pointerEvents: "none", color: night ? "#bfb391" : "#5b4e33", fontSize: 13.5, fontStyle: "italic", textShadow: night ? "0 1px 8px rgba(0,0,0,.7)" : "0 1px 10px rgba(255,255,255,.8)" }}>
        {walkMode
          ? "WASD / arrows to walk · Shift to run · drag to look (mobile: left thumb walks, right thumb looks) · click wonders to collect"
          : "Drag to orbit · scroll to zoom · click a kohen and he will answer · thirty-six wonders hide in the white stone"}
      </div>

      {toast && (
        <div style={{ position: "absolute", bottom: 76, left: "50%", transform: "translateX(-50%)", animation: "toastIn .3s ease both", background: "rgba(30,24,12,.92)", border: "1px solid rgba(212,164,55,.5)", borderRadius: 12, padding: "10px 20px", color: "#f0e2b6", fontSize: 14.5, fontStyle: "italic", maxWidth: "84vw", textAlign: "center", boxShadow: "0 8px 26px rgba(0,0,0,.4)", zIndex: 6 }}>
          {toast}
        </div>
      )}

      {allFound && fact === null && (
        <div className="panel" style={{ position: "absolute", bottom: 56, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, rgba(45,35,14,.95), rgba(76,58,20,.95))", border: "1px solid #d4a437", borderRadius: 16, padding: "18px 28px", color: "#ffe9ad", textAlign: "center", maxWidth: 500, boxShadow: "0 12px 44px rgba(0,0,0,.45)" }}>
          <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 21, fontWeight: 700 }}>כל הכבוד — all thirty-six found. חי, twice over.</div>
          <div style={{ fontSize: 15.5, marginTop: 6, fontStyle: "italic", lineHeight: 1.5 }}>
            “Out of Zion, the perfection of beauty, G-d shone forth” (Tehillim 50:2) · “Greater shall be the glory of this latter House than the former, and in this place I will grant peace” (Chaggai 2:9)
          </div>
        </div>
      )}

      {fact !== null && (
        <div className="panel" onClick={closeFact} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(14,11,5,.5)", backdropFilter: "blur(4px)", cursor: "pointer", zIndex: 5 }}>
          <div className="card-frame" onClick={(e) => e.stopPropagation()} style={{ cursor: "default", maxWidth: 550, margin: 20, background: "linear-gradient(160deg, #fbf6e8, #efe3c4)", borderRadius: 20, border: "1px solid rgba(140,110,50,.5)", boxShadow: "0 28px 80px rgba(0,0,0,.5)", padding: "30px 34px", position: "relative" }}>
            <div className={DISCOVERIES[fact].kind === "rimon" ? "seal seal-silver" : "seal"}>
              {DISCOVERIES[fact].kind === "rimon" ? "◉" : "✦"}
            </div>
            <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 21.5, fontWeight: 700, color: "#4a3a18", marginTop: 20, marginBottom: 9, lineHeight: 1.3, textAlign: "center" }}>
              {DISCOVERIES[fact].title}
            </div>
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(140,110,50,.5), transparent)", margin: "0 auto 13px", maxWidth: 300 }} />
            <div style={{ fontSize: 17.5, lineHeight: 1.66, color: "#544729" }}>{DISCOVERIES[fact].text}</div>
            <button onClick={closeFact} style={{ marginTop: 20, fontFamily: "'Frank Ruhl Libre', serif", fontSize: 13.5, letterSpacing: ".13em", textTransform: "uppercase", background: "#4a3a18", color: "#f5e9c8", border: "none", borderRadius: 999, padding: "11px 28px", cursor: "pointer" }}>
              Continue the journey
            </button>
          </div>
        </div>
      )}

      {/* A kohen or a Levite, answering */}
      {speech && (
        <div className="panel card-frame" style={{ position: "absolute", left: "50%", bottom: 96, transform: "translateX(-50%)", width: "min(560px, 88vw)", background: "linear-gradient(160deg, rgba(251,246,232,.97), rgba(238,226,196,.97))", border: "1px solid rgba(140,110,50,.5)", borderRadius: 18, boxShadow: "0 22px 60px rgba(0,0,0,.45)", padding: "18px 22px 16px", zIndex: 6, animation: "rise .28s ease" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 7 }}>
            <span style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 18, fontWeight: 700, color: "#4a3a18" }}>{speech.name}</span>
            <span style={{ fontSize: 13, fontStyle: "italic", color: "#7a6634" }}>{speech.role}</span>
            <button onClick={() => setSpeech(null)} aria-label="Close" style={{ marginLeft: "auto", background: "none", border: "none", color: "#7a6634", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
          <div style={{ fontSize: 16.5, lineHeight: 1.62, color: "#544729" }}>“{speech.text}”</div>
          <div style={{ marginTop: 9, fontSize: 12, letterSpacing: ".05em", color: "#8a7440" }}>{speech.src}</div>
        </div>
      )}

      {/* ─── פתיחה · the opening ─── The first step is the hardest, so it is
           given, not hidden: what the rings mean, and where the first one waits. */}
      {loaded && !noWebGL && storageReady && !opened && (
        <div className="pesichah-veil" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at 50% 45%, rgba(20,15,6,.42), rgba(8,6,2,.78))", backdropFilter: "blur(3px)", zIndex: 7, padding: "36px 18px 22px" }}>
          <div className="pesichah" style={{ width: "min(560px, 92vw)", maxHeight: "88vh", overflowY: "auto", background: "linear-gradient(160deg, #fbf6e8, #efe3c4)", borderRadius: 22, border: "1px solid rgba(140,110,50,.5)", boxShadow: "0 30px 90px rgba(0,0,0,.55), 0 0 90px rgba(212,164,55,.22)", padding: "clamp(24px, 5vw, 34px) clamp(20px, 5vw, 34px) clamp(20px, 4vw, 26px)", textAlign: "center", position: "relative" }}>

            <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: "clamp(23px, 6vw, 31px)", fontWeight: 900, color: "#4a3a18", lineHeight: 1.25 }}>
              בֹּאוּ שְׁעָרָיו בְּתוֹדָה
            </div>
            <div style={{ fontSize: "clamp(13.5px, 3.5vw, 15px)", fontStyle: "italic", color: "#7a6634", marginTop: 5 }}>
              “Enter His gates with thanksgiving” · Tehillim 100:4
            </div>

            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(140,110,50,.55), transparent)", margin: "clamp(13px, 3vw, 18px) 0 6px" }} />
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(140,110,50,.28), transparent)", marginBottom: "clamp(14px, 3vw, 18px)" }} />

            <div style={{ fontSize: "clamp(15px, 4vw, 17px)", lineHeight: 1.55, color: "#544729", fontStyle: "italic" }}>
              Thirty-six things are hidden in this House — eighteen <span style={{ fontStyle: "normal" }}>רימונים</span> of
              silver and eighteen wonders of gold, each one a teaching from Tanach, Talmud, or the
              spade of the archaeologist. Eighteen is <span style={{ fontStyle: "normal" }}>חי</span>, life;
              thirty-six is life twice, and the number of the hidden righteous.
            </div>

            <div style={{ textAlign: "left", margin: "clamp(15px, 3.5vw, 20px) auto 4px", maxWidth: 430, display: "flex", flexDirection: "column", gap: "clamp(10px, 2.5vw, 13px)" }}>
              {[
                ["◉", <>Every hidden thing floats inside a <b style={{ fontWeight: 600 }}>slowly turning ring of gold light</b>. When you see one — click what is inside it.</>],
                ["✥", <>Drag to turn the House, scroll to draw near, and <b style={{ fontWeight: 600 }}>⇊ Walk the Courts</b> to stand inside them.</>],
                ["⌖", <>The banner above always whispers where the next one waits. If it stays hidden, press <b style={{ fontWeight: 600 }}>הראה לי · Show me</b> — a pillar of light will rise over it.</>],
              ].map(([glyph, text], i) => (
                <div key={i} className="pesichah-line" style={{ display: "flex", gap: 12, alignItems: "flex-start", animationDelay: `${0.45 + i * 0.13}s` }}>
                  <span className="glyph-tile">{glyph}</span>
                  <span style={{ fontSize: "clamp(14px, 3.8vw, 15.5px)", lineHeight: 1.5, color: "#544729" }}>{text}</span>
                </div>
              ))}
            </div>

            <div className="pesichah-line" style={{ animationDelay: ".9s", marginTop: "clamp(14px, 3.5vw, 20px)", padding: "11px 15px", borderRadius: 13, background: "rgba(212,164,55,.13)", border: "1px solid rgba(140,110,50,.28)", fontSize: "clamp(14px, 3.8vw, 15.5px)", lineHeight: 1.5, color: "#544729", fontStyle: "italic" }}>
              The first waits <b style={{ fontStyle: "normal", fontWeight: 600 }}>inside the eastern gatehouse</b> — the
              sealed gate that faces the sunrise, on the near side of the court.
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", alignItems: "center", marginTop: "clamp(16px, 4vw, 22px)" }}>
              <button
                onClick={() => {
                  setOpened(true);
                  if (apiRef.current.guideTo?.(0)) showToast("There — where the light stands, inside the eastern gate.");
                }}
                style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 14, letterSpacing: ".1em", background: "linear-gradient(135deg,#4a3a18,#6b5322)", color: "#f9edc9", border: "1px solid rgba(212,164,55,.5)", borderRadius: 999, padding: "12px 26px", cursor: "pointer", boxShadow: "0 8px 22px rgba(0,0,0,.28)" }}
              >
                ⌖ הראה לי · Show me the first
              </button>
              <button
                onClick={() => setOpened(true)}
                style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 13.5, letterSpacing: ".06em", background: "none", color: "#7a6634", border: "1px solid rgba(140,110,50,.35)", borderRadius: 999, padding: "12px 22px", cursor: "pointer" }}
              >
                אֵלֵךְ לְבַדִּי · I'll look on my own
              </button>
            </div>

            <div style={{ marginTop: "clamp(12px, 3vw, 16px)", fontSize: "clamp(11.5px, 3vw, 12.5px)", fontStyle: "italic", color: "#8a7440" }}>
              “Whoever occupies himself with the design of the House — it is reckoned to him as though he built it.” · Midrash Tanchuma, Tzav 14
            </div>
          </div>
        </div>
      )}

      {!loaded && !noWebGL && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#c9bd98", fontStyle: "italic", fontSize: 18 }}>
          Raising the white stone mountain…
        </div>
      )}
    </div>
  );
}
