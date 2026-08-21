import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { track } from "./analytics.js";

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
  { kind: "rimon", emoji: "🚪", title: "שער הקדים — The Sealed Eastern Gate", text: "“This gate shall remain shut; it shall not be opened… because Hashem, the G-d of Israel, has entered through it” (Yechezkel 44:2). Tradition binds this to Sha'ar HaRachamim — the Gate of Mercy sealed in Jerusalem's eastern wall, waiting.", hint: "Where mercy waits behind stone, inside the eastern gatehouse." },
  { kind: "rimon", emoji: "🌊", title: "מים חיים — The Living Waters", text: "Yechezkel 47: a trickle from beneath the threshold becomes ankle-deep, knee-deep, then a river no one can cross — sweetening even the Dead Sea. Chazal read it as Torah itself: water that heals wherever it flows, fruit for food and leaves for healing (47:12).", hint: "Follow what begins as a trickle, east across the court." },
  { kind: "rimon", emoji: "⛰️", title: "הראל — The Altar Called ‘Mountain of G-d’", text: "Yechezkel 43:15 names the hearth 'Har'el' — Mountain of G-d. Uniquely, this altar is climbed by steps facing east (43:17), and must be inaugurated for seven days before the first regular offering rises.", hint: "At the foot of the mountain that burns." },
  { kind: "rimon", emoji: "📏", title: "קנה המדה — The Measuring Reed", text: "The vision arrives as a blueprint: a man 'whose appearance was like bronze' measures every wall with a reed of six long cubits (40:5). The Vilna Gaon wrote treatises reconstructing the plan — and the Midrash promises: one who studies the Temple's design, it is as if he built it.", hint: "Among the northern columns, something measures you back." },
  { kind: "rimon", emoji: "🧱", title: "שכינה במערב — No Western Gate", text: "Gates open east, north, and south — never west. 'The Shechinah is in the west' (Bava Batra 25a): the wall behind the Holy of Holies stays unbroken. Nothing passes behind the Presence.", hint: "Along the one wall where no gate dares open." },
  { kind: "rimon", emoji: "🔥", title: "אש מן השמים — Built by Fire or by Hands?", text: "Rambam (Hilchot Melachim 11) rules that Mashiach builds the final Temple. Rashi and Midrash Tanchuma teach it descends whole, built of fire, from Heaven. The chassidic masters reconcile them: we build from below, and Heaven completes what our hands begin.", hint: "The highest gold guards the smallest silver." },
  { kind: "rimon", emoji: "🌍", title: "בית תפילה לכל העמים — A House for All Nations", text: "These courts span 500×500 amot — far beyond the largest sacred precinct the ancient world ever raised. Yeshayahu 56:7: 'My House shall be called a house of prayer for all nations.' The enlarged floor plan is that promise drawn in stone.", hint: "A kitchen court in the far southwest keeps a secret." },
  { kind: "rimon", emoji: "💠", title: "גלי הים — Marble Like the Waves of the Sea", text: "Bava Batra 4a: the Temple was built of stones of blue-green and white marble. Its builder wished to plate it all in gold — the Sages told him: leave it, it is more beautiful as it is, for it looks like the waves of the sea. And Sukkah 51b: 'One who has not seen it has never seen a magnificent building.'", hint: "Within the royal porch of a hundred columns." },
  { kind: "wonder", emoji: "🦊", title: "השועל של רבי עקיבא — Rabbi Akiva's Fox", text: "Makkot 24b: the sages saw a fox slip out of the ruined Holy of Holies and wept — but Rabbi Akiva laughed. 'Just as Uriah's prophecy of ruin came true, so will Zechariah's: elders will yet sit in the streets of Jerusalem.' They answered: 'Akiva, you have comforted us.' Here the fox walks outside the walls — the ruin behind him, the promise standing before him.", hint: "Something small and russet waits below the southern stairs." },
  { kind: "wonder", emoji: "🎻", title: "כינור של לויים — The Harp of the Levites", text: "On the fifteen steps between the courts the Levites stood with harps, lyres and cymbals — one step for each Shir HaMa'alot. David's kinor, say Chazal, hung above his bed and played by itself when the north wind moved through it at midnight (Berachot 3b). Touch it and it remembers its song.", hint: "An instrument rests where the singers stand — it still remembers." },
  { kind: "wonder", emoji: "📯", title: "שופר גדול — The Great Shofar", text: "“And it shall be on that day: a great shofar will be sounded, and the lost shall come from Assyria and the outcasts from Egypt, and they will bow to Hashem on the holy mountain in Jerusalem” (Yeshayahu 27:13). This is the shofar of ingathering — the sound before the silence of the Kodesh.", hint: "A ram's horn waits on marble near the southern gate. Dare to sound it." },
  { kind: "wonder", emoji: "🪨", title: "אבן השתייה — The Foundation Stone", text: "Yoma 54b: 'The world was woven outward from the Even HaShetiya' — the stone beneath the Holy of Holies, from which creation was drawn like thread from a spindle. On Yom Kippur the Kohen Gadol placed the incense upon it. Its glow seeps from beneath the western ground: the world's first light, still warm.", hint: "The world began behind the House. Seek warmth in the western ground." },
  { kind: "wonder", emoji: "🕎", title: "מנורת זהב — Light the Menorah", text: "Shabbat 22b asks: does He need our light? The Ner Ma'aravi that burned beyond its oil was 'testimony to all who enter the world that the Shechinah dwells in Israel.' You have kindled seven flames. The Sfat Emes teaches: every soul is a wick — the fire descends when the vessel is prepared.", hint: "Seven branches of gold stand cold. They wait for you." },
  { kind: "wonder", emoji: "💨", title: "קטורת — The Eleven Spices", text: "Keritot 6a counts eleven spices in the ketoret — including chelbenah, foul-smelling alone, deliberately included: a fast that excludes the sinners of Israel is no fast at all. And the house of Avtinas guarded one secret: ma'aleh ashan, the herb that made the smoke rise in a single straight column, unbent by any wind.", hint: "A small golden table before the House holds eleven fragrances. Wake them." },
  { kind: "wonder", emoji: "⚓", title: "שערי ניקנור — The Doors That Crossed the Sea", text: "Yoma 38a: Nicanor brought two bronze doors from Alexandria. A storm rose; the sailors threw one into the sea — and it surfaced beneath the ship at Akko (some say the sea simply refused to keep it). All the Temple's gates were later plated gold, except Nicanor's: the miracle-bronze gleamed like gold on its own. You have just opened them.", hint: "Bronze that crossed the sea guards the top of the fifteen steps." },
  { kind: "wonder", emoji: "🎺", title: "לבית התקיעה — The Trumpeting Stone", text: "In 1968, archaeologists at the Temple Mount's southwest corner found a fallen parapet stone carved: 'לבית התקיעה להב…' — 'To the place of trumpeting, to procl[aim]…' From that height a kohen sounded the trumpet each Friday at dusk: fields emptied, shops shuttered, and Shabbat descended on Jerusalem. The stone is real — it waits in the Israel Museum, and here, restored to its corner.", hint: "At the southwest height, a stone announces Shabbat." },
  // ── The deeper eighteen. Ids 0–15 are the opening circuit and never move —
  // progress is stored by index, so anything new is appended, never inserted.
  { kind: "rimon", emoji: "✨", title: "עשרה נסים — Ten Miracles in the House", text: "Avot 5:5 counts them: no woman ever miscarried from the scent of the sacred meat, and the meat never spoiled; no fly was seen in the slaughterhouse; the Kohen Gadol never became impure on Yom Kippur; rain never put out the fire of the woodpile; no wind ever bent the column of smoke; no disqualification was ever found in the omer, the two loaves, or the showbread; the people stood pressed together and bowed with room to spare; no snake or scorpion ever injured anyone in Jerusalem; and no one ever said to his fellow, “the place is too narrow for me to stay the night in Jerusalem.”", hint: "Ten of them — and one waits high above the golden ridge of the Royal Stoa." },
  { kind: "rimon", emoji: "🗳️", title: "שלושה עשר שופרות — The Thirteen Chests", text: "Shekalim 6:5: thirteen chests stood in the Mikdash, each with a mouth narrow above and wide below — shaped like a shofar, so that no hand could reach back in and take out what had been given. Each was labeled for its purpose: the shekalim, the bird-offerings, the incense, the gold of the kapporet, freewill gifts. And the men who emptied them wore garments with no hem, no cuff and no fold, so that no one could ever suspect them (Shekalim 3:2).", hint: "Among the northern columns, thirteen mouths that opened only downward." },
  { kind: "rimon", emoji: "🤫", title: "לשכת חשאים — The Chamber of the Discreet", text: "Shekalim 5:6: in it the discreet would place their gifts in secret, and the poor of good family would take from it in secret. The Rambam ranks this second only to a loan that prevents poverty: the giver does not know who receives, and the receiver does not know who gave (Hilchot Matnot Aniyim 10:8). A whole room built so that no one would ever have to say thank you.", hint: "In the far northeastern kitchen court, a gift that no one signed." },
  { kind: "rimon", emoji: "🔎", title: "אבן הטוען — The Claimant's Stone", text: "Bava Metzia 28b: there was a stone in Jerusalem — whoever had lost something went there, and whoever had found something went there. The finder stood and announced, the loser stood and gave the identifying signs, and took back what was his. An entire city's honesty, organized around one rock in the open air.", hint: "On the eastern pavement, a plain stone that gives back what was lost." },
  { kind: "rimon", emoji: "⚖️", title: "לשכת הגזית — The Chamber of Hewn Stone", text: "Middot 5:4: the Great Sanhedrin sat in the Chamber of Hewn Stone — seventy-one elders in a half-circle, so that each one could see the faces of all the others. From here Torah went out to all Israel (Sanhedrin 88b). And when murderers grew many, the Sanhedrin rose and left the chamber, so that capital cases could no longer be tried (Avodah Zarah 8b): they would rather leave the room than kill in it.", hint: "Along the southern edge of the inner court, where seventy-one sat in a half circle." },
  { kind: "rimon", emoji: "📐", title: "הכבש — A Ramp, and Not Steps", text: "“Do not ascend My altar by steps, so that your nakedness not be uncovered upon it” (Shemot 20:23) — so the altar is climbed by a ramp of thirty-two amot (Middot 3:3). Rashi asks what nakedness a robed kohen could uncover, and answers: the stones have no feelings, and still the Torah asks that they not be treated dismissively. How much more so a human being, who is in the image of his Maker.", hint: "At the foot of the long incline that climbs the burning mountain." },
  { kind: "rimon", emoji: "🍷", title: "השיתין — The Drains Beneath the Altar", text: "Sukkah 49a: the shitin — the shafts beneath the altar's southwestern corner into which the libations poured — were created during the six days of Creation, and they descend to the deep. Nearby, a kohen once noticed one paving stone that sat differently from its fellows; before he could finish telling his friend, his soul left him, and they knew for certain that the Ark had been hidden underneath (Yoma 54a; Shekalim 6:2).", hint: "At the altar's southwestern corner, where the wine goes down and does not come back." },
  { kind: "rimon", emoji: "🏺", title: "שער המים — The Water Gate", text: "Middot 2:6 names the gates of the azarah, and through this one they carried up the golden flask drawn from the Shiloach for the water libation of Sukkot (Sukkah 48b). Its name, says the Talmud, is also a promise: from beneath this threshold the future water will come out (Yechezkel 47:1). What was carried in each dawn will one day flow out on its own.", hint: "South of the inner court, where the flask was carried up each dawn of Sukkot." },
  { kind: "rimon", emoji: "🏔️", title: "הר המוריה — Mount Moriah", text: "“And Shlomo began to build the House of Hashem in Jerusalem on Mount Moriah, where He appeared to David his father” (Divrei HaYamim II 3:1). Here Avraham bound Yitzchak and named the place “Hashem will see”; here Yaakov slept and saw the ladder; here, say Chazal, the dust of Adam was taken from the very ground of his atonement (Bereishit Rabbah 14:8). The mountain was chosen long before the first stone was cut.", hint: "From the eastern stairs, turn and look back at the mountain itself." },
  { kind: "rimon", emoji: "👣", title: "שלוש רגלים — Three Times a Year", text: "“Three times a year all your males shall appear before Hashem your G-d in the place He will choose” (Devarim 16:16). The roads and the mikvaot were repaired in Adar for the pilgrims (Shekalim 1:1); Jerusalem's houses were never rented out, because the city belonged to everyone who came; and for the days of the festival all of Israel counted as chaverim, trusted as pure (Chagigah 26a). A city that grew to fit whoever arrived.", hint: "On the broad southern stairs, worn smooth by the feet of three festivals." },
  { kind: "wonder", emoji: "⚙️", title: "מוכני בן קטין — The Wheel of the Laver", text: "Yoma 37a: Ben Katin made a wheel for the kiyor, so that it could be lowered into its well overnight — water left standing until morning would have been disqualified, and the kohanim would have had nothing to sanctify their hands with at dawn. He also made it twelve spouts, one for each kohen of the daily offering (Middot 3:6). A man is remembered forever in the Mishnah for a piece of hardware that let the work begin on time.", hint: "Beside the bronze laver, an axle and a wheel still remember one man's name." },
  { kind: "wonder", emoji: "🍇", title: "גפן של זהב — The Golden Vine", text: "Middot 3:8: a vine of gold stood over the entrance of the Heichal, trained upon posts. Whoever donated a leaf, a berry or a whole cluster brought it and hung it there, and the kohanim hammered it onto the vine. Josephus (War 5.210) says the clusters hung the height of a man. It grew the way nothing else grows — only by being given away.", hint: "Above the cedar doors of the House, something is growing that no rain ever fed." },
  { kind: "wonder", emoji: "🌿", title: "ערבה — The Willows of the Altar", text: "Sukkah 45a: they brought willow branches eleven amot tall from Motza in the valley below, and stood them upright against the sides of the altar with their tops bent over it, and circled the altar once on each day of Sukkot and seven times on the seventh. The willow has no taste and no fragrance — no Torah and no good deeds, says the Midrash — and it is the one branch that leans directly on the altar.", hint: "Tall branches lean against the altar: the plant with neither taste nor scent." },
  { kind: "wonder", emoji: "🎶", title: "חליל — The Flute of the Water-Drawing", text: "Sukkah 51a: whoever has not seen the rejoicing of Beit HaSho'evah has never seen rejoicing in his life. The flute was played for five and six days together; golden lamps with four bowls each lit the courtyards of Jerusalem until there was no courtyard without light; pious men danced with burning torches, juggling them; and the Levites stood on the fifteen steps with harps, lyres, cymbals and every instrument of song. They did not sleep for the whole festival.", hint: "By the fifteen steps a flute is waiting for a night nobody sleeps through." },
  { kind: "wonder", emoji: "🍃", title: "עלהו לתרופה — Leaves for Healing", text: "Yechezkel 47:12: on both banks of the river every tree of food will grow; its leaf will not wither and its fruit will not fail; each month it bears new fruit, because its waters come out from the Mikdash — its fruit for food, and its leaf for healing. Chazal read לתרופה as two words: to unlock what is shut, and to loosen the tongue of the mute (Sanhedrin 100a).", hint: "At the river's edge, one tree whose leaf was never meant for eating." },
  { kind: "wonder", emoji: "🍞", title: "שולחן לחם הפנים — The Table Lifted Up", text: "Menachot 29a and Chagigah 26b: on each of the three festivals the kohanim lifted the golden Shulchan and showed the pilgrims the showbread upon it, saying — see how beloved you are before Hashem: it is taken up as warm as it was on the day it was set down. Twelve loaves, two stacks of six, and in all those years no week's bread ever went stale.", hint: "Before the House stands a golden table, raised so the crowd could see the bread." },
  { kind: "wonder", emoji: "🎲", title: "הקלפי — The Lottery", text: "Yoma 22a: at first, whoever wished simply ran up the ramp, and the swifter of the two won the service. Once two ran together, and one pushed the other, and he fell and broke his leg. When the court saw the danger, they instituted the lottery: the officer named a number, and they counted around the circle by raised fingers (Tamid 1:2). Even the eagerness to serve needed a fence around it.", hint: "In the court a wooden box holds the fairest way ever found to hand out honour." },
  { kind: "wonder", emoji: "🪵", title: "קרבן עצים — The Offering of Wood", text: "Ta'anit 26a lists the nine days on which named families brought wood for the altar. Ta'anit 28a tells why they were honoured: an enemy government once posted watchmen on the roads so that no one could bring wood up to Jerusalem, and men hollowed logs into ladder-rungs and carried them past the guards, saying they were going to fetch chicks from a dovecote. The last of those days, the fifteenth of Av, is called one of the two happiest days Israel ever had (Ta'anit 30b).", hint: "Split fig-logs are stacked in the court, and every stack was carried by a family." },
  { kind: "wonder", emoji: "🐄", title: "פרה אדומה — The Red Heifer and the Causeway", text: "Bamidbar 19: the ashes of a heifer entirely red, that never bore a yoke, purify whoever touched the dead — and make impure the pure kohen who prepares them. Shlomo said: I thought I could become wise in it, but it is far from me (Yoma 14a). Parah 3:6: it was burned on Har HaMishcha, and a causeway was built from the Temple Mount across to it, arches upon arches, an arch above each pier, for fear of a grave hidden in the ground below.", hint: "East, beyond the sealed gate, a raised causeway crosses to something russet and red." },
  { kind: "wonder", emoji: "📝", title: "הכותל המערבי — The Wall That Remained", text: "Shemot Rabbah 2:2: the Shechinah has never departed from the Western Wall. Shir HaShirim Rabbah 2:9 reads “behold, He stands behind our wall” — behind the western wall of the Mikdash — because Hashem swore to it that it would never be destroyed. Herod's great courses are still standing at the western retaining wall, and the notes pressed into their joints are still being written today.", hint: "Outside the western retaining wall, great courses still stand — and people still write to them." },
];

// Eighteen who answer — twelve kohanim at the stations of the morning avodah
// and six Levites on the steps. Every line carries its source, like every
// dimension does.
// ═══════════ נְגִינוֹת — melodies ═══════════
//
// The fifteen steps are already an instrument: STEP_SCALE tunes them to D
// Ahava Rabbah (freygish) — D Eb F# G A Bb C — which is the mode most of
// Ashkenazi liturgical song lives in. So a melody played here can light the
// steps it is climbing, which is the whole point of putting music in a House
// whose Levites stood on those steps and played (Middot 2:5; Sukkah 51b).
//
// ─── On what is and is not here ───
// Everything below is public domain. Two melodies that would fit this House
// beautifully are deliberately absent, because they are protected works and
// this site is public: Naomi Shemer's "Yerushalayim shel Zahav" (1967; Shemer
// d. 2004) and Leonard Cohen's "Dance Me to the End of Love" (1984; Cohen
// d. 2016). Encoding a melody is reproducing the musical work even with no
// lyric and no recording. If a licence is ever obtained they drop straight
// into this array.
//
// ─── On accuracy ───
// `nigun` is composed for this House, so it is right by definition. The three
// borrowed tunes were first written down here by ear, and all three were
// wrong — outlines with the right shape and the wrong notes. All three have
// now been read note for note off an engraved score: Hatikvah and Ma'oz Tzur
// off the LilyPond in their Wikipedia articles, Shalom Aleichem off Goldfarb's
// sixteen bars, which did eventually turn up. Every one carries
// `verified: true`, and the by-ear warning in the panel is kept for whatever
// is added next rather than deleted.
//
// Tempi are the tunes' own, not a house style — the crotchet mark where the
// score carries one, the speed the thing is actually sung at where it does
// not. They were all set roughly a fifth too slow when first entered.
// Each melody is one line of data; fixing a note is editing a number.
const NOTE_HZ = (m) => 440 * Math.pow(2, (m - 69) / 12);
// Step index → MIDI, matching STEP_SCALE exactly. Used to light the tread a
// note is standing on.
const STEP_MIDI = [50, 51, 54, 55, 57, 58, 60, 62, 63, 66, 67, 69, 70, 72, 74];

const MELODIES = [
  {
    id: "nigun",
    heb: "נִגּוּן הַמַּעֲלוֹת",
    title: "A Nigun of Ascent",
    verified: true,
    // Tempo. Every one of these was set a fifth under the speed the tune is
    // actually sung at, and four songs in a row at a funeral pace is what
    // "the songs play too slow" meant. A nigun of ascent is danced, not
    // mourned: 108 is a walking-up pulse.
    bpm: 108,
    blurb: "Wordless, and composed for this House rather than borrowed. It is built only from the fifteen notes the steps are tuned to — D Ahava Rabbah, the mode of the ba'al tefillah — and it climbs, because a Song of Ascent should.",
    source: "Mode: Ahava Rabbah · the steps: Middot 2:5; Sukkah 51b",
    // Rises the full two octaves of the ascent, then settles home.
    // ── מִלִּים — the words ──
    // A nigun has none, and that is the claim it makes: the Baal Shem Tov's
    // circle held that a wordless melody goes where a worded one cannot,
    // because words fix a thought and a nigun does not have to.
    lyrics: { wordless: "It has no words. That is the point of it — a nigun is what is left when the words run out, and the chassidim held it goes higher for having been left.", stanzas: [] },
    notes: [[50,1],[51,1],[54,1],[55,1],[57,2],[55,1],[54,1],[51,2],[50,2],[0,1],
            [57,1],[58,1],[60,1],[62,2],[60,1],[58,1],[57,2],[0,1],
            [55,1],[57,1],[58,1],[57,1],[55,3],[0,1],
            [62,1],[63,1],[66,1],[67,1],[69,2],[67,1],[66,1],[63,2],[62,2],[0,1],
            [60,1],[58,1],[57,1],[55,1],[54,1],[51,1],[50,4]],
  },
  {
    id: "hatikvah",
    heb: "הַתִּקְוָה",
    title: "Hatikvah — The Hope",
    verified: true,
    // Twenty bars of 4/4. Ceremonial performances run the anthem in a little
    // under a minute, which puts the crotchet near 94; at 72 it took sixty-six
    // seconds and sagged in the middle of every held A.
    bpm: 94,
    blurb: "The tune is far older than the words and was never Jewish to begin with: it descends from \"La Mantovana,\" printed by Giuseppe Cenci around 1600, a wandering European melody that also surfaces in Smetana's Vltava. Samuel Cohen set it to Naftali Herz Imber's poem Tikvatenu in 1888. Imber's hope was two thousand years old when he wrote it down; the melody had been drifting for three hundred.",
    source: "Melody: Cenci, c. 1600, via Samuel Cohen 1888 · Text: N. H. Imber, 1878 — all public domain. Notes read off the engraved score in the Wikipedia article, D minor, 4/4.",
    // Sixteen bars, and the last four sung twice — the anthem as engraved, not
    // the flattened outline that used to stand here.
    // Imber's poem, 1878, in the two-stanza form the anthem settled into. The
    // beat spans are where the words sit in the tune, so the panel can light
    // the line being sung — beats, not seconds, so it stays right at any tempo.
    lyrics: { stanzas: [
      { from: 0, to: 32,
        he: "כָּל עוֹד בַּלֵּבָב פְּנִימָה\nנֶפֶשׁ יְהוּדִי הוֹמִיָּה,\nוּלְפַאֲתֵי מִזְרָח קָדִימָה,\nעַיִן לְצִיּוֹן צוֹפִיָּה;",
        tl: "Kol od balevav p'nima / nefesh yehudi homiya, / ul'fa'atei mizrach kadima, / ayin l'Tzion tzofiya;",
        en: "So long as within the heart a Jewish soul still stirs, and onward toward the ends of the east an eye still looks to Zion —" },
      { from: 32, to: 48,
        he: "עוֹד לֹא אָבְדָה תִּקְוָתֵנוּ,\nהַתִּקְוָה בַּת שְׁנוֹת אַלְפַּיִם,",
        tl: "Od lo avda tikvatenu, / hatikvah bat shnot alpayim,",
        en: "our hope is not yet lost, the hope two thousand years old —" },
      { from: 48, to: 80,
        he: "לִהְיוֹת עַם חָפְשִׁי בְּאַרְצֵנוּ,\nאֶרֶץ צִיּוֹן וִירוּשָׁלַיִם.",
        tl: "lihyot am chofshi b'artzenu, / eretz Tzion virushalayim.",
        en: "to be a free people in our own land, the land of Zion and Jerusalem." },
    ] },
    notes: [[62,0.5],[64,0.5],[65,0.5],[67,0.5],[69,1],[69,1],
            [70,0.5],[69,0.5],[70,0.5],[74,0.5],[69,2],
            [67,1],[67,0.5],[67,0.5],[65,1],[65,1],
            [64,0.5],[62,0.5],[64,0.5],[65,0.5],[62,1.5],[57,0.5],
            [62,0.5],[64,0.5],[65,0.5],[67,0.5],[69,1],[69,1],
            [70,0.5],[69,0.5],[70,0.5],[74,0.5],[69,2],
            [67,1],[67,0.5],[67,0.5],[65,1],[65,1],
            [64,0.5],[62,0.5],[64,0.5],[65,0.5],[62,2],
            [62,1],[74,1],[74,1],[74,1],
            [72,0.5],[74,0.5],[72,0.5],[70,0.5],[69,2],
            [62,1],[74,1],[74,1],[74,1],
            [72,0.5],[74,0.5],[72,0.5],[70,0.5],[69,2],
            [72,1],[72,0.5],[72,0.5],[65,1],[65,1],
            [67,0.5],[69,0.5],[70,0.5],[72,0.5],[69,1],[67,0.5],[65,0.5],
            [67,1],[67,1],[65,1],[65,0.5],[65,0.5],
            [64,0.5],[62,0.5],[64,0.5],[65,0.5],[62,2],
            [72,1],[72,0.5],[72,0.5],[65,1],[65,1],
            [67,0.5],[69,0.5],[70,0.5],[72,0.5],[69,1],[67,0.5],[65,0.5],
            [67,1],[67,1],[65,1],[65,0.5],[65,0.5],
            [64,0.5],[62,0.5],[64,0.5],[65,0.5],[62,2]],
  },
  {
    id: "shalom",
    heb: "שָׁלוֹם עֲלֵיכֶם",
    title: "Shalom Aleichem — Peace Be Upon You",
    verified: true,
    bpm: 78,
    blurb: "Peace greeted at the door. The words come from the kabbalists of Tzfat and were first printed in Tikkunei Shabbat (Prague, 1641), built on Shabbat 119b: two angels walk a person home on Shabbat eve. The melody almost everyone sings is Israel Goldfarb's, written in 1918 — by his own account sitting near the Alma Mater statue at Columbia University, which is a strange and lovely place for a Shabbat hymn to have been born.",
    source: "Text: Tzfat, printed Prague 1641 · Shabbat 119b · Melody: Israel Goldfarb, 1918 (public domain). Sixteen bars read off the engraved score, D minor, 4/4, marked ♩=66; dropped an octave so it sits on the steps.",
    // What stood here was written from memory and was not Goldfarb's tune at
    // all — a plausible A–B♭–A shape in the right mode and the wrong song.
    // The engraving turned up (flutetunes.com, sixteen bars, ♩=66) and this is
    // it note for note: the pickup A, the fall F–E–D, and the C♯ of the
    // harmonic minor that the memory version had quietly flattened away. Its
    // written register runs G4–B♭5, above every tread the steps are tuned to,
    // so the whole line is moved down an octave to land on them.
    // Tikkunei Shabbat, Prague 1641, on Shabbat 119b. Four stanzas to one tune:
    // the angels are greeted, asked in, asked for a blessing, and sent out
    // again — which is the whole of Friday night in twelve lines.
    lyrics: { stanzas: [
      { from: 0, to: 32,
        he: "שָׁלוֹם עֲלֵיכֶם מַלְאֲכֵי הַשָּׁרֵת\nמַלְאֲכֵי עֶלְיוֹן,",
        tl: "Shalom aleichem, malachei hashareit, malachei Elyon,",
        en: "Peace be upon you, ministering angels, angels of the Most High," },
      { from: 32, to: 64,
        he: "מִמֶּלֶךְ מַלְכֵי הַמְּלָכִים\nהַקָּדוֹשׁ בָּרוּךְ הוּא.",
        tl: "mimelech malchei ham'lachim, HaKadosh Baruch Hu.",
        en: "from the King who is King of kings, the Holy One, blessed be He." },
    ], more: [
      { he: "בּוֹאֲכֶם לְשָׁלוֹם ...", tl: "Bo'achem l'shalom …", en: "Come in peace …" },
      { he: "בָּרְכוּנִי לְשָׁלוֹם ...", tl: "Barchuni l'shalom …", en: "Bless me with peace …" },
      { he: "צֵאתְכֶם לְשָׁלוֹם ...", tl: "Tzeitchem l'shalom …", en: "Go out in peace …" },
    ] },
    notes: [[57,1],[65,0.5],[64,0.5],[62,1],[62,1],[61,0.5],[62,0.5],[64,0.5],[62,0.5],[61,0.5],[58,0.5],[57,1],
            [61,0.5],[61,0.5],[61,1],[62,0.5],[61,0.5],[62,0.5],[65,0.5],[64,4],
            [57,1],[65,0.5],[64,0.5],[62,1],[62,1],[61,0.5],[62,0.5],[64,0.5],[62,0.5],[61,0.5],[58,0.5],[57,0.5],[57,0.5],
            [55,1],[62,1],[61,1],[58,0.5],[55,0.5],[57,3],[0,1],
            [65,1],[69,0.5],[69,0.5],[69,1],[69,1],[67,0.5],[65,0.5],[64,0.5],[65,0.5],[67,0.5],[69,0.5],[67,1],
            [65,0.5],[64,0.5],[62,0.5],[64,0.5],[65,0.5],[69,0.5],[67,0.5],[65,0.5],[64,4],
            [64,0.5],[65,0.5],[67,1],[67,1],[67,1],[67,0.5],[70,0.5],[69,0.5],[67,0.5],[65,0.5],[64,0.5],[62,1],
            [62,0.5],[64,0.5],[65,1],[64,0.5],[62,0.5],[61,0.5],[64,0.5],[62,4]],
  },
  {
    id: "maoz",
    heb: "מָעוֹז צוּר",
    title: "Ma'oz Tzur — Rock of Ages",
    verified: true,
    // A Chanukah table song, sung briskly and by children. 116.
    bpm: 116,
    blurb: "The one song here that asks for this House by name: תִּכּוֹן בֵּית תְּפִלָּתִי — let my house of prayer be established — and there we will bring the thanksgiving offering. The poem is thirteenth century, signed by an acrostic reading Mordechai. The melody is a German folk tune of the fifteenth or sixteenth century that Ashkenazi Jewry took up and kept.",
    source: "Text: 13th c., acrostic 'Mordechai' · Melody: German folk, 15th–16th c. (public domain). Notes read off the engraved 'traditional version' in the Wikipedia article, written there in C and moved here to D so the whole House stays in one key.",
    // Two strains and their answers: A A' B C C'. The old line here climbed
    // D–D–G–G–A where the tune falls away from its opening D to the A below
    // it and comes back up — D–A–D–G–F#–E–D — which is why it never landed.
    // There is no B♭ anywhere in this tune; the whole of it sits in D major
    // against Hatikvah's D minor.
    // The first stanza, thirteenth century, acrostic מרדכי. The whole House is
    // in the second line of it: תִּכּוֹן בֵּית תְּפִלָּתִי — let my house of
    // prayer be established — and the last words are the dedication of the
    // altar that stands in the middle of this court.
    lyrics: { stanzas: [
      { from: 0, to: 16,
        he: "מָעוֹז צוּר יְשׁוּעָתִי,\nלְךָ נָאֶה לְשַׁבֵּחַ.",
        tl: "Ma'oz tzur yeshu'ati, lecha na'eh l'shabe'ach.",
        en: "Rock of my salvation — it is fitting to praise You." },
      { from: 16, to: 32,
        he: "תִּכּוֹן בֵּית תְּפִלָּתִי,\nוְשָׁם תּוֹדָה נְזַבֵּחַ.",
        tl: "Tikon beit tefilati, v'sham toda n'zabe'ach.",
        en: "Let my house of prayer be established, and there we will bring the thanksgiving offering." },
      { from: 32, to: 48,
        he: "לְעֵת תָּכִין מַטְבֵּחַ\nמִצָּר הַמְנַבֵּחַ.",
        tl: "L'et tachin matbe'ach mitzar hamnabe'ach.",
        en: "When You have made an end of the barking foe," },
      { from: 48, to: 80,
        he: "אָז אֶגְמוֹר בְּשִׁיר מִזְמוֹר\nחֲנֻכַּת הַמִּזְבֵּחַ.",
        tl: "Az egmor b'shir mizmor chanukat hamizbe'ach.",
        en: "then I will finish, with song and psalm, the dedication of the altar." },
    ] },
    notes: [[62,1],[57,1],[62,1],[67,1],[66,1],[64,1],[62,1.5],[69,0.5],
            [69,1],[71,1],[64,1],[66,0.5],[67,0.5],[66,1],[64,1],[62,2],
            [62,1],[57,1],[62,1],[67,1],[66,1],[64,1],[62,1.5],[69,0.5],
            [69,1],[71,1],[64,1],[66,0.5],[67,0.5],[66,1],[64,1],[62,1.5],[69,0.5],
            [69,1.5],[69,0.5],[71,1],[73,1],[74,2],[69,2],
            [74,1],[73,1],[71,1],[69,1],[69,0.5],[67,0.5],[66,0.5],[67,0.5],[64,2],
            [66,1.5],[67,0.5],[69,1.5],[71,0.5],[64,1.5],[66,0.5],[67,2],
            [66,1],[62,1],[71,1],[69,0.5],[67,0.5],[66,1],[67,1],[69,2],
            [66,1.5],[67,0.5],[69,1.5],[71,0.5],[64,1.5],[66,0.5],[67,2],
            [66,1],[62,1],[71,1],[69,0.5],[67,0.5],[66,1],[64,1],[62,2]],
  },
];

// ═══════════ לוּחַ — the calendar ═══════════
//
// Everything date-aware in this House comes out of the next hundred lines: the
// chag it is today, whether the almond is in flower, how many lights are in the
// chanukiah, which day of the Omer, and the parshah of anybody's birthday.
//
// It is arithmetic, not a lookup: the Hebrew calendar has been computable since
// Hillel II fixed it in the fourth century, and the whole of it is the molad
// (the mean lunation, 29d 12h 793p — which is 29.530594 days, and is wrong by
// about half a second a century) plus four dechiyot that push Rosh Hashanah off
// the days it may not fall on. No table, no network, no dependency.
//
// Days are counted in RD — Rata Die — where RD 1 is 1 January 1 CE in the
// proleptic Gregorian calendar. Months are numbered from Nisan, because that is
// how the Torah counts them (Shemot 12:2 — הַחֹדֶשׁ הַזֶּה לָכֶם רֹאשׁ
// חֳדָשִׁים), even though the year turns at Tishrei, which is month 7.
const HEB_EPOCH = -1373427;
const gLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const gMonthLen = (y, m) => (m === 2 ? (gLeap(y) ? 29 : 28) : [1, 3, 5, 7, 8, 10, 12].includes(m) ? 31 : 30);
function gregToRD(y, m, d) {
  return 365 * (y - 1) + Math.floor((y - 1) / 4) - Math.floor((y - 1) / 100)
    + Math.floor((y - 1) / 400) + Math.floor((367 * m - 362) / 12)
    + (m <= 2 ? 0 : (gLeap(y) ? -1 : -2)) + d;
}
function rdToGreg(rd) {
  let y = Math.floor((rd - 1) / 366) + 1;
  while (gregToRD(y + 1, 1, 1) <= rd) y++;
  let m = 1;
  while (gregToRD(y, m, gMonthLen(y, m)) < rd) m++;
  return { y, m, d: rd - gregToRD(y, m, 1) + 1 };
}
// Seven leap years in nineteen — the Metonic cycle, which is the whole reason
// Pesach stays in the spring (Devarim 16:1: שָׁמוֹר אֶת־חֹדֶשׁ הָאָבִיב).
const hebLeap = (y) => ((y * 7 + 1) % 19) < 7;
const monthsInHebYear = (y) => (hebLeap(y) ? 13 : 12);
function moladElapsed(year) {
  const monthsElapsed = Math.floor((235 * year - 234) / 19);
  const parts = 12084 + 13753 * monthsElapsed;
  let day = monthsElapsed * 29 + Math.floor(parts / 25920);
  // לא אד״ו ראש — Rosh Hashanah may not fall on a Sunday, Wednesday or
  // Friday, or Yom Kippur would abut a Shabbat and Hoshana Rabbah would land
  // on one.
  if ((3 * (day + 1)) % 7 < 3) day += 1;
  return day;
}
function yearCorrection(year) {
  const a = moladElapsed(year - 1), b = moladElapsed(year), c = moladElapsed(year + 1);
  if (c - b === 356) return 2;                 // גטר״ד
  if (b - a === 382) return 1;                 // בט״ו תקפ״ט
  return 0;
}
const hebNewYear = (y) => HEB_EPOCH + moladElapsed(y) + yearCorrection(y);
const hebYearLen = (y) => hebNewYear(y + 1) - hebNewYear(y);
function hebMonthLen(year, month) {
  if ([2, 4, 6, 10, 13].includes(month)) return 29;
  if (month === 12 && !hebLeap(year)) return 29;
  if (month === 8 && hebYearLen(year) % 10 !== 5) return 29;   // Cheshvan, full only in a שלמה year
  if (month === 9 && hebYearLen(year) % 10 === 3) return 29;   // Kislev, defective in a חסרה year
  return 30;
}
function hebToRD(year, month, day) {
  let d = hebNewYear(year) + day - 1;
  if (month < 7) {
    for (let m = 7; m <= monthsInHebYear(year); m++) d += hebMonthLen(year, m);
    for (let m = 1; m < month; m++) d += hebMonthLen(year, m);
  } else {
    for (let m = 7; m < month; m++) d += hebMonthLen(year, m);
  }
  return d;
}
function rdToHeb(rd) {
  let year = Math.floor((rd - HEB_EPOCH) / 366);
  while (hebNewYear(year + 1) <= rd) year++;
  let month = rd < hebToRD(year, 1, 1) ? 7 : 1;
  while (rd > hebToRD(year, month, hebMonthLen(year, month))) month++;
  return { year, month, day: rd - hebToRD(year, month, 1) + 1 };
}
const HEB_MONTHS = ["", "נִיסָן", "אִיָּיר", "סִיוָן", "תַּמּוּז", "אָב", "אֱלוּל", "תִּשְׁרֵי",
  "חֶשְׁוָן", "כִּסְלֵו", "טֵבֵת", "שְׁבָט", "אֲדָר", "אֲדָר ב׳"];
const hebMonthName = (y, m) => (m === 12 && hebLeap(y) ? "אֲדָר א׳" : HEB_MONTHS[m]);
// Gematria. The two exceptions are 15 and 16, which are written טו and טז
// rather than יה and יו, because those two spell the Name.
function hebNum(n) {
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const huns = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];
  let s = "";
  n = n % 1000;
  s += huns[Math.floor(n / 100)];
  const r = n % 100;
  if (r === 15) s += "טו";
  else if (r === 16) s += "טז";
  else { s += tens[Math.floor(r / 10)]; s += ones[r % 10]; }
  if (s.length === 1) return s + "׳";
  return s.slice(0, -1) + "״" + s.slice(-1);
}
const hebDateStr = (h) => `${hebNum(h.day)} ${hebMonthName(h.year, h.month)} ${hebNum(h.year - 5000)}`;

// ── The parshah ──
//
// The order never changes; what changes is how many Shabbatot there are to put
// it in. A Shabbat that falls on a festival reads the festival, so a year with
// its chagim badly placed runs out of Shabbatot and has to double up — and
// which pairs double up is fixed for each of the fourteen shapes a Hebrew year
// can take (its Rosh Hashanah weekday and its length), separately for Israel,
// which keeps one day of yom tov and therefore has one more Shabbat free.
//
// The table below is those fourteen shapes, twice. It was derived rather than
// remembered, and then checked parshah by parshah against sixty-five years of
// published luchot in both rites — 6,207 Shabbatot, no disagreements.
const PARSHIYOT = ["Bereshit", "Noach", "Lech-Lecha", "Vayera", "Chayei Sara", "Toldot", "Vayetzei",
  "Vayishlach", "Vayeshev", "Miketz", "Vayigash", "Vayechi", "Shemot", "Vaera", "Bo", "Beshalach",
  "Yitro", "Mishpatim", "Terumah", "Tetzaveh", "Ki Tisa", "Vayakhel", "Pekudei", "Vayikra", "Tzav",
  "Shmini", "Tazria", "Metzora", "Achrei Mot", "Kedoshim", "Emor", "Behar", "Bechukotai", "Bamidbar",
  "Nasso", "Beha'alotcha", "Sh'lach", "Korach", "Chukat", "Balak", "Pinchas", "Matot", "Masei",
  "Devarim", "Vaetchanan", "Eikev", "Re'eh", "Shoftim", "Ki Teitzei", "Ki Tavo", "Nitzavim",
  "Vayelech", "Ha'azinu", "V'Zot HaBerachah"];
const PARSHIYOT_HE = ["בְּרֵאשִׁית", "נֹחַ", "לֶךְ־לְךָ", "וַיֵּרָא", "חַיֵּי שָׂרָה", "תּוֹלְדוֹת",
  "וַיֵּצֵא", "וַיִּשְׁלַח", "וַיֵּשֶׁב", "מִקֵּץ", "וַיִּגַּשׁ", "וַיְחִי", "שְׁמוֹת", "וָאֵרָא",
  "בֹּא", "בְּשַׁלַּח", "יִתְרוֹ", "מִשְׁפָּטִים", "תְּרוּמָה", "תְּצַוֶּה", "כִּי תִשָּׂא",
  "וַיַּקְהֵל", "פְקוּדֵי", "וַיִּקְרָא", "צַו", "שְׁמִינִי", "תַזְרִיעַ", "מְצֹרָע",
  "אַחֲרֵי מוֹת", "קְדֹשִׁים", "אֱמֹר", "בְּהַר", "בְּחֻקֹּתַי", "בְּמִדְבַּר", "נָשֹׂא",
  "בְּהַעֲלֹתְךָ", "שְׁלַח־לְךָ", "קֹרַח", "חֻקַּת", "בָּלָק", "פִּינְחָס", "מַּטּוֹת", "מַסְעֵי",
  "דְּבָרִים", "וָאֶתְחַנַּן", "עֵקֶב", "רְאֵה", "שֹׁפְטִים", "כִּי תֵצֵא", "כִּי תָבוֹא",
  "נִצָּבִים", "וַיֵּלֶךְ", "הַאֲזִינוּ", "וְזֹאת הַבְּרָכָה"];
// Which of the five books each falls in, for the panel.
const PARSHAH_BOOK = (i) => (i < 12 ? "בְּרֵאשִׁית · Bereshit" : i < 23 ? "שְׁמוֹת · Shemot"
  : i < 33 ? "וַיִּקְרָא · Vayikra" : i < 43 ? "בְּמִדְבַּר · Bamidbar" : "דְּבָרִים · Devarim");
const PAIR_AT = [21, 26, 28, 31, 38, 41, 50];
const MERGE_TABLE = {
  "1-353-D": "1111011", "1-353-I": "1111011", "1-355-D": "1111111", "1-355-I": "1111011",
  "1-383-D": "0000111", "1-383-I": "0000011", "1-385-D": "0000010", "1-385-I": "0000000",
  "2-354-D": "1111111", "2-354-I": "1111011", "2-384-D": "0000010", "2-384-I": "0000000",
  "4-354-D": "1111010", "4-354-I": "1110010", "4-355-D": "0111010", "4-355-I": "0111010",
  "4-383-D": "0000000", "4-383-I": "0000000", "4-385-D": "0000001", "4-385-I": "0000001",
  "6-353-D": "1111010", "6-353-I": "1111010", "6-355-D": "1111011", "6-355-I": "1111011",
  "6-383-D": "0000011", "6-383-I": "0000011", "6-385-D": "0000111", "6-385-I": "0000011",
};
function festivalShabbat(rd, israel) {
  const { month, day } = rdToHeb(rd);
  if (month === 7) return day <= 2 || day === 10 || (day >= 15 && day <= (israel ? 22 : 23));
  if (month === 1) return day >= 15 && day <= (israel ? 21 : 22);
  if (month === 3) return day === 6 || (!israel && day === 7);
  return false;
}
const nextShabbat = (rd) => { let d = rd; while (((d % 7) + 7) % 7 !== 6) d++; return d; };
// One Torah cycle: Bereshit on the first Shabbat after Simchat Torah, then a
// parshah every Shabbat until next year's Bereshit.
function sedraCycle(y, israel) {
  const merged = MERGE_TABLE[`${((hebNewYear(y) % 7) + 7) % 7}-${hebYearLen(y)}-${israel ? "I" : "D"}`];
  if (!merged) return [];
  const seq = [];
  for (let i = 0; i < 53; i++) {
    const p = PAIR_AT.indexOf(i);
    if (p >= 0 && merged[p] === "1") { seq.push([i, i + 1]); i++; } else seq.push([i]);
  }
  const start = nextShabbat(hebToRD(y, 7, israel ? 22 : 23) + 1);
  const end = nextShabbat(hebToRD(y + 1, 7, israel ? 22 : 23) + 1);
  const out = [];
  let k = 0;
  for (let d = start; d < end && k < seq.length; d += 7) {
    if (festivalShabbat(d, israel)) continue;
    out.push({ rd: d, idx: seq[k] });
    k++;
  }
  return out;
}
// The parshah read on the Shabbat on or after `rd` — which is exactly the
// question a bar or bat mitzvah asks about the day they were born.
function parshahOnOrAfter(rd, israel = false) {
  const target = nextShabbat(rd);
  const y = rdToHeb(target).year;
  for (const cy of [y - 1, y, y + 1]) {
    for (const s of sedraCycle(cy, israel)) if (s.rd === target) return { ...s, rd: target };
  }
  // Simchat Torah and the festival Shabbatot have their own reading; step on.
  return parshahOnOrAfter(target + 7, israel);
}

// Which day the House thinks it is. Normally today; but ?date=2026-12-06 will
// put the chanukiah at the gate in the middle of August, which is the only way
// most people will ever see it — eight nights a year is not many. Bad input
// falls back to the real date rather than throwing, because a query string is
// something a stranger can write.
function sceneDateRD() {
  try {
    const q = new URLSearchParams(window.location.search).get("date");
    const m = q && /^(\d{4})-(\d{2})-(\d{2})$/.exec(q);
    if (m) {
      const y = +m[1], mo = +m[2], d = +m[3];
      if (y >= 1500 && y <= 2199 && mo >= 1 && mo <= 12 && d >= 1 && d <= gMonthLen(y, mo)) return gregToRD(y, mo, d);
    }
  } catch (err) { /* no window, or a query string that is not one */ }
  const n = new Date();
  return gregToRD(n.getFullYear(), n.getMonth() + 1, n.getDate());
}

// ── מוֹעֲדִים — what day it is in the House ──
//
// Only the ones this House would have noticed. Each carries what the place did
// on it, because a date with nothing attached is a fact and not a festival.
function chagOn(rd, israel = false) {
  const { year, month, day } = rdToHeb(rd);
  const L = hebLeap(year);
  const at = (m, d) => month === m && day === d;
  const K = (id, he, en, note) => ({ id, he, en, note });
  if (at(7, 1) || at(7, 2)) return K("rosh", "רֹאשׁ הַשָּׁנָה", "Rosh Hashanah", "The shofar is sounded a hundred times, and the world is judged. Here the great shofar waits on marble near the southern gate.");
  if (at(7, 10)) return K("yom", "יוֹם הַכִּפּוּרִים", "Yom Kippur", "The one day the Kohen Gadol went behind the parochet, into the room with nothing in it but the Even HaShetiyah. He said the Name aloud, and the court fell on their faces.");
  if (month === 7 && day >= 15 && day <= 21) return K("sukkot", "סֻכּוֹת", "Sukkot", `Day ${day - 14} of the festival. Water was poured on the altar and the Levites played all night on the fifteen steps — Sukkah 51b says whoever has not seen the Simchat Beit HaSho'evah has never seen rejoicing.`);
  if (at(7, 22)) return K("atzeret", "שְׁמִינִי עֲצֶרֶת", "Shemini Atzeret", "One more day, said for its own sake. Rain is asked for from today.");
  if (!israel && at(7, 23)) return K("torah", "שִׂמְחַת תּוֹרָה", "Simchat Torah", "The last words of the Torah and the first, read on the same day, so it never ends.");
  if ((month === 9 && day >= 25) || (month === 10 && day <= (hebMonthLen(year, 9) === 30 ? 2 : 3))) {
    const n = month === 9 ? day - 24 : day + (hebMonthLen(year, 9) === 30 ? 6 : 5);
    return K("chanukah", "חֲנֻכָּה", "Chanukah", `Night ${n} of eight. The rededication of this altar after it was defiled — Chanukat HaMizbe'ach, the last words of Ma'oz Tzur.`);
  }
  if (at(11, 15)) return K("tubshvat", "ט״וּ בִּשְׁבָט", "Tu BiShvat", "The new year of the trees. The almond is the first thing in the land to flower, and it is flowering now — Shemot 25:33 carved it into the Menorah for exactly that reason.");
  if (at(L ? 13 : 12, 14)) return K("purim", "פּוּרִים", "Purim", "The one festival whose scroll never says the Name — because the hiding is the point.");
  if (at(1, 14)) return K("erevpesach", "עֶרֶב פֶּסַח", "Erev Pesach", "The korban pesach was brought this afternoon in three shifts, and Pesachim 64b says the court was so full that the doors were shut on the first group.");
  if (month === 1 && day >= 15 && day <= (israel ? 21 : 22)) return K("pesach", "פֶּסַח", "Pesach", `Day ${day - 14}. On the second day the Omer of barley was cut and brought here and waved, and only then could the new grain be eaten.`);
  if (at(2, 18)) return K("lag", "ל״ג בָּעוֹמֶר", "Lag BaOmer", "The thirty-third day of the count, and the day the dying stopped.");
  if (at(3, 6) || (!israel && at(3, 7))) return K("shavuot", "שָׁבוּעוֹת", "Shavuot", "The bikkurim came up with an ox before them, its horns overlaid with gold and an olive wreath on its head, and a flute playing the whole way (Bikkurim 3:2–4).");
  if (at(4, 17)) return K("tammuz", "שִׁבְעָה עָשָׂר בְּתַמּוּז", "17 Tammuz", "The walls were breached. Three weeks from here to the ninth of Av.");
  if (at(5, 9)) return K("tisha", "תִּשְׁעָה בְּאָב", "Tisha B'Av", "Both Houses fell on this day. Makkot 24b: the sages wept at a fox in the ruin, and Rabbi Akiva laughed — because the prophecy of the ruin coming true is what makes the prophecy of the rebuilding true too.");
  if (at(5, 15)) return K("tuav", "ט״וּ בְּאָב", "Tu B'Av", "Ta'anit 30b calls it one of the two happiest days Israel ever had. The daughters of Jerusalem went out in borrowed white, so that nobody could tell who was rich.");
  if (month === 6) return K("elul", "אֱלוּל", "Elul", "The month of return. The shofar is blown every morning, and the King is said to be in the field.");
  return null;
}
// Sefirat HaOmer. Vayikra 23:15 counts from the day the Omer was brought, and
// the Omer was brought *here* — so the House has an opinion about what day it is.
function omerDay(rd) {
  const { year } = rdToHeb(rd);
  for (const y of [year - 1, year]) {
    const start = hebToRD(y, 1, 16);
    const n = rd - start + 1;
    if (n >= 1 && n <= 49) return n;
  }
  return 0;
}

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

// Build a standard material whose relief is derived from its own colour map.
//
// three builds one UV transform per material and takes it from `map` whenever
// there is one, so in practice the derived maps already follow the colour map
// wherever it goes. Copying repeat/offset across anyway costs nothing and
// keeps the three textures honest on their own terms — it is what makes a
// material with no colour map (the river) able to drive its transform from the
// normal map instead.
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

// 1024x512, not 512x512, and twice the columns. Block proportions are
// unchanged — 1024/8 is the same 128px face 512/4 was — but the map now holds
// twice as many distinct stones before it starts over, and the extra period is
// spent along the wall, which is the only direction a 500-amah retaining wall
// tiles far enough for the eye to catch the repeat. Callers halve their u
// repeat to keep every stone the size it was. Costs one Sobel pass at double
// width, roughly 16ms per map; a square 1024 would have cost four times that
// to lengthen a period that was never visible vertically.
function ashlar({ base = [218, 211, 194], courses = 5, cols = 8, margin = true } = {}) {
  return makeCanvas(1024, 512, (ctx, w, h) => {
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
    for (let i = 0; i < 4400; i++) {   // twice the canvas, twice the grit
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

// The azarah floor. It had been the top face of the inner-court block, which
// wears the sea-wave marble at repeat(1.6, 1) — fine on a 10-amah wall face,
// but the same UV spans the 260-amah floor, so one tile of pattern was stretched
// across 162 amot and the most-looked-at surface in the House rendered as a
// featureless pale plane.
//
// Middot does not describe a pattern for the court floor, so this is dressed
// stone rather than an invention with a citation attached: large slabs, joints
// that are lighter than the field rather than darker (a polished floor's joints
// catch light, they do not read as black lines the way a dry-laid pavement's
// do), and per-slab tone variation wide enough that the eye reads individual
// stones from standing height.
// Airborne dust. One very diffuse radial falloff — no structure at all,
// because structure is what makes a haze sprite read as a cloud sitting on the
// ground instead of as air.
function hazeTex() {
  return makeCanvas(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,0.5)");
    g.addColorStop(0.45, "rgba(255,255,255,0.22)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

function courtStoneTex() {
  return makeCanvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "rgb(226,220,205)"; ctx.fillRect(0, 0, w, h);
    const n = 4, cell = w / n;
    for (let r = 0; r < n; r++) {
      for (let c2 = 0; c2 < n; c2++) {
        const j = rnd(-9, 9);
        const x = c2 * cell, y = r * cell;
        const g = ctx.createLinearGradient(x, y, x + cell, y + cell);
        g.addColorStop(0, `rgb(${224 + j | 0},${218 + j | 0},${202 + j | 0})`);
        g.addColorStop(0.6, `rgb(${233 + j | 0},${227 + j | 0},${211 + j | 0})`);
        g.addColorStop(1, `rgb(${220 + j | 0},${214 + j | 0},${198 + j | 0})`);
        ctx.fillStyle = g;
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
        // Faint veining, kept inside the slab — veins do not cross a joint.
        ctx.save();
        ctx.beginPath(); ctx.rect(x + 1, y + 1, cell - 2, cell - 2); ctx.clip();
        for (let v = 0; v < 3; v++) {
          ctx.strokeStyle = `rgba(${rnd(178, 202) | 0},${rnd(172, 196) | 0},${rnd(150, 176) | 0},${rnd(0.10, 0.22)})`;
          ctx.lineWidth = rnd(0.5, 1.5);
          ctx.beginPath();
          let vx = x + rnd(0, cell), vy = y;
          ctx.moveTo(vx, vy);
          while (vy < y + cell) { vy += rnd(12, 30); vx += rnd(-20, 20); ctx.lineTo(vx, vy); }
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    // Joints, pale.
    ctx.strokeStyle = "rgba(246,242,232,0.55)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(w, i * cell); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, h); ctx.stroke();
    }
    // Scuff and grit, low contrast — this floor is washed daily.
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = `rgba(${rnd(196, 226) | 0},${rnd(190, 220) | 0},${rnd(168, 200) | 0},${rnd(0.02, 0.06)})`;
      ctx.fillRect(rnd(0, w), rnd(0, h), rnd(1, 2), rnd(1, 2));
    }
  });
}

// A cumulus is not a blob. It has a hard cauliflower top where the rising air
// is still condensing and a flat grey base where it crossed the condensation
// level — that flat bottom is the single feature that makes a painted cloud
// read as weather rather than as smoke. So: a mound of overlapping puffs
// biased upward, shaded from bright at the crown to dim underneath, then cut
// off along a soft horizontal line with everything below it erased.
function cloudTex() {
  return makeCanvas(512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const base = h * 0.74;                       // the condensation level
    for (let i = 0; i < 90; i++) {
      // Puffs cluster toward the middle and toward the top, and the ones near
      // the crown are smaller — which is what gives the cauliflower edge.
      const u = rnd(-1, 1);
      const x = w * 0.5 + u * w * 0.40;
      const lift = 1 - Math.abs(u) * 0.75;                       // a mound, not a slab
      const y = base - rnd(0.05, 1.0) * lift * (h * 0.60);
      const r = rnd(16, 54) * (0.5 + 0.5 * lift);
      // Vertical shading: the crown takes the sun, the belly sits in its own
      // shadow. Carried in the texture's luminance so a single sprite tint can
      // still swing the whole thing to gold at dusk.
      const k = Math.pow((base - y) / (h * 0.62), 0.7);
      const v = Math.round(192 + 63 * k);
      const g = ctx.createRadialGradient(x, y, r * 0.12, x, y, r);
      g.addColorStop(0, `rgba(${v},${v},${Math.min(255, v + 6)},0.40)`);
      g.addColorStop(0.55, `rgba(${v},${v},${Math.min(255, v + 6)},0.20)`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    // Cut the flat base. A hard line would read as a crop, so it is feathered
    // over about six percent of the height — which is roughly how ragged a
    // real cloud base is.
    ctx.globalCompositeOperation = "destination-out";
    const cut = ctx.createLinearGradient(0, base - h * 0.05, 0, base + h * 0.03);
    cut.addColorStop(0, "rgba(0,0,0,0)");
    cut.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = cut;
    ctx.fillRect(0, base - h * 0.05, w, h);
    ctx.globalCompositeOperation = "source-over";
  });
}

// Cirrus: ice, twenty times higher, drawn out into streaks by a wind that has
// nothing to push against. They do almost nothing by day and everything at
// dusk, because at eight hundred amot they are still in full sunlight when the
// courts have been in shadow for twenty minutes.
function cirrusTex() {
  return makeCanvas(512, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      const y = rnd(h * 0.2, h * 0.8);
      const len = rnd(w * 0.18, w * 0.52);
      const x = rnd(0, w - len);
      const g = ctx.createLinearGradient(x, 0, x + len, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, `rgba(255,255,255,${rnd(0.10, 0.26).toFixed(3)})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      // Slight shear, so they hook the way wind-drawn ice does.
      ctx.save();
      ctx.translate(x, y); ctx.transform(1, 0, rnd(-0.35, 0.35), 1, 0, 0);
      ctx.fillRect(-x, -rnd(1.5, 5), w, rnd(3, 10));
      ctx.restore();
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

// Water needs a moving surface more than it needs a colour. This is a height
// field for it: long crests running with the current, then finer chop crossing
// them at an angle so the two do not beat into a visible pattern. It is never
// drawn — only Sobelled into a normal map, which is then scrolled.
function rippleTex() {
  return makeCanvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, w, h);
    const crest = (amp, freq, phase, weight, tilt) => {
      ctx.strokeStyle = `rgba(255,255,255,${weight})`;
      ctx.lineWidth = rnd(3, 9);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = phase + Math.sin((x / w) * freq * 6.283 + phase) * amp + x * tilt;
        ctx.lineTo(x, ((y % h) + h) % h);
      }
      ctx.stroke();
    };
    // Long crests, drawn light then dark so each reads as a rise and a trough.
    for (let i = 0; i < 22; i++) {
      const ph = rnd(0, h);
      crest(rnd(3, 9), rnd(1, 3), ph, rnd(0.10, 0.22), rnd(-0.04, 0.04));
      ctx.strokeStyle = `rgba(0,0,0,${rnd(0.08, 0.18)})`;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = ph + 7 + Math.sin((x / w) * 2 * 6.283 + ph) * 6;
        ctx.lineTo(x, ((y % h) + h) % h);
      }
      ctx.stroke();
    }
    // Fine chop, crossing.
    for (let i = 0; i < 70; i++) {
      ctx.strokeStyle = `rgba(${Math.random() < 0.5 ? "255,255,255" : "0,0,0"},${rnd(0.04, 0.10)})`;
      ctx.lineWidth = rnd(1, 2.6);
      ctx.beginPath();
      let x = rnd(0, w), y = rnd(0, h);
      ctx.moveTo(x, y);
      for (let k = 0; k < 3; k++) { x += rnd(10, 30); y += rnd(-7, 7); ctx.lineTo(x, y); }
      ctx.stroke();
    }
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

// Dashboards want the English half of a title — "שער הקדים — The Sealed
// Eastern Gate" reads as a run of boxes in most of them, and the em dash is
// the seam in every one of the thirty-six.
const enTitle = (t) => t.split("—").pop().trim();

// ─────────────────────────────── component ───────────────────────────────
export default function Mikdash() {
  const mountRef = useRef(null);
  const apiRef = useRef({});
  const [found, setFound] = useState([]);
  const [fact, setFact] = useState(null);
  const [night, setNight] = useState(false);
  const [sound, setSound] = useState(true);
  const [hints, setHints] = useState(false);
  const [music, setMusic] = useState(false);
  const [peace, setPeace] = useState(false);
  const [cal, setCal] = useState(false);
  const [israel, setIsrael] = useState(false);
  const [bday, setBday] = useState("");
  const [lyrics, setLyrics] = useState(null);
  const [finale, setFinale] = useState(false);
  const [nowPlaying, setNowPlaying] = useState(null);
  // The pitch currently sounding, so the key strip can light it. Held in React
  // rather than the scene because the strip is DOM — the scene lights its own
  // fifteen treads from the same callback.
  const [activeNote, setActiveNote] = useState(null);
  const [songBeat, setSongBeat] = useState(-1);
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
  // Starting over throws away thirty-six discoveries, so it asks first.
  const [confirmReset, setConfirmReset] = useState(false);

  const foundRef = useRef(found); foundRef.current = found;
  const questRef = useRef(questMode); questRef.current = questMode;
  const walkRef = useRef(walkMode); walkRef.current = walkMode;
  // Ever walked, not walking now — the visit-end report wants the whole visit.
  const walkedRef = useRef(false); if (walkMode) walkedRef.current = true;

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
      let carried = 0, returning = false;
      try {
        if (window.storage) {
          const r = await window.storage.get(STORE_KEY);
          if (r && r.value) {
            const data = JSON.parse(r.value);
            returning = true;
            if (Array.isArray(data.found)) {
              const keep = data.found.filter((n) => n >= 0 && n < DISCOVERIES.length);
              carried = keep.length;
              setFound(keep);
            }
            if (typeof data.night === "boolean") setNight(data.night);
            if (typeof data.sound === "boolean") setSound(data.sound);
            if (data.opened) setOpened(true);
          }
        }
      } catch (err) { /* first visit — nothing saved yet */ }
      // Saved progress is the only thing that distinguishes a first visit from
      // a return here — nothing identifies the visitor, so this is the whole
      // of what retention can be measured with, and it is enough.
      track("visit", { returning: returning ? "yes" : "no", carried });
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
      if (apiRef.current.guideTo?.(0)) {
        // Forty seconds in the courts and nothing found: the House had to
        // point. A rising count here is the clearest sign the first rimon is
        // hidden too well.
        track("auto-hint");
        showToast("בֹּא וּרְאֵה — come and see. There, inside the eastern gate.");
      }
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
      // Worth counting: this is the one failure a visitor cannot work around,
      // and the share of visits it costs is invisible from any page-view total.
      track("webgl-unsupported", { ua: navigator.userAgent.slice(0, 120) });
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
      // ── The moon is the right shape tonight ──
      // The Hebrew month *is* the moon: it begins at the molad and the day of
      // the month is very nearly the age of the moon in days. So the phase does
      // not have to be invented — it can be read off the date, and the moon
      // over this House is the moon that is actually up. It is full on the
      // fifteenth, which is why Pesach and Sukkot are on the fifteenth.
      uMoonK: { value: 0.5 },
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
          uniform vec3 uSunDir; uniform vec3 uMoonDir; uniform float uMoonK;

          // ── Why an atmosphere and not a gradient ──
          //
          // What stood here was three colours for day, three for night, and a
          // cross-fade between them. It could not produce a sunset, because a
          // sunset is not a dark blue day: it is the same air, seen through
          // eight times as much of it, with the short wavelengths already
          // scattered out. Mixing a blue toward a black never passes through
          // gold, so the House went from noon to midnight without an evening.
          //
          // This is Preetham's analytic single-scattering model — the same one
          // three ships in examples/jsm/objects/Sky.js, written out here rather
          // than imported, because importing it would break the rule that this
          // file carries no dependency beyond react and three. Two terms:
          // Rayleigh, which is wavelength-dependent (blue scatters ~5.5× more
          // than red) and paints the whole dome, and Mie, which is not, and
          // makes the white aureole around the sun. Both are integrated along
          // an optical mass that grows without bound at the horizon. That is
          // the whole trick: at noon you look through one atmosphere and see
          // blue; at dusk you look through forty and the blue is gone before
          // it reaches you.
          //
          // Everything below — dusk, the gold band, the deepening zenith, the
          // second blue after the sun is down — now comes out of uSunDir on
          // its own. Nothing about the sky is keyed off uNight any more except
          // what is genuinely nocturnal: stars, the moon, the galaxy.
          const float PI = 3.141592653589793;
          const vec3 UP = vec3(0.0, 1.0, 0.0);
          const float RAYLEIGH_ZENITH = 8.4E3;   // scale height of the air, metres
          const float MIE_ZENITH = 1.25E3;       // aerosols sit much lower down
          const vec3 TOTAL_RAYLEIGH = vec3(5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5);
          const vec3 MIE_CONST = vec3(1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14);
          const float CUTOFF_ANGLE = 1.6110731556870734;
          const float STEEPNESS = 1.5;
          const float SUN_E = 1000.0;
          // cos of half a degree — the sun and the moon subtend almost exactly
          // the same angle from here, which is the only reason eclipses work.
          const float DISC_COS = 0.9999566769464484;
          const float ONE_OVER_FOURPI = 0.07957747154594767;
          // Judean summer: dry, dusty, a little more turbid than a maritime sky.
          const float TURBIDITY = 3.4;
          const float MIE_COEFF = 0.0055;
          const float MIE_G = 0.80;

          float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
          float vnoise(vec3 p){
            vec3 i = floor(p), f = fract(p);
            f = f*f*(3.0-2.0*f);
            float n000 = hash(i), n100 = hash(i+vec3(1,0,0));
            float n010 = hash(i+vec3(0,1,0)), n110 = hash(i+vec3(1,1,0));
            float n001 = hash(i+vec3(0,0,1)), n101 = hash(i+vec3(1,0,1));
            float n011 = hash(i+vec3(0,1,1)), n111 = hash(i+vec3(1,1,1));
            return mix(mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),
                       mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y), f.z);
          }
          float fbm(vec3 p){
            float v = 0.0, a = 0.5;
            for (int i = 0; i < 5; i++){ v += a*vnoise(p); p *= 2.03; a *= 0.5; }
            return v;
          }
          float hgPhase(float c, float g){
            return ONE_OVER_FOURPI * ((1.0 - g*g) / pow(max(1.0 - 2.0*g*c + g*g, 1e-4), 1.5));
          }
          // Optical mass: how many zenith-atmospheres this direction looks
          // through. Kasten–Young, which stays finite at and just below the
          // horizon where 1/cos does not.
          float opticalMass(float cosZenith){
            float za = acos(clamp(cosZenith, -1.0, 1.0));
            return 1.0 / (cosZenith + 0.15 * pow(max(93.885 - za*180.0/PI, 0.1), -1.253));
          }

          void main(){
            vec3 d = normalize(vDir);
            vec3 sunDir = normalize(uSunDir);
            float sunUp = dot(sunDir, UP);

            // How much sun is left. Falls off across the horizon rather than at
            // it, because the sun keeps lighting the air from below for a good
            // while after it has gone.
            float sunfade = 1.0 - clamp(1.0 - exp(sunUp), 0.0, 1.0);
            float sunE = SUN_E * max(0.0, 1.0 - exp(-((CUTOFF_ANGLE - acos(clamp(sunUp, -1.0, 1.0))) / STEEPNESS)));
            vec3 betaR = TOTAL_RAYLEIGH * (1.0 - (1.0 - sunfade));
            vec3 betaM = 0.434 * ((0.2 * TURBIDITY) * 10E-18) * MIE_CONST * MIE_COEFF;

            float mass = opticalMass(max(0.0, dot(UP, d)));
            vec3 Fex = exp(-(betaR * RAYLEIGH_ZENITH * mass + betaM * MIE_ZENITH * mass));

            float cosT = dot(d, sunDir);
            vec3 betaRT = betaR * (3.0/(16.0*PI)) * (1.0 + pow(cosT*0.5 + 0.5, 2.0));
            vec3 betaMT = betaM * hgPhase(cosT, MIE_G);
            vec3 ratio = (betaRT + betaMT) / (betaR + betaM);
            vec3 Lin = pow(sunE * ratio * (1.0 - Fex), vec3(1.5));
            Lin *= mix(vec3(1.0), pow(sunE * ratio * Fex, vec3(0.5)),
                       clamp(pow(1.0 - sunUp, 5.0), 0.0, 1.0));

            // ── The disc ──
            // Hidden below the true horizon so it cannot burn through the hill
            // from underneath, and reddened on the way down by the same Fex the
            // rest of the sky is using — which is what makes it go from white
            // at noon to a red coin you can look at.
            float disc = smoothstep(DISC_COS, DISC_COS + 0.00004, cosT)
                       * smoothstep(-0.012, 0.006, sunDir.y);
            // Limb darkening: the edge of a star's disc is dimmer than the
            // middle because you see less deep into it. Small, and the reason a
            // drawn sun looks like a sticker and a real one does not.
            float limb = clamp((cosT - DISC_COS) / 0.000043, 0.0, 1.0);
            disc *= 0.55 + 0.45 * sqrt(limb);
            // The flat 0.1·Fex ambient is Preetham's stand-in for a night sky
            // and it has to be gated on there being a sun, or it survives to
            // midnight: with the sun nineteen degrees under, Fex is still ~0.9
            // and that term alone was painting a dome at 0.067 — a brown-grey
            // overcast with every star drowned behind it. Off by the time the
            // sun is a quarter turn down, and the real night sky takes over.
            float sunLeft = smoothstep(-0.26, 0.02, sunUp);
            vec3 L0 = vec3(0.1) * Fex * sunLeft + (sunE * 19000.0 * Fex) * disc;

            vec3 sky = (Lin + L0) * 0.042 + vec3(0.0, 0.00035, 0.0009);
            sky = pow(sky, vec3(1.0 / (1.2 + 1.2 * sunfade)));

            // ── Shafts ──
            // Not a post-process — there is no composer here and adding one
            // would cost the no-dependency rule. This is the cheap honest half
            // of the effect: the Mie aureole broken up angularly, so when the
            // sun is low the glow around it comes through the dust in bands
            // rather than as an even wash. Only near the horizon, only near the
            // sun, and gone by mid-morning.
            float low = smoothstep(0.32, 0.02, sunDir.y) * smoothstep(-0.10, 0.02, sunDir.y);
            if (low > 0.001) {
              vec3 ax = normalize(cross(sunDir, UP));
              float ang = atan(dot(d, ax), dot(d, normalize(cross(ax, sunDir))));
              float shaft = fbm(vec3(ang * 2.6, uTime * 0.012, 4.0)) ;
              shaft = smoothstep(0.42, 0.86, shaft);
              float near = pow(max(cosT, 0.0), 7.0);
              sky += shaft * near * low * vec3(0.26, 0.17, 0.085);
            }

            // ── Night ──
            // Everything from here is nocturnal and rides on uNight, and every
            // one of them is faded by how bright the sky already is: a star is
            // not dim at dusk, it is outshone, and fading them against the sky's
            // own luminance is what makes them come out in the right order
            // instead of all at once.
            float night = uNight;
            if (night > 0.002) {
              // A night sky is not black. Airglow — oxygen recombining at a
              // hundred kilometres — sets a floor over the whole dome, and it
              // is brightest a few degrees up where the line of sight through
              // that layer is longest. This is that floor, and it is what the
              // stars are drawn against.
              sky += mix(vec3(0.016, 0.019, 0.045), vec3(0.0011, 0.0030, 0.0050),
                         smoothstep(0.0, 0.55, d.y)) * night;
              float horizonExt = smoothstep(-0.02, 0.22, d.y);   // thicker air, dimmer stars
              float washout = 1.0 - smoothstep(0.006, 0.10, dot(sky, vec3(0.33)));

              // ── Stars ──
              // The old field put one star in the middle of every cell of a
              // grid and gave it the whole cell, so at any size worth seeing
              // they were squares. These are jittered inside their cell and
              // fall off round, in two layers: a sparse bright one and a dense
              // faint one, which is what actually makes a sky read as deep.
              // Colour runs from the red end to the blue on the same hash, so
              // Antares and Rigel are not the same white pinprick.
              vec3 starC = vec3(0.0);
              for (int L = 0; L < 2; L++) {
                float scale = L == 0 ? 130.0 : 310.0;
                float thresh = L == 0 ? 0.978 : 0.9945;
                float size = L == 0 ? 0.20 : 0.13;
                vec3 cell = floor(d * scale);
                vec3 jit = vec3(hash(cell + 1.3), hash(cell + 2.7), hash(cell + 4.1));
                float r = length(fract(d * scale) - jit);
                float mag = hash(cell + 7.9);
                // Magnitude. A flat hash makes every star the same and a high
                // power makes almost all of them invisible; this keeps the
                // spread wide and still leaves the faint ones on the plate,
                // which is the difference between a sky and a scattering.
                float lit = step(thresh, hash(cell)) * smoothstep(size, 0.0, r) * mix(0.22, 1.0, mag * mag);
                float tw = 0.62 + 0.38 * sin(uTime * (1.4 + mag * 2.2) + mag * 62.0);
                vec3 tint = mix(vec3(1.0, 0.78, 0.62), vec3(0.72, 0.82, 1.0), hash(cell + 11.7));
                starC += lit * tw * tint * (L == 0 ? 1.5 : 0.62);
              }
              sky += starC * horizonExt * washout * night;

              // ── The galaxy ──
              // A band with structure in it: two octaves of cloud along the
              // plane and a dark lane cut through the middle, which is the Rift
              // and the thing that makes it recognisable rather than a smear.
              float ph = atan(d.z, d.x);
              float band = exp(-pow((d.y - 0.42 + 0.25 * sin(ph)) , 2.0) * 26.0);
              float clouds = fbm(d * 5.5 + 11.0) * 0.7 + fbm(d * 15.0) * 0.4;
              float rift = smoothstep(0.34, 0.62, fbm(d * 7.0 + 40.0));
              sky += band * clouds * rift * 0.16 * vec3(0.74, 0.78, 0.98) * horizonExt * washout * night;

              // ── The moon ──
              // Given a disc, a terminator and a face. The phase runs off the
              // angle between where the moon is and where the sun is, so the
              // lit limb always points at the sun even when the sun is under
              // the hill — the one detail that makes a painted moon wrong and
              // is free to get right.
              vec3 moonDir = normalize(uMoonDir);
              float mCos = dot(d, moonDir);
              float mDisc = smoothstep(DISC_COS - 0.00012, DISC_COS + 0.00006, mCos);
              if (mDisc > 0.0) {
                // Position on the visible face, in the moon's own frame.
                vec3 mx = normalize(cross(moonDir, UP));
                vec3 my = cross(moonDir, mx);
                vec2 uv = vec2(dot(d, mx), dot(d, my)) / 0.0093;   // ≈ the disc radius
                uv = clamp(uv, -1.0, 1.0);
                float z = sqrt(max(0.0, 1.0 - dot(uv, uv)));
                // Maria: darker basalt plains, and the reason the moon has a face.
                float maria = smoothstep(0.42, 0.72, fbm(vec3(uv * 2.1, z * 1.4) + 3.0));
                float face = mix(1.0, 0.62, maria) * (0.72 + 0.28 * z);
                // Terminator. Which side is lit comes from where the sun is;
                // *how much* is lit comes from the date. For an illuminated
                // fraction k the phase angle is cos φ = 2k − 1, and the
                // terminator is the ellipse whose semi-minor axis is |cos φ| —
                // so at k = ½ it is a straight line down the middle and at
                // k = 1 it has swung all the way to the limb. This is why a
                // crescent's inner edge curves and its outer edge does not.
                vec3 toSun = normalize(sunDir - moonDir * dot(sunDir, moonDir));
                vec2 ax2 = normalize(vec2(dot(toSun, mx), dot(toSun, my)) + vec2(1e-5, 0.0));
                vec2 pp2 = vec2(-ax2.y, ax2.x);
                float su = dot(uv, ax2), sv = dot(uv, pp2);
                float rad = sqrt(max(0.0, 1.0 - sv * sv));
                float phase = smoothstep(-0.05, 0.05, su + (2.0 * uMoonK - 1.0) * rad);
                // Earthshine: the dark limb is not black, it is lit by us.
                sky += mDisc * face * (phase * 2.6 + 0.045) * vec3(0.96, 0.955, 0.92) * night;
              }
              // ── כּוֹכָב נוֹפֵל ──
              // One every twenty-six seconds or so, on a great circle, from a
              // hash of which twenty-six-second window it is — so it is always
              // in a different place and it never repeats within a sitting. Two
              // tenths of a second of it, which is about how long a real one
              // lasts, and the visitor who happens to be looking the right way
              // gets it and the one who is not never knows.
              float mt = uTime / 26.0;
              float ep = floor(mt), fr = fract(mt);
              if (fr < 0.085) {
                vec3 ra = normalize(vec3(hash(vec3(ep, 1.7, 3.1)) - 0.5,
                                         hash(vec3(ep, 2.3, 5.9)) * 0.55 + 0.30,
                                         hash(vec3(ep, 4.1, 7.3)) - 0.5));
                vec3 rb = normalize(ra + vec3(hash(vec3(ep, 6.7, 1.3)) - 0.5, -0.40,
                                              hash(vec3(ep, 8.9, 2.7)) - 0.5) * 0.62);
                float u2 = fr / 0.085;
                vec3 head = normalize(mix(ra, rb, u2));
                vec3 tail = normalize(mix(ra, rb, max(0.0, u2 - 0.22)));
                vec3 ab = head - tail;
                float tt = clamp(dot(d - tail, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
                float dm = length(d - (tail + ab * tt));
                // Bright at the head, gone at the tail, and the whole thing
                // fading as it burns out.
                float streak = exp(-dm * dm * 46000.0) * (0.35 + 0.65 * tt) * (1.0 - u2 * u2);
                sky += streak * vec3(1.0, 0.94, 0.80) * horizonExt * night * 2.6;
              }

              // Halo — ice in the high air, and a wide soft glow around it.
              float mh = max(mCos, 0.0);
              sky += (pow(mh, 2600.0) * 0.9 + pow(mh, 160.0) * 0.10 + pow(mh, 12.0) * 0.014)
                     * vec3(0.80, 0.86, 1.0) * night;
            }

            // Dither. Eight bits across a gradient this shallow bands visibly,
            // and a half-bit of noise is cheaper than a tenth bit of colour.
            sky += (hash(d * 1234.5 + uTime * 0.0001) - 0.5) * 0.006;

            gl_FragColor = vec4(max(sky, 0.0), 1.0);
            // A ShaderMaterial writes gl_FragColor raw — three only appends the
            // output conversion to its own materials. The sun's disc leaves this
            // in the thousands, so it needs the same ACES curve the stone gets
            // or it clips to a white hole; and then the same sRGB encode, or the
            // sky alone stays in the old space and sits visibly darker than the
            // House standing against it.
            #include <tonemapping_fragment>
            #include <encodings_fragment>
          }`,
      })
    );
    scene.add(sky);

    // Eighteen cumulus in three decks and eighteen cirrus above them — the
    // number rule, and also the smallest count at which a sky stops looking
    // like a handful of clouds someone placed. The cirrus sit at three times
    // the height and move at a third of the apparent speed, which is the only
    // parallax cue a sky has.
    const cMap = cloudTex(), ciMap = cirrusTex();
    const clouds = [];
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < 6; i++) {
        const m = new THREE.SpriteMaterial({ map: cMap, transparent: true, opacity: 0.85 - layer * 0.18, depthWrite: false, fog: false });
        const s = new THREE.Sprite(m);
        const sc = rnd(260, 480) - layer * 40;
        s.scale.set(sc, sc * 0.46, 1);
        s.position.set(rnd(-1500, 1500), 330 + layer * 130 + rnd(-30, 30), rnd(-1500, 1500));
        s.userData = { speed: 3 + layer * 3 + rnd(0, 3), mat: m, baseO: m.opacity, cirrus: false };
        scene.add(s);
        clouds.push(s);
      }
    }
    for (let i = 0; i < 18; i++) {
      const m = new THREE.SpriteMaterial({ map: ciMap, transparent: true, opacity: rnd(0.30, 0.55), depthWrite: false, fog: false });
      const s = new THREE.Sprite(m);
      const sc = rnd(700, 1250);
      s.scale.set(sc, sc * 0.20, 1);
      s.position.set(rnd(-1700, 1700), rnd(940, 1320), rnd(-1700, 1700));
      s.userData = { speed: 1.4 + rnd(0, 1.6), mat: m, baseO: m.opacity, cirrus: true };
      scene.add(s);
      clouds.push(s);
    }

    // ── אָבָק — dust in the air ───────────────────────────────────────────
    //
    // The one thing separating this from a photograph of a model was that the
    // air was perfectly clear: every stone at nine hundred amot read as
    // crisply as one at nine. Fog fixes the far distance but does nothing for
    // the near ground, and it is the near ground where heat shows.
    //
    // So: eighteen very faint sprites lying low across the precinct, drifting.
    // They keep depth testing, so the House occludes them properly and they
    // stack up in front of whatever is furthest away, which is what makes them
    // read as depth rather than as a filter over the lens. Warmest and
    // strongest at the low sun, nearly gone at midday and at night — dust is
    // only visible when something rakes across it.
    const hazeMap = hazeTex();
    const haze = [];
    for (let i = 0; i < 18; i++) {
      const m = new THREE.SpriteMaterial({
        map: hazeMap, transparent: true, opacity: 0, depthWrite: false, fog: false,
      });
      const sp = new THREE.Sprite(m);
      const sc = rnd(320, 700);
      sp.scale.set(sc, sc * rnd(0.22, 0.38), 1);
      sp.position.set(rnd(-1300, 1300), rnd(6, 74), rnd(-1300, 1300));
      sp.userData = { mat: m, base: rnd(0.08, 0.18), drift: rnd(0.6, 2.2), phase: rnd(0, 6.28) };
      scene.add(sp);
      haze.push(sp);
    }

    // ═══════════ Lights ═══════════
    const hemi = new THREE.HemisphereLight(0xcfe0ff, 0xc4b18a, 0.85);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff0d2, 1.55);
    sun.castShadow = true;
    // Shadow texel budget. The old 2048 map spread over a 1120-amah frustum
    // put one texel every half-amah, which is coarser than the stones it was
    // meant to shadow.
    //
    // Texture cap alone is the wrong test for who can afford 4096: a phone
    // will happily report a 16384 cap and then spend 64MB it does not have on
    // the depth map. Coarse pointer is the cheap proxy for "this is a handset
    // or a tablet", and those stay at 2048.
    const coarsePointer = typeof window.matchMedia === "function"
      && window.matchMedia("(pointer: coarse)").matches;
    const shadowRes = !coarsePointer && renderer.capabilities.maxTextureSize >= 8192 ? 4096 : 2048;
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
    const whiteMap = ashlar(); whiteMap.repeat.set(1.5, 1.4);
    // Hero surface: every outer wall and most of the precinct. Deep bump so
    // the drafted margins hold a shadow line, and a roughness map so the sun
    // does not slide across a whole wall at one sharpness.
    const white = pbr(whiteMap, { bump: 3.2, normalScale: 1.15, rough: [0.55, 0.95] });
    const megaMap2 = ashlar({ base: [211, 205, 189], cols: 6, courses: 3 });
    megaMap2.repeat.set(2, 2);
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
    const stoneDarkMap = ashlar({ base: [206, 196, 172] }); stoneDarkMap.repeat.set(0.5, 1);
    const stoneDarkM = pbr(stoneDarkMap, { bump: 3.0, normalScale: 1.05, rough: [0.6, 0.96] });
    // The flutes are drawn as gradient bands, so their derived normal curves a
    // flat cylinder into twenty-two real grooves — the one place where the
    // derived map is doing the whole job of geometry.
    const fluted = pbr(flutedTex(), { bump: 2.2, normalScale: 1.4, rough: [0.35, 0.68] });
    // ── Beaten gold scatters along the hammer, not evenly ──
    //
    // The facade was the largest gold surface in the House and the least
    // convincing thing in it: a flat orange slab. The reason is that
    // MeshStandardMaterial's specular lobe is isotropic — the same width in
    // every direction — and hammered plate is not. A planished surface carries
    // thousands of shallow parallel dents from the working, and light coming
    // off it is stretched across them into a band, which is why real gold
    // leaf has a sheen that travels as you move and painted gold does not.
    //
    // `MeshPhysicalMaterial.anisotropy` does this in newer three; on r128 it
    // does not exist, so this is the honest version of it — the GGX roughness
    // is split into two, wide along the hammer direction and tight across it,
    // and the specular lobe is evaluated once for each and mixed. Cheap: one
    // extra distribution and one extra visibility term per light, on the four
    // materials that are actually metal.
    //
    // The direction is taken from the surface's own UV tangent rather than a
    // world axis, so the sheen follows the plate around a corner instead of
    // sliding over it. Bent to the horizontal, because that is the way plate is
    // beaten when it is lying on a bench.
    const anisotropic = (mat, strength) => {
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uAniso = { value: strength };
        // Everything the lobe needs has to live inside BRDF_Specular_GGX
        // itself: it is a function, declared long before main, and a variable
        // set in main is not in scope there. So the tangent frame is rebuilt
        // per call from the normal, which costs a cross product and a
        // normalize and saves the whole business of threading a varying
        // through a shader three assembled.
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", `#include <common>
            uniform float uAniso;
            float anisoGGX(vec3 h, vec3 n, vec3 t, vec3 b, float ax, float ay){
              float ht = dot(h, t) / ax, hb = dot(h, b) / ay, hn = dot(h, n);
              float d = ht*ht + hb*hb + hn*hn;
              return RECIPROCAL_PI / (ax * ay * d * d);
            }`)
          .replace("float D = D_GGX( alpha, dotNH );", `float D = D_GGX( alpha, dotNH );
            {
              // The hammer runs horizontally across the plate, so the tangent
              // is the horizontal direction lying in the surface. Degenerate
              // on a floor, where the cross product vanishes and the epsilon
              // picks an arbitrary but stable direction rather than a NaN.
              vec3 aT = normalize(cross(vec3(0.0, 1.0, 0.0), normal) + vec3(1e-4, 0.0, 0.0));
              vec3 aB = cross(normal, aT);
              float ax = clamp(alpha * (1.0 + uAniso), 0.0016, 1.0);
              float ay = clamp(alpha / (1.0 + uAniso), 0.0008, 1.0);
              D = mix(D, anisoGGX(halfDir, normal, aT, aB, ax, ay), 0.8);
            }`);
      };
      mat.customProgramCacheKey = () => "aniso" + strength;
      return mat;
    };
    anisotropic(gold, 0.75);
    anisotropic(goldPlate, 0.85);
    anisotropic(bronze, 0.55);

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
    // ── מַדְרֵגוֹת — the terraces ──
    //
    // The one thing the ring of hills was still saying was "heightfield". A
    // displaced sphere with a broken silhouette is a landform; it is not a
    // landform anyone lives on. The hills around Jerusalem have been cut into
    // contour terraces for olives and vines for something like three thousand
    // years, and the terraces are the single most recognisable thing about
    // them — flat treads a few amot apart with a dry-stone riser between, held
    // level right around the contour so the winter rain stays on the slope
    // instead of taking the soil down into the wadi.
    //
    // Cheap to build, because a terrace is a quantisation. Snap each vertex's
    // height to a fixed interval and the whole hill steps; smoothstep the last
    // quarter of each interval and the riser gets a face instead of being a
    // zero-thickness cliff the normals cannot resolve. The silhouette against
    // the sky steps with it, which is the half that actually sells it — a
    // terrace painted on a smooth hill reads as stripes.
    //
    // Snapping is in local y and the mesh is squashed afterwards, so the
    // interval is divided by that squash: the treads have to come out level in
    // the world, not level in the sphere.
    const TERRACE = 11;                       // amot of rise per tread
    for (let i = 0; i < 15; i++) {
      const a = (i / 15) * Math.PI * 2 + rnd(-0.14, 0.14);
      const r = rnd(150, 300);
      // Rows in phi, and this is the whole game. A quantisation cannot put a
      // step where the mesh has no vertex to hold it: at the original 18 rows
      // there was less than one row per tread, so snapping moved each row a
      // little and the hill came out exactly as smooth as it started. It needs
      // five or six rows to a tread — one for the tread, one for the riser,
      // and slack — which at these radii means ninety-odd. Only the farmed
      // hills pay for it; the rock ones stay cheap.
      const farmed = i % 3 !== 2;
      const geo = new THREE.SphereGeometry(r, farmed ? 32 : 28, farmed ? 96 : 20);
      const pos = geo.attributes.position;
      // One random phase set per hill, so no two share a ridge line.
      const p1 = rnd(0, 6.28), p2 = rnd(0, 6.28), p3 = rnd(0, 6.28);
      // Not every hill is farmed. The steep ones are left as rock, which also
      // keeps the ring from reading as one stamp repeated fifteen times.
      const squash = rnd(0.2, 0.38);
      const step = TERRACE / squash;
      const v = new THREE.Vector3();
      for (let k = 0; k < pos.count; k++) {
        v.fromBufferAttribute(pos, k);
        const th = Math.atan2(v.z, v.x), ph = Math.acos(Math.max(-1, Math.min(1, v.y / r)));
        const d =
          // Deeper than it was. The terraces are contour lines of this field,
          // and a shallow field has near-circular contours — which came out as
          // a stack of plates rather than a farmed slope. At this amplitude the
          // lines wander round the hill the way a contour actually does.
          Math.sin(th * 3 + p1) * Math.sin(ph * 2 + p1) * 0.22 +
          Math.sin(th * 5 - p2) * Math.sin(ph * 3 + p2) * 0.11 +
          Math.sin(th * 9 + p3) * Math.sin(ph * 5 - p3) * 0.045;
        v.multiplyScalar(1 + d);
        if (farmed && v.y > 0) {
          const lvl = Math.floor(v.y / step);
          const f = v.y / step - lvl;
          // Flat for the first three quarters of the tread, then the riser.
          const u = Math.min(1, Math.max(0, (f - 0.70) / 0.30));
          v.y = (lvl + u * u * (3 - 2 * u)) * step;
        }
        pos.setXYZ(k, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      const hill = new THREE.Mesh(geo, hillMats[i % hillMats.length]);
      hill.scale.y = squash;
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
    // ═══════════ עֵצִים — the trees of the House ═══════════
    //
    // Seventy identical grey-green lollipops stood here, which is not a
    // landscape, it is one tree stamped seventy times. What follows is seven
    // species, and each one is in this scene because a source puts it here.
    //
    //   תָּמָר   date palm — Yechezkel 40:16, 26, 31 carves תִּמֹרִים, palm
    //            ornaments, onto the gates themselves, and 41:18 alternates
    //            them with cherubim along the walls of the Heichal. The House
    //            wears palms; the hillside should have the tree they are
    //            carved from. Tehillim 92:13: צַדִּיק כַּתָּמָר יִפְרָח.
    //   בְּרוֹשׁ  cypress — Yeshayahu 60:13, and the verse is explicit about
    //            why it is planted: בְּרוֹשׁ תִּדְהָר וּתְאַשּׁוּר יַחְדָּו
    //            לְפָאֵר מְקוֹם מִקְדָּשִׁי, "to beautify the place of My
    //            sanctuary." Tidhar and te'ashur are not securely identified,
    //            so only the berosh is drawn.
    //   זַיִת    olive — Shemot 27:20, the beaten oil for the light;
    //            Zechariah 4:3, two olive trees standing by the menorah.
    //   רִמּוֹן   pomegranate — Shemot 28:33 on the hem of the me'il, and
    //            Melachim I 7:20, two hundred of them on the capitals. The
    //            eighteen hidden rimonim are this tree's fruit.
    //   תְּאֵנָה  fig — Melachim I 5:5 and Micah 4:4, each man under his vine
    //            and under his fig tree, with no one to make him afraid.
    //   חָרוּב   carob — Ta'anit 23a. Choni asks the man planting one how long
    //            until it bears; seventy years, he says; as my fathers planted
    //            for me, I plant for my children.
    //   שָׁקֵד   almond — Shemot 25:33, the menorah's cups are מְשֻׁקָּדִים,
    //            almond-shaped, and Bamidbar 17:23, Aharon's staff put forth
    //            buds and bore ripe almonds overnight. Drawn in blossom.
    //
    // Where they may stand is also a source, and a strict one. Devarim 16:21:
    // לֹא־תִטַּע לְךָ אֲשֵׁרָה כָּל־עֵץ אֵצֶל מִזְבַּח ה' — you shall not
    // plant an asherah, any tree, beside the altar of Hashem. Rambam (Hilchot
    // Avodah Zarah 6:9) reads כל עץ at its word: a tree planted anywhere in the
    // azarah incurs lashes, even for beauty, even for the House's honour. So
    // not one of these stands inside the courts, and `plantable()` is what
    // enforces it. Tehillim 92:14 — שְׁתוּלִים בְּבֵית ה' בְּחַצְרוֹת
    // אֱלֹהֵינוּ יַפְרִיחוּ, planted in the House of Hashem, they flourish in
    // the courts of our G-d — has to be read as metaphor for exactly this
    // reason. The only planting in the azarah is people.
    const bark = {
      olive: new THREE.MeshStandardMaterial({ color: 0x3a3227, roughness: 0.95 }),
      palm:  new THREE.MeshStandardMaterial({ color: 0x4a3a24, roughness: 0.92 }),
      dark:  new THREE.MeshStandardMaterial({ color: 0x2b2318, roughness: 0.95 }),
    };
    // ── What day it is, inside the scene ──
    // The same arithmetic the לוּחַ panel runs, read once when the House is
    // built. Three things in here are date-aware: the almond, the chanukiah at
    // the gate, and the ox that walks in front of the bikkurim.
    const todayRD = sceneDateRD();
    const todayHeb = rdToHeb(todayRD);
    const todayChag = chagOn(todayRD, false);
    // The moon's age. Day 1 of a Hebrew month is the new moon and day 15 is
    // full, which is a fact about the calendar and not a coincidence: the month
    // is defined by the moon. Illuminated fraction from the age by the synodic
    // period, 29.530594 days.
    const moonAge = todayHeb.day - 1;
    const moonK = (1 - Math.cos((2 * Math.PI * moonAge) / 29.530594)) / 2;
    const almondInFlower = todayHeb.month === 11 || todayHeb.month === 12 || todayHeb.month === 13;

    const foliage = {
      olive:  new THREE.MeshStandardMaterial({ color: 0x2c3a1c, roughness: 0.95 }),
      cypress: new THREE.MeshStandardMaterial({ color: 0x11240f, roughness: 0.95 }),
      palm:   new THREE.MeshStandardMaterial({ color: 0x1e3a12, roughness: 0.9, side: THREE.DoubleSide }),
      rimon:  new THREE.MeshStandardMaterial({ color: 0x1b3a12, roughness: 0.9 }),
      fig:    new THREE.MeshStandardMaterial({ color: 0x21400f, roughness: 0.92 }),
      carob:  new THREE.MeshStandardMaterial({ color: 0x16290e, roughness: 0.95 }),
      // ── The almond keeps the season ──
      // It was in blossom all year, which is the one tree in this land where
      // that is a real claim and not a licence: the shaked flowers in Shevat,
      // before its own leaves and before anything else in the country, and it
      // is named for being early — שָׁקֵד, from שׁוֹקֵד, to be awake and
      // watching (Yirmiyahu 1:11–12, where the almond branch is the pun).
      // So it flowers in Shevat and Adar and is green the rest of the year,
      // which means a visitor in late January finds the grove different and
      // nobody had to tell them why.
      almond: new THREE.MeshStandardMaterial({ color: almondInFlower ? 0xe7cdd4 : 0x2c4a16, roughness: 0.9 }),
    };
    const fruit = {
      date:   new THREE.MeshStandardMaterial({ color: 0x6b2a08, roughness: 0.7 }),
      rimon:  new THREE.MeshStandardMaterial({ color: 0x8e1408, roughness: 0.55 }),
      fig:    new THREE.MeshStandardMaterial({ color: 0x3b2352, roughness: 0.7 }),
      carob:  new THREE.MeshStandardMaterial({ color: 0x241605, roughness: 0.8 }),
    };
    const bough = (mat, rt, rb, h, x, y, z, parent, tilt = 0, turn = 0) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 6), mat);
      m.position.set(x, y, z);
      m.rotation.set(tilt, turn, 0);
      m.castShadow = true;
      parent.add(m);
      return m;
    };
    const berries = (mat, n, r, y, spread, parent) => {
      for (let i = 0; i < n; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 5), mat);
        const a = rnd(0, 6.283), d = rnd(spread * 0.4, spread);
        b.position.set(Math.cos(a) * d, y + rnd(-spread * 0.4, spread * 0.3), Math.sin(a) * d);
        b.castShadow = true;
        parent.add(b);
      }
    };

    // Every builder returns a group whose origin sits at the foot of the trunk,
    // so a caller only has to know the ground height.
    const TREES = {
      // A bare ringed column with the whole crown at the top: no other tree in
      // the land has this silhouette, and it is the one the gates are carved
      // with. Fronds are flattened cones, drooping further the older the leaf.
      tamar(sc = 1) {
        const g = new THREE.Group();
        const h = rnd(15, 23) * sc;
        bough(bark.palm, 0.62 * sc, 1.05 * sc, h, 0, h / 2, 0, g, 0, 0);
        // Old frond bases left on the trunk as a scaly collar.
        for (let i = 0; i < 7; i++) {
          const k = new THREE.Mesh(new THREE.ConeGeometry(0.9 * sc, 0.7 * sc, 5), bark.palm);
          k.position.set(0, h * (0.30 + i * 0.085), 0);
          k.rotation.set(Math.PI / 2.2, (i * 2.4) % 6.283, 0);
          g.add(k);
        }
        // A frond is not a spoke. Laid out flat and radiating, eleven of them
        // read as a green asterisk from any raised camera — which is most of
        // this scene. A real frond leaves the crown climbing, then arches over
        // under its own weight, and the whole crown is a fountain.
        //
        // So each one is two segments hung off nested pivots: the outer group
        // sets the compass bearing, the inner sets how far the frond has bent
        // down. Nesting rather than one Euler because the order then cannot be
        // got wrong. The second segment carries more bend than the first, which
        // is the arch.
        const fronds = 14;
        for (let i = 0; i < fronds; i++) {
          const yaw = new THREE.Group();
          yaw.position.y = h;
          yaw.rotation.y = (i / fronds) * 6.283 + rnd(-0.18, 0.18);
          // Youngest fronds stand near-upright at the heart, oldest hang below
          // the horizontal. Spread across the ring so the crown has a top.
          const bend = -0.55 + (i / fronds) * 1.75 + rnd(-0.12, 0.12);
          const len = rnd(7, 10.5) * sc;
          const seg = (l, w, drop, atX) => {
            const pit = new THREE.Group();
            pit.rotation.z = -drop;
            pit.position.x = atX;
            const blade = new THREE.Mesh(new THREE.ConeGeometry(w, l, 4), foliage.palm);
            blade.scale.set(1, 1, 0.16);        // flatten the cone into a blade
            blade.rotation.z = -Math.PI / 2;    // lay it along +X
            blade.position.x = l / 2;
            blade.castShadow = true;
            pit.add(blade);
            return pit;
          };
          const inner = seg(len * 0.55, 1.15 * sc, bend, 0);
          const outer = seg(len * 0.5, 0.72 * sc, 0.5 + bend * 0.35, len * 0.55);
          inner.add(outer);
          yaw.add(inner);
          g.add(yaw);
        }
        const dates = new THREE.Group();
        dates.position.y = h - 1.2 * sc;
        berries(fruit.date, 14, 0.34 * sc, 0, 1.7 * sc, dates);
        g.add(dates);
        return g;
      },
      // Yeshayahu's tree, and the only true spire in the scene — it does the
      // job of a vertical accent that nothing else here can.
      berosh(sc = 1) {
        const g = new THREE.Group();
        const h = rnd(14, 21) * sc;
        bough(bark.dark, 0.4 * sc, 0.75 * sc, h * 0.3, 0, h * 0.15, 0, g);
        // Three overlapping cones, each leaning and turned a little off the
        // last. One clean cone is a traffic cone; the offsets are what make it
        // a tree that grew. Widest low, narrowest at the tip.
        const tiers = [
          { r: h * 0.21, l: h * 0.58, y: h * 0.36 },
          { r: h * 0.17, l: h * 0.62, y: h * 0.56 },
          { r: h * 0.11, l: h * 0.46, y: h * 0.80 },
        ];
        for (const [i, t] of tiers.entries()) {
          const c = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.l, 7), foliage.cypress);
          c.position.set(rnd(-0.3, 0.3) * sc, t.y, rnd(-0.3, 0.3) * sc);
          c.rotation.set(rnd(-0.05, 0.05), i * 0.9, rnd(-0.05, 0.05));
          c.castShadow = true;
          g.add(c);
        }
        return g;
      },
      zayit(sc = 1) {
        const g = new THREE.Group();
        const h = rnd(4.5, 7) * sc;
        // Old olives split low and lean apart; that fork is the whole read.
        bough(bark.olive, 0.75 * sc, 1.25 * sc, h, 0, h / 2, 0, g, rnd(-0.1, 0.1));
        const arms = 2 + (Math.random() < 0.5 ? 1 : 0);
        for (let i = 0; i < arms; i++) {
          const a = (i / arms) * 6.283 + rnd(-0.4, 0.4);
          const l = rnd(2.6, 4.2) * sc;
          const arm = bough(bark.olive, 0.35 * sc, 0.6 * sc, l, 0, h + l * 0.3, 0, g);
          arm.rotation.set(rnd(0.35, 0.7), a, 0);
          arm.position.set(Math.cos(a) * l * 0.3, h + l * 0.28, Math.sin(a) * l * 0.3);
          const lobe = makeCanopy(rnd(2.4, 3.6) * sc, foliage.olive, 2);
          lobe.position.set(Math.cos(a) * l * 0.75, h + l * 0.55, Math.sin(a) * l * 0.75);
          g.add(lobe);
        }
        return g;
      },
      rimon(sc = 1) {
        const g = new THREE.Group();
        const h = rnd(3.2, 4.6) * sc;
        bough(bark.olive, 0.45 * sc, 0.7 * sc, h, 0, h / 2, 0, g, rnd(-0.12, 0.12));
        const cr = makeCanopy(rnd(2.6, 3.6) * sc, foliage.rimon, 3);
        cr.position.y = h + 1.8 * sc; g.add(cr);
        berries(fruit.rimon, 9, 0.5 * sc, h + 1.6 * sc, 2.6 * sc, g);
        return g;
      },
      te_enah(sc = 1) {
        const g = new THREE.Group();
        const h = rnd(3.4, 4.8) * sc;
        bough(bark.olive, 0.8 * sc, 1.15 * sc, h, 0, h / 2, 0, g);
        // The fig is wider than it is tall — that spread is why the phrase is
        // "under his fig tree".
        const cr = makeCanopy(rnd(4.2, 5.8) * sc, foliage.fig, 4);
        cr.scale.set(1.25, 0.62, 1.25);
        cr.position.y = h + 1.4 * sc; g.add(cr);
        berries(fruit.fig, 7, 0.36 * sc, h + 1.2 * sc, 3.4 * sc, g);
        return g;
      },
      charuv(sc = 1) {
        const g = new THREE.Group();
        const h = rnd(4.5, 6.5) * sc;
        bough(bark.dark, 1.0 * sc, 1.5 * sc, h, 0, h / 2, 0, g);
        const cr = makeCanopy(rnd(5, 6.8) * sc, foliage.carob, 4);
        cr.scale.set(1.1, 0.8, 1.1);
        cr.position.y = h + 2.4 * sc; g.add(cr);
        berries(fruit.carob, 10, 0.26 * sc, h + 2 * sc, 4 * sc, g);
        return g;
      },
      shaked(sc = 1) {
        const g = new THREE.Group();
        const h = rnd(4, 5.6) * sc;
        bough(bark.olive, 0.42 * sc, 0.66 * sc, h, 0, h / 2, 0, g, rnd(-0.1, 0.1));
        const cr = makeCanopy(rnd(2.8, 4) * sc, foliage.almond, 4);
        cr.scale.set(1.1, 0.78, 1.1);
        cr.position.y = h + 1.9 * sc; g.add(cr);
        return g;
      },
    };

    // ── Merging ──────────────────────────────────────────────────────────
    //
    // A hundred and eight trees built from primitives is about thirteen hundred
    // meshes, and thirteen hundred draw calls a frame for scenery that never
    // moves is indefensible. The usual answer is
    // BufferGeometryUtils.mergeBufferGeometries, but that lives in
    // three/examples/jsm and importing it would end the `react` + `three` and
    // nothing else rule this component is built on.
    //
    // So: merge here. Walk a group, bake each mesh's world matrix into its
    // vertices, and concatenate everything sharing a material into one buffer.
    // The grove goes from ~1300 draw calls to one per material. Geometries are
    // de-indexed first, which costs vertices but makes concatenation a
    // straight copy with no index rebasing to get wrong.
    //
    // The trade is frustum culling: one merged mesh spanning the whole ring is
    // never culled, so it is always submitted. For static scenery at this count
    // that is still overwhelmingly the better side of the bargain.
    // `sway` bakes a per-vertex weight for the wind shader below. It has to
    // happen here, at merge time, because this is the last moment each vertex
    // still knows which tree it came off — afterwards it is one anonymous
    // buffer spanning the whole ring. Weight is height above that tree's own
    // foot, squared: the squaring keeps the first few amot almost still, so a
    // canopy does not shear away from the trunk it is sitting on, while the
    // frond tips get the whole amplitude.
    const mergeByMaterial = (root, { sway = false, swaySpan = 15 } = {}) => {
      root.updateMatrixWorld(true);
      const buckets = new Map();
      const foot = new THREE.Vector3();
      for (const cluster of root.children) {
        cluster.getWorldPosition(foot);
        const y0 = foot.y;
        cluster.traverse((o) => {
          if (!o.isMesh) return;
          const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone());
          g.applyMatrix4(o.matrixWorld);   // also runs the normal matrix
          if (sway) {
            const pos = g.attributes.position;
            const w = new Float32Array(pos.count);
            for (let i = 0; i < pos.count; i++) {
              const t = Math.min(1, Math.max(0, (pos.getY(i) - y0) / swaySpan));
              w[i] = t * t;
            }
            g.setAttribute("aSway", new THREE.BufferAttribute(w, 1));
          }
          if (!buckets.has(o.material)) buckets.set(o.material, []);
          buckets.get(o.material).push(g);
        });
      }
      const out = new THREE.Group();
      for (const [mat, geos] of buckets) {
        let total = 0;
        for (const g of geos) total += g.attributes.position.count;
        const pos = new Float32Array(total * 3);
        const nor = new Float32Array(total * 3);
        const uv = new Float32Array(total * 2);
        const sw = sway ? new Float32Array(total) : null;
        let o3 = 0, o2 = 0, o1 = 0;
        for (const g of geos) {
          const n = g.attributes.position.count;
          pos.set(g.attributes.position.array, o3);
          if (g.attributes.normal) nor.set(g.attributes.normal.array, o3);
          if (g.attributes.uv) uv.set(g.attributes.uv.array, o2);
          if (sw && g.attributes.aSway) sw.set(g.attributes.aSway.array, o1);
          o3 += n * 3; o2 += n * 2; o1 += n;
          g.dispose();
        }
        const merged = new THREE.BufferGeometry();
        merged.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        merged.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
        merged.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
        if (sw) merged.setAttribute("aSway", new THREE.BufferAttribute(sw, 1));
        merged.computeBoundingSphere();
        const m = new THREE.Mesh(merged, mat);
        m.castShadow = m.receiveShadow = true;
        // Same gust in the depth pass as on the surface, or the shadow stands
        // still while the tree bends.
        if (sway && mat.userData.windAmp !== undefined) {
          m.customDepthMaterial = windDepth(mat.userData.windAmp);
        }
        out.add(m);
      }
      return out;
    };

    // ── רוּחַ — wind ──────────────────────────────────────────────────────
    //
    // Nothing in this landscape moved except the doves and the fire, and the
    // palms were the worst of it: the most flexible thing on screen and the
    // most rigid in fact. But the grove is merged now — one buffer per material
    // for the whole ring — so there is no per-tree object left to rotate. The
    // motion has to happen in the vertex shader, which is where foliage wind
    // belongs anyway.
    //
    // Two sines at incommensurate rates so the gust never visibly loops, phased
    // by world position so it crosses the grove as a front rather than pulsing
    // everywhere at once. Amplitude is the baked aSway weight, so a trunk
    // stands still and a frond tip travels.
    //
    const windU = { value: 0 };
    // The same two sines the shader runs, evaluated in JS. The wind you hear
    // and the wind you watch were previously two unrelated clocks — the trees
    // bent on uWind while the bed swelled on sin(t*0.11)*sin(t*0.043), so a
    // visitor standing among the palms heard a lull exactly as the fronds
    // threw themselves over. One signal now, sampled where the camera stands.
    const gustAt = (x, z, tt) => {
      const ph = x * 0.021 + z * 0.016;
      return Math.sin(tt * 0.85 + ph) * 0.62 + Math.sin(tt * 1.63 + ph * 2.3) * 0.38;
    };
    // The displacement itself, lifted out of the surface material so the depth
    // material can run the identical arithmetic. It has to be identical, not
    // merely similar: a shadow drawn from a slightly different gust is worse
    // than one that does not move at all, because the eye reads the mismatch
    // as the tree floating off its own shadow.
    const swayPatch = (shader, amp) => {
      shader.uniforms.uWind = windU;
      shader.uniforms.uAmp = { value: amp };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>
          attribute float aSway;
          uniform float uWind;
          uniform float uAmp;`)
        .replace("#include <begin_vertex>", `#include <begin_vertex>
          {
            float ph = transformed.x * 0.021 + transformed.z * 0.016;
            float gust = sin(uWind * 0.85 + ph) * 0.62
                       + sin(uWind * 1.63 + ph * 2.3) * 0.38;
            transformed.x += gust * aSway * uAmp;
            transformed.z += gust * aSway * uAmp * 0.55;
            transformed.y -= abs(gust) * aSway * uAmp * 0.12;
          }`);
    };
    const windward = (mat, amp) => {
      mat.onBeforeCompile = (shader) => swayPatch(shader, amp);
      // Distinct cache keys, or three reuses one compiled program for every
      // amplitude and the whole grove bends like a palm.
      mat.customProgramCacheKey = () => "wind" + amp;
      // Carried on the material so the merge, which is the only place that
      // knows which mesh ends up with which material, can hang the matching
      // depth material off the mesh.
      mat.userData.windAmp = amp;
      return mat;
    };
    // ── The shadows move too ──
    //
    // Shadow casting does not use the surface material. three swaps in a
    // MeshDepthMaterial for the depth pass, and that one was unpatched — so
    // every tree in the grove threw a shadow of where it would have been
    // standing in still air. It read as fine from the orbit camera because the
    // sun is high and the shadows are short; from underneath a palm at dusk,
    // with the fronds travelling most of an amah, the tree and its shadow had
    // visibly nothing to do with each other.
    //
    // A material assigned to `mesh.customDepthMaterial` is used in place of the
    // swapped-in one, so this is the same displacement compiled into the depth
    // program. RGBADepthPacking because that is what a directional light's
    // shadow map wants.
    const windDepth = (amp) => {
      const d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
      d.onBeforeCompile = (shader) => swayPatch(shader, amp);
      d.customProgramCacheKey = () => "winddepth" + amp;
      return d;
    };
    // A frond is a sail; a cypress barely gives. Amplitudes are in amot.
    windward(foliage.palm, 1.5);
    windward(foliage.almond, 0.62);
    windward(foliage.fig, 0.55);
    windward(foliage.olive, 0.48);
    windward(foliage.rimon, 0.45);
    windward(foliage.carob, 0.38);
    windward(foliage.cypress, 0.22);

    // Devarim 16:21 in code. Nothing may be planted inside the precinct, so the
    // whole plaza footprint plus its stairs is refused outright.
    const plantable = (x, z) => !(Math.abs(x) < HALF + 90 && Math.abs(z) < HALF + 110);

    // Trees are planted into a holding group, not the scene, so the whole
    // grove can be merged in one pass once it is complete.
    const grove = new THREE.Group();
    const plant = (kind, x, z, y = LAND_Y, sc = 1) => {
      if (!plantable(x, z)) return null;
      const t = TREES[kind](sc);
      t.position.set(x, y, z);
      t.rotation.y = rnd(0, 6.283);
      grove.add(t);
      return t;
    };

    // Ninety trees: חי times five. The grove is weighted the way the hills
    // around Jerusalem are — mostly olive, with the palms and cypresses set
    // nearer the approach where their height does the most work.
    const GROVE = [
      ["zayit", 40], ["tamar", 18], ["berosh", 16],
      ["charuv", 12], ["te_enah", 10], ["shaked", 7], ["rimon", 5],
    ];
    for (const [kind, count] of GROVE) {
      let placed = 0, guard = 0;
      while (placed < count && guard++ < count * 40) {
        const a = rnd(0, Math.PI * 2);
        // Palms and cypresses crowd the approach; the orchard trees sit back.
        const near = kind === "tamar" || kind === "berosh";
        const r = near ? rnd(430, 700) : rnd(470, 1020);
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (plant(kind, x, z, LAND_Y, rnd(0.85, 1.2))) placed++;
      }
    }
    scene.add(mergeByMaterial(grove, { sway: true }));

    // ── Ground cover ─────────────────────────────────────────────────────
    //
    // Two problems, one fix. The dust met the plaza at a drawn line — stone
    // stopped, ground started, nothing in between — which is the giveaway that
    // a thing was modelled rather than built somewhere. And the plain between
    // the trees was empty in a way the Judean hills are not: they are covered
    // in low grey-green scrub and loose limestone, right up to whatever has
    // been built on them.
    //
    // So: a band that thickens as it approaches the precinct and spills over
    // the edge of the paving, which is what makes the join stop reading as a
    // line. Merged like the grove, and swayed like it too — over a much shorter
    // span, so a knee-high bush trembles instead of leaning.
    const scrubMat = new THREE.MeshStandardMaterial({ color: 0x38401f, roughness: 0.98 });
    const sageMat = new THREE.MeshStandardMaterial({ color: 0x4a4c34, roughness: 0.98 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x9c8f74, roughness: 0.95 });
    windward(scrubMat, 0.3);
    windward(sageMat, 0.26);

    const scrub = new THREE.Group();
    const bush = (x, z, sc, mat) => {
      const g = new THREE.Group();
      const lobes = 2 + (Math.random() < 0.6 ? 1 : 0);
      for (let i = 0; i < lobes; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.7, 1.35) * sc, 6, 5), mat);
        b.position.set(rnd(-0.8, 0.8) * sc, rnd(0.35, 0.8) * sc, rnd(-0.8, 0.8) * sc);
        b.scale.set(1, rnd(0.45, 0.7), 1);          // wind-pruned: wider than tall
        b.castShadow = true;
        g.add(b);
      }
      g.position.set(x, LAND_Y, z);
      scrub.add(g);
    };
    const rock = (x, z, sc) => {
      const g = new THREE.Group();
      const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rnd(0.6, 1.5) * sc, 0), rockMat);
      r.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
      r.scale.set(1, rnd(0.5, 0.8), rnd(0.8, 1.2));
      r.position.y = rnd(0.1, 0.4) * sc;            // half-buried, not resting on top
      r.castShadow = true;
      g.add(r);
      g.position.set(x, LAND_Y, z);
      scrub.add(g);
    };

    // 216 bushes — חי times twelve. Biased hard toward the precinct: r is
    // drawn from a square root so the ring's area does not spread them evenly,
    // which would leave the near ground as bare as the far.
    for (let i = 0; i < 216; i++) {
      const a = rnd(0, Math.PI * 2);
      const u = Math.random();
      const r = 300 + (1 - Math.sqrt(u)) * 820;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!plantable(x, z)) continue;
      bush(x, z, rnd(0.7, 1.5), Math.random() < 0.45 ? sageMat : scrubMat);
    }
    // A deliberate fringe hugging the paving, inside the tree exclusion but
    // outside the stone, so the edge is broken rather than drawn.
    for (let i = 0; i < 108; i++) {
      const side = i % 4, t2 = rnd(-1, 1);
      const off = rnd(4, 34);
      const near = HALF + 46 + off;
      const [x, z] = side === 0 ? [t2 * near, near] : side === 1 ? [t2 * near, -near]
                   : side === 2 ? [near, t2 * near] : [-near, t2 * near];
      bush(x, z, rnd(0.5, 1.05), Math.random() < 0.5 ? sageMat : scrubMat);
    }
    // 108 stones, thickest where the ground has been walked and scuffed.
    for (let i = 0; i < 108; i++) {
      const a = rnd(0, Math.PI * 2);
      const r = 300 + (1 - Math.sqrt(Math.random())) * 700;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!plantable(x, z)) continue;
      rock(x, z, rnd(0.6, 1.6));
    }
    // Short span: a bush is one amah of stem, not fifteen of trunk.
    scene.add(mergeByMaterial(scrub, { sway: true, swaySpan: 2.2 }));

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
    // Festival lights that only exist on their own day; flickered by the same
    // loop the wall torches are.
    const festivalFlames = [];
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
    // The floor is laid as its own plane rather than left as the block's top
    // face, because a BoxGeometry gives every face the same 0..1 UV: any repeat
    // that suits the 260-amah floor makes nonsense of the 10-amah sides. One
    // tile here is about 26 amot, so a slab is roughly six — a stone two men
    // can set, which is what the courts were paved with.
    const courtMap = courtStoneTex(); courtMap.repeat.set(10, 8);
    const courtFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(IC + 50, IC),
      // Shallow relief: this stone is dressed flat and polished, so the joints
      // want to catch light, not cast shadows. The roughness map does the real
      // work — a polished floor's highlight breaks up across the slabs.
      pbr(courtMap, { bump: 1.2, normalScale: 0.35, rough: [0.18, 0.46] })
    );
    courtFloor.rotation.x = -Math.PI / 2;
    courtFloor.position.set(-60, IC_H + 0.04, 0);   // clear of the block's top face
    courtFloor.receiveShadow = true;
    scene.add(courtFloor);
    const IC_E = -60 + (IC + 50) / 2; // = 70, eastern edge of inner court
    // Fifteen steps, fifteen Shir HaMa'alot — so each one is tuned and can be
    // struck. Each gets its own material so it can flash when it sounds.
    const stepMeshes = [];
    // s = 0 is the lowest step, farthest east; s = 14 is the top one at Nicanor.
    // The ascent has to rise westward with groundHeight(), or the walk surface
    // and the marble disagree and the top step vanishes inside the court slab.
    const SH = IC_H / 15;              // one degree of the ascent
    const SD = SH + 0.15;              // a little deeper than the rise, so no gaps
    const stepTop = (s) => s * SH + SD / 2;
    for (let s = 0; s < 15; s++) {
      const w = 70 - s * 2.4;
      const mat = marble.clone();
      mat.emissive = new THREE.Color(0xffd24a);
      mat.emissiveIntensity = 0;
      const st = box(2.6, SD, w, mat, IC_E + (14 - s) * 2.6, s * SH, 0);
      st.userData.step = s;            // the lowest step is the lowest note
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
    const laverWaterMat = new THREE.MeshStandardMaterial({ color: 0x22809f, metalness: 0.4, roughness: 0.08, envMap, envMapIntensity: 1 });
    metals.push(laverWaterMat);
    const laverWater = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 0.3, 14), laverWaterMat);
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
    // Flat boxes in one flat blue, with the whole river pulsing opacity
    // together — the last surface in the House with no material on it at all.
    // Water reads as water for two reasons: it reflects the sky, and its
    // surface moves. So it gets the environment map the metals use, and a
    // derived ripple normal that is scrolled along the current every frame.
    //
    // There is no colour map here on purpose. three builds one UV transform per
    // material and takes it from `map` when there is one — with none, the
    // normal map's own offset drives it, which is exactly the handle the
    // current needs.
    const waterNormal = normalFromCanvas(rippleTex().image, 1.7);
    waterNormal.repeat.set(9, 1.4);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1a7a9e, transparent: true, opacity: 0.72,
      metalness: 0.35, roughness: 0.07,
      normalMap: waterNormal, normalScale: new THREE.Vector2(0.5, 0.5),
      envMap, envMapIntensity: 1,
    });
    // Joins the metals so the day/night ramp dims its reflection too: at night
    // there is far less sky for the river to hold.
    metals.push(waterMat);
    const streams = [];
    // The court's own reach of the river, written as its edges rather than as
    // a width and a centre, because the kohanim have to know where it is: it
    // runs from under the threshold of the House (x = −106, its eastern face)
    // to past the eastern edge of the azarah, four amot across, south of the
    // altar as Yechezkel 47:1 has it. Nothing else in the court divides it end
    // to end, so anyone walking from the kiyor to the altar must cross here.
    const AMAH_X0 = -106, AMAH_X1 = 90, AMAH_Z0 = 28, AMAH_Z1 = 32;
    const inAmah = (x, z) => x > AMAH_X0 && x < AMAH_X1 && z > AMAH_Z0 && z < AMAH_Z1;
    // A thrown droplet reads at eye height and disappears from above, which is
    // where this House is mostly watched from — and the sprite pool is additive,
    // which over sunlit stone adds nothing at all, the same trap the beacon fell
    // into. So the water answers twice: droplets off the foot, and a ring
    // opening on the surface where the foot went in. The ring is normally
    // blended and pale against a mid-blue river, so it reads from any angle and
    // at any hour.
    const ripples = [];
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.18, 6, 22),
        new THREE.MeshBasicMaterial({ color: 0xeaf8ff, transparent: true, opacity: 0, depthWrite: false })
      );
      m.rotation.x = Math.PI / 2;
      m.visible = false;
      m.userData.life = 0;
      scene.add(m);
      ripples.push(m);
    }
    let rippleNext = 0;
    const ripple = (x, z) => {
      const m = ripples[(rippleNext = (rippleNext + 1) % ripples.length)];
      m.position.set(x, IC_H + 0.78, z);
      m.scale.set(1, 1, 1);
      m.userData.life = 1;
      m.visible = true;
    };
    streams.push(box(AMAH_X1 - AMAH_X0, 0.5, AMAH_Z1 - AMAH_Z0, waterMat,
                     (AMAH_X0 + AMAH_X1) / 2, IC_H + 0.32, (AMAH_Z0 + AMAH_Z1) / 2));
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
    // Yechezkel 47:12 is specific about what grows on these banks: כָּל־עֵץ
    // מַאֲכָל, every tree of food, its fruit renewed month by month. So the
    // river is planted only with the bearing species, cycling so no two
    // neighbours match — and nine a side makes eighteen, חי, which is the
    // right number for a bank whose whole business is healing.
    //
    // These are the one exception to plantable(): they stand on the river's
    // banks outside the precinct, which is where the pasuk puts them. Nothing
    // here crosses into the azarah.
    const RIVER_TREES = ["tamar", "rimon", "te_enah"];
    const riverGrove = new THREE.Group();
    for (let t = 0; t < 9; t++) {
      const tx = 190 + t * 62 + (t % 2) * 18;
      const ty = tx > HALF + 39 ? LAND_Y : 0;
      for (const sgn of [-1, 1]) {
        const tz = 30 + sgn * (15 + (t % 3) * 5);
        const kind = RIVER_TREES[(t + (sgn > 0 ? 1 : 0)) % RIVER_TREES.length];
        const tr = TREES[kind](kind === "tamar" ? 0.7 : 1.05);
        tr.position.set(tx, ty, tz);
        tr.rotation.y = rnd(0, 6.283);
        riverGrove.add(tr);
      }
    }
    scene.add(mergeByMaterial(riverGrove, { sway: true }));

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
    // These waypoints are walked by lerp, with no collision resolution behind
    // them — the kohanim are the one thing in the House that can pass through
    // stone — so every leg has to be laid clear of the colliders by hand.
    // Three of them were not:
    //   · path 5 ran straight through the Temple platform, which stands six
    //     amot proud of the azarah. Its two kohanim were buried inside the
    //     marble for most of the loop and simply could not be seen.
    //   · paths 2 and 6 each parked a waypoint in the middle of the amah, so a
    //     kohen turned a corner standing in the water. Crossing it is right;
    //     loitering in it is not, so both were moved to the southern bank.
    //   · path 2's fifth leg clipped the southwestern corner of the altar.
    //     Moving its waypoint off the water cleared that as well.
    // Six of the twelve still cross the amah twice a loop, which is as it
    // should be — the kiyor stands on the southern bank and the altar on the
    // northern, so the walk to the service crosses the water by design.
    const KOHEN_PATHS = [
      [[30, -70], [55, -30], [30, 40], [-40, 60], [-70, 20], [-60, -50]],
      [[-90, 40], [-60, 75], [0, 80], [40, 60], [12, 36], [-50, 10]],
      [[50, -80], [20, -95], [-30, -80], [-60, -40], [-30, -20], [20, -45]],
      [[-100, -30], [-80, -70], [-40, -90], [-10, -60], [-50, -35], [-85, -5]],
      [[-88, -52], [-142, -56], [-180, -78], [-158, -100], [-100, -96], [-72, -70]],
      [[58, -18], [40, 22], [0, 62], [-40, 88], [8, 70], [50, 36]],
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
      f.position.set(sx, stepTop(step), -30 + l * 12);
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
    fox.userData = { id: 8, tail, head: fh, snout, face: -0.7, home: new THREE.Vector3(70, LAND_Y, HALF + 90) };
    scene.add(fox);
    clickables.push(fox);

    // ═══════════ גְּמַלִּים — the camels of the nations ═══════════
    //
    // Yeshayahu 60:6, the same chapter that sends the berosh to beautify the
    // Sanctuary thirteen verses later: שִׁפְעַת גְּמַלִּים תְּכַסֵּךְ ...
    // כֻּלָּם מִשְּׁבָא יָבֹאוּ זָהָב וּלְבוֹנָה יִשָּׂאוּ — a multitude of
    // camels shall cover you, all of them from Sheva shall come, bearing gold
    // and frankincense, and heralding the praises of Hashem.
    //
    // Both halves of that load already have a home in this House: the gold is
    // on the facade, and the לְבוֹנָה is one of the eleven spices of the
    // ketoret (Keritot 6a) and the two spoonfuls set beside the lechem hapanim
    // (Vayikra 24:7). So the camels are drawn arriving, still loaded, below the
    // southern stairs where a pilgrim road would come up — outside the walls,
    // because a camel has no business in the courts.
    const camelHide = new THREE.MeshStandardMaterial({ color: 0x6b5433, roughness: 0.95 });
    const camelPale = new THREE.MeshStandardMaterial({ color: 0x8a7150, roughness: 0.95 });
    const pannier = new THREE.MeshStandardMaterial({ color: 0x5c1f1a, roughness: 0.9 });
    const makeCamel = (couched = false) => {
      const g = new THREE.Group();
      const lift = couched ? 2.2 : 5.6;          // a couched camel folds to the ground
      const body = new THREE.Mesh(new THREE.SphereGeometry(3, 11, 9), camelHide);
      body.scale.set(1.75, 0.95, 1.05);
      body.position.y = lift; body.castShadow = true; g.add(body);
      // The hump is the whole silhouette; one, so it reads as a dromedary.
      const hump = new THREE.Mesh(new THREE.SphereGeometry(1.9, 9, 7), camelHide);
      hump.scale.set(1.15, 1.05, 0.95);
      hump.position.set(-0.2, lift + 2.1, 0); hump.castShadow = true; g.add(hump);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 1.15, 5.4, 7), camelHide);
      neck.position.set(3.6, lift + 2.2, 0);
      neck.rotation.z = couched ? -0.95 : -0.42;  // a resting camel lowers its head
      neck.castShadow = true; g.add(neck);
      const head = new THREE.Mesh(new THREE.SphereGeometry(1.05, 9, 7), camelPale);
      const hx = couched ? 5.6 : 5.3, hy = lift + (couched ? 4.0 : 4.9);
      head.scale.set(1.35, 0.9, 0.9);
      head.position.set(hx, hy, 0); head.castShadow = true; g.add(head);
      const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.6, 7, 6), camelPale);
      muzzle.scale.set(1.4, 0.8, 0.8);
      muzzle.position.set(hx + 1.25, hy - 0.35, 0); g.add(muzzle);
      for (const es of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.6, 5), camelPale);
        ear.position.set(hx - 0.5, hy + 0.85, es * 0.5); g.add(ear);
      }
      // Legs: standing they are straight columns, couched they fold under and
      // only the knee shows.
      for (let l = 0; l < 4; l++) {
        const fore = l < 2;
        const lx = fore ? 2.4 : -2.6, lz = (l % 2 ? 1 : -1) * 1.35;
        if (couched) {
          const knee = new THREE.Mesh(new THREE.SphereGeometry(0.85, 7, 6), camelHide);
          knee.position.set(lx, 1.1, lz); knee.castShadow = true; g.add(knee);
        } else {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.46, 5.4, 6), camelHide);
          leg.position.set(lx, 2.7, lz); leg.castShadow = true; g.add(leg);
          const knee = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), camelHide);
          knee.position.set(lx, 3.4, lz); g.add(knee);
        }
      }
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 2.6, 5), camelHide);
      tail.position.set(-5.2, lift + 0.6, 0); tail.rotation.z = 0.5; g.add(tail);
      // The load. Panniers either flank, gold in one and levonah in the other.
      for (const ps of [-1, 1]) {
        const bag = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, 1.4), pannier);
        bag.position.set(-0.4, lift + 0.5, ps * 2.2);
        bag.rotation.z = 0.06; bag.castShadow = true; g.add(bag);
      }
      const ingots = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 1.1), gold);
      ingots.position.set(-0.4, lift + 1.9, 2.2); ingots.castShadow = true; g.add(ingots);
      const resin = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 6), marble);
      resin.scale.set(1.5, 0.7, 1); resin.position.set(-0.4, lift + 1.8, -2.2); g.add(resin);
      return g;
    };
    // Three, arriving: one already couched and unloading, two still standing.
    // They sit below the southern approach on the surrounding land, well
    // outside plantable()'s precinct box, so nothing crowds the stairs.
    // Set east of centre: due south they sat under the on-screen nav pad in
    // the opening framing, which is the one place nothing worth seeing should
    // go. Here they read against open dust with the stairs behind them.
    const CAMELS = [
      { x: 132, z: HALF + 116, ry: -0.55, couched: true },
      { x: 178, z: HALF + 142, ry: -1.2, couched: false },
      { x: 216, z: HALF + 108, ry: -0.85, couched: false },
    ];
    // The nearest camel, kept for the sound bed: a grunt should come from a
    // particular animal at a particular place, not from the caravan in general.
    const camelAt = new THREE.Vector3(CAMELS[0].x, LAND_Y + 6, CAMELS[0].z);
    for (const c of CAMELS) {
      const cm = makeCamel(c.couched);
      cm.position.set(c.x, LAND_Y, c.z);
      cm.rotation.y = c.ry;
      scene.add(cm);
    }

    // The scene clock, stamped once a frame by the loop below. Declared up
    // here because the flock is laid out at build time and wants to read it.
    let nowT = 0;

    // ═══════════ צֹאן — a flock on the approach ═══════════
    //
    // Most korbanot walked to Jerusalem. Devarim 14:24–25 makes the concession
    // explicit — if the road is too long, sell it and carry the silver — which
    // is worth reading the other way round: unless the road was too long, the
    // animal came up on its own feet. So the last mile of the pilgrim road
    // south of the stairs had sheep on it, and this one has had nothing on it
    // at all, which is also the reason the middle distance has been reading as
    // empty ground between two things worth looking at.
    //
    // Eighteen, which is the number rule, and two draw calls, which is the
    // budget: the whole animal is merged down to one geometry of wool and one
    // of face, and eighteen of each are drawn as instances. That is why they
    // move as rigid bodies — a grazing sheep pitches its whole front end down
    // here rather than lowering a head, which is close enough at two hundred
    // amot and costs nothing per frame but a matrix.
    const wool = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.96 });
    const woolDark = new THREE.MeshStandardMaterial({ color: 0x4a4238, roughness: 0.9 });
    const sheepProto = new THREE.Group();
    {
      // Fleece: three overlapping lobes, because a single ellipsoid reads as a
      // pill and a fleece is lumpy — the same argument the trees settled.
      for (const [lx, ly, lz, r] of [[0, 0, 0, 1.30], [0.62, 0.10, 0, 1.05], [-0.66, 0.04, 0, 1.02]]) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 7), wool);
        b.scale.set(1.16, 0.92, 1.0);
        b.position.set(lx, 2.05 + ly, lz);
        b.castShadow = true; sheepProto.add(b);
      }
      // Legs: dark, thin, and short. They are four dots at distance and the
      // thing that stops the fleece looking like a boulder.
      for (let l = 0; l < 4; l++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 1.5, 5), woolDark);
        leg.position.set(l < 2 ? 0.78 : -0.72, 0.75, (l % 2 ? 1 : -1) * 0.52);
        leg.castShadow = true; sheepProto.add(leg);
      }
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.46, 0.9, 6), wool);
      neck.position.set(1.55, 2.35, 0); neck.rotation.z = -0.55; sheepProto.add(neck);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), woolDark);
      head.scale.set(1.5, 0.92, 0.9);
      head.position.set(2.12, 2.18, 0); head.castShadow = true; sheepProto.add(head);
      for (const es of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.17, 5, 4), woolDark);
        ear.scale.set(1.5, 0.5, 0.9);
        ear.position.set(1.86, 2.30, es * 0.36); sheepProto.add(ear);
      }
      const tail = new THREE.Mesh(new THREE.SphereGeometry(0.30, 6, 5), wool);
      tail.scale.set(0.8, 1.25, 0.8);
      tail.position.set(-1.55, 2.10, 0); sheepProto.add(tail);
    }
    const SHEEP = 18;
    const sheepInst = [];
    for (const merged of mergeByMaterial(sheepProto).children) {
      const im = new THREE.InstancedMesh(merged.geometry, merged.material, SHEEP);
      im.castShadow = im.receiveShadow = true;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(im);
      sheepInst.push(im);
    }
    // Road and flock. The road runs south from the foot of the great stairs;
    // the flock walks up it, and when the leaders reach the bottom step the
    // whole flock is put back at the far end — a pilgrim road never runs out
    // of them for long.
    // Pulled in from the far plain. At five hundred amot out the flock was
    // real and invisible — eighteen white specks two pixels across. This band
    // sits them in the middle distance the entry shot actually frames.
    const FLOCK_END = HALF + 66, FLOCK_START = HALF + 330;
    const sheep = [];
    for (let i = 0; i < SHEEP; i++) {
      sheep.push({
        // Clustered on the road with a long tail of stragglers, not spread
        // evenly: a flock is a clump and three animals that fell behind.
        lane: rnd(-70, 26) + (Math.random() < 0.22 ? rnd(-46, 46) : 0),
        along: rnd(0, FLOCK_START - FLOCK_END),
        sp: rnd(2.4, 3.6),
        // Grazing. A sheep on a walk stops constantly; phase and rate per
        // animal so the flock never dips its heads together.
        gph: rnd(0, 6.28), grate: rnd(0.10, 0.22),
        wob: rnd(0, 6.28),
      });
    }
    const sheepM = new THREE.Matrix4(), sheepQ = new THREE.Quaternion();
    const sheepE = new THREE.Euler(), sheepP = new THREE.Vector3(), sheepS = new THREE.Vector3(1, 1, 1);
    const stepSheep = (dt2) => {
      const span = FLOCK_START - FLOCK_END;
      // Called once at build time, before the loop has stamped a clock.
      const tt = nowT || 0;
      for (let i = 0; i < SHEEP; i++) {
        const sh = sheep[i];
        // Grazing: nose down, and while the nose is down the feet stop. One
        // number does both, which is also true of sheep.
        const graze = Math.max(0, Math.sin(sh.gph + tt * sh.grate));
        sh.along -= sh.sp * dt2 * (1 - graze * 0.92);
        if (sh.along < 0) sh.along += span;
        const z = FLOCK_END + sh.along;
        // The road is not straight and neither is a flock on it.
        const x = sh.lane + Math.sin(z * 0.012 + sh.wob) * 9;
        sheepP.set(x, LAND_Y, z);
        // Facing up the road, nose pitched into the grass, and the small
        // side-to-side roll of a walking quadruped.
        sheepE.set(0, -Math.PI / 2 + Math.cos(z * 0.012 + sh.wob) * 0.12,
                   graze * 0.42 + Math.sin(tt * 3.1 + sh.wob) * 0.03 * (1 - graze));
        sheepQ.setFromEuler(sheepE);
        sheepM.compose(sheepP, sheepQ, sheepS);
        for (const im of sheepInst) im.setMatrixAt(i, sheepM);
      }
      for (const im of sheepInst) im.instanceMatrix.needsUpdate = true;
    };
    stepSheep(0);

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
    const SB0 = new THREE.Vector2(-2.6, 1.5), SB1 = new THREE.Vector2(3.0, 4.5);  // soundboard: bass foot → treble shoulder
    const NK0 = new THREE.Vector2(-3.1, 9.5), NK1 = new THREE.Vector2(3.3, 7.3);  // harmonic curve, over the same span
    const boardAt = (u) => new THREE.Vector2(SB0.x + (SB1.x - SB0.x) * u, SB0.y + (SB1.y - SB0.y) * u);
    const neckAt = (u) => new THREE.Vector2(
      NK0.x + (NK1.x - NK0.x) * u,
      NK0.y + (NK1.y - NK0.y) * u + Math.sin(u * Math.PI) * 1.15   // it arches; a harmonic curve is not a chord
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
    limb(SB0.clone().addScaledVector(bN, -1.2).addScaledVector(bDir, -0.25),
         SB1.clone().addScaledVector(bN, -0.7).addScaledVector(bDir, 0.35), 0.78, 1.5, 8, cedar);
    limb(SB0, SB1, 0.14, 0.19, 6, gold);                           // the rib the strings are pinned along
    cyl(1.1, 1.35, 0.5, 8, gold, -1.9, -0.95, 0, harp);            // the foot, set level with the belly it stands beside
    // the rose cut into the belly, where a soundbox is opened so it can sing
    const rc = boardAt(0.36).addScaledVector(bN, -0.85);
    const rose = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 6, 14), gold);
    rose.position.set(rc.x, rc.y, 1.18); harp.add(rose);
    // the forepillar, carrying the whole pull of the strings down to the foot
    // run it a little past NK0 into the first course of the neck, so the two
    // members overlap at the shoulder instead of meeting in a notch
    limb(new THREE.Vector2(-3.5, -1.1), neckAt(0.035), 0.38, 0.56, 8, gold);
    // the neck, walked along the curve in twelve tapering courses
    for (let i = 0; i < 12; i++) {
      const u0 = i / 12, u1 = (i + 1) / 12;
      limb(neckAt(u0), neckAt(u1), 0.46 - u1 * 0.2, 0.46 - u0 * 0.2, 8, gold);
    }
    // a pomegranate finial over the pillar, like everything else golden here
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), gold);
    finial.position.set(NK0.x + 0.06, NK0.y + 0.6, 0); harp.add(finial);
    for (let c = 0; c < 4; c++) {
      const a = c * Math.PI / 2;
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.48, 5), gold);
      crown.position.set(NK0.x + 0.06 + Math.cos(a) * 0.25, NK0.y + 1.21, Math.sin(a) * 0.25);
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
    // ── שׁוֹר — an ox, built once and used twice ──
    //
    // What stood here was a sphere with a cone on it. Four things were wrong
    // and all four are the same mistake — a cow is not a smooth solid:
    //
    //   · the horns were the colour of the hide. Horn is keratin over bone and
    //     it is pale, which is the single strongest cue that the animal is an
    //     animal and not a shape;
    //   · the barrel was one ellipsoid, so it had no shoulder and no
    //     hindquarter, and a bovine silhouette is almost entirely shoulder and
    //     hindquarter with a dip between them;
    //   · the legs were four straight columns from the body to the ground.
    //     A leg has a knee in front and a hock behind, bending opposite ways,
    //     and the hooves were missing entirely;
    //   · nothing moved. She stood on the Mount for two versions perfectly
    //     still, and stillness at that distance reads as a prop.
    //
    // Facing +X, feet at y = 0, about seven amot nose to tail before the group
    // is scaled. `horn` lets the same animal be the red heifer of Bamidbar 19
    // on Har HaMishcha and the ox that walks in front of the bikkurim with its
    // horns overlaid with gold (Bikkurim 3:2–4).
    const hornBone = new THREE.MeshStandardMaterial({ color: 0xd9cba4, roughness: 0.42 });
    const hoofDark = new THREE.MeshStandardMaterial({ color: 0x2b2119, roughness: 0.65 });
    const eyeDark = new THREE.MeshStandardMaterial({ color: 0x140f0a, roughness: 0.3 });
    const makeOx = ({ hide, muzzle, horn = hornBone, wreath = false } = {}) => {
      const g = new THREE.Group();
      const parts = {};
      const lobe = (r, sx, sy, sz, x, y, z, mat = hide) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 11, 9), mat);
        m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.castShadow = true; g.add(m);
        return m;
      };
      // Barrel: chest, belly, rump. The rump sits a touch lower than the
      // withers, which is where a cow's topline actually goes.
      parts.chest = lobe(1.55, 1.05, 1.02, 1.0, 1.5, 3.75, 0);
      parts.belly = lobe(1.62, 1.25, 0.94, 1.02, -0.2, 3.55, 0);
      lobe(1.48, 1.02, 0.98, 0.98, -1.9, 3.6, 0);
      // Withers — the shoulder ridge an ox carries the yoke on.
      lobe(0.85, 1.5, 0.62, 0.72, 1.4, 4.75, 0);
      // Neck, thick at the shoulder and narrow at the poll.
      const neck = cyl(0.72, 1.35, 2.9, 9, hide, 3.15, 4.55, 0, g);
      neck.rotation.z = -0.62; neck.castShadow = true;
      // Dewlap: the fold of loose skin down the throat. Small, and the reason
      // the front of a cow does not read as a tube.
      lobe(0.62, 1.5, 1.15, 0.5, 3.3, 3.35, 0);
      // Head. Long and flat-sided, not round — a bovine skull is mostly muzzle.
      parts.head = new THREE.Group();
      parts.head.position.set(4.15, 5.05, 0);
      // A cow's head is big. Scaled here rather than in every part below so the
      // horns and the wreath come with it.
      parts.head.scale.setScalar(1.18);
      g.add(parts.head);
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.86, 11, 9), hide);
      skull.scale.set(1.25, 1.0, 0.88); skull.castShadow = true; parts.head.add(skull);
      const snout = new THREE.Mesh(new THREE.SphereGeometry(0.58, 9, 7), muzzle);
      snout.scale.set(1.45, 0.86, 0.86); snout.position.set(1.32, -0.34, 0);
      snout.castShadow = true; parts.head.add(snout);
      for (const sd of [-1, 1]) {
        const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 5), eyeDark);
        nostril.position.set(2.02, -0.30, sd * 0.24); parts.head.add(nostril);
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 7, 6), eyeDark);
        eye.position.set(0.62, 0.20, sd * 0.66); parts.head.add(eye);
        // Ears, out sideways and a little back, and they flick.
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.30, 7, 6), hide);
        ear.scale.set(1.5, 0.42, 0.85);
        ear.position.set(-0.30, 0.36, sd * 0.92);
        ear.rotation.z = sd * 0.25; ear.rotation.x = sd * 0.5;
        parts.head.add(ear);
        parts["ear" + (sd > 0 ? "R" : "L")] = ear;
        // Horns: two tapered segments, the second turned up and in. A single
        // straight cone is a party hat; the bend is the whole shape.
        const h1 = cyl(0.15, 0.23, 0.78, 7, horn, 0, 0, 0);
        const h2 = cyl(0.04, 0.15, 0.7, 7, horn, 0, 0.68, 0);
        h2.rotation.z = sd * 0.0; h2.rotation.x = -sd * 0.75;
        const hg = new THREE.Group();
        hg.add(h1); hg.add(h2);
        hg.position.set(-0.05, 0.62, sd * 0.5);
        hg.rotation.x = sd * 0.85; hg.rotation.z = -0.18;
        h1.castShadow = h2.castShadow = true;
        parts.head.add(hg);
      }
      if (wreath) {
        // עֲטָרָה שֶׁל זַיִת — the olive wreath of Bikkurim 3:3, worn between
        // the horns.
        const olive = new THREE.MeshStandardMaterial({ color: 0x5d7030, roughness: 0.85 });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.13, 5, 12), olive);
        ring.rotation.x = Math.PI / 2; ring.position.set(-0.05, 0.66, 0);
        parts.head.add(ring);
        for (let l = 0; l < 9; l++) {
          const a = (l / 9) * Math.PI * 2;
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.17, 5, 4), olive);
          leaf.scale.set(1.6, 0.35, 0.7);
          leaf.position.set(-0.05 + Math.cos(a) * 0.62, 0.74, Math.sin(a) * 0.62);
          leaf.rotation.y = -a;
          parts.head.add(leaf);
        }
      }
      // Legs. Front knee bends back, hind hock bends forward — opposite ways,
      // which is the thing everyone gets wrong and everyone can see.
      parts.legs = [];
      for (let l = 0; l < 4; l++) {
        const fore = l < 2, sd = l % 2 ? 1 : -1;
        const lx = fore ? 1.9 : -2.05, lz = sd * 0.95;
        const leg = new THREE.Group();
        leg.position.set(lx, 3.3, lz);
        g.add(leg);
        const upper = cyl(0.34, 0.52, 1.9, 7, hide, 0, -0.95, 0, leg);
        upper.rotation.z = fore ? 0.10 : -0.16;
        upper.castShadow = true;
        const joint = new THREE.Mesh(new THREE.SphereGeometry(0.33, 7, 6), hide);
        joint.position.set(fore ? -0.19 : 0.30, -1.85, 0); leg.add(joint);
        const lower = cyl(0.20, 0.28, 1.55, 7, hide, fore ? -0.24 : 0.30, -2.62, 0, leg);
        lower.rotation.z = fore ? -0.06 : 0.12;
        lower.castShadow = true;
        const hoof = cyl(0.27, 0.24, 0.42, 7, hoofDark, fore ? -0.28 : 0.22, -3.5, 0, leg);
        hoof.castShadow = true;
        parts.legs.push(leg);
      }
      // Tail with a switch on the end — the tuft is what you actually see move.
      const tail = new THREE.Group();
      tail.position.set(-3.25, 4.15, 0);
      g.add(tail);
      const tailRod = cyl(0.09, 0.16, 2.6, 6, hide, 0, -1.3, 0, tail);
      tailRod.castShadow = true;
      const switchTuft = new THREE.Mesh(new THREE.SphereGeometry(0.30, 7, 6), hoofDark);
      switchTuft.scale.set(0.7, 1.5, 0.7); switchTuft.position.set(0, -2.75, 0);
      tail.add(switchTuft);
      parts.tail = tail;
      return { group: g, parts };
    };
    // The one on the Mount. Bamidbar 19:2 — אֲדֻמָּה תְּמִימָה, entirely red
    // and without blemish, and Parah 2:5 disqualifies her for two black hairs.
    // Deeper than it reads on paper. Full sun through an ACES curve lifts a
    // mid red most of a stop, and 0x9c3b22 — which is a red-brown in a swatch —
    // came out of the renderer the colour of a peach.
    const redHide = new THREE.MeshStandardMaterial({ color: 0x6d2410, roughness: 0.92 });
    const redMuzzle = new THREE.MeshStandardMaterial({ color: 0x521a0b, roughness: 0.94 });
    const parahOx = makeOx({ hide: redHide, muzzle: redMuzzle });
    const parah = parahOx.group;
    parah.position.set(536, LAND_Y + 9, CWAY_Z);
    parah.rotation.y = -2.3;
    parah.scale.set(1.8, 1.8, 1.8);   // she has to read as a heifer from the Mount
    parah.userData = { id: 34 };
    scene.add(parah);
    clickables.push(parah);
    // Alive, barely. Breath in the barrel, a tail that swings, an ear that
    // flicks on its own clock, and the slow drop and lift of a head cropping
    // grass. All of it small — she is four hundred amot away and the point is
    // only that she is not a statue.
    const livingOx = [];
    const animateOx = (o, phase, scale = 1) => livingOx.push({ o, phase, scale });
    animateOx(parahOx.parts, 0);

    // ═══════════ מוֹעֲדִים — what stands here only on the chag ═══════════
    //
    // The House keeps the calendar. Two things are built only on the days they
    // belong to, and on every other day of the year they are simply not here —
    // which is the point: somebody who comes back in Kislev finds something
    // that was not there in Av, and nothing told them to look.
    //
    // Both are outside the walls. A chanukiah is not a Temple vessel and has no
    // business in the courts (the Menorah inside has seven branches and is lit
    // by kohanim); its whole mitzvah is פִּרְסוּמֵי נִיסָא, publicising the
    // miracle, which means a doorway and a street. And an ox has no business in
    // the courts either, which is why the bikkurim procession stops at the foot
    // of the stairs and the baskets go up on shoulders.
    if (todayChag && todayChag.id === "chanukah") {
      // Which night. Straight off the date rather than out of the sentence in
      // the panel: 25 Kislev is the first, and Kislev is 29 days some years and
      // 30 others, which is exactly the sort of thing that silently breaks a
      // count once every few years and is invisible when you test it in August.
      const kislevLen = hebMonthLen(todayHeb.year, 9);
      const night = todayHeb.month === 9 ? todayHeb.day - 24 : todayHeb.day + (kislevLen - 24);
      const lit = Math.max(1, Math.min(8, night));
      const chanukiah = new THREE.Group();
      // On the plaza clear of the southern gate, and scaled up until it reads
      // from the opening view. A chanukiah is a hand's span of oil; this one is
      // thirty amot across, which is not a claim about the object but about the
      // one thing it is for — פִּרְסוּמֵי נִיסָא, publicising the miracle.
      // Something nobody can see from the road is not publicising anything.
      chanukiah.position.set(96, 0, HALF + 18);
      chanukiah.scale.setScalar(2.3);
      box(9, 1.1, 3.4, gold, 0, 0.55, 0, chanukiah);
      cyl(0.5, 0.9, 4.2, 9, gold, 0, 2.7, 0, chanukiah);
      box(13, 0.7, 0.8, gold, -0.9, 5.1, 0, chanukiah);
      const flameTex2 = fireSpriteTex();
      // Eight in a row and the שַׁמָּשׁ apart from them and higher, because it
      // is the only one whose light may be used — the eight are for looking at
      // and nothing else (Shabbat 21b–22a).
      //
      // Lamp 1 is at the right as you face it, and on night N lamps 1…N burn.
      // The Talmud's argument about which end to start from is about the order
      // of kindling, not the order of standing: the newest is lit first, and
      // the row still fills from the far side inward.
      for (let c = 0; c <= 8; c++) {
        const isSham = c === 8;
        const x = isSham ? -7.4 : (3.5 - c) * 1.4;
        const cupY = isSham ? 6.7 : 5.6;
        if (isSham) cyl(0.22, 0.22, 1.6, 7, gold, x, 5.8, 0, chanukiah);
        const cup = cyl(0.44, 0.28, 0.62, 8, gold, x, cupY, 0, chanukiah);
        cup.castShadow = true;
        if (!isSham && c + 1 > lit) continue;          // not yet this night
        const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
        fl.scale.set(0.9, 1.5, 1);
        fl.position.set(x, cupY + 0.85, 0);
        chanukiah.add(fl);
        const li = new THREE.PointLight(0xffb347, 0.5, 34, 2);
        li.position.set(x, cupY + 1.1, 0);
        chanukiah.add(li);
        festivalFlames.push({ fl, li, ph: rnd(0, 6.28) });
      }
      scene.add(chanukiah);
    }

    if (todayChag && todayChag.id === "shavuot") {
      // Bikkurim 3:2–4. The ox goes in front with its horns overlaid with gold
      // and an olive wreath on its head, and a flute plays the whole way up;
      // the craftsmen of Jerusalem stand as they pass, which the Talmud says
      // they do for nobody else — work stops for farmers carrying figs.
      const oxHide = new THREE.MeshStandardMaterial({ color: 0x4a3320, roughness: 0.9 });
      const oxMuzzle = new THREE.MeshStandardMaterial({ color: 0x33210f, roughness: 0.92 });
      const bikkur = makeOx({ hide: oxHide, muzzle: oxMuzzle, horn: gold, wreath: true });
      bikkur.group.position.set(-30, LAND_Y, HALF + 150);
      bikkur.group.rotation.y = -Math.PI / 2;          // facing up the road
      bikkur.group.scale.setScalar(1.55);
      scene.add(bikkur.group);
      animateOx(bikkur.parts, 2.1);
      // The baskets. Bikkurim 3:8: the rich brought theirs in gold and silver,
      // the poor in wicker of peeled willow — and the poor man's basket was
      // given away with the fruit while the rich man's was handed back.
      const wick = new THREE.MeshStandardMaterial({ color: 0xa8843e, roughness: 0.95 });
      for (let b2 = 0; b2 < 6; b2++) {
        const bx = -30 + rnd(-16, 16), bz = HALF + 168 + rnd(-14, 14);
        const basket = cyl(1.5, 1.05, 2.1, 9, wick, bx, LAND_Y + 1.05, bz, scene);
        basket.castShadow = true;
        for (let f2 = 0; f2 < 5; f2++) {
          const fig = new THREE.Mesh(new THREE.SphereGeometry(0.45, 7, 6), fruit.rimon);
          fig.position.set(bx + rnd(-0.8, 0.8), LAND_Y + 2.2, bz + rnd(-0.8, 0.8));
          scene.add(fig);
        }
      }
    }


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

    // Nicanor's doors are wonder 14 themselves. They were built long before
    // `clickables` exists, so the registration has to happen down here — and
    // when it was missing they carried a halo and a hint but nothing to strike,
    // which dead-ended the quest at the top of the fifteen steps (guideTo()
    // scans this same list, so "Show me" found no beacon to raise either).
    clickables.push(nicanor);

    // Two bronze slabs 1.2 amot thick are a fair target with a mouse and a
    // cruel one with a thumb: from any oblique angle they read as a line, and
    // the top step waits directly under them to catch the miss with a note.
    // So the target is the gateway rather than the leaves — an unseen pane
    // filling the aperture between the posts, threshold to lintel. opacity 0
    // and not visible=false, because three.js skips invisible objects in the
    // raycast, and this one has to stay hittable while staying unseen.
    // Kept as thin as the leaves themselves and lifted two amot clear of the
    // threshold, so that a steeply overhead ray aimed at the fifteenth step
    // still reaches the marble and sounds its note instead of being caught by
    // a pane of nothing hanging above it.
    const nicanorHit = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 22, 40),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
    );
    nicanorHit.position.set(NIC_X, IC_H + 13, 0);
    nicanorHit.userData = { id: 14 };
    scene.add(nicanorHit);
    clickables.push(nicanorHit);

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

    // ═══════════ סִיס — the swifts ═══════════
    //
    // Not a flourish: the common swifts of Jerusalem nest in the crevices of
    // the Western Wall's stones and have done for as long as anyone has
    // counted. They arrive back from Africa each year toward the end of the
    // winter and leave by early summer, and the city marks the return. Nothing
    // else in this scene says "this stone is old and lived in" as fast as
    // birds that treat it as a cliff.
    //
    // They fly at dusk and at first light, in fast screaming parties around
    // walls — never at midday — so they are tied to the same rake term the
    // dust uses, and the whole flock is switched off when the sun is high.
    const swiftMat = new THREE.MeshStandardMaterial({ color: 0x151109, roughness: 1, transparent: true, opacity: 0 });
    const swiftFlock = new THREE.Group();
    swiftFlock.visible = false;
    const swifts = [];
    for (let i = 0; i < 18; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.85, 6, 5), swiftMat);
      body.scale.set(2.4, 0.62, 0.62);
      g.add(body);
      // Swept back hard — the scythe outline is the whole identification, and
      // at this distance the silhouette is all anyone gets.
      for (const sgn of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 0.85), swiftMat);
        wing.position.set(-1.1, 0, sgn * 1.7);
        wing.rotation.y = sgn * 0.62;
        g.add(wing);
      }
      g.userData = {
        a: rnd(0, 6.283), r: rnd(300, 580), h: rnd(34, 128),
        sp: rnd(0.42, 0.78) * (Math.random() < 0.5 ? 1 : -1),
        bob: rnd(7, 22), bobSp: rnd(0.7, 1.6), phase: rnd(0, 6.283),
      };
      swiftFlock.add(g);
      swifts.push(g);
    }
    scene.add(swiftFlock);

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
      songBus: null, song: null, songAt: 0, crackAt: 0, camelAt: 0,
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

    // ═══════════ Playing the steps ═══════════
    //
    // One voice, plucked: a triangle fundamental with two quiet partials and a
    // fast decay, which is close enough to a struck string to sit beside the
    // kinnor without pretending to be a piano. Scheduling is done against
    // `ctx.currentTime` in one pass rather than a timer per note — the audio
    // clock does not drift and setTimeout does, and a melody is exactly the
    // thing where drift is audible.
    //
    // Visuals are driven separately, off requestAnimationFrame against the
    // same audio clock, so a stalled frame delays the light and never the note.
    let melodyStop = null;
    // Every note of a melody is scheduled on the audio clock the instant play is
    // pressed, so "stop" cannot mean "stop scheduling" — the whole tune is
    // already in the future. Each run therefore gets its own bus and keeps its
    // oscillators, and stopping ducks the bus and stops the voices. Without
    // that, ■ only put the lights out while the tune played on, and starting a
    // second melody laid it on top of the first: two songs at once, which is
    // what a wrong melody actually sounded like.
    const playPitch = (midi, at, dur, dest, voices) => {
      const ctx = ensureAudio();
      const f = NOTE_HZ(midi);
      // Release. Every note used to ring for a fixed half-second past its own
      // length, which at a quaver of a third of a second meant three notes
      // sounding at once for the whole of a fast run — the tunes came out
      // slurred, and slurred reads as slow however fast the clock is set.
      // Tie the tail to the note instead, capped so a held minim still decays
      // like a struck string rather than stopping dead.
      const tail = Math.min(0.42, dur * 0.6);
      [[1, "triangle", 0.19], [2, "sine", 0.06], [3, "sine", 0.022], [4, "sine", 0.008]]
        .forEach(([mul, type, peak]) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = type; o.frequency.value = f * mul;
          g.gain.setValueAtTime(0.0001, at);
          // Attack scaled to the note: 14ms is a pluck on a quaver and a thud
          // on a semibreve, and the long notes are the ones that want a bow.
          g.gain.exponentialRampToValueAtTime(peak, at + Math.min(0.03, 0.012 + dur * 0.02));
          g.gain.exponentialRampToValueAtTime(0.0001, at + dur + tail);
          o.connect(g); g.connect(dest);
          o.start(at); o.stop(at + dur + tail + 0.05);
          voices.push(o);
        });
    };
    // Nearest tread to a pitch, so the ascent lights under the melody even when
    // the melody is not in the steps' own mode.
    const nearestStep = (midi) => {
      let best = 0, bestD = 1e9;
      for (let i = 0; i < STEP_MIDI.length; i++) {
        const d = Math.abs(STEP_MIDI[i] - midi);
        if (d < bestD) { bestD = d; best = i; }
      }
      return best;
    };
    apiRef.current.playMelody = (mel, onNote, onEnd) => {
      apiRef.current.stopMelody?.();
      if (!amb.on) return false;
      const ctx = ensureAudio();
      const spb = 60 / mel.bpm;
      const start = ctx.currentTime + 0.25;
      const bus = ctx.createGain();
      bus.gain.value = 1;
      bus.connect(amb.master || ctx.destination);
      const voices = [];
      const timeline = [];
      let cursor = 0;
      for (const [midi, beats] of mel.notes) {
        if (midi > 0) {
          // A little more air between notes than the old 0.92. Articulation is
          // most of what separates a melody from a drone.
          const dur = beats * spb * 0.86;
          playPitch(midi, start + cursor, dur, bus, voices);
          // The beat position travels with the note so the panel can follow the
          // words. Beats, not seconds: the lyric is attached to the music, and
          // the music is the same shape at any tempo.
          timeline.push({ at: start + cursor, midi, beat: cursor / spb });
        }
        cursor += beats * spb;
      }
      const total = cursor;
      let idx = 0, raf = 0, live = true;
      // One teardown for both endings — the tune running out and the button
      // being pressed — so a melody can never leave its bus hanging on the mix.
      const teardown = (fade) => {
        live = false;
        cancelAnimationFrame(raf);
        const now = ctx.currentTime;
        bus.gain.cancelScheduledValues(now);
        bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), now);
        bus.gain.exponentialRampToValueAtTime(0.0001, now + fade);
        // stop() before start() simply means the voice never sounds, which is
        // exactly right for the notes still waiting in the future.
        voices.forEach((o) => { try { o.stop(now + fade); } catch { /* already done */ } });
        setTimeout(() => { try { bus.disconnect(); } catch { /* already gone */ } }, (fade + 0.3) * 1000);
      };
      // ── Where the tune is coming from ──
      //
      // It is played by pressing a button, but it is sounding out of the
      // fifteen steps, and it used to arrive at exactly the same volume from
      // the far corner of the outer court as from the foot of the ascent. That
      // is the one thing that told the ear it was a UI noise and not a place.
      //
      // It falls off over the precinct now — but to a floor, not to nothing.
      // Someone who presses play from the outer wall has to hear that they
      // pressed it, so distance takes two thirds of it and never the last
      // third. Inverse-square in the tail, flat inside forty amot, which is
      // roughly the width of the ascent itself.
      const heard = () => {
        const d = camera.position.distanceTo(STEPS_POS);
        return 0.34 + 0.66 / (1 + Math.pow(Math.max(0, d - 40) / 190, 2));
      };
      bus.gain.value = heard();
      const tick = () => {
        if (!live) return;
        bus.gain.value = heard();
        const now = ctx.currentTime;
        while (idx < timeline.length && now >= timeline[idx].at) {
          const { midi, beat } = timeline[idx];
          onNote?.(midi, beat);
          const st = nearestStep(midi);
          if (stepMeshes[st]) stepMeshes[st].material.emissiveIntensity = 0.85;
          idx++;
        }
        // The last note is still ringing out here, so let it decay on its own
        // rather than ducking it: only the bookkeeping ends.
        if (now >= start + total + 0.4) {
          teardown(1.2);
          melodyStop = null;
          onEnd?.();
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      // Pressed stop: a short duck, fast enough to feel like a stop and slow
      // enough not to click.
      melodyStop = () => teardown(0.08);
      return true;
    };
    apiRef.current.stopMelody = () => { melodyStop?.(); melodyStop = null; };

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

      // Rectified and smoothed: the trees care which way the gust blows, the
      // ear only cares how hard. A slow term underneath keeps the bed from
      // pumping at the fronds' rate, which would sound mechanical.
      const swirl = Math.abs(gustAt(p.x, p.z, t));
      const gust = clamp01(0.34 + 0.44 * swirl + 0.22 * Math.sin(t * 0.047 + 1.7));
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

      // ── A camel, rarely ──
      //
      // Yeshayahu's caravan has been standing below the southern stairs in
      // total silence since it arrived. A camel is not a quiet animal: it
      // grumbles when it is loaded and it grumbles when it is not, and one low
      // complaint from the dust is worth more to the place than another layer
      // of wind.
      //
      // Built the way the fire crackle is — the shared brown-noise buffer,
      // played slowly and pushed through a low resonant bandpass, with a
      // little pitch fall over the length of it, which is what makes a growl
      // sound like an animal exhaling rather than a filter sweeping. Only when
      // the camera is close, and rarely enough that hearing one twice in a
      // minute would be bad luck.
      const camelAmt = clamp01(1 - (p.distanceTo(camelAt) - 30) / 150);
      if (camelAmt > 0.05 && t > amb.camelAt) {
        amb.camelAt = t + 14 + Math.random() * 30;
        const t0 = ctx.currentTime;
        const s2 = ctx.createBufferSource(), g2 = ctx.createGain(), f2 = ctx.createBiquadFilter();
        const len = 0.5 + Math.random() * 0.45;
        s2.buffer = amb.buf;
        s2.playbackRate.value = 0.32 + Math.random() * 0.1;
        f2.type = "bandpass";
        f2.Q.value = 7.5;
        // The fall. A camel's grumble drops as the breath runs out.
        const f0 = 150 + Math.random() * 60;
        f2.frequency.setValueAtTime(f0, t0);
        f2.frequency.exponentialRampToValueAtTime(f0 * 0.62, t0 + len);
        g2.gain.setValueAtTime(0.0001, t0);
        g2.gain.exponentialRampToValueAtTime(0.5 * camelAmt, t0 + 0.09);
        g2.gain.setValueAtTime(0.5 * camelAmt, t0 + len * 0.55);
        g2.gain.exponentialRampToValueAtTime(0.0001, t0 + len + 0.2);
        s2.connect(f2); f2.connect(g2); g2.connect(amb.master);
        s2.start(t0, Math.random() * 4, len + 0.3); s2.stop(t0 + len + 0.3);
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
    // Added light cannot brighten sunlit marble. The stone is already at the
    // top of the tone curve, so a single 0.2 additive beam laid over the
    // courts added nothing the eye could find: the pillar only ever showed
    // where it happened to cross a dark roof or the hills, and over the House
    // itself — which is where the quest keeps pointing — it was not there at
    // all. The column is two shells now. The additive one still blooms at
    // night; a normally-blended amber core *tints* whatever stands behind it,
    // so the pillar reads against white stone at noon.
    const beaconBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 6.4, 150, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffc14a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, side: THREE.DoubleSide, fog: false })
    );
    beaconBeam.position.y = 75;
    beaconBeam.renderOrder = 20;
    beacon.add(beaconBeam);
    const beaconCore = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 2.6, 150, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xe08c18, transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide, fog: false })
    );
    beaconCore.position.y = 75;
    beaconCore.renderOrder = 21;
    beacon.add(beaconCore);
    const beaconRing = new THREE.Mesh(
      new THREE.TorusGeometry(7.5, 0.7, 8, 36),
      new THREE.MeshBasicMaterial({ color: 0xd9860f, transparent: true, opacity: 0, depthWrite: false, depthTest: false, fog: false })
    );
    beaconRing.renderOrder = 22;
    beaconRing.rotation.x = Math.PI / 2;
    beaconRing.position.y = 0.8;
    beacon.add(beaconRing);
    beacon.visible = false;
    beacon.frustumCulled = false;
    scene.add(beacon);
    const guide = { until: -1, active: false, t: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), rFrom: 0, rTo: 0 };

    // ═══════════ Camera control: orbit + first-person ═══════════
    // Where the House opens. HOME is declared here rather than beside
    // resetView() because the opening shot and the reset target must be the
    // same place — when they were two separate literals a close-in rig for
    // inspecting the harp (radius 38, no drift) got left in as the initial
    // orbit, so the House opened buried against a wall and only the ⌂ button
    // ever showed the courts. One object now, spread into the live state.
    const HOME = { theta: Math.PI * 0.2, phi: Math.PI * 0.37, radius: 700, target: new THREE.Vector3(-40, 30, 0) };
    const orbit = {
      theta: HOME.theta, phi: HOME.phi, radius: HOME.radius, target: HOME.target.clone(),
      dragging: false, lastX: 0, lastY: 0,
      drift: 0.00072,   // the slow turn that shows the precinct off on arrival
    };
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

    // ═══════════ שִׂמְחָה — the ending ═══════════
    //
    // Thirty-six found. What used to happen was a line of text at the bottom of
    // the screen, which is a receipt and not an ending.
    //
    // What happens now is the House doing what the House does when something is
    // finished: the shofar of ingathering, a tekiah gedolah held until the
    // breath runs out; the pillar of light standing up out of the Kodesh; every
    // torch on the walls taking; and a burst of gold leaf and olive and
    // pomegranate over the courts, which is the closest thing this place has to
    // confetti and is not an anachronism — Tehillim 118:27 has them binding the
    // festival offering with branches all the way up to the horns of the altar,
    // and the Talmud (Sukkah 45a) has the children stripping and eating their
    // lulavim on the seventh day. Things got thrown in this courtyard.
    //
    // Six hundred and forty-eight pieces of it: חי times thirty-six, which is
    // the number of the thing being celebrated.
    const CONFETTI = 648;
    // Four amot to a piece, which is a leaf the size of a door and is not an
    // attempt at scale. The opening view stands seven hundred amot out, where
    // one amah is about one pixel: honest confetti would be invisible, and
    // invisible confetti is not a celebration. Sized to read from where the
    // House is actually watched from.
    const confettiGeo = new THREE.PlaneGeometry(3.4, 2.3);
    const confettiMat = new THREE.MeshStandardMaterial({
      // Barely metallic. A high metalness with only a prefiltered sky to
      // reflect turns a small facing-away triangle almost black, and a field of
      // black specks over the courts reads as a bug and not as gold leaf.
      //
      // The emissive is warm and very low. It was white at a third, which is
      // enough to lift every colour toward the paper it is printed on: the
      // gold went cream, the pomegranate went pink and the techelet went baby
      // blue. This only keeps the shaded side off the floor.
      side: THREE.DoubleSide, roughness: 0.42, metalness: 0.12,
      transparent: true, opacity: 0, emissive: 0x3a2a08, emissiveIntensity: 0.5,
    });
    const confetti = new THREE.InstancedMesh(confettiGeo, confettiMat, CONFETTI);
    confetti.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    confetti.frustumCulled = false;
    confetti.visible = false;
    scene.add(confetti);
    // Gold leaf, pomegranate, olive, the white of the linen, and the techelet of
    // the thread — five colours already in this House, weighted so that gold
    // wins. An even split of six read as party streamers; gold at two in five
    // reads as gold leaf with things thrown in among it.
    const CONF_COLS = [0xffc21f, 0xffd24a, 0xe8a413, 0x9c1620, 0xb3202a,
                       0x5e7028, 0xfdf8ec, 0x1d4f9c];
    {
      const c = new THREE.Color();
      for (let i = 0; i < CONFETTI; i++) {
        c.setHex(CONF_COLS[i % CONF_COLS.length]);
        confetti.setColorAt(i, c);
      }
      confetti.instanceColor.needsUpdate = true;
    }
    const confParts = [];
    for (let i = 0; i < CONFETTI; i++) {
      confParts.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), spin: 0, ax: 0, az: 0, ph: 0, sz: 1 });
    }
    let confTime = -1;                       // < 0 means nothing is falling
    const confM = new THREE.Matrix4(), confQ = new THREE.Quaternion();
    const confE = new THREE.Euler(), confS = new THREE.Vector3();
    // ── Where it is thrown ──
    //
    // The first version threw it over the Kodesh, which is the right place for
    // it and the wrong place to see it from: from the opening view, seven
    // hundred amot out and high, the whole burst went off in a patch of sky the
    // size of a thumbnail. Confetti has to be in frame or it did not happen.
    //
    // So it is sown into the camera's own view instead — spread across the
    // width of the frustum at every depth from just past the lens out to the
    // House, with a sixth of it close enough to sweep past the eye. Wherever
    // the visitor is standing and whichever way they are facing when the
    // thirty-sixth falls, it comes down in front of them.
    const cf = new THREE.Vector3(), cr = new THREE.Vector3(), cu = new THREE.Vector3();
    const throwConfetti = () => {
      camera.getWorldDirection(cf);
      cr.set(cf.z, 0, -cf.x).normalize();          // horizontal right of the view
      cu.crossVectors(cr, cf).normalize();
      const halfW = Math.tan((camera.fov * Math.PI) / 360) * camera.aspect;
      for (let i = 0; i < CONFETTI; i++) {
        const q = confParts[i];
        // A sixth of it right at the lens, the rest spread out to the House.
        const depth = i % 6 === 0 ? rnd(14, 70) : rnd(70, 620);
        const w = halfW * depth * 1.15;
        q.p.copy(camera.position)
          .addScaledVector(cf, depth)
          .addScaledVector(cr, rnd(-w, w))
          .addScaledVector(cu, rnd(0.05, 1.15) * w * 0.8 + depth * 0.10);
        // Thrown, not dropped: it goes up first and outward from the middle of
        // the frame, which is what a burst looks like.
        q.v.set(rnd(-9, 9), rnd(8, 26), rnd(-9, 9));
        q.spin = rnd(1.6, 6.5) * (Math.random() < 0.5 ? -1 : 1);
        q.ax = rnd(0, 6.28); q.az = rnd(0, 6.28); q.ph = rnd(0, 6.28);
        // Nearer pieces bigger, so the depth reads.
        q.sz = rnd(0.7, 1.5) * (depth < 70 ? 0.45 : 1);
      }
      confTime = 0;
      confetti.visible = true;
      confettiMat.opacity = 1;
    };
    // Flat pieces do not fall, they flutter: air spills off one edge and then
    // the other, and the leaf slides sideways each time it tips. Two sines out
    // of phase with the tumble is enough to say it.
    const stepConfetti = (dt2) => {
      if (confTime < 0) return;
      confTime += dt2;
      if (confTime > 22) { confTime = -1; confetti.visible = false; return; }
      confettiMat.opacity = confTime > 17 ? Math.max(0, 1 - (confTime - 17) / 5) : 1;
      for (let i = 0; i < CONFETTI; i++) {
        const q = confParts[i];
        // Terminal velocity, reached fast, because a leaf has almost no mass
        // and a great deal of drag.
        q.v.y += (-11 - q.v.y * 0.9) * dt2;
        q.v.x -= q.v.x * 0.55 * dt2;
        q.v.z -= q.v.z * 0.55 * dt2;
        const tip = Math.sin(confTime * 2.4 + q.ph);
        q.p.x += (q.v.x + tip * 5.5) * dt2;
        q.p.z += (q.v.z + Math.cos(confTime * 1.9 + q.ph) * 5.5) * dt2;
        q.p.y += q.v.y * dt2;
        // Rest where it lands rather than sinking through the paving.
        const floor = groundHeight(q.p.x, q.p.z) + 0.25;
        if (q.p.y <= floor) { q.p.y = floor; q.v.set(0, 0, 0); }
        const settled = q.v.lengthSq() < 0.001;
        confE.set(settled ? Math.PI / 2 : q.ax + confTime * q.spin,
                  q.az + confTime * q.spin * 0.4,
                  settled ? 0 : tip * 0.9);
        confQ.setFromEuler(confE);
        confS.set(q.sz, q.sz, q.sz);
        confM.compose(q.p, confQ, confS);
        confetti.setMatrixAt(i, confM);
      }
      confetti.instanceMatrix.needsUpdate = true;
    };

    // תְּקִיעָה גְדוֹלָה — one blast, held. Yeshayahu 27:13 is the great shofar
    // of the ingathering, and the length of it is the whole point: a tekiah
    // gedolah is held until the breath gives out, which is why it is the last
    // sound of Yom Kippur and the right sound for this.
    const tekiahGedolah = () => {
      if (!amb.on) return;
      const ctx = ensureAudio(); const t0 = ctx.currentTime + 0.15;
      const LEN = 6.4;
      const filt = ctx.createBiquadFilter(), gain = ctx.createGain();
      filt.type = "lowpass"; filt.Q.value = 4;
      filt.frequency.setValueAtTime(700, t0);
      filt.frequency.linearRampToValueAtTime(1900, t0 + LEN * 0.72);
      filt.frequency.linearRampToValueAtTime(1200, t0 + LEN);
      const oscs = [];
      // Two detuned voices, as in the short blast, and the octave above added
      // late — a real horn cracks up into its next partial when it is pushed,
      // and pushing it is what a gedolah is.
      [[146, 1], [147.5, 1], [292, 0]].forEach(([f, on], k) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = k === 1 ? "square" : "sawtooth";
        o.frequency.setValueAtTime(f, t0);
        o.frequency.linearRampToValueAtTime(f * 1.08, t0 + 0.2);
        o.frequency.setValueAtTime(f * 1.08, t0 + LEN * 0.66);
        o.frequency.linearRampToValueAtTime(f * 1.58, t0 + LEN * 0.74);   // up to the fifth
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(on ? 0.26 : 0.0001, t0 + 0.12);
        if (!on) {
          g.gain.setValueAtTime(0.0001, t0 + LEN * 0.7);
          g.gain.exponentialRampToValueAtTime(0.10, t0 + LEN * 0.78);
        }
        g.gain.setValueAtTime(on ? 0.26 : 0.10, t0 + LEN * 0.93);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + LEN + 0.5);
        o.connect(g); g.connect(filt);
        o.start(t0); o.stop(t0 + LEN + 0.6);
        oscs.push(o);
      });
      // A little breath around the tone. Without it the blast is an oscillator.
      const air = ctx.createBufferSource(), ag = ctx.createGain(), af = ctx.createBiquadFilter();
      air.buffer = amb.buf; air.loop = true; air.playbackRate.value = 1.6;
      af.type = "bandpass"; af.frequency.value = 1400; af.Q.value = 0.8;
      ag.gain.setValueAtTime(0.0001, t0);
      ag.gain.exponentialRampToValueAtTime(0.05, t0 + 0.2);
      ag.gain.setValueAtTime(0.05, t0 + LEN * 0.9);
      ag.gain.exponentialRampToValueAtTime(0.0001, t0 + LEN + 0.4);
      air.connect(af); af.connect(ag); ag.connect(filt);
      air.start(t0); air.stop(t0 + LEN + 0.5);
      gain.gain.value = 1;
      filt.connect(gain); gain.connect(amb.master || ctx.destination);
    };

    // Everything at once, and one flag the loop reads to make the light swell.
    let finaleAt = -1;
    apiRef.current.celebrate = () => {
      throwConfetti();
      tekiahGedolah();
      finaleAt = nowT;
      // Every torch on every wall takes at the same moment.
      torchFires.forEach(({ flame }) => { flame.material.opacity = 1; });
    };
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
      guide.until = nowT + 16;
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
    // A touchend arrives with an EMPTY e.touches — the finger that just lifted
    // lives only in changedTouches. Testing the list for truthiness instead of
    // length handed back undefined here, and onUp threw on p.clientX before it
    // could ever raycast: on a phone nothing on the whole map could be tapped.
    // Length, not existence.
    const pxOf = (e) => {
      if (e.touches && e.touches.length) return e.touches[0];
      if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0];
      return e;
    };

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
    // A phone fires a compatibility mouse event after every tap. While the
    // touch path was broken that duplicate was the only thing collecting
    // anything; now that both work, an unguarded tap would take the same wonder
    // twice — two fact cards, two bursts, two shofar blasts. Ignore a mouse
    // event that treads on the heels of a touch.
    let lastTouchUp = -1e4;
    const onUp = (e) => {
      orbit.dragging = false;
      if (e.changedTouches) lastTouchUp = performance.now();
      else if (performance.now() - lastTouchUp < 700) return;
      if (walkRef.current && e.changedTouches) {
        for (const t of e.changedTouches) {
          if (player.touchMove && t.identifier === player.touchMove.id) { player.touchMove = null; player.moveVec.f = 0; player.moveVec.s = 0; }
          if (player.touchLook && t.identifier === player.touchLook.id) player.touchLook = null;
        }
      }
      // A thumb is not a mouse pointer. It lands a little away from where the
      // eye aimed and it wobbles on the way up, so both allowances below are
      // granted to touch alone — clicking with a mouse behaves exactly as it
      // always did.
      const byTouch = !!(e.changedTouches || e.touches);
      if (moved > (byTouch ? 16 : 7)) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const p = pxOf(e);
      const castAt = (dx, dy) => {
        mv.set(((p.clientX + dx - rect.left) / rect.width) * 2 - 1,
               -((p.clientY + dy - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(mv, camera);
        return raycaster.intersectObjects(clickables, true);
      };
      let hits = castAt(0, 0);
      if (!hits.length && byTouch) {
        // Dead centre found nothing whatsoever, so widen the tap to the size
        // of a fingertip: eight rays around a 22px circle, nearest hit wins.
        // This runs only on a clean miss, so a deliberate tap on a step or on
        // a kohen still lands precisely where it was aimed and nothing that
        // already worked can be stolen by something beside it.
        const R = 22;
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2;
          const near = castAt(Math.cos(ang) * R, Math.sin(ang) * R);
          if (near.length && (!hits.length || near[0].distance < hits[0].distance)) hits = near;
        }
      }
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
    // ── Dusk ──
    // The sky can now produce an evening; these are what let the ground join
    // it. A low sun's light has been through thirty times the air a midday
    // sun's has, and everything it touches goes with it: the direct light to
    // orange, the haze to a dusty rose, the skylight that fills the shadows to
    // the colour of the band opposite the sun. Linearised like every other
    // colour here, because they are all consumed linearly.
    const duskSunCol = new THREE.Color(0xff7a33);
    const duskFog = new THREE.Color(0x8a4a2c);
    const duskHemiSky = new THREE.Color(0xc98a86);
    const sunColA = new THREE.Color(), fogA = new THREE.Color(), hemiA = new THREE.Color();
    // Smoothstep — the same curve the sky shader uses, so a threshold set here
    // and a threshold set there mean the same thing.
    const sstep = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };

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
      windU.value = t;

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
      skyUniforms.uMoonK.value = moonK;
      // ── The ground light follows the sun's height, not the clock ──
      //
      // All of this used to run linearly on e2, which is the eased position of
      // a slider and not the position of anything in the sky. The result was
      // that at the exact moment the sky behind the House had gone to dusk, the
      // House itself was still lit at three-quarter strength and the colour of
      // noon: a sunset painted on a backdrop with midday stone in front of it.
      //
      // Now every one of them is a function of sunDir.y, which is the same
      // quantity the scattering in the sky shader is integrating. They cannot
      // disagree any more, because there is only one number.
      const sunY = sunDir.y;
      // Direct sunlight, which ends at the geometric horizon and not a moment
      // later. Everything after that is skylight, and skylight is the hemi.
      const dayAmt = sstep(-0.02, 0.13, sunY);
      // 0 overhead, 1 on the horizon. The reddening and the dimming both run
      // on its square, because neither is linear in air mass.
      const low = clamp01(1 - sunY / 0.42);
      const moonAmt = sstep(-0.02, -0.17, sunY);
      // The swap of the shadow-casting direction happens where both terms are
      // zero, so there is nothing to see when it happens.
      const useMoon = sunY <= -0.02;
      sun.position.copy(useMoon ? moonDir : sunDir).multiplyScalar(900);
      sun.intensity = useMoon ? 0.34 * moonAmt : 2.45 * dayAmt * (1 - 0.5 * low * low);
      sunColA.copy(daySunCol).lerp(duskSunCol, low * low);
      sun.color.copy(useMoon ? nightSunCol : sunColA);
      // Linearised hemisphere colours carry roughly a third less luminance, so
      // the fill comes back up — but not all the way. Some of that lost fill is
      // exactly the flatness this pass is trying to remove: a shadowed wall
      // should fall away, not sit at three-quarter brightness.
      //
      // The skylight is what keeps a courtyard readable for the half hour
      // after sunset, so it outlives the sun deliberately: it is still at a
      // third of full when the direct light has been gone for ten degrees.
      const skyAmt = sstep(-0.22, 0.14, sunY);
      hemi.intensity = 0.25 + 0.40 * skyAmt;
      hemiA.copy(dayHemiSky).lerp(duskHemiSky, low * low * dayAmt);
      hemi.color.copy(hemiA).lerp(nightHemiSky, 1 - skyAmt);
      hemi.groundColor.copy(dayHemiGnd).lerp(nightHemiGnd, 1 - skyAmt);
      fogA.copy(dayFog).lerp(duskFog, low * low);
      scene.fog.color.copy(fogA).lerp(nightFog, 1 - skyAmt);
      windowMat.emissiveIntensity = e2 * 1.6;
      doorGlow.intensity = e2 * 1.5;
      goldPlate.emissiveIntensity = e2 * 0.18;
      // at night there is far less sky for the gold to reflect
      const envI = lerp(1.05, 0.26, e2);
      for (let mi = 0; mi < metals.length; mi++) metals[mi].envMapIntensity = envI;
      shetiyaLight.intensity = lerp(0.9, 1.6, e2);
      fireLight.intensity = lerp(1.3, 2.4, e2) + Math.sin(t * 13) * 0.12 + (vnoiseJS(t * 7) - 0.5) * 0.3;
      fireBlueLight.intensity = lerp(0.85, 1.45, e2) + (vnoiseJS(t * 11 + 40) - 0.5) * 0.35;
      // The festival lights burn steadily brighter than a wall torch and are
      // not tied to nightfall: a chanukiah is lit at dusk and burns for half an
      // hour past it, and these are the only flames in the House that do not
      // go out when the sun comes up.
      for (let fi = 0; fi < festivalFlames.length; fi++) {
        const { fl, li, ph } = festivalFlames[fi];
        const f = 0.86 + Math.sin(t * 8.3 + ph) * 0.09 + (vnoiseJS(t * 4.4 + ph) - 0.5) * 0.16;
        fl.scale.set(0.9 * f, 1.5 * f, 1);
        fl.material.opacity = 0.55 + e2 * 0.45;
        li.intensity = (0.35 + e2 * 0.85) * f;
      }
      torchFires.forEach(({ light, flame }, ti) => {
        light.intensity = e2 * 1.1 + Math.sin(t * 9 + ti * 2.4) * 0.1 * e2;
        const fs = 0.3 + e2 * 0.8 + Math.sin(t * 11 + ti * 3.1) * 0.12 + (vnoiseJS(t * 5 + ti) - 0.5) * 0.2;
        flame.scale.set(3 * fs, 4.4 * fs, 1);
        flame.material.opacity = 0.35 + e2 * 0.6;
      });
      // ── Clouds ──
      //
      // Two fixes and one addition. The drift was `+= speed` once a frame,
      // which the frame-rate audit missed: the weather ran two and a half times
      // faster on a 144Hz laptop than on a 60Hz one. It is per-second now.
      //
      // The addition is the reason to stop and watch. Clouds are the last thing
      // the sun touches — they are above the terminator and lit from
      // underneath long after the courts have gone into shadow — and because
      // the light arrives almost horizontally at that hour, the ones standing
      // in the sun's direction take it and the ones behind the viewer do not.
      // So the warmth is per-cloud, not a wash over all of them: gold on one
      // side of the sky, blue-grey on the other, which is what a real evening
      // looks like and what a single tint could never say.
      const shx = sunDir.x, shz = sunDir.z;
      const shl = Math.hypot(shx, shz) || 1;
      const dusk = low * low * sstep(-0.16, 0.10, sunY);
      stepSheep(dt);
      stepConfetti(dt);
      // ── The ox breathes ──
      // Four small motions on four unrelated periods, so they never line up
      // into a loop: the barrel fills and empties, the tail swings and
      // occasionally snaps at a fly, one ear flicks, and the head goes down to
      // the grass and comes up again. Nothing here is more than a few degrees.
      for (let oi = 0; oi < livingOx.length; oi++) {
        const { o, phase } = livingOx[oi];
        const br = 1 + Math.sin(t * 0.9 + phase) * 0.022;
        o.chest.scale.set(1.05 * br, 1.02 * br, 1.0 * br);
        o.belly.scale.set(1.25, 0.94 * br, 1.02 * br);
        // A tail hangs and swings; a fly makes it snap. The snap is the sharp
        // term riding on the slow one, and it is what makes her look alive.
        const fly = Math.max(0, Math.sin(t * 0.21 + phase * 2.1) - 0.93) * 14;
        o.tail.rotation.x = Math.sin(t * 0.75 + phase) * 0.16 + fly * Math.sin(t * 9);
        o.tail.rotation.z = Math.sin(t * 0.51 + phase * 1.7) * 0.11;
        const flick = Math.max(0, Math.sin(t * 0.33 + phase * 3.3) - 0.9) * 9;
        o.earR.rotation.x = 0.5 + flick;
        o.earL.rotation.x = -0.5 - Math.max(0, Math.sin(t * 0.29 + phase) - 0.94) * 8;
        // Grazing: down for a long while, up for a short one.
        const graze = Math.max(0, Math.sin(t * 0.13 + phase * 1.3) * 1.5);
        o.head.rotation.z = Math.min(1, graze) * 0.62;
        o.head.position.y = 5.05 - Math.min(1, graze) * 1.5;
        o.head.position.x = 4.15 + Math.min(1, graze) * 0.55;
      }
      // ── The swell ──
      // For eight seconds after the thirty-sixth is found the House itself
      // answers: the Shetiyah lights the room above it, the gold goes hot, and
      // the exposure lifts most of a stop and comes back down. That last one is
      // the whole trick — a flash of light in a tone-mapped scene is not a
      // white sprite over the top, it is the camera opening.
      if (finaleAt >= 0) {
        const e = t - finaleAt;
        if (e > 9) { finaleAt = -1; renderer.toneMappingExposure = 0.78; }
        else {
          // Fast up, slow down, with the shofar underneath it.
          const swell = e < 0.55 ? e / 0.55 : Math.max(0, 1 - (e - 0.55) / 8.4);
          const s2 = swell * swell * (3 - 2 * swell);
          renderer.toneMappingExposure = 0.78 + 0.30 * s2;
          shetiyaLight.intensity += 5.5 * s2;
          goldPlate.emissiveIntensity += 0.55 * s2;
          for (let mi = 0; mi < metals.length; mi++) metals[mi].envMapIntensity += 0.9 * s2;
        }
      }
      clouds.forEach((c2) => {
        const u = c2.userData;
        c2.position.x += u.speed * dt;
        if (c2.position.x > 1800) c2.position.x = -1800;
        const cl = Math.hypot(c2.position.x, c2.position.z) || 1;
        const facing = (c2.position.x * shx + c2.position.z * shz) / (cl * shl);
        // Cirrus hold the light longest of anything in the sky — they are ice
        // at three times the height, and they are still burning when the
        // cumulus below them have gone grey.
        const warm = clamp01(0.34 + 0.66 * facing) * dusk * (u.cirrus ? 1.25 : 1);
        const night = 1 - skyAmt;
        const r = lerp(1.0, 1.0, warm), g = lerp(1.0, 0.55, warm), b = lerp(1.0, 0.30, warm);
        u.mat.color.setRGB(lerp(r, 0.30, night), lerp(g, 0.35, night), lerp(b, 0.52, night));
        u.mat.opacity = u.baseO * lerp(1, 0.26, night) * (u.cirrus ? 0.55 + 0.75 * dusk : 1);
      });
      // Dust peaks when the sun is low and the light rakes through it. sunDir.y
      // runs about 0.6 at midday down through 0 at the horizon, so 1 - y is the
      // rake; squared, because the effect is not linear in anyone's memory of it.
      const rake = Math.min(1, Math.max(0, 1 - sunDir.y * 1.35));
      // A floor of 0.3 rather than a pure rake term: with the sun at its
      // midday height this evaluated to 0.036 and the whole eighteen-sprite
      // layer was invisible at the one time of day the House opens on — real
      // in the code and absent on screen. Desert air is never actually clear.
      const dustLit = (0.3 + 0.7 * rake * rake) * (1 - e2 * 0.8);
      // The swifts share the dust's rake: out at dusk and dawn, gone at noon.
      // A parabola on the day/night ease, not the rake: zero in full daylight,
      // zero in the dark, peaking as the light goes. The rake term saturates at
      // night and would have left them circling the walls at midnight, which
      // swifts do not do — they are birds of the last hour of light and the
      // first. Catching them is a reward for watching the sun go down.
      const swiftLit = Math.min(1, 1.25 * 4 * e2 * (1 - e2));
      swiftFlock.visible = swiftLit > 0.01;
      if (swiftFlock.visible) {
        swiftMat.opacity = Math.min(1, swiftLit);
        for (let si = 0; si < swifts.length; si++) {
          const u = swifts[si].userData;
          u.a += u.sp * dt;
          const y = u.h + Math.sin(t * u.bobSp + u.phase) * u.bob;
          swifts[si].position.set(Math.cos(u.a) * u.r, y, Math.sin(u.a) * u.r);
          // Face along the tangent, and bank into the turn the way they do.
          swifts[si].rotation.y = -u.a + (u.sp > 0 ? Math.PI / 2 : -Math.PI / 2);
          swifts[si].rotation.z = (u.sp > 0 ? -0.5 : 0.5) + Math.sin(t * u.bobSp + u.phase) * 0.35;
        }
      }

      for (let hi = 0; hi < haze.length; hi++) {
        const u = haze[hi].userData;
        u.mat.opacity = u.base * dustLit;
        // Warm at the rake, neutral overhead.
        u.mat.color.setRGB(1, lerp(1, 0.86, rake), lerp(1, 0.68, rake));
        haze[hi].position.x += u.drift * dt;
        if (haze[hi].position.x > 1400) haze[hi].position.x = -1400;
      }

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
          const fade = Math.min(1, left / 1.6) * (0.72 + 0.28 * Math.sin(t * 4.2));
          beaconBeam.material.opacity = 0.32 * fade;
          beaconCore.material.opacity = 0.5 * fade;
          beaconRing.material.opacity = 0.9 * fade;
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

      // The current. Scrolling the normal map is what turns a blue slab into
      // moving water; the slow crosswise drift keeps the crests from reading
      // as a conveyor belt.
      waterNormal.offset.x = (t * 0.045) % 1;
      waterNormal.offset.y = Math.sin(t * 0.19) * 0.03;
      streams.forEach((s, i) => { s.material.opacity = 0.6 + Math.sin(t * 2 + i) * 0.11; });
      for (let i = 0; i < ripples.length; i++) {
        const m = ripples[i];
        if (!m.visible) continue;
        const u = m.userData;
        u.life -= dt * 1.5;
        if (u.life <= 0) { m.visible = false; m.material.opacity = 0; continue; }
        const sc = 1 + (1 - u.life) * 2.4;      // opens outward, staying inside the banks
        m.scale.set(sc, sc, 1);
        m.material.opacity = u.life * 0.7;
      }
      sparks.material.opacity = 0.5 + Math.sin(t * 3) * 0.3;
      laverWater.position.y = IC_H + 5.5 + Math.sin(t * 2.2) * 0.06;

      fox.position.y = LAND_Y + Math.abs(Math.sin(t * 2.6)) * 0.25;
      // Makkot 24b is a fox *coming out* of the place of the Holy of Holies —
      // the thing that made Rabbi Akiva laugh when the others tore their
      // clothes. A fox that sits perfectly still is a statue of that story,
      // not the story. So he paces a short beat below the stairs, drops his
      // head to the ground on the turn, and looks up now and then.
      {
        const fu = fox.userData;
        const beat = Math.sin(t * 0.28);                    // slow there-and-back
        fox.position.x = fu.home.x + beat * 11;
        // Ease the turn rather than snapping it: reading the sign of the
        // velocity directly flips him through 180° in a single frame, which
        // reads as a glitch, not an animal changing its mind.
        const want = -0.7 + (Math.cos(t * 0.28) > 0 ? 0 : Math.PI);
        fu.face += (want - fu.face) * (1 - Math.exp(-dt * 3.2));
        fox.rotation.y = fu.face;
        // Weight shifts as he pads; the body dips slightly on each step.
        fox.position.y = fu.home.y + Math.abs(Math.sin(t * 3.1)) * 0.35;
        // Head: mostly down at the scent, lifted on a slow cycle.
        const lift = Math.max(0, Math.sin(t * 0.41 + 1.2));
        fu.head.position.y = 3.6 - 0.5 + lift * 0.9;
        fu.head.rotation.z = -0.35 + lift * 0.45;
        fu.snout.position.y = 3.3 - 0.6 + lift * 1.0;
        fu.snout.rotation.z = -Math.PI / 2 - 0.3 + lift * 0.4;
        fu.tail.rotation.x = Math.sin(t * 3) * 0.28;
        fu.tail.rotation.y = Math.sin(t * 1.7) * 0.18;
      }
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
      // Open, the aperture is a doorway again and must stop swallowing taps
      // aimed through it at the altar and the House beyond.
      nicanorHit.visible = nu.open < 0.02;

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
          // "וַיַּעֲבִרֵנִי בַמַּיִם מֵי אָפְסָיִם" — and he made me pass through the water,
          // ankle-deep (Yechezkel 47:3). This water is for walking through, and
          // here at the threshold it is still מים מפכים, a trickle — Yoma 77b has
          // it issuing thin as a locust's antennae. Nobody bridges a rill.
          // What it must not look like is clipping, which is what it was: full
          // stride, no splash, feet hidden under a translucent blue skin. The
          // amah now shortens the step, flattens the bob to a wade, quiets the
          // arms, and answers at the feet.
          const wet = f.userData.wet;
          f.userData.t = (f.userData.t + f.userData.speed * dt * (wet ? 0.55 : 1)) % 1;
          const total = path.length;
          const ft = f.userData.t * total;
          const i0 = Math.floor(ft) % total, i1 = (i0 + 1) % total;
          const frac = ft - Math.floor(ft);
          const x = lerp(path[i0][0], path[i1][0], frac);
          const z = lerp(path[i0][1], path[i1][1], frac);
          const nowWet = inAmah(x, z);
          const bob = Math.abs(Math.sin(t * 6 + f.userData.t * 40));
          f.position.set(x, IC_H + bob * (nowWet ? 0.04 : 0.14), z);
          f.rotation.y = Math.atan2(-(path[i1][1] - path[i0][1]), path[i1][0] - path[i0][0]) + Math.PI / 2;
          const swing = Math.sin(t * 6 + f.userData.t * 40) * (nowWet ? 0.16 : 0.3);
          if (f.userData.armL) f.userData.armL.rotation.x = swing - 0.25;
          if (f.userData.armR) f.userData.armR.rotation.x = -swing + 0.25;
          if (nowWet) {
            // One splash as he steps in, then a smaller one under each footfall
            // — `bob` at its lowest is the foot down. Counts are kept small on
            // purpose: the 60 sprites here are the same pool the gold dust of a
            // found wonder comes out of, and a wonder must never be upstaged by
            // a man crossing a stream.
            if (!wet) {
              burst(f.position, { count: 12, speed: 6, size: 0.95, rise: 1.1, tint: 0xdff4ff });
              ripple(x, z);
            } else if (bob < 0.06 && t - (f.userData.dropAt || 0) > 0.45) {
              f.userData.dropAt = t;
              burst(f.position, { count: 4, speed: 4, size: 0.7, rise: 1, tint: 0xdff4ff });
              ripple(x, z);
            }
          }
          f.userData.wet = nowWet;
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
        // Was a hard-coded 0.016 — an assumed 60Hz frame. The doves circled
        // half again as fast on a 144Hz display and crawled on a struggling
        // one. Same bug shape as the day/night ease; the kohanim next door
        // already used dt.
        d.userData.a += d.userData.sp * dt;
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
    // How long the white stone takes to rise, on the devices people actually
    // have. Rounded to a tenth of a second — the exact millisecond is noise.
    track("scene-ready", { ms: Math.round(performance.now() / 100) * 100 });

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
      // The heart of the measurement: which of the thirty-six are actually
      // found, in what order, and how many people are still there by then.
      const known = foundRef.current.includes(id);
      const d = DISCOVERIES[id];
      track(known ? "revisit" : "discovery", {
        id,
        kind: d.kind,
        title: enTitle(d.title),
        nth: known ? foundRef.current.length : foundRef.current.length + 1,
        mode: questRef.current ? "quest" : "free",
        walking: walkRef.current ? "yes" : "no",
      });
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

  // ── What day it is, and what that means here ──
  // Recomputed when the rite toggles, which is the only thing on this screen
  // that can change the answer. The date itself is read once a mount; nobody
  // leaves this open across midnight, and if they do the House is wrong about
  // the date for exactly as long as a reload takes to fix.
  const today = useMemo(() => {
    const rd = sceneDateRD();
    const n = new Date(Date.UTC(rdToGreg(rd).y, rdToGreg(rd).m - 1, rdToGreg(rd).d));
    const h = rdToHeb(rd);
    const p = parshahOnOrAfter(rd, israel);
    return {
      rd, h,
      he: hebDateStr(h),
      greg: n.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }),
      chag: chagOn(rd, israel),
      omer: omerDay(rd),
      // The day of the Hebrew month is the age of the moon, so the panel can
      // say what is actually up there — and the moon in the sky above the
      // House is drawn from the same number.
      moon: h.day - 1,
      parshah: {
        he: p.idx.map((i) => PARSHIYOT_HE[i]).join("־"),
        en: p.idx.map((i) => PARSHIYOT[i]).join("–"),
        book: PARSHAH_BOOK(p.idx[0]),
      },
    };
  }, [israel]);

  // A Hebrew birthday in a given year. Two things go wrong and both have
  // answers: a 30th in a month that only has 29 days this year falls back to
  // the 29th, and an Adar birthday in a leap year goes to Adar II, which is
  // the Rema's ruling (Orach Chaim 55:10) and the near-universal practice.
  const hebBirthdayIn = (hy, bm, bd) => {
    let m = bm;
    if (bm === 12 && hebLeap(hy)) m = 13;
    else if (bm === 13 && !hebLeap(hy)) m = 12;
    return hebToRD(hy, m, Math.min(bd, hebMonthLen(hy, m)));
  };
  const birth = useMemo(() => {
    const mm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(bday);
    if (!mm) return null;
    const y = +mm[1], m = +mm[2], d = +mm[3];
    if (y < 1500 || y > 2199 || m < 1 || m > 12 || d < 1 || d > gMonthLen(y, m)) return null;
    const rd = gregToRD(y, m, d);
    const h = rdToHeb(rd);
    const named = (p) => ({
      he: p.idx.map((i) => PARSHIYOT_HE[i]).join("־"),
      en: p.idx.map((i) => PARSHIYOT[i]).join("–"),
      book: PARSHAH_BOOK(p.idx[0]),
    });
    let hy = today.h.year;
    if (hebBirthdayIn(hy, h.month, h.day) < today.rd) hy += 1;
    const nextRd = hebBirthdayIn(hy, h.month, h.day);
    const g = rdToGreg(nextRd);
    const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Shabbat"];
    return {
      he: hebDateStr(h),
      dow: DOW[((rd % 7) + 7) % 7],
      chag: chagOn(rd, israel),
      parshah: named(parshahOnOrAfter(rd, israel)),
      thisYear: `${hebDateStr(rdToHeb(nextRd))} — ${g.d} ${["January","February","March","April","May","June","July","August","September","October","November","December"][g.m - 1]} ${g.y}`,
      turning: hy - h.year,
      bat: named(parshahOnOrAfter(hebBirthdayIn(h.year + 12, h.month, h.day), israel)),
      bar: named(parshahOnOrAfter(hebBirthdayIn(h.year + 13, h.month, h.day), israel)),
    };
  }, [bday, israel, today]);

  // ─── A chag announces itself ───
  // Once, a few seconds after the doors open, and only if there is one. The
  // House knows what day it is; it would be strange for it to say nothing on
  // the day the whole place was built for.
  useEffect(() => {
    if (!opened || !loaded || !today.chag) return;
    const t = setTimeout(() => showToast(`${today.chag.he} — ${today.chag.en}. Open לוּחַ.`), 4200);
    return () => clearTimeout(t);
  }, [opened, loaded, today.chag, showToast]);

  const allFound = found.length === DISCOVERIES.length;

  // ── The ending fires once, and only for the person who earned it ──
  // A visitor who comes back to a finished House should find it finished, not
  // have the shofar blown at them again on every reload. So the celebration is
  // hung on the *transition* to thirty-six, and the first value seen after the
  // saved state loads is taken as the starting point rather than as an event.
  const prevFound = useRef(-1);
  useEffect(() => {
    if (!storageReady) return;
    const n = found.length, was = prevFound.current;
    prevFound.current = n;
    if (was < 0) return;
    // Two moments worth naming on their own: the one that turns a visitor into
    // a player, and the one almost nobody reaches.
    if (was === 0 && n === 1) track("first-discovery");
    if (n === DISCOVERIES.length && was < n) {
      track("quest-complete");
      setFinale(true);
      apiRef.current.celebrate?.();
    }
  }, [found.length, storageReady]);
  // ─── the shape of a whole visit ───
  // Page views say how many came; this says how long they stayed and how deep
  // they got. Sent on pagehide, which fires on a phone being locked or a tab
  // being closed — the one lifecycle event mobile Safari can be relied on for.
  // Guarded so that a visit is only ever counted once, however it ends.
  const departed = useRef(false);
  useEffect(() => {
    const startedAt = performance.now();
    const depart = (why) => {
      if (departed.current) return;
      departed.current = true;
      track("visit-end", {
        found: foundRef.current.length,
        seconds: Math.round((performance.now() - startedAt) / 1000),
        mode: questRef.current ? "quest" : "free",
        walked: walkedRef.current ? "yes" : "no",
        why,
      });
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") depart("hidden"); };
    const onPageHide = () => depart("pagehide");
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  // ─── מֵחָדָשׁ — begin again ───
  // Finding a wonder leaves marks all through the scene: materials swapped to
  // gold, the menorah lit, the ketoret woken, Nicanor's doors open, the eighth
  // rimon revealed. Unwinding each one by hand would be a list that goes stale
  // the next time a wonder is added, so this rewrites the saved record and
  // raises the House again from nothing — the one reset that cannot miss a
  // piece. What a visitor chose is not progress, so night and sound survive,
  // and someone who has just found all thirty-six is not shown the pesichah
  // again on their way back in.
  const startOver = useCallback(async () => {
    track("start-over");
    try {
      await window.storage?.set(STORE_KEY, JSON.stringify({ found: [], night, sound, opened: true }));
    } catch (err) { /* nothing saved means nothing to clear */ }
    window.location.reload();
  }, [night, sound]);
  // Close the ending and the question goes with it — reopening the card should
  // never land on a half-asked "are you sure".
  useEffect(() => { if (!finale) setConfirmReset(false); }, [finale]);

  // Escape closes the teaching card as well. It covers the House exactly the
  // way the finale does, and it opens thirty-six times to the finale's once.
  useEffect(() => {
    if (fact === null) return;
    const k = (e) => { if (e.key === "Escape") closeFact(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [fact, closeFact]);

  // Escape closes it, like everything else that covers the House.
  useEffect(() => {
    if (!finale) return;
    const k = (e) => { if (e.key === "Escape") setFinale(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [finale]);

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
        .hints-panel { max-height: max(150px, min(48vh, calc(100vh - 448px))); }
        @media (max-width: 720px) {
          .hints-panel { max-height: max(150px, min(48vh, calc(100vh - 600px))); }
        }
        /* Beside the chips, not beneath them, wherever there is width for it —
           a phone held sideways has no room below the column, and a desktop has
           room to spare, so both get the taller list. Only a portrait phone,
           which has neither, keeps the stacked layout above. */
        @media (max-height: 560px), (min-width: 900px) {
          .hints-panel { top: 74px !important; bottom: 14px; right: 178px !important;
            width: min(285px, calc(100vw - 210px)) !important; max-height: none; }
        }
        @keyframes countPop { 0% { transform: scale(1); } 38% { transform: scale(1.32); color: #ffd97a; } 100% { transform: scale(1); } }
        @keyframes gleam { 0%,100% { box-shadow: 0 0 0 0 rgba(255,217,122,0); } 50% { box-shadow: 0 0 0 5px rgba(255,217,122,.18); } }
        @keyframes veilIn { from { opacity: 0; } to { opacity: 1; } }
        /* The ending. The card comes up off the floor of the screen and the
           seal turns once as it lands — one motion, not two, so it reads as
           something being set down rather than as an animation being played. */
        @keyframes finaleRise { from { opacity:0; transform: translateY(34px) scale(.94); } to { opacity:1; transform: none; } }
        @keyframes sealTurn { from { opacity:0; transform: rotate(-160deg) scale(.3); } to { opacity:1; transform: none; } }
        @keyframes sealGlow { 0%,100% { text-shadow: 0 0 14px rgba(255,217,122,.5); } 50% { text-shadow: 0 0 34px rgba(255,217,122,1), 0 0 60px rgba(212,164,55,.6); } }
        .finale-card { animation: finaleRise .7s cubic-bezier(.16,.9,.28,1) both .1s; }
        .finale-seal { color:#ffd97a; animation: sealTurn .8s cubic-bezier(.16,1,.3,1) both .28s, sealGlow 3.4s ease-in-out infinite 1.1s; }
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
        .seal { position:absolute; top:-34px; left:50%; transform:translateX(-50%);
          width:58px; height:68px; border-radius:29px 29px 5px 5px;
          display:flex; align-items:center; justify-content:center;
          font-size:26px; line-height:1;
          filter:drop-shadow(0 2px 2px rgba(60,44,10,.4));
          background:linear-gradient(158deg,#fff6d8 0%,#f2d68f 20%,#d9ac41 52%,#b3841f 76%,#eccb79 100%);
          box-shadow:0 10px 24px rgba(0,0,0,.38), 0 0 0 1px rgba(110,84,26,.45),
                     inset 0 1px 0 rgba(255,255,255,.9), inset 0 -3px 6px rgba(120,88,20,.35);
          z-index:2; }
        /* the opening — a recessed niche the emoji stands inside, the way the
           gatehouse cells stand back inside their own arch */
        .seal::before { content:""; position:absolute; inset:5px 6px 6px; border-radius:24px 24px 3px 3px;
          background:linear-gradient(170deg, rgba(92,66,14,.3), rgba(255,246,216,.32) 55%, rgba(255,255,255,.48));
          box-shadow:inset 0 2px 5px rgba(80,58,12,.42), inset 0 -1px 0 rgba(255,255,255,.7),
                     0 0 0 1px rgba(96,70,16,.28); }
        .seal::after { content:""; position:absolute; left:50%; bottom:-7px; transform:translateX(-50%);
          width:84px; height:7px; border-radius:2px;
          background:linear-gradient(90deg,transparent,rgba(190,152,68,.9) 16%,rgba(255,238,190,.95) 50%,rgba(190,152,68,.9) 84%,transparent);
          box-shadow:0 2px 7px rgba(0,0,0,.28); }
        .seal-silver { color:#465060;
          background:linear-gradient(158deg,#ffffff 0%,#eef1f5 20%,#c2c9d3 52%,#939cab 76%,#e2e7ee 100%);
          box-shadow:0 10px 24px rgba(0,0,0,.38), 0 0 0 1px rgba(90,100,115,.4),
                     inset 0 1px 0 rgba(255,255,255,.95), inset 0 -3px 6px rgba(80,92,108,.32); }
        .seal-silver::before { border-radius:24px 24px 3px 3px;
          background:linear-gradient(170deg, rgba(70,80,94,.28), rgba(240,244,249,.34) 55%, rgba(255,255,255,.52));
          box-shadow:inset 0 2px 5px rgba(62,72,86,.4), inset 0 -1px 0 rgba(255,255,255,.75),
                     0 0 0 1px rgba(80,92,108,.3); }
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
        .glyph-tile { flex:0 0 30px; height:33px; border-radius:15px 15px 4px 4px;
          display:flex; align-items:center; justify-content:center; font-size:16px; line-height:1;
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
              // Asking for the pillar of light is the honest measure of how
              // hard a given hint is: the ones with the highest counts are the
              // ones whose wording needs work.
              track("show-me", { from: "banner", id: nextTarget, nth: found.length + 1, title: enTitle(DISCOVERIES[nextTarget].title) });
              if (apiRef.current.guideTo?.(nextTarget)) showToast(walkMode ? "Follow the pillar of light." : "There — where the light stands.");
              else showToast("אֵין אוֹר — nothing to mark there yet. Walk the courts and look for it.");
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
          <div key={found.length} onClick={allFound ? () => setFinale(true) : undefined} title={allFound ? "Read it again" : undefined} style={{ fontSize: 21, fontWeight: 700, fontFamily: "'Frank Ruhl Libre', serif", animation: "countPop .55s ease", ...(allFound ? { color: "#ffd24a", cursor: "pointer", animation: "countPop .55s ease, glowPulse 2s infinite .55s" } : {}) }}>
            {found.length} / {DISCOVERIES.length}
          </div>
        </div>
        <button className="chip" onClick={() => { track("walk-mode", { to: walkMode ? "off" : "on", found: found.length }); setWalkMode((w) => !w); }} style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: walkMode ? "linear-gradient(135deg,#f3e6c0,#e0cd97)" : "rgba(30,24,12,.85)", color: walkMode ? "#4a3a18" : "#e9d9a8", border: "1px solid rgba(212,164,55,.5)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          {walkMode ? "⬆ Overview" : "⇊ Walk the Courts"}
        </button>
        <button className="chip" onClick={() => { track("night-mode", { to: night ? "off" : "on" }); setNight((n) => !n); }} style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: night ? "linear-gradient(135deg,#f3e6c0,#e0cd97)" : "linear-gradient(135deg,#1a2440,#2c3a63)", color: night ? "#4a3a18" : "#e8ecf7", border: "1px solid rgba(212,164,55,.55)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          {night ? "☀ יום" : "☾ לילה"}
        </button>
        <button className="chip" onClick={() => { track("sound", { to: sound ? "off" : "on" }); setSound((s) => !s); }} title={sound ? "Silence the courts" : "Let the courts sound"} style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: sound ? "linear-gradient(135deg,#f3e6c0,#e0cd97)" : "rgba(30,24,12,.85)", color: sound ? "#4a3a18" : "#e9d9a8", border: "1px solid rgba(212,164,55,.4)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          {sound ? "♪ קול" : "⃠ דממה"}
        </button>
        <button className="chip" onClick={() => { track("quest-mode", { to: questMode ? "free" : "quest", found: found.length }); setQuestMode((q) => !q); }} style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: "rgba(30,24,12,.85)", color: "#e9d9a8", border: "1px solid rgba(212,164,55,.4)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          {questMode ? "מסע · Quest ✓" : "Free explore"}
        </button>
        <button className="chip" onClick={() => { track("panel", { which: "steps", to: music ? "close" : "open" }); setMusic((m) => !m); setPeace(false); setCal(false); setHints(false); }} title="Play the fifteen steps" style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: music ? "linear-gradient(135deg,#f3e6c0,#e0cd97)" : "rgba(30,24,12,.85)", color: music ? "#4a3a18" : "#e9d9a8", border: "1px solid rgba(212,164,55,.4)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          ♪ נְגִינוֹת
        </button>
        <button className="chip" onClick={() => { track("panel", { which: "calendar", to: cal ? "close" : "open" }); setCal((c) => !c); setMusic(false); setPeace(false); setHints(false); }} title="Today in the House, and the parshah of any birthday" style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: cal ? "linear-gradient(135deg,#f3e6c0,#e0cd97)" : "rgba(30,24,12,.85)", color: cal ? "#4a3a18" : "#e9d9a8", border: "1px solid rgba(212,164,55,.4)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          לוּחַ{today.chag ? " ✦" : ""}
        </button>
        <button className="chip" onClick={() => { track("panel", { which: "peace", to: peace ? "close" : "open" }); setPeace((p) => !p); setMusic(false); setCal(false); setHints(false); }} title="A house of prayer for all peoples" style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: peace ? "linear-gradient(135deg,#f3e6c0,#e0cd97)" : "rgba(30,24,12,.85)", color: peace ? "#4a3a18" : "#e9d9a8", border: "1px solid rgba(212,164,55,.4)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
          שָׁלוֹם
        </button>
        <button className="chip" onClick={() => { track("panel", { which: "hints", to: hints ? "close" : "open" }); setHints((h) => !h); setMusic(false); setCal(false); setPeace(false); }} style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12.5, letterSpacing: ".07em", background: "rgba(30,24,12,.85)", color: "#e9d9a8", border: "1px solid rgba(212,164,55,.4)", borderRadius: 999, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
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
        <div className="panel hints-panel" style={{ position: "absolute", top: 432, right: 16, width: "min(285px, calc(100vw - 32px))", boxSizing: "border-box", overflowY: "auto", WebkitOverflowScrolling: "touch", background: "rgba(28,22,10,.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(212,164,55,.4)", borderRadius: 16, padding: "16px 18px", color: "#e8dcba", boxShadow: "0 12px 40px rgba(0,0,0,.4)", zIndex: 3 }}>
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
              <div key={i} style={{ fontSize: 14, fontStyle: "italic", padding: "5px 0", opacity: lockedAhead ? 0.35 : 1, borderBottom: i < DISCOVERIES.length - 1 ? "1px solid rgba(212,164,55,.14)" : "none" }}>
                {/* the mark stays lit and unstruck — it is the trophy; only the
                    hint it replaces gets crossed out */}
                <span style={{ fontStyle: "normal", marginRight: 5, opacity: done ? 1 : 0.85 }}>{done ? d.emoji : `${i + 1}.`}</span>
                <span style={{ opacity: done ? 0.42 : 1, textDecoration: done ? "line-through" : "none" }}>
                  {lockedAhead ? "· · · still veiled · · ·" : d.hint}
                </span>
                {!lockedAhead && !done && (
                  <button
                    onClick={() => {
                      track("show-me", { from: "list", id: i, title: enTitle(d.title) });
                      if (apiRef.current.guideTo?.(i)) showToast(walkMode ? "Follow the pillar of light." : "There — where the light stands.");
                      else showToast("אֵין אוֹר — nothing to mark there yet. Walk the courts and look for it.");
                    }}
                    title="Mark it with a pillar of light"
                    style={{ marginLeft: 8, fontStyle: "normal", fontSize: 11.5, background: "rgba(212,164,55,.18)", color: "#ffd97a", border: "1px solid rgba(212,164,55,.45)", borderRadius: 999, padding: "2px 9px", cursor: "pointer" }}
                  >⌖ show me</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ נְגִינוֹת — the melody panel ═══
          The strip is the fifteen steps laid flat: same span, D3 to D5, same
          tuning. A note lights its key here and its tread out in the courts at
          the same instant, off one callback, so the two never disagree. */}
      {music && (
        <div className="panel" style={{ position: "absolute", top: 296, right: 16, width: "min(330px, calc(100vw - 32px))", boxSizing: "border-box",
          background: "linear-gradient(160deg,#fdf8ec,#f2e7ce)", color: "#3a2f16", borderRadius: 16, padding: "16px 18px",
          border: "1px solid rgba(150,120,50,.3)", boxShadow: "0 16px 44px rgba(0,0,0,.35)", maxHeight: "min(62vh, 560px)", overflowY: "auto", zIndex: 30 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 700, fontSize: 15 }}>נְגִינוֹת · Melodies</div>
            <button onClick={() => { apiRef.current.stopMelody?.(); setNowPlaying(null); setActiveNote(null); setSongBeat(-1); setMusic(false); }}
              aria-label="Close" style={{ background: "none", border: "none", color: "#7a6634", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
          <div style={{ fontSize: 11.5, lineHeight: 1.55, color: "#6d5c30", margin: "6px 0 12px" }}>
            The Levites stood on these fifteen steps and played (Middot 2:5; Sukkah 51b). The steps are tuned to D Ahava Rabbah — watch them light in the courts as each melody climbs.
          </div>
          {MELODIES.map((mel) => (
            <div key={mel.id} style={{ borderTop: "1px solid rgba(150,120,50,.22)", padding: "11px 0 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <button
                  onClick={() => {
                    if (nowPlaying === mel.id) { apiRef.current.stopMelody?.(); setNowPlaying(null); setActiveNote(null); setSongBeat(-1); return; }
                    const ok = apiRef.current.playMelody?.(mel, (m, b) => { setActiveNote(m); setSongBeat(b); },
                      () => { setNowPlaying(null); setActiveNote(null); setSongBeat(-1); });
                    if (ok) setNowPlaying(mel.id);
                    else showToast("קוֹל — turn the sound on first, and the steps will answer.");
                  }}
                  style={{ flex: "0 0 auto", width: 30, height: 30, borderRadius: 999, cursor: "pointer",
                    background: nowPlaying === mel.id ? "#4a3a18" : "rgba(74,58,24,.12)", color: nowPlaying === mel.id ? "#f5e9c8" : "#4a3a18",
                    border: "1px solid rgba(150,120,50,.4)", fontSize: 12, lineHeight: 1 }}
                  aria-label={nowPlaying === mel.id ? "Stop" : "Play " + mel.title}>
                  {nowPlaying === mel.id ? "■" : "▶"}
                </button>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 700, fontSize: 14 }}>{mel.heb}</div>
                  <div style={{ fontSize: 11.5, color: "#6d5c30" }}>{mel.title}</div>
                </div>
              </div>
              <div style={{ fontSize: 11.5, lineHeight: 1.6, marginTop: 8 }}>{mel.blurb}</div>
              <div style={{ fontSize: 10.5, color: "#8a7440", marginTop: 6, fontStyle: "italic" }}>{mel.source}</div>
              {!mel.verified && (
                <div style={{ fontSize: 10.5, color: "#8a5a2a", marginTop: 4 }}>
                  ♪ Transcribed by ear — not yet checked against a score.
                </div>
              )}
              {/* ─── מִלִּים — the words ───
                  Open per melody, and while that melody is playing the stanza
                  being sung lights up. The span is in beats, so it follows the
                  tune and not the clock: change the tempo and the words still
                  land in the right place. */}
              <button
                onClick={() => setLyrics((v) => (v === mel.id ? null : mel.id))}
                style={{ marginTop: 8, fontFamily: "'Frank Ruhl Libre', serif", fontSize: 11, letterSpacing: ".08em",
                  background: lyrics === mel.id ? "rgba(74,58,24,.14)" : "transparent", color: "#6d5c30",
                  border: "1px solid rgba(150,120,50,.4)", borderRadius: 999, padding: "3px 11px", cursor: "pointer" }}>
                {lyrics === mel.id ? "מִלִּים ▾" : "מִלִּים ▸ words"}
              </button>
              {lyrics === mel.id && (
                <div style={{ marginTop: 9, padding: "11px 12px", borderRadius: 12, background: "rgba(255,252,244,.72)", border: "1px solid rgba(150,120,50,.26)" }}>
                  {mel.lyrics.wordless && (
                    <div style={{ fontSize: 12.5, lineHeight: 1.6, fontStyle: "italic", color: "#6d5c30" }}>{mel.lyrics.wordless}</div>
                  )}
                  {mel.lyrics.stanzas.map((st, si) => {
                    const live = nowPlaying === mel.id && songBeat >= st.from && songBeat < st.to;
                    return (
                      <div key={si} style={{ marginBottom: 11, paddingLeft: 9,
                        borderLeft: `2px solid ${live ? "#d4a437" : "rgba(150,120,50,.2)"}`,
                        transition: "border-color .25s ease, opacity .25s ease",
                        opacity: nowPlaying === mel.id && !live ? 0.42 : 1 }}>
                        <div dir="rtl" style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 16.5, lineHeight: 1.75, color: live ? "#4a3a18" : "#544729", whiteSpace: "pre-line", textAlign: "right" }}>{st.he}</div>
                        <div style={{ fontSize: 11.5, fontStyle: "italic", color: "#8a7440", marginTop: 3, lineHeight: 1.5 }}>{st.tl}</div>
                        <div style={{ fontSize: 12.5, color: "#544729", marginTop: 3, lineHeight: 1.55 }}>{st.en}</div>
                      </div>
                    );
                  })}
                  {mel.lyrics.more && (
                    <div style={{ borderTop: "1px solid rgba(150,120,50,.22)", paddingTop: 8, marginTop: 2 }}>
                      <div style={{ fontSize: 10.5, letterSpacing: ".09em", textTransform: "uppercase", color: "#8a7440", marginBottom: 5 }}>and the same tune again, three more times</div>
                      {mel.lyrics.more.map((st, si) => (
                        <div key={si} style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 3 }}>
                          <span dir="rtl" style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 14, color: "#544729" }}>{st.he}</span>
                          <span style={{ fontSize: 11.5, color: "#8a7440", fontStyle: "italic" }}>{st.en}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* The strip only appears while something is playing, so it never sits
          over the House doing nothing. */}
      {nowPlaying && (
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 34, zIndex: 30,
          display: "flex", alignItems: "flex-end", padding: "9px 11px", borderRadius: 12,
          background: "rgba(24,19,9,.82)", border: "1px solid rgba(212,164,55,.35)", boxShadow: "0 12px 36px rgba(0,0,0,.45)" }}>
          {(() => {
            const LO = 50, HI = 74;                       // D3..D5, the ascent's own span
            const BLACK = [1, 3, 6, 8, 10];
            const keys = [];
            for (let m = LO; m <= HI; m++) {
              const pc = ((m % 12) + 12) % 12;
              const isBlack = BLACK.includes(pc);
              const on = activeNote === m;
              if (!isBlack) {
                keys.push(
                  <div key={m} style={{ position: "relative", width: 15, height: 52, marginRight: 2, borderRadius: "2px 2px 3px 3px",
                    background: on ? "linear-gradient(180deg,#ffe9a8,#f0c96a)" : "linear-gradient(180deg,#f6f1e2,#ddd4bd)",
                    boxShadow: on ? "0 0 14px rgba(255,206,92,.85)" : "inset 0 -2px 3px rgba(0,0,0,.18)",
                    transition: "background .07s linear, box-shadow .07s linear" }} />
                );
              } else {
                keys.push(
                  <div key={m} style={{ position: "relative", width: 0, marginRight: 0, zIndex: 2 }}>
                    <div style={{ position: "absolute", left: -7, bottom: 20, width: 11, height: 32, borderRadius: "2px 2px 3px 3px",
                      background: on ? "linear-gradient(180deg,#ffd873,#e0a92e)" : "linear-gradient(180deg,#3a3020,#20190e)",
                      boxShadow: on ? "0 0 12px rgba(255,196,64,.9)" : "0 2px 4px rgba(0,0,0,.5)",
                      transition: "background .07s linear, box-shadow .07s linear" }} />
                  </div>
                );
              }
            }
            return keys;
          })()}
        </div>
      )}

      {/* ═══ לוּחַ — the calendar ═══
          The House keeps its own date. Everything here is computed from the
          molad in this file — no table, no network — so it is right in a
          hundred years and right on an aeroplane. */}
      {cal && (
        <div className="panel" style={{ position: "absolute", top: 296, right: 16, width: "min(346px, calc(100vw - 32px))", boxSizing: "border-box",
          background: "linear-gradient(160deg,#fdf8ec,#f2e7ce)", color: "#3a2f16", borderRadius: 16, padding: "16px 18px",
          border: "1px solid rgba(150,120,50,.3)", boxShadow: "0 16px 44px rgba(0,0,0,.35)", maxHeight: "min(66vh, 620px)", overflowY: "auto", zIndex: 30 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 700, fontSize: 15 }}>לוּחַ · Today in the House</div>
            <button onClick={() => setCal(false)} aria-label="Close the calendar" style={{ flex: "0 0 auto", width: 28, height: 28, marginTop: -2, marginRight: -5, lineHeight: 1, fontSize: 15, background: "rgba(150,120,50,.12)", color: "#6d5c30", border: "1px solid rgba(150,120,50,.35)", borderRadius: 999, cursor: "pointer" }}>×</button>
          </div>

          <div style={{ textAlign: "center", margin: "12px 0 4px" }}>
            <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 25, fontWeight: 700, color: "#4a3a18", lineHeight: 1.35 }}>{today.he}</div>
            <div style={{ fontSize: 12.5, color: "#8a7440", fontStyle: "italic", marginTop: 2 }}>{today.greg}</div>
          </div>

          {today.chag && (
            <div style={{ marginTop: 10, padding: "11px 13px", borderRadius: 12, background: "linear-gradient(135deg, rgba(212,164,55,.20), rgba(212,164,55,.09))", border: "1px solid rgba(150,120,50,.34)" }}>
              <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 17, fontWeight: 700, color: "#4a3a18" }}>{today.chag.he}</div>
              <div style={{ fontSize: 11.5, letterSpacing: ".08em", textTransform: "uppercase", color: "#8a7440", marginTop: 1 }}>{today.chag.en}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 6, color: "#544729" }}>{today.chag.note}</div>
            </div>
          )}

          {today.omer > 0 && (
            <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.5, color: "#544729" }}>
              <b style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>סְפִירַת הָעֹמֶר</b> — day {today.omer} of forty-nine
              {today.omer >= 7 && `, which is ${Math.floor(today.omer / 7)} week${Math.floor(today.omer / 7) > 1 ? "s" : ""}${today.omer % 7 ? ` and ${today.omer % 7} day${today.omer % 7 > 1 ? "s" : ""}` : ""}`}.
              <div style={{ fontSize: 12, fontStyle: "italic", color: "#8a7440", marginTop: 3 }}>Counted from the sheaf that was waved in this court on the second day of Pesach (Vayikra 23:15).</div>
            </div>
          )}

          <div style={{ marginTop: 11, fontSize: 12.5, lineHeight: 1.55, color: "#544729" }}>
            <b style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>הַלְּבָנָה</b> — the moon is {today.moon === 0 ? "new tonight" : `${today.moon} day${today.moon > 1 ? "s" : ""} old`}
            {today.moon >= 13 && today.moon <= 16 ? ", and full" : ""}.
            <div style={{ fontSize: 11.5, fontStyle: "italic", color: "#8a7440", marginTop: 2 }}>Turn on the night and look: it is drawn at that phase, because the Hebrew month is the moon and the day of it is the moon's age.</div>
          </div>

          <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid rgba(150,120,50,.24)" }}>
            <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "#8a7440" }}>This Shabbat they read</div>
            <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 20, fontWeight: 700, color: "#4a3a18", marginTop: 3 }}>{today.parshah.he}</div>
            <div style={{ fontSize: 13, color: "#6d5c30" }}>{today.parshah.en} · {today.parshah.book}</div>
          </div>

          {/* ─── the birthday parshah ─── */}
          <div style={{ marginTop: 13, paddingTop: 12, borderTop: "1px solid rgba(150,120,50,.24)" }}>
            <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 700, fontSize: 14.5, color: "#4a3a18" }}>פָּרָשַׁת יוֹם הֻלֶּדֶת</div>
            <div style={{ fontSize: 12.5, fontStyle: "italic", color: "#7a6634", lineHeight: 1.5, marginTop: 3 }}>
              Your Hebrew birthday, and the parshah they read for it — the one a bar or bat mitzvah is called up to.
            </div>
            <input
              type="date" value={bday} max="2199-12-31" min="1500-01-01"
              onChange={(e) => setBday(e.target.value)}
              aria-label="Your date of birth"
              style={{ marginTop: 9, width: "100%", boxSizing: "border-box", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, padding: "9px 11px", borderRadius: 10, border: "1px solid rgba(150,120,50,.45)", background: "rgba(255,252,244,.9)", color: "#3a2f16" }}
            />
            {birth && (
              <div style={{ marginTop: 11, padding: "12px 13px", borderRadius: 12, background: "rgba(255,252,244,.75)", border: "1px solid rgba(150,120,50,.28)" }}>
                <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "#8a7440" }}>You were born on</div>
                <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 19, fontWeight: 700, color: "#4a3a18", marginTop: 2 }}>{birth.he}</div>
                <div style={{ fontSize: 12.5, color: "#7a6634", fontStyle: "italic" }}>a {birth.dow}{birth.chag ? ` · ${birth.chag.en}` : ""}</div>
                <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(150,120,50,.4), transparent)", margin: "10px 0" }} />
                <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "#8a7440" }}>Your parshah</div>
                <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 21, fontWeight: 700, color: "#4a3a18", marginTop: 2 }}>{birth.parshah.he}</div>
                <div style={{ fontSize: 13, color: "#6d5c30" }}>{birth.parshah.en} · {birth.parshah.book}</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "#544729", marginTop: 8 }}>
                  Your Hebrew birthday this year is <b>{birth.thisYear}</b>{birth.turning !== null ? <> — you turn <b>{birth.turning}</b></> : null}.
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#544729", marginTop: 7 }}>
                  <div>At twelve they read <b>{birth.bat.en}</b>.</div>
                  <div>At thirteen, <b>{birth.bar.en}</b>.</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 13, paddingTop: 11, borderTop: "1px solid rgba(150,120,50,.24)", display: "flex", alignItems: "center", gap: 9 }}>
            <button onClick={() => setIsrael((v) => !v)} style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 12, letterSpacing: ".05em", background: israel ? "linear-gradient(135deg,#f0e2b6,#e0cd97)" : "rgba(150,120,50,.12)", color: "#4a3a18", border: "1px solid rgba(150,120,50,.4)", borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}>
              {israel ? "אֶרֶץ יִשְׂרָאֵל" : "חוּץ לָאָרֶץ"}
            </button>
            <div style={{ fontSize: 11.5, fontStyle: "italic", color: "#8a7440", lineHeight: 1.4 }}>
              One day of yom tov or two — it changes the parshah for a few weeks each year.
            </div>
          </div>
        </div>
      )}

      {/* ═══ שָׁלוֹם — what the House is for ═══ */}
      {peace && (
        <div className="panel" style={{ position: "absolute", top: 296, right: 16, width: "min(330px, calc(100vw - 32px))", boxSizing: "border-box",
          background: "linear-gradient(160deg,#fdf8ec,#f2e7ce)", color: "#3a2f16", borderRadius: 16, padding: "16px 18px",
          border: "1px solid rgba(150,120,50,.3)", boxShadow: "0 16px 44px rgba(0,0,0,.35)", maxHeight: "min(62vh, 560px)", overflowY: "auto", zIndex: 30 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 700, fontSize: 15 }}>שָׁלוֹם · The Peace This House Is For</div>
            <button onClick={() => setPeace(false)} aria-label="Close"
              style={{ background: "none", border: "none", color: "#7a6634", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.68, marginTop: 10 }}>
            <p style={{ margin: "0 0 10px" }}>
              This House is not built for its own sake. Every source that describes it standing again describes the same thing happening around it — the fighting stops.
            </p>
            <p style={{ margin: "0 0 4px", fontFamily: "'Frank Ruhl Libre', serif", fontSize: 13.5, direction: "rtl" }}>
              וְכִתְּתוּ חַרְבוֹתָם לְאִתִּים וַחֲנִיתוֹתֵיהֶם לְמַזְמֵרוֹת
            </p>
            <p style={{ margin: "0 0 10px" }}>
              “They shall beat their swords into plowshares and their spears into pruning hooks; nation shall not lift up sword against nation, neither shall they learn war any more.” — Yeshayahu 2:4. The verses just before it are about this mountain, and this House on it.
            </p>
            <p style={{ margin: "0 0 10px" }}>
              Micah 4:4 says the same and then adds what peace actually looks like when you are living in it: <i>each man under his vine and under his fig tree, and none shall make him afraid.</i> The fig trees on the hillside here are that pasuk.
            </p>
            <p style={{ margin: "0 0 10px" }}>
              And the House is not meant to belong only to the people who built it — <span style={{ fontFamily: "'Frank Ruhl Libre', serif", direction: "rtl" }}>כִּי בֵיתִי בֵּית־תְּפִלָּה יִקָּרֵא לְכָל־הָעַמִּים</span>, “for My House shall be called a house of prayer for all peoples” (Yeshayahu 56:7).
            </p>
            <p style={{ margin: "0 0 10px" }}>
              The Rambam ends the Mishneh Torah on it: in that time there will be neither famine nor war, neither envy nor rivalry, and the whole occupation of the world will be to know Hashem (Hilchot Melachim 12:5).
            </p>
            <p style={{ margin: "0 0 10px", fontStyle: "italic", color: "#6d5c30" }}>
              שַׁאֲלוּ שְׁלוֹם יְרוּשָׁלִָם — pray for the peace of Jerusalem (Tehillim 122:6). That psalm is one of the fifteen Songs of Ascent, one for each of the steps outside. Whoever is reading this: may it come, and soon, and for everyone.
            </p>
          </div>
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

      {/* ═══ The ending ═══
          It used to be a line of text along the bottom of the screen, which is
          a receipt. This is a card that covers the House, says the two verses
          the whole place is built on, and can be shut — and once it is shut the
          counter in the corner keeps it, so it is never lost, only put away. */}
      {finale && (
        <div className="panel" onClick={() => setFinale(false)}
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "radial-gradient(circle at 50% 42%, rgba(60,44,12,.42), rgba(10,8,3,.72))",
            backdropFilter: "blur(3px)", cursor: "pointer", zIndex: 40, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="finale-card"
            style={{ cursor: "default", maxWidth: 560, width: "100%", boxSizing: "border-box", position: "relative",
              background: "linear-gradient(158deg, rgba(52,40,14,.97), rgba(86,66,22,.97) 55%, rgba(48,37,13,.97))",
              border: "1px solid #d4a437", borderRadius: 22, padding: "34px 32px 28px",
              color: "#ffe9ad", textAlign: "center", boxShadow: "0 30px 90px rgba(0,0,0,.62), 0 0 0 1px rgba(255,217,122,.16) inset" }}>
            <button onClick={() => setFinale(false)} aria-label="Close" title="Close"
              style={{ position: "absolute", top: 12, right: 14, width: 32, height: 32, lineHeight: 1, fontSize: 17,
                background: "rgba(255,217,122,.12)", color: "#ffe9ad", border: "1px solid rgba(212,164,55,.5)",
                borderRadius: 999, cursor: "pointer" }}>×</button>

            <div className="finale-seal" style={{ fontSize: 40, lineHeight: 1 }}>✦</div>
            <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 30, fontWeight: 900, color: "#ffd97a", marginTop: 12, letterSpacing: ".02em" }}>
              כָּל הַכָּבוֹד
            </div>
            <div style={{ fontSize: 15, letterSpacing: ".14em", textTransform: "uppercase", color: "#d7bd82", marginTop: 7 }}>
              all thirty-six found · חי, twice over
            </div>
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(212,164,55,.65), transparent)", margin: "18px auto", maxWidth: 340 }} />
            <div style={{ fontSize: 17, fontStyle: "italic", lineHeight: 1.62 }}>
              “Out of Zion, the perfection of beauty, G‑d shone forth.”
              <div style={{ fontSize: 12.5, fontStyle: "normal", letterSpacing: ".08em", color: "#c9ad74", marginTop: 3 }}>תהילים נ׳:ב׳ · Tehillim 50:2</div>
            </div>
            <div style={{ fontSize: 17, fontStyle: "italic", lineHeight: 1.62, marginTop: 15 }}>
              “Greater shall be the glory of this latter House than the former, and in this place I will grant peace.”
              <div style={{ fontSize: 12.5, fontStyle: "normal", letterSpacing: ".08em", color: "#c9ad74", marginTop: 3 }}>חגי ב׳:ט׳ · Chaggai 2:9</div>
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "#e0c98f", marginTop: 18, fontStyle: "italic" }}>
              Eighteen silver rimonim and eighteen living wonders, and nothing here that is not sourced to a pasuk, a daf, or a stone somebody measured. The House stays open. Nothing you found is taken back.
            </div>
            {confirmReset ? (
              <div style={{ marginTop: 20, padding: "15px 16px", borderRadius: 15, background: "rgba(18,13,4,.5)", border: "1px solid rgba(212,164,55,.42)" }}>
                <div style={{ fontSize: 14.5, fontStyle: "italic", lineHeight: 1.55, color: "#f2dfa9" }}>
                  All thirty-six go back into hiding and the House is raised again from
                  nothing. Night and sound stay as you set them.
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 15 }}>
                  <button onClick={startOver} autoFocus
                    style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 13, letterSpacing: ".13em", textTransform: "uppercase",
                      background: "linear-gradient(135deg,#f3e6c0,#dcc48f)", color: "#4a3a18", border: "none", borderRadius: 999,
                      padding: "12px 24px", cursor: "pointer" }}>
                    Hide them again
                  </button>
                  <button onClick={() => setConfirmReset(false)}
                    style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 13, letterSpacing: ".13em", textTransform: "uppercase",
                      background: "transparent", color: "#ffe9ad", border: "1px solid rgba(212,164,55,.55)", borderRadius: 999,
                      padding: "12px 22px", cursor: "pointer" }}>
                    Keep what I found
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 22 }}>
                <button onClick={() => setFinale(false)}
                  style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 13, letterSpacing: ".13em", textTransform: "uppercase",
                    background: "linear-gradient(135deg,#f3e6c0,#dcc48f)", color: "#4a3a18", border: "none", borderRadius: 999,
                    padding: "12px 26px", cursor: "pointer" }}>
                  Back to the House
                </button>
                <button onClick={() => apiRef.current.celebrate?.()} title="Blow it again"
                  style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 13, letterSpacing: ".13em", textTransform: "uppercase",
                    background: "transparent", color: "#ffe9ad", border: "1px solid rgba(212,164,55,.55)", borderRadius: 999,
                    padding: "12px 22px", cursor: "pointer" }}>
                  📯 Again
                </button>
                {/* Quieter than the other two on purpose: it is the one button
                    here that throws something away. */}
                <button onClick={() => setConfirmReset(true)} title="Hide all thirty-six and walk in again"
                  style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 13, letterSpacing: ".13em", textTransform: "uppercase",
                    background: "transparent", color: "#d0b478", border: "1px solid rgba(212,164,55,.3)", borderRadius: 999,
                    padding: "12px 22px", cursor: "pointer" }}>
                  ↻ מֵחָדָשׁ · Start over
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {fact !== null && (
        <div className="panel" onClick={closeFact} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(14,11,5,.5)", backdropFilter: "blur(4px)", cursor: "pointer", zIndex: 5 }}>
          <div className="card-frame" onClick={(e) => e.stopPropagation()} style={{ cursor: "default", maxWidth: 550, margin: 20, background: "linear-gradient(160deg, #fbf6e8, #efe3c4)", borderRadius: 20, border: "1px solid rgba(140,110,50,.5)", boxShadow: "0 28px 80px rgba(0,0,0,.5)", padding: "30px 34px", position: "relative" }}>
            <div className={DISCOVERIES[fact].kind === "rimon" ? "seal seal-silver" : "seal"}>
              {DISCOVERIES[fact].emoji}
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
                ["💫", <>Every hidden thing floats inside a <b style={{ fontWeight: 600 }}>slowly turning ring of gold light</b>. When you see one — click what is inside it.</>],
                ["🚶", <>Drag to turn the House, scroll to draw near, and <b style={{ fontWeight: 600 }}>⇊ Walk the Courts</b> to stand inside them.</>],
                ["🔦", <>The banner above always whispers where the next one waits. If it stays hidden, press <b style={{ fontWeight: 600 }}>הראה לי · Show me</b> — a pillar of light will rise over it.</>],
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
                  track("pesichah-closed", { via: "show-me" });
                  setOpened(true);
                  if (apiRef.current.guideTo?.(0)) showToast("There — where the light stands, inside the eastern gate.");
                }}
                style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 14, letterSpacing: ".1em", background: "linear-gradient(135deg,#4a3a18,#6b5322)", color: "#f9edc9", border: "1px solid rgba(212,164,55,.5)", borderRadius: 999, padding: "12px 26px", cursor: "pointer", boxShadow: "0 8px 22px rgba(0,0,0,.28)" }}
              >
                ⌖ הראה לי · Show me the first
              </button>
              <button
                onClick={() => { track("pesichah-closed", { via: "on-my-own" }); setOpened(true); }}
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
