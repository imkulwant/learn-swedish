# Level C content, pack set 1

Nov 19, 2026 · for Kul · to be integrated by another agent

## Context

The app has content only for level D (plus one C grammar pack shown to both levels). A learner who picks C sees "No … for C yet" in Läsa, Höra, Skriva, Tala, Words and mocks. This plan adds a first set of level C content, sized at about **70% of the D content that ships today**, as Kul asked. More D content comes later.

Kul also asked that C include **A/B-type basics**. The syllabus supports that: KP27 course 3C is the *first* course on study path 3, so its central content repeats basics that A and B learners meet: numbers 0–1000, the clock and dates, shopping (*inköp*, *i affären*), the health centre, simple messages and directions (verified in NC/SU's Tabell 2, see Sources). About a third of this set is that kind of basic content (shopping and time words, a basics grammar pack, a shop announcement, a timetable, directions). The rest is C-level: short everyday texts, one longer text, a news item, a presentation, informal writing and conversation.

Everything below is original, written for this app, and drafted by an AI. **Every unit is `status: draft`.** Per `docs/PLAN.md`, Anna (the reviewer) must approve each one before production builds ship it.

## What the research says about the C test (verified 2026-11-19)

- **C pass criteria (KP27, Godkänt, same for 1C, 2C and 3C), quoted:**
  - *Eleven lyssnar och visar förståelse av tydligt talad enkel svenska om bekanta ämnen.* (D drops *enkel*.)
  - *Eleven läser och visar förståelse av enkla texter om bekanta ämnen.*
  - *Eleven talar och samtalar om bekanta ämnen samt upprätthåller samtalen på ett till viss del fungerande sätt.* (D: *i huvudsak fungerande*.)
  - *…uttrycker sig eleven enkelt, begripligt och till viss del sammanhängande samt med viss anpassning till syfte och mottagare.*
  - *Eleven skriver enkla texter med i huvudsak fungerande struktur om bekanta ämnen.* (D adds *informella och mer formella*.)
- **3C central content that differs from 3D:**
  - Lyssna och läsa: *vägbeskrivningar*, *scheman och tabeller, till exempel för resvägar samt mötes- och arbetstider*, *diagram och kartor*, *enkla skönlitterära texter och enkel sakprosa*. The strategies are *identifiera enskilda språkljud och uppfatta betydelsebärande ord* (D: *dra slutsatser, identifiera syftet, läsa mellan raderna*). Tools: *ordbok och översättningsappar*.
  - Samtala, tala och skriva: *enkla samtal … i affären och på vårdcentralen*, questions *vid inköp samt studie- och yrkesvägledning*, *framföra och efterfråga önskemål, information, tankar och åsikter*, *enkla muntliga sammanfattningar*. D adds workplaces, job interviews, and *uttrycka och bemöta åsikter*. Strategy: *be om upprepning och förtydligande*.
  - Språkliga företeelser: *ord, fraser och uttryck*, *tempus, numerus och bestämdhet* (D: *kongruens*), *tal 0–1 000*, *klockan, datum, ordningstal och enkla tidsangivelser*, *huvudsatser och enkla bisatser*, *enkla sambandsord och uttryck för tid, plats, orsak och förtydligande*, *att dela upp en text i inledning, huvudinnehåll och avslutning*.
- **The C test** (Skolverket, SU):
  - Läsa A and Läsa B: open, multiple-choice and matching tasks.
  - Höra: monologues, dialogues, announcements and news.
  - Skriva: **one informal task**.
  - Tala: an **individual conversation with the test leader** (*samtalsledare*), who asks follow-up questions such as "berätta om …", plus a **pair conversation**. The leader gives less support at higher courses.
- **What SU's C writing matrix looks for:** an email with an introduction, a main part and an ending; simple linking words (*och, men, eller, sedan, som, så, eftersom*); some variety in words; a sentence that starts with something other than the subject; spelling that can be understood.
- **Not found:** the C test's timings, the number of tasks per booklet, and the expected length of the writing task. Don't change `EXAM_FORMAT` or `WRITING_WORDS`. The C values already in the code (C: 50–150 words of writing, 20–350 words per text, 15–300 words per clip) are what this content was written to.

Sources: [NC/SU Tabell 2, Centralt innehåll 1A–3D](https://www.su.se/download/18.158579331a0862edb86f42/1789542424322/Tabell%202%20Centralt%20inneha%CC%8All%20kurs%201A%20till%203D%20i%20KP27%20fo%CC%88r%20sfi.pdf), [NC/SU Tabell 3, Betygskriterier](https://www.su.se/download/18.158579331a0862edb86f41/1789542424300/Tabell%203%20Betygskriterier%20i%20KP27%20fo%CC%88r%20sfi.pdf), [Skolverket: delprov och innehåll](https://www.skolverket.se/prov-och-bedomning/nationella-prov/nationella-prov-pa-papper/delprov-och-innehall/delprov-och-innehall---komvux-svenska-for-invandrare), [SU: Om sfi-proven](https://www.su.se/enheter/nationella-prov-i-sfi/om-sfi-proven) (C writing matrix and *Vägledning för samtalsledare, kurs C*).

## Volume: 70% of today's D

| Part | D today | C in this plan | Pack file |
| --- | --- | --- | --- |
| Läsa | 6 texts, 16 questions | 4 texts, 13 questions | `content/reading/c-lasa-1.yaml` |
| Höra | 5 clips, 18 questions | 4 clips, 12 questions | `content/listening/c-hora-1.yaml` |
| Words | 60 words (2 packs) | 42 words (2 packs) | `content/vocab/c-ord-handla.yaml`, `content/vocab/c-ord-hemmet.yaml` |
| Grammar | 5 lessons, 31 exercises (C pack 1) | 4 basics lessons, 26 exercises | `content/grammar/c-grammatik-2.yaml` |
| Skriva | 4 tasks | 3 informal tasks | `content/writing/c-skriva-1.yaml` |
| Tala, solo | 3 tasks | 2 tasks | `content/speaking/c-tala-1.yaml` |
| Tala, pairs | 2 discussions | 1 discussion | `content/speaking/c-tala-2.yaml` |
| Mock | 1 (17 questions) | 1 (12 questions, 1 writing task) | `content/mocks/c-prov-1.yaml` |
| Everyday | 3 scenarios, all levels | none (already shown at C) | – |

## How to integrate (for the integrating agent)

1. **Save each YAML block below as the file named in its first comment line**, unchanged. No code changes are needed. `level: C` already exists in `LEVELS` (`src/domain/content/schema.ts:11`), `WRITING_TASKS.C` is 1 (`src/domain/examFormat.ts`), and the drill screens list packs by level (`src/features/exam/PartScreen.tsx:35`).
2. **KP27 tags:** C units use the existing ids in `src/domain/content/kp27.ts` (`KP27_D_POINTS`). The 3C points are a subset of the 3D points or close to them, and the schema accepts only those ids. Don't add a C point list.
3. **IDs:** every id starts with `c-` (drills) or `cm1-` (mock), so none clashes with the D ids (`d-…`, `m1-…`, `g-…`, `s-…`, `t-…`, `p-…`). No C headword appears in a D word pack. The build rejects duplicate ids and headwords (`packProblems` in `src/domain/content/validate.ts`).
4. **Audio is required before `npm test` passes.** `readAudioSources` includes drafts (`scripts/lib/listening.ts:197`), and `content/content.test.ts` checks that every clip, word, model answer and partner line has up-to-date audio. On a Mac, run `scripts/setup-audio.sh` once, then `npm run audio`. Commit the new `content/audio/*.m4a` files and `content/audio.lock.json`.
5. **Run:** `npm run content`, then `npm test`, then `INCLUDE_DRAFTS=1 npm run content && npm run dev` to try each pack at level C (Settings → level C, then Exam → each part, Learn → Words and Grammar, Exam → Mock exams).
6. **Docs:**
   - Add one row per pack to the table in `docs/CONTENT.md`, with status "Draft, not reviewed".
   - Add rows to `docs/DECISIONS.md`:
     - (a) C content uses the D KP27 ids.
     - (b) At C, the solo speaking task is the individual conversation with the test leader. It uses the `SpeakingTask` shape, with the leader's questions as `points`.
     - (c) About a third of the C content is A/B-type basics, because 3C begins study path 3.
7. **Leave these e2e tests unchanged until Anna reviews the C packs.** They assert that C is empty, which stays true in production builds as long as the packs are drafts:
   - `e2e/reading.spec.ts:164` ("No reading texts for C yet")
   - `e2e/vocab.spec.ts:145–151` ("No words for level C yet")

   After the review, update them to assert C content instead.
8. **Grammar order:** `loadLessons` (`src/data/content.ts`) sorts by level and then by file name, so `c-grammatik-2` comes after `c-grammatik-1`. Pack 1 is V2, BIFF, the perfect, definite forms and linking words. The basics in pack 2 (plural, the past tense, pronouns, time) would teach better *before* it. Moving them first changes the order for D learners who are midway, so leave the order as it is and ask Kul.

Don't edit generated files. `content/audio.lock.json` changes only through `npm run audio`.

---

## 1. Läsa C – `content/reading/c-lasa-1.yaml`

Formats: "Hitta information" in a timetable (resvägar), short messages ("Vad vill personen?"), notices matched to people, and one longer text (*enkel sakprosa*), which C always includes.

```yaml
# file: content/reading/c-lasa-1.yaml
# C reading pack 1. Original texts in the official task formats.
# Drafted 2026-11-19; not reviewed yet (docs/CONTENT.md).
id: c-lasa-1
version: 1
level: C
skill: lasa
title: Läsa C – paket 1
texts:
  - id: c-lasa-1-buss
    status: draft
    kp27: [lyssna-lasa.tabeller-diagram-kartor]
    theme: trafik
    instruction: Här ser du en del av en busstidtabell. Svara på frågorna med hjälp av tidtabellen.
    title: Buss 12 – Centrum till Ekdala sjukhus
    blocks:
      - heading: Måndag–fredag
        lines:
          - Centrum 07.10 – Skolgatan 07.16 – Ekdala sjukhus 07.30
          - Centrum 07.40 – Skolgatan 07.46 – Ekdala sjukhus 08.00
          - Centrum 08.10 – Skolgatan 08.16 – Ekdala sjukhus 08.30
      - heading: Lördag och söndag
        lines:
          - Bussen går en gång i timmen, från klockan 9.10 till klockan 18.10.
      - heading: Bra att veta
        lines:
          - Du kan inte köpa biljett på bussen. Köp biljetten i appen eller i automaten vid hållplatsen.
    items:
      - type: short
        id: c-lasa-1-buss-sista
        prompt: Du ska vara på sjukhuset klockan 8.15 en tisdag. Vilken är den sista bussen från Centrum som du kan ta?
        accept:
          - '07.40'
          - '7.40'
          - '07:40'
          - '7:40'
          - kl. 07.40
          - kl. 7.40
          - klockan 07.40
          - klockan 7.40
          - bussen 07.40
          - bussen 7.40
        model: Bussen 07.40.
        explain: The 07.40 bus is at the hospital at 08.00. The next one, 08.10, gets there at 08.30, which is too late.
      - type: mc
        id: c-lasa-1-buss-tid
        prompt: Hur lång tid tar resan från Centrum till sjukhuset?
        options:
          - 6 minuter
          - 14 minuter
          - 20 minuter
          - 30 minuter
        answer: 2
        explain: The bus leaves Centrum at 07.10 and is at the hospital at 07.30, so the trip takes 20 minutes.
      - type: mc
        id: c-lasa-1-buss-sondag
        prompt: Hur ofta går bussen på söndagar?
        options:
          - Var trettionde minut
          - En gång i timmen
          - Två gånger om dagen
          - Den går inte på söndagar
        answer: 1
        explain: '"Lördag och söndag: Bussen går en gång i timmen" – once an hour.'

  - id: c-lasa-1-meddelanden
    status: draft
    kp27: [lyssna-lasa.berattelser-nyheter-instruktioner]
    theme: vardag
    instruction: Här kan du läsa fyra korta meddelanden. Vad vill personerna? Välj det alternativ som passar bäst.
    title: Fyra meddelanden
    blocks:
      - heading: A
        author: Sara
        lines:
          - Hej! Jag står i affären nu. Vill du ha vanlig mjölk eller laktosfri? Svara snabbt, jag ska betala snart!
      - heading: B
        author: Vårdcentralen Ekdala
        lines:
          - 'Påminnelse: Du har en tid hos sjuksköterskan torsdag den 14 mars klockan 10.20. Om du inte kan komma, ring oss senast dagen innan.'
      - heading: C
        author: Jonas
        lines:
          - Förlåt att jag glömde din födelsedag i går! Jag skäms. Får jag bjuda dig på lunch i helgen?
      - heading: D
        author: Mirja i 2A
        lines:
          - Hej grannar! Jag ska flytta på lördag. Är det någon som kan hjälpa mig att bära möbler på förmiddagen? Jag bjuder på pizza!
    items:
      - type: mc
        id: c-lasa-1-meddelanden-a
        prompt: A. Vad vill Sara?
        options:
          - Be om hjälp
          - Be om ursäkt
          - Påminna om något
          - Fråga om något
        answer: 3
        explain: Sara asks which milk you want ("Vill du ha …?"). She is asking a question.
      - type: mc
        id: c-lasa-1-meddelanden-b
        prompt: B. Vad vill vårdcentralen?
        options:
          - Be om hjälp
          - Be om ursäkt
          - Påminna om något
          - Fråga om något
        answer: 2
        explain: '"Påminnelse" means reminder. The health centre reminds you of your appointment.'
      - type: mc
        id: c-lasa-1-meddelanden-c
        prompt: C. Vad vill Jonas?
        options:
          - Be om hjälp
          - Be om ursäkt
          - Påminna om något
          - Fråga om något
        answer: 1
        explain: '"Förlåt att jag glömde …" – Jonas says sorry that he forgot your birthday.'
      - type: mc
        id: c-lasa-1-meddelanden-d
        prompt: D. Vad vill Mirja?
        options:
          - Be om hjälp
          - Be om ursäkt
          - Påminna om något
          - Fråga om något
        answer: 0
        explain: '"Är det någon som kan hjälpa mig …?" – Mirja asks for help with carrying furniture.'

  - id: c-lasa-1-anslag
    status: draft
    kp27: [lyssna-lasa.berattelser-nyheter-instruktioner, digitalt.kallkritik]
    theme: kultur och fritid
    instruction: Här är fem annonser från anslagstavlan på biblioteket. Vilken annons passar vilken person? En annons blir över.
    title: Anslagstavlan på Ekdala bibliotek
    blocks:
      - heading: A. Språkcafé
        lines:
          - Vill du prata mer svenska? Kom till biblioteket varje onsdag klockan 18–19.30. Vi fikar och pratar om olika ämnen. Gratis!
      - heading: B. Sagostund
        lines:
          - Varje lördag klockan 10.30 läser vi sagor för barn mellan 3 och 6 år. Föräldrar är välkomna att sitta med.
      - heading: C. Säljes – barncykel
        lines:
          - Röd cykel för barn som är 5–7 år. Den är i bra skick. Pris 300 kronor. Ring Ali på kvällen.
      - heading: D. Hjälp med mobilen och datorn
        lines:
          - Har du problem med e-post, BankID eller 1177 i mobilen? Varje tisdag klockan 13–15 hjälper vi dig. Du behöver inte anmäla dig.
      - heading: E. Promenadgruppen
        lines:
          - Vi går en lång promenad i skogen varje söndag klockan 10. Vi träffas på parkeringen vid sjön. Ta med bra skor och kaffe!
    items:
      - type: match
        id: c-lasa-1-anslag-para
        prompt: Vilken annons passar vilken person?
        pairs:
          - q: Amina vill lära sig att logga in på 1177 i mobilen.
            answer: 3
          - q: Tomas vill röra på sig och vara ute i naturen.
            answer: 4
          - q: Leila har en dotter på fyra år som älskar böcker.
            answer: 1
          - q: Karim vill träna på att prata svenska med andra.
            answer: 0
        options:
          - A. Språkcafé
          - B. Sagostund
          - C. Säljes – barncykel
          - D. Hjälp med mobilen och datorn
          - E. Promenadgruppen
        explain: Look for one key word for each person. 1177 and the mobile match D, the forest (skogen) matches E, a four-year-old matches B (children aged 3–6), and speaking Swedish matches A. The bike (C) is left over.
      - type: short
        id: c-lasa-1-anslag-dator
        prompt: Vilken dag kan man få hjälp med mobilen?
        accept:
          - tisdag
          - tisdagar
          - på tisdag
          - på tisdagar
          - varje tisdag
          - tisdagar klockan 13–15
          - på tisdagar klockan 13–15
        model: På tisdagar, klockan 13–15.
        explain: 'Ad D says "Varje tisdag klockan 13–15 hjälper vi dig."'

  - id: c-lasa-1-amal
    status: draft
    kp27:
      [
        lyssna-lasa.berattelser-nyheter-instruktioner,
        lyssna-lasa.skonlitteratur-sakprosa,
        lyssna-lasa.strategier,
      ]
    theme: arbete
    instruction: Läs texten om Amal och svara på frågorna.
    title: Amal börjar om
    blocks:
      - lines:
          - Amal är 38 år och kommer från Syrien. Hon har bott i Ekdala i två år tillsammans med sin man och deras två söner. I hemlandet arbetade hon som frisör i femton år. Hon hade en egen salong med tre anställda.
          - När Amal kom till Sverige kunde hon bara säga hej och tack på svenska. Det första året var svårt. Hon förstod inte breven från skolan, och hon kände sig ofta ensam när barnen var i skolan och mannen var på sin kurs.
          - Nu läser hon sfi på förmiddagarna. Hon tycker om sin lärare, som pratar långsamt och tydligt. – Jag lär mig mest när jag måste prata, säger Amal. Därför går hon också på språkcafé på biblioteket varje onsdag.
          - Sedan augusti gör Amal praktik på en frisersalong i centrum två eftermiddagar i veckan. Hon klipper och färgar hår, men hon svarar också i telefon och bokar tider åt kunderna. I början var det svårt att prata i telefon, men nu går det bättre.
          - Amal har en dröm. Om några år vill hon öppna en egen salong igen, den här gången i Ekdala. – Men först måste jag bli bättre på svenska, säger hon och skrattar.
    items:
      - type: mc
        id: c-lasa-1-amal-yrke
        prompt: Vad arbetade Amal med i sitt hemland?
        options:
          - Hon var lärare.
          - Hon var frisör.
          - Hon var sjuksköterska.
          - Hon arbetade i en affär.
        answer: 1
        explain: '"I hemlandet arbetade hon som frisör i femton år" – she was a hairdresser.'
      - type: mc
        id: c-lasa-1-amal-svart
        prompt: Varför var det första året svårt?
        options:
          - Hon hade inget jobb och inga pengar.
          - Hon förstod inte så mycket och var ofta ensam.
          - Hennes söner ville inte gå i skolan.
          - Hon bodde långt från centrum.
        answer: 1
        explain: 'The second paragraph says she did not understand the letters from school ("förstod inte breven") and often felt lonely ("kände sig ofta ensam").'
      - type: short
        id: c-lasa-1-amal-sprakcafe
        prompt: Varför går Amal på språkcafé?
        accept:
          - hon lär sig mest när hon måste prata
          - för att hon lär sig mest när hon måste prata
          - eftersom hon lär sig mest när hon måste prata
          - för att prata
          - för att prata svenska
          - för att öva på att prata
          - för att träna på att prata
          - hon vill prata svenska
        model: Hon lär sig mest när hon måste prata.
        explain: '"Jag lär mig mest när jag måste prata … Därför går hon också på språkcafé." "Därför" (that is why) links the reason to the café.'
      - type: mc
        id: c-lasa-1-amal-drom
        prompt: Vad vill Amal göra i framtiden?
        options:
          - Flytta tillbaka till sitt hemland.
          - Bli lärare på sfi.
          - Öppna en egen salong i Ekdala.
          - Arbeta på biblioteket.
        answer: 2
        explain: '"Om några år vill hon öppna en egen salong igen, den här gången i Ekdala."'
```

## 2. Höra C – `content/listening/c-hora-1.yaml`

One clip of each official kind. `nst` is the lower voice and `alma` the higher one (DECISIONS #26), so male speakers are `nst` and female speakers are `alma`. `say` spells out numbers.

```yaml
# file: content/listening/c-hora-1.yaml
# C listening pack 1. Original clips in the official kinds: an announcement,
# a dialogue, news and a monologue. Audio is made by `npm run audio`.
# Drafted 2026-11-19; not reviewed yet (docs/CONTENT.md).
id: c-hora-1
version: 1
level: C
skill: hora
title: Höra C – paket 1
clips:
  - id: c-hora-1-affar
    status: draft
    kp27: [lyssna-lasa.berattelser-nyheter-instruktioner]
    theme: handla
    kind: utrop
    instruction: Du handlar mat och hör ett meddelande i affären. Lyssna och svara på frågorna.
    title: Ett meddelande i affären
    lines:
      - voice: nst
        text: Hej och välkommen till Ekdala Livs! Just nu har vi ett bra erbjudande på frukt. Alla äpplen kostar 19,90 kronor kilot. Vi vill också påminna om att butiken stänger klockan 20 i kväll. Kassorna stänger fem minuter innan. Tack för att du handlar hos oss!
        say: Hej och välkommen till Ekdala Livs! Just nu har vi ett bra erbjudande på frukt. Alla äpplen kostar nitton kronor och nittio öre kilot. Vi vill också påminna om att butiken stänger klockan tjugo i kväll. Kassorna stänger fem minuter innan. Tack för att du handlar hos oss!
    items:
      - type: mc
        id: c-hora-1-affar-vad
        prompt: Vad kostar äpplena?
        options:
          - 9,90 kronor kilot
          - 19,90 kronor kilot
          - 29,90 kronor kilot
          - 19,90 kronor styck
        answer: 1
        explain: '"Alla äpplen kostar 19,90 kronor kilot" – 19.90 kronor a kilo. "Styck" would mean each.'
      - type: short
        id: c-hora-1-affar-stanger
        prompt: När stänger butiken i kväll?
        accept:
          - '20'
          - '20.00'
          - klockan 20
          - kl. 20
          - kl 20
          - klockan tjugo
          - klockan åtta
          - åtta
        model: Klockan 20.
        explain: '"Butiken stänger klockan 20 i kväll." Klockan 20 is the same as klockan åtta på kvällen.'
      - type: mc
        id: c-hora-1-affar-kassor
        prompt: Vad händer klockan 19.55?
        options:
          - Butiken öppnar.
          - Kassorna stänger.
          - Frukten blir billigare.
          - Det kommer nya äpplen.
        answer: 1
        explain: '"Kassorna stänger fem minuter innan" – the tills close five minutes before 20.00, at 19.55.'

  - id: c-hora-1-vagen
    status: draft
    kp27:
      [
        lyssna-lasa.berattelser-nyheter-instruktioner,
        lyssna-lasa.tabeller-diagram-kartor,
      ]
    theme: trafik
    kind: dialog
    instruction: Hassan frågar en kvinna om vägen. Lyssna på samtalet och svara på frågorna.
    title: Var ligger vårdcentralen?
    lines:
      - voice: nst
        speaker: Hassan
        text: Ursäkta, kan du hjälpa mig? Jag letar efter vårdcentralen.
      - voice: alma
        speaker: Eva
        text: Ja, visst. Gå rakt fram till rondellen. Där svänger du till vänster, in på Storgatan.
      - voice: nst
        speaker: Hassan
        text: Till vänster vid rondellen. Och sedan?
      - voice: alma
        speaker: Eva
        text: Sedan går du förbi en skola och ett apotek. Vårdcentralen ligger i det stora gula huset bredvid apoteket.
      - voice: nst
        speaker: Hassan
        text: Är det långt härifrån?
      - voice: alma
        speaker: Eva
        text: Nej, det tar ungefär tio minuter att gå.
      - voice: nst
        speaker: Hassan
        text: Tack så mycket!
      - voice: alma
        speaker: Eva
        text: Ingen orsak.
    items:
      - type: mc
        id: c-hora-1-vagen-svang
        prompt: Vart ska Hassan svänga vid rondellen?
        options:
          - Till höger
          - Till vänster
          - Rakt fram
          - Tillbaka
        answer: 1
        explain: '"Där svänger du till vänster" – he turns left at the roundabout.'
      - type: mc
        id: c-hora-1-vagen-var
        prompt: Var ligger vårdcentralen?
        options:
          - Bredvid apoteket
          - Bredvid skolan
          - Vid rondellen
          - Mittemot stationen
        answer: 0
        explain: '"Vårdcentralen ligger i det stora gula huset bredvid apoteket" – next to the pharmacy.'
      - type: short
        id: c-hora-1-vagen-tid
        prompt: Hur lång tid tar det att gå till vårdcentralen?
        accept:
          - tio minuter
          - ungefär tio minuter
          - cirka tio minuter
          - 10 minuter
          - ungefär 10 minuter
          - cirka 10 minuter
          - tio
          - '10'
        model: Ungefär tio minuter.
        explain: '"Det tar ungefär tio minuter att gå."'

  - id: c-hora-1-sno
    status: draft
    kp27: [lyssna-lasa.berattelser-nyheter-instruktioner]
    theme: samhälle
    kind: nyhet
    instruction: Du hör en kort nyhet på radion. Lyssna och svara på frågorna.
    title: Nyheter från Radio Ekdala
    lines:
      - voice: nst
        text: Nyheter från Radio Ekdala. Det har snöat mycket i natt, och i dag går många bussar sent. Buss 3 och buss 7 går inte alls före klockan 10. Kommunen ber alla som kan att gå eller att ta tåget i stället. Skolorna är öppna som vanligt. I morgon blir det kallare, men det ska inte snöa mer.
        say: Nyheter från Radio Ekdala. Det har snöat mycket i natt, och i dag går många bussar sent. Buss tre och buss sju går inte alls före klockan tio. Kommunen ber alla som kan att gå eller att ta tåget i stället. Skolorna är öppna som vanligt. I morgon blir det kallare, men det ska inte snöa mer.
    items:
      - type: mc
        id: c-hora-1-sno-varfor
        prompt: Varför går bussarna sent?
        options:
          - Det är fel på bussarna.
          - Det har snöat mycket.
          - Det finns inga chaufförer.
          - Vägen är avstängd.
        answer: 1
        explain: '"Det har snöat mycket i natt, och i dag går många bussar sent."'
      - type: short
        id: c-hora-1-sno-bussar
        prompt: Vilka bussar går inte före klockan tio?
        accept:
          - buss 3 och buss 7
          - buss 3 och 7
          - 3 och 7
          - bussarna 3 och 7
          - buss tre och buss sju
          - buss tre och sju
          - tre och sju
        model: Buss 3 och buss 7.
        explain: '"Buss 3 och buss 7 går inte alls före klockan 10." "Inte alls" means not at all.'
      - type: mc
        id: c-hora-1-sno-morgon
        prompt: Hur blir vädret i morgon?
        options:
          - Varmare och mer snö
          - Kallare, men ingen ny snö
          - Regn och blåst
          - Sol och varmt
        answer: 1
        explain: '"I morgon blir det kallare, men det ska inte snöa mer."'

  - id: c-hora-1-nadia
    status: draft
    kp27:
      [
        lyssna-lasa.berattelser-nyheter-instruktioner,
        samtala.berattelser-presentationer,
      ]
    theme: studier
    kind: monolog
    instruction: Det är första dagen på en ny sfi-kurs. Läraren presenterar sig. Lyssna och svara på frågorna.
    title: En ny lärare
    lines:
      - voice: alma
        speaker: Nadia
        text: Hej allihop! Jag heter Nadia, och jag är er nya lärare i den här gruppen. Jag kommer från Ekdala, men jag har bott i Spanien i fem år. Där arbetade jag på en svensk skola. På fritiden tycker jag om att baka och att vandra i fjällen.
      - voice: alma
        speaker: Nadia
        text: Nu ska jag berätta lite om kursen. Vi träffas måndag till torsdag, klockan nio till tolv. På fredagar har ni ingen lektion här, men då kan ni gå till läxhjälpen på biblioteket. Glöm inte att ta med en ordbok eller en översättningsapp till lektionerna. Har ni några frågor?
    items:
      - type: mc
        id: c-hora-1-nadia-vem
        prompt: Vem är Nadia?
        options:
          - En ny elev
          - En ny lärare
          - En bibliotekarie
          - En studievägledare
        answer: 1
        explain: '"Jag är er nya lärare i den här gruppen."'
      - type: short
        id: c-hora-1-nadia-dagar
        prompt: Vilka dagar har gruppen lektion?
        accept:
          - måndag till torsdag
          - från måndag till torsdag
          - måndagar till torsdagar
          - måndag–torsdag
          - måndag-torsdag
        model: Måndag till torsdag.
        explain: '"Vi träffas måndag till torsdag." On Fridays there is no lesson.'
      - type: mc
        id: c-hora-1-nadia-ta-med
        prompt: Vad ska eleverna ta med till lektionerna?
        options:
          - En dator
          - En ordbok eller en översättningsapp
          - Sina läxor från biblioteket
          - Något att fika
        answer: 1
        explain: '"Glöm inte att ta med en ordbok eller en översättningsapp till lektionerna."'
```

## 3. Words – two C packs

The forms follow `FORM_COUNT`:

- noun: en/ett form, definite, plural, definite plural
- verb: infinitive with att, present, past, supine, imperative
- adjective: en form, ett form, plural or definite

None of the headwords is in a D pack. The first pack is A/B-type basics: shopping, money and time words.

```yaml
# file: content/vocab/c-ord-handla.yaml
# Vocabulary: shopping, money and time. Forms follow FORM_COUNT in src/domain/content/schema.ts.
# Drafted 2026-11-19; not reviewed yet (docs/CONTENT.md).
id: c-ord-handla
version: 1
level: C
skill: ord
title: Ord – handla och tid
theme: handla
words:
  - id: affar
    status: draft
    pos: noun
    forms: [en affär, affären, affärer, affärerna]
    en: shop, store
    example: { sv: 'Affären på hörnet har öppet till klockan 22.', en: 'The shop on the corner is open until 10 pm.' }
  - id: pris
    status: draft
    pos: noun
    forms: [ett pris, priset, priser, priserna]
    en: price
    example: { sv: 'Priset står på skylten.', en: 'The price is on the sign.' }
  - id: kassa
    status: draft
    pos: noun
    forms: [en kassa, kassan, kassor, kassorna]
    en: checkout, till
    example: { sv: 'Du betalar i kassan vid utgången.', en: 'You pay at the checkout by the exit.' }
  - id: kvitto
    status: draft
    pos: noun
    forms: [ett kvitto, kvittot, kvitton, kvittona]
    en: receipt
    example: { sv: 'Spara kvittot om du vill lämna tillbaka tröjan.', en: 'Keep the receipt if you want to return the jumper.' }
  - id: erbjudande
    status: draft
    pos: noun
    forms: [ett erbjudande, erbjudandet, erbjudanden, erbjudandena]
    en: offer, special offer
    example: { sv: 'Veckans erbjudande är kaffe för 39 kronor.', en: "This week's offer is coffee for 39 kronor." }
  - id: pase
    status: draft
    pos: noun
    forms: [en påse, påsen, påsar, påsarna]
    en: bag (plastic or paper)
    example: { sv: 'Vill du köpa en påse?', en: 'Would you like to buy a bag?' }
  - id: rakning
    status: draft
    pos: noun
    forms: [en räkning, räkningen, räkningar, räkningarna]
    en: bill, invoice
    example: { sv: 'Jag betalar alla räkningar i appen.', en: 'I pay all bills in the app.' }
  - id: klocka
    status: draft
    pos: noun
    forms: [en klocka, klockan, klockor, klockorna]
    en: clock, watch; (klockan) the time, o'clock
    example: { sv: 'Ursäkta, vad är klockan?', en: 'Excuse me, what time is it?' }
  - id: kvart
    status: draft
    pos: noun
    forms: [en kvart, kvarten, kvartar, kvartarna]
    en: quarter of an hour
    example: { sv: 'Bussen kommer om en kvart.', en: 'The bus comes in a quarter of an hour.' }
  - id: vecka
    status: draft
    pos: noun
    forms: [en vecka, veckan, veckor, veckorna]
    en: week
    example: { sv: 'Kursen börjar nästa vecka.', en: 'The course starts next week.' }
  - id: manad
    status: draft
    pos: noun
    forms: [en månad, månaden, månader, månaderna]
    en: month
    example: { sv: 'Hyran betalar man en gång i månaden.', en: 'You pay the rent once a month.' }
  - id: helg
    status: draft
    pos: noun
    forms: [en helg, helgen, helger, helgerna]
    en: weekend; holiday
    example: { sv: 'Vad gjorde du i helgen?', en: 'What did you do at the weekend?' }
  - id: kosta
    status: draft
    pos: verb
    forms: [att kosta, kostar, kostade, kostat, kosta]
    en: to cost
    example: { sv: 'Hur mycket kostar bananerna?', en: 'How much do the bananas cost?' }
  - id: betala
    status: draft
    pos: verb
    forms: [att betala, betalar, betalade, betalat, betala]
    en: to pay
    example: { sv: 'Kan jag betala med kort?', en: 'Can I pay by card?' }
  - id: handla
    status: draft
    pos: verb
    forms: [att handla, handlar, handlade, handlat, handla]
    en: to shop, to buy groceries
    example: { sv: 'Vi handlar mat på lördagar.', en: 'We buy groceries on Saturdays.' }
  - id: kopa
    status: draft
    pos: verb
    forms: [att köpa, köper, köpte, köpt, köp]
    en: to buy
    example: { sv: 'Jag köpte en ny jacka i går.', en: 'I bought a new jacket yesterday.' }
  - id: salja
    status: draft
    pos: verb
    forms: [att sälja, säljer, sålde, sålt, sälj]
    en: to sell
    example: { sv: 'Han säljer sin gamla cykel.', en: 'He is selling his old bike.' }
  - id: billig
    status: draft
    pos: adjective
    forms: [billig, billigt, billiga]
    en: cheap
    example: { sv: 'Grönsakerna är billiga på torget.', en: 'The vegetables are cheap at the market.' }
  - id: dyr
    status: draft
    pos: adjective
    forms: [dyr, dyrt, dyra]
    en: expensive
    example: { sv: 'Det är dyrt att äta på restaurang.', en: 'It is expensive to eat at a restaurant.' }
  - id: oppen
    status: draft
    pos: adjective
    forms: [öppen, öppet, öppna]
    en: open
    example: { sv: 'Apoteket är öppet till klockan 19.', en: 'The pharmacy is open until 7 pm.' }
  - id: stangd
    status: draft
    pos: adjective
    forms: [stängd, stängt, stängda]
    en: closed
    example: { sv: 'Banken är stängd på söndagar.', en: 'The bank is closed on Sundays.' }
```

```yaml
# file: content/vocab/c-ord-hemmet.yaml
# Vocabulary: home, family and neighbours. Forms follow FORM_COUNT in src/domain/content/schema.ts.
# Drafted 2026-11-19; not reviewed yet (docs/CONTENT.md).
id: c-ord-hemmet
version: 1
level: C
skill: ord
title: Ord – hemmet och familjen
theme: boende
words:
  - id: lagenhet
    status: draft
    pos: noun
    forms: [en lägenhet, lägenheten, lägenheter, lägenheterna]
    en: flat, apartment
    example: { sv: 'Vi bor i en lägenhet med tre rum och kök.', en: 'We live in a flat with three rooms and a kitchen.' }
  - id: hyra
    status: draft
    pos: noun
    forms: [en hyra, hyran, hyror, hyrorna]
    en: rent
    example: { sv: 'Hyran ska betalas senast den sista varje månad.', en: 'The rent must be paid by the last day of each month.' }
  - id: granne
    status: draft
    pos: noun
    forms: [en granne, grannen, grannar, grannarna]
    en: neighbour
    example: { sv: 'Min granne vattnar mina blommor när jag är bortrest.', en: 'My neighbour waters my plants when I am away.' }
  - id: tvattstuga
    status: draft
    pos: noun
    forms: [en tvättstuga, tvättstugan, tvättstugor, tvättstugorna]
    en: laundry room
    example: { sv: 'Jag har bokat tvättstugan på tisdag.', en: 'I have booked the laundry room for Tuesday.' }
  - id: kok
    status: draft
    pos: noun
    forms: [ett kök, köket, kök, köken]
    en: kitchen
    example: { sv: 'Vi äter frukost i köket.', en: 'We have breakfast in the kitchen.' }
  - id: rum
    status: draft
    pos: noun
    forms: [ett rum, rummet, rum, rummen]
    en: room
    example: { sv: 'Barnen delar rum.', en: 'The children share a room.' }
  - id: nyckel
    status: draft
    pos: noun
    forms: [en nyckel, nyckeln, nycklar, nycklarna]
    en: key
    example: { sv: 'Jag har glömt nycklarna hemma.', en: 'I have left the keys at home.' }
  - id: familj
    status: draft
    pos: noun
    forms: [en familj, familjen, familjer, familjerna]
    en: family
    example: { sv: 'Min familj kom till Sverige 2023.', en: 'My family came to Sweden in 2023.' }
  - id: barn
    status: draft
    pos: noun
    forms: [ett barn, barnet, barn, barnen]
    en: child
    example: { sv: 'Hur många barn har du?', en: 'How many children do you have?' }
  - id: foralder
    status: draft
    pos: noun
    forms: [en förälder, föräldern, föräldrar, föräldrarna]
    en: parent
    example: { sv: 'Alla föräldrar är välkomna på mötet.', en: 'All parents are welcome at the meeting.' }
  - id: syskon
    status: draft
    pos: noun
    forms: [ett syskon, syskonet, syskon, syskonen]
    en: sibling, brother or sister
    example: { sv: 'Jag har fyra syskon.', en: 'I have four brothers and sisters.' }
  - id: kompis
    status: draft
    pos: noun
    forms: [en kompis, kompisen, kompisar, kompisarna]
    en: friend, mate
    example: { sv: 'Jag ska träffa en kompis på ett café.', en: 'I am meeting a friend at a café.' }
  - id: forskola
    status: draft
    pos: noun
    forms: [en förskola, förskolan, förskolor, förskolorna]
    en: preschool
    example: { sv: 'Vår dotter går på förskolan på dagarna.', en: 'Our daughter goes to preschool in the daytime.' }
  - id: bo
    status: draft
    pos: verb
    forms: [att bo, bor, bodde, bott, bo]
    en: to live (somewhere)
    example: { sv: 'Var bor du?', en: 'Where do you live?' }
  - id: flytta
    status: draft
    pos: verb
    forms: [att flytta, flyttar, flyttade, flyttat, flytta]
    en: to move (house)
    example: { sv: 'Vi flyttade hit för två år sedan.', en: 'We moved here two years ago.' }
  - id: stada
    status: draft
    pos: verb
    forms: [att städa, städar, städade, städat, städa]
    en: to clean, to tidy
    example: { sv: 'Vi städar lägenheten på lördagar.', en: 'We clean the flat on Saturdays.' }
  - id: tvatta
    status: draft
    pos: verb
    forms: [att tvätta, tvättar, tvättade, tvättat, tvätta]
    en: to wash (clothes)
    example: { sv: 'Jag tvättar kläder två gånger i veckan.', en: 'I do the laundry twice a week.' }
  - id: traffa
    status: draft
    pos: verb
    forms: [att träffa, träffar, träffade, träffat, träffa]
    en: to meet
    example: { sv: 'Vi träffar grannarna på gården.', en: 'We meet the neighbours in the courtyard.' }
  - id: hamta
    status: draft
    pos: verb
    forms: [att hämta, hämtar, hämtade, hämtat, hämta]
    en: to fetch, to pick up
    example: { sv: 'Jag hämtar barnen på förskolan klockan fyra.', en: 'I pick the children up from preschool at four.' }
  - id: stor
    status: draft
    pos: adjective
    forms: [stor, stort, stora]
    en: big, large
    example: { sv: 'Vi har ett stort kök.', en: 'We have a big kitchen.' }
  - id: trevlig
    status: draft
    pos: adjective
    forms: [trevlig, trevligt, trevliga]
    en: nice, pleasant
    example: { sv: 'Grannarna är väldigt trevliga.', en: 'The neighbours are very nice.' }
```

## 4. Grammar C, pack 2 (basics) – `content/grammar/c-grammatik-2.yaml`

These are the four basics that 3C names and pack 1 does not teach: numerus and bestämdhet, tempus (the past tense), pronouns, and *klockan, datum, ordningstal och tidsangivelser*.

```yaml
# file: content/grammar/c-grammatik-2.yaml
# Grammar pack 2: the basics that KP27 course 3C names (it begins study path 3).
# Explanations are in English, in the Markdown subset of
# src/domain/lessonText.ts: *Swedish* in single stars, **bold** in double.
# Instructions to the learner (prompt) are in Swedish, as on the test; the
# explanation after an answer (explain) is in English.
# Drafted 2026-11-19; not reviewed yet (docs/CONTENT.md).
id: c-grammatik-2
version: 1
level: C
skill: grammatik
title: Grammatik – grunderna
lessons:
  - id: c-g-substantiv
    status: draft
    kp27: [sprak.ordforrad-bojning]
    title: En eller ett, och plural
    en: 'Nouns: en or ett, the definite form and the plural'
    body: |
      Every Swedish noun is an *en* word or an *ett* word. About three of four nouns are *en* words. There is no rule that always works, so learn the article with the word: *en bil*, *ett hus*.

      ## The definite form

      For "the", Swedish adds an ending to the noun. En words take *-en* or *-n*, and ett words take *-et* or *-t*.

      | Indefinite | Definite |
      | --- | --- |
      | *en bil* | *bilen* |
      | *en lampa* | *lampan* |
      | *ett hus* | *huset* |
      | *ett äpple* | *äpplet* |

      ## The plural

      There are five common plural endings. The end of the word often shows which one to use.

      | Ending | Singular | Plural | Plural, definite |
      | --- | --- | --- | --- |
      | *-or* | *en flicka* | *flickor* | *flickorna* |
      | *-ar* | *en bil* | *bilar* | *bilarna* |
      | *-er* | *en månad* | *månader* | *månaderna* |
      | *-n* | *ett äpple* | *äpplen* | *äpplena* |
      | no ending | *ett hus* | *hus* | *husen* |

      - En words that end in *-a* usually take *-or*: *en lampa*, *två lampor*.
      - Ett words that end in a consonant usually take no ending: *ett barn*, *tre barn*.
      - Some common words change their vowel: *en man*, *två män*; *en bok*, *två böcker*.

      ## After my and your

      After *min*, *din* and other possessives, the noun has no ending: *min bil*, not *min bilen*.
    items:
      - type: mc
        id: c-g-substantiv-1
        prompt: En eller ett? ___ hus
        options:
          - en
          - ett
        answer: 1
        explain: Hus is an ett word, ett hus. Learn the article with the noun.
      - type: gap
        id: c-g-substantiv-2
        prompt: Skriv ordet i plural.
        sentence: Jag har köpt två ___ i dag.
        hint: en tröja
        accept: [tröjor]
        explain: Tröja is an en word that ends in -a, so the plural ends in -or, tröjor.
      - type: gap
        id: c-g-substantiv-3
        prompt: Skriv ordet i bestämd form.
        sentence: Var är ___? Jag hittar den inte.
        hint: en nyckel
        accept: [nyckeln]
        explain: Nyckel is an en word that ends in -el, so the definite form adds only -n, nyckeln.
      - type: gap
        id: c-g-substantiv-4
        prompt: Skriv ordet i plural.
        sentence: Vi har tre ___, två döttrar och en son.
        hint: ett barn
        accept: [barn]
        explain: Barn is an ett word that ends in a consonant, so the plural has no ending, tre barn.
      - type: mc
        id: c-g-substantiv-5
        prompt: Vilken form passar? Jag har läst ___ som du gav mig. Den var bra.
        options:
          - en bok
          - boken
          - böcker
          - böckerna
        answer: 1
        explain: It is one book that you both know about, so the definite singular boken fits. Den shows that it is one en word.
      - type: transform
        id: c-g-substantiv-6
        prompt: Skriv meningen i plural.
        from: Bilen är ny.
        accept: [Bilarna är nya.]
        explain: Bil takes -ar in the plural, and the definite plural is bilarna. An adjective after a plural ends in -a, nya.

  - id: c-g-preteritum
    status: draft
    kp27: [sprak.ordforrad-bojning]
    title: Vad hände? Preteritum
    en: The past tense
    body: |
      Use the past tense (*preteritum*) for something that happened at a finished time, for example *i går*, *i måndags*, *förra veckan* or *för två år sedan*.

      ## Four patterns

      Look at the present tense to find the pattern.

      | Group | Present | Past | Example |
      | --- | --- | --- | --- |
      | 1 | *-ar* | *-ade* | *jobbar*, *jobbade* |
      | 2 | *-er* | *-de* | *stänger*, *stängde* |
      | 2 | *-er* after k, p, s, t or x | *-te* | *köper*, *köpte* |
      | 3 | a short verb | *-dde* | *bor*, *bodde* |

      ## Verbs to learn one by one

      Many common verbs change their vowel, or are irregular in another way.

      | Infinitive | Present | Past |
      | --- | --- | --- |
      | *vara* | *är* | *var* |
      | *ha* | *har* | *hade* |
      | *gå* | *går* | *gick* |
      | *komma* | *kommer* | *kom* |
      | *äta* | *äter* | *åt* |
      | *skriva* | *skriver* | *skrev* |
      | *se* | *ser* | *såg* |
      | *ta* | *tar* | *tog* |

      ## Word order

      A time word at the start takes place 1, so the verb comes next: *I går **jobbade** jag.*
    items:
      - type: gap
        id: c-g-preteritum-1
        prompt: Skriv verbet i preteritum.
        sentence: I går ___ jag hela dagen.
        hint: jobba
        accept: [jobbade]
        explain: Jobbar ends in -ar (group 1), so the past tense is jobbade.
      - type: gap
        id: c-g-preteritum-2
        prompt: Skriv verbet i preteritum.
        sentence: Vi ___ till Sverige för tre år sedan.
        hint: flytta
        accept: [flyttade]
        explain: Flyttar is group 1, so the past tense is flyttade. "För tre år sedan" names a finished time.
      - type: gap
        id: c-g-preteritum-3
        prompt: Skriv verbet i preteritum.
        sentence: Hon ___ en ny jacka i lördags.
        hint: köpa
        accept: [köpte]
        explain: Köper ends in -er after p, so the past tense ends in -te, köpte.
      - type: gap
        id: c-g-preteritum-4
        prompt: Skriv verbet i preteritum.
        sentence: Förra året ___ vi i Göteborg.
        hint: bo
        accept: [bodde]
        explain: Bo is a short verb (group 3), so the past tense is bodde.
      - type: gap
        id: c-g-preteritum-5
        prompt: Skriv verbet i preteritum.
        sentence: I morse ___ jag frukost klockan sju.
        hint: äta
        accept: [åt]
        explain: Äta changes its vowel. The past tense is åt.
      - type: mc
        id: c-g-preteritum-6
        prompt: Vilken form passar? I lördags ___ vi på bio.
        options:
          - går
          - gick
          - gått
        answer: 1
        explain: I lördags means last Saturday, a finished time, so the past tense gick fits. Gått needs har before it.
      - type: transform
        id: c-g-preteritum-7
        prompt: Skriv meningen i preteritum.
        from: Han skriver ett sms till sin bror.
        accept: [Han skrev ett sms till sin bror.]
        explain: Skriva changes its vowel. The past tense is skrev.

  - id: c-g-pronomen
    status: draft
    kp27: [sprak.ordforrad-bojning, sprak.meningsbyggnad]
    title: Jag, mig och min
    en: Personal and possessive pronouns
    body: |
      A pronoun has one form as the subject and another as the object. The possessive shows who owns something.

      | Subject | Object | Possessive |
      | --- | --- | --- |
      | *jag* | *mig* | *min*, *mitt*, *mina* |
      | *du* | *dig* | *din*, *ditt*, *dina* |
      | *han* | *honom* | *hans* |
      | *hon* | *henne* | *hennes* |
      | *vi* | *oss* | *vår*, *vårt*, *våra* |
      | *ni* | *er* | *er*, *ert*, *era* |
      | *de* | *dem* | *deras* |

      People often say *mej*, *dej* and *dom*, but write *mig*, *dig* and *de* or *dem*.

      ## Min, mitt, mina

      The possessive follows the thing you own: *min bil* (an en word), *mitt hus* (an ett word), *mina barn* (plural).

      ## Sin, sitt, sina

      When the subject owns the thing, use *sin*, *sitt* or *sina* instead of *hans*, *hennes* or *deras*.

      - *Ali ringer **sin** mamma.* Ali calls his own mother.
      - *Ali ringer **hans** mamma.* Ali calls another man's mother.
    items:
      - type: gap
        id: c-g-pronomen-1
        prompt: Skriv rätt form av "jag".
        sentence: Kan du hjälpa ___ med läxan?
        accept: [mig, mej]
        explain: The pronoun is the object of hjälpa, so it is mig. People often say "mej".
      - type: gap
        id: c-g-pronomen-2
        prompt: Skriv rätt form av "min".
        sentence: Var är ___ nycklar?
        accept: [mina]
        explain: Nycklar is plural, so the possessive is mina.
      - type: gap
        id: c-g-pronomen-3
        prompt: Skriv rätt form av "vår".
        sentence: Vi har sålt ___ hus.
        accept: [vårt]
        explain: Hus is an ett word, so the possessive is vårt.
      - type: mc
        id: c-g-pronomen-4
        prompt: Vilken mening är rätt?
        options:
          - Jag träffade de i affären.
          - Jag träffade dem i affären.
        answer: 1
        explain: The pronoun is the object of träffade, so it is dem. Both are said "dom".
      - type: mc
        id: c-g-pronomen-5
        prompt: Sara hämtar ___ son på förskolan. (Det är Saras egen son.)
        options:
          - hennes
          - sin
          - sitt
        answer: 1
        explain: Sara is the subject and owns the thing, so use sin. Son is an en word, so it is sin, not sitt.
      - type: mc
        id: c-g-pronomen-6
        prompt: Vilken mening är rätt?
        options:
          - Min lägenheten är stor.
          - Min lägenhet är stor.
          - Mitt lägenhet är stor.
        answer: 1
        explain: Lägenhet is an en word, so min. After a possessive, the noun has no ending, so lägenhet, not lägenheten.

  - id: c-g-tid
    status: draft
    kp27: [sprak.ordforrad-bojning, sprak.textbindning]
    title: Klockan, datum och tid
    en: The clock, dates and time words
    body: |
      ## The clock

      - *Klockan är tre.* 3.00
      - *Den är kvart över tre.* 3.15
      - *Den är halv fyra.* 3.30
      - *Den är kvart i fyra.* 3.45

      **Halv fyra** is half an hour **before** four, not after it. Timetables use the 24-hour clock: *15.30* is *femton och trettio*, or in everyday speech *halv fyra*.

      ## Dates

      Dates use ordinal numbers: *den första maj*, *den tjugofjärde december*. Days and months start with a small letter: *måndag*, *maj*.

      | Number | Ordinal |
      | --- | --- |
      | *1* | *första* |
      | *2* | *andra* |
      | *3* | *tredje* |
      | *4* | *fjärde* |
      | *5* | *femte* |
      | *10* | *tionde* |
      | *20* | *tjugonde* |

      ## Small time words

      | Swedish | Meaning |
      | --- | --- |
      | *om en vecka* | in a week, from now |
      | *för en vecka sedan* | a week ago |
      | *i en vecka* | for a week |
      | *på måndag* | this coming Monday |
      | *i måndags* | last Monday |
      | *på måndagar* | every Monday |
    items:
      - type: mc
        id: c-g-tid-1
        prompt: Klockan är 14.30. Vad säger man?
        options:
          - halv två
          - halv tre
          - tre och trettio
        answer: 1
        explain: 14.30 is half an hour before three, so it is halv tre.
      - type: mc
        id: c-g-tid-2
        prompt: Klockan är 8.45. Vad säger man?
        options:
          - kvart över åtta
          - kvart i nio
          - kvart i åtta
        answer: 1
        explain: 8.45 is a quarter of an hour before nine, kvart i nio.
      - type: gap
        id: c-g-tid-3
        prompt: Skriv rätt litet ord.
        sentence: Jag har en tid hos tandläkaren ___ fredag.
        accept: [på]
        explain: På fredag means this coming Friday. I fredags would mean last Friday.
      - type: gap
        id: c-g-tid-4
        prompt: Skriv rätt litet ord.
        sentence: Vi flyttade hit ___ två år sedan.
        accept: [för]
        explain: För … sedan means ago, för två år sedan.
      - type: gap
        id: c-g-tid-5
        prompt: Skriv rätt litet ord.
        sentence: Kursen börjar ___ en vecka.
        accept: [om]
        explain: Om en vecka means in a week, from now.
      - type: mc
        id: c-g-tid-6
        prompt: Du har en tid den 3 mars. Hur säger man datumet?
        options:
          - den tre mars
          - den tredje mars
          - den tredjen mars
        answer: 1
        explain: Dates use ordinal numbers. Number 3 is tredje, so den tredje mars.
      - type: order
        id: c-g-tid-7
        prompt: Börja med "I måndags".
        chunks: [I måndags, var, jag, hos läkaren]
        explain: I måndags (last Monday) takes place 1, so the verb var comes second and the subject jag after it.
```

## 5. Skriva C – `content/writing/c-skriva-1.yaml`

At C there is one informal task. The model answers fit `WRITING_WORDS.C` (50–150 words). They use the features that SU's C matrix looks for: an introduction, a main part and an ending; *och, men, sedan, så, eftersom*; and sentences that start with a time word (V2).

```yaml
# file: content/writing/c-skriva-1.yaml
# Writing pack 1, level C: three informal tasks (the C test has one informal task).
# The task and model answer are in Swedish; `en` and the notes are in English.
# Each note's `quote` must appear word for word in the model answer.
# Model answers are meant to pass at C, not to be perfect.
# Drafted 2026-11-19; not reviewed yet (docs/CONTENT.md).
id: c-skriva-1
version: 1
level: C
skill: skriva
title: Skriva C – paket 1
prompts:
  - id: c-s-kurskamrat
    status: draft
    kp27:
      [
        samtala.berattelser-presentationer,
        samtala.sammanfattningar,
        sprak.textstruktur,
      ]
    theme: studier
    register: informal
    title: Mejl till en kurskamrat
    en: An email to a classmate who has been ill
    task:
      - Din kurskamrat Ali har varit sjuk i tre dagar och har inte varit på sfi. Han skriver till dig och frågar vad ni har gjort i skolan. Svara på hans mejl.
    points:
      - Fråga hur Ali mår.
      - Berätta vad ni har gjort på lektionerna.
      - Berätta om läxan.
      - Föreslå att ni pluggar tillsammans.
    model:
      lines:
        - Hej Ali!
        - Tack för ditt mejl. Vad tråkigt att du har varit sjuk! Hur mår du nu?
        - I måndags läste vi en text om hur man bokar en tid på vårdcentralen. Sedan övade vi på att ringa i par. I går lyssnade vi på nyheter på lätt svenska, och det var ganska svårt.
        - Läxan är att skriva tio meningar om vad du gör på helgen. Vi ska lämna den till läraren på fredag.
        - Om du vill kan vi plugga tillsammans på biblioteket i morgon efter lektionen. Passar det?
        - Krya på dig!
        - Hälsningar
        - Sara
      notes:
        - quote: Hur mår du nu?
          note: Answers the first point early, with a question that shows you care.
        - quote: I måndags läste vi
          note: The time word comes first, so the verb läste comes second and vi after it (V2). Läste is the past tense of läsa.
        - quote: Sedan övade vi
          note: Sedan (then) puts the events in order, and the verb still comes second.
        - quote: Om du vill kan vi plugga
          note: A subordinate clause takes place 1, so the verb kan comes right after it.
        - quote: Krya på dig!
          note: The usual phrase to someone who is ill, "get well soon".

  - id: c-s-inbjudan
    status: draft
    kp27: [samtala.onskemal-asikter, samtala.anpassning, sprak.textbindning]
    theme: familj och vänner
    register: informal
    title: Svar på en inbjudan
    en: A reply to a party invitation
    task:
      - Din granne Maria har bjudit dig på sin 40-årsfest på lördag. Du kan komma, men du kommer lite senare. Skriv ett mejl till Maria.
    points:
      - Tacka för inbjudan.
      - Säg att du kommer, och förklara varför du kommer senare.
      - Fråga om du kan ta med något.
      - Fråga om något som du undrar över, till exempel kläder.
    model:
      lines:
        - Hej Maria!
        - Tack så mycket för inbjudan till din fest! Jag kommer gärna.
        - Tyvärr kommer jag lite senare, eftersom jag jobbar till klockan sju på lördag. Jag tror att jag är hos dig ungefär halv åtta. Är det okej?
        - Ska jag ta med något? Jag kan baka en kaka eller göra en sallad, om du vill.
        - Jag undrar också en sak. Ska man ha fina kläder, eller går det bra med vanliga kläder?
        - Jag ser fram emot att fira dig!
        - Kram
        - Amir
      notes:
        - quote: Jag kommer gärna.
          note: Gärna is a friendly way to say yes to an invitation.
        - quote: Tyvärr kommer jag lite senare
          note: Tyvärr (unfortunately) takes place 1, so the verb kommer comes second.
        - quote: eftersom jag jobbar till klockan sju
          note: Eftersom gives the reason, as the task asks.
        - quote: Ska jag ta med något?
          note: A short, clear question for the third point.
        - quote: Jag ser fram emot att fira dig!
          note: A warm ending before the closing. "Kram" fits a neighbour you know well.

  - id: c-s-helgen
    status: draft
    kp27: [samtala.berattelser-presentationer, sprak.ordforrad-bojning, sprak.textstruktur]
    theme: fritid
    register: informal
    title: Mejl om din helg
    en: An email to a friend about your weekend
    task:
      - Din vän Lisa bor i en annan stad. Hon har skrivit och frågat vad du gjorde i helgen. Svara på hennes mejl.
    points:
      - Berätta vad du gjorde på lördagen och på söndagen.
      - Berätta vad som var roligast.
      - Fråga vad Lisa gjorde.
      - Föreslå något som ni kan göra tillsammans.
    model:
      lines:
        - Hej Lisa!
        - Tack för ditt mejl! Min helg var jättebra.
        - På lördagen var det fint väder, så jag åkte till stranden med mina barn. Vi badade, åt glass och spelade fotboll. På kvällen lagade jag mat till min syster och hennes familj.
        - På söndagen var jag trött, och därför stannade jag hemma. Jag städade lite och läste en bok.
        - Det roligaste var stranden, eftersom barnen var så glada.
        - Vad gjorde du i helgen? Har du lust att hälsa på oss nästa månad? Då kan vi gå på museum tillsammans.
        - Kram
        - Fatima
      notes:
        - quote: så jag åkte till stranden
          note: Så shows a result. After så, the subject comes before the verb.
        - quote: Vi badade, åt glass och spelade fotboll.
          note: Three verbs in the past tense, including åt, the past of äta.
        - quote: och därför stannade jag hemma
          note: Därför (so, that is why) takes place 1, so the verb stannade comes second.
        - quote: Det roligaste var stranden, eftersom
          note: Answers "what was the most fun" and gives a reason.
        - quote: Har du lust att hälsa på oss nästa månad?
          note: A friendly suggestion, as the last point asks.
```

## 6. Tala C, solo – `content/speaking/c-tala-1.yaml`

At C, the individual part is a conversation: the leader asks the learner to tell about a familiar topic and asks follow-up questions. Here the `task` is the leader's request, and the `points` are the follow-up questions. Model answers fit `MODEL_WORDS` (150–450 words) and are simpler than at D.

```yaml
# file: content/speaking/c-tala-1.yaml
# Speaking pack 1, level C: the individual conversation with the test leader.
# The task is what the leader asks; the points are the leader's follow-up
# questions. Each model answer is read by the alma voice.
# A model answer passes at C: simple, understandable, partly connected.
# Drafted 2026-11-19; not reviewed yet (docs/CONTENT.md).
id: c-tala-1
version: 1
level: C
skill: tala
title: Tala C – paket 1
tasks:
  - id: c-t-vanlig-dag
    status: draft
    kp27: [samtala.berattelser-presentationer, samtala.fragor-vagledning-intervju, sprak.uttal]
    theme: vardag
    title: En vanlig dag
    en: An ordinary day – tell the test leader about it
    task:
      - Samtalsledaren ber dig berätta om hur en vanlig dag ser ut för dig.
    points:
      - Vad gör du på morgonen?
      - Vad gör du på dagen, till exempel i skolan eller på jobbet?
      - Vad brukar du göra på kvällen?
      - Vilken del av dagen tycker du bäst om? Varför?
    phrases:
      - Jag brukar …
      - Först … sedan …
      - Efter lunch …
      - På kvällen …
      - Det bästa med dagen är … eftersom …
      - På helgerna är det annorlunda, för då …
    model:
      - voice: alma
        text: Jag ska berätta om en vanlig dag för mig. Jag brukar vakna klockan sex, eftersom mina barn börjar skolan tidigt.
      - voice: alma
        text: Först äter vi frukost tillsammans. Jag dricker te och äter en smörgås med ost. Sedan följer jag barnen till skolan, och efter det tar jag bussen till sfi.
      - voice: alma
        text: Lektionerna börjar klockan halv nio och slutar klockan tolv. Vi läser, skriver och pratar mycket i grupp. Jag tycker mest om när vi pratar, för då lär jag mig nya ord.
      - voice: alma
        text: Efter lunch handlar jag mat och hämtar barnen. På eftermiddagen hjälper jag dem med läxorna. Ibland är det svårt, eftersom läxorna är på svenska och jag inte förstår allt. Men vi hjälps åt.
      - voice: alma
        text: På kvällen lagar jag middag. Efter middagen tittar vi på tv eller går en promenad. Barnen lägger sig klockan åtta, och sedan pluggar jag en stund innan jag går och lägger mig.
      - voice: alma
        text: Den bästa delen av dagen är kvällen, när hela familjen är hemma. På helgerna är det annorlunda. Då sover vi längre och träffar ofta våra vänner.

  - id: c-t-framtiden
    status: draft
    kp27: [samtala.berattelser-presentationer, samtala.fragor-vagledning-intervju, samtala.onskemal-asikter, sprak.uttal]
    theme: arbete
    title: Mina planer
    en: Your plans for work and studies – tell the test leader
    task:
      - Samtalsledaren vill veta vad du har gjort tidigare och vad du vill göra i framtiden.
    points:
      - Vad gjorde du innan du kom till Sverige, eller innan du började på sfi?
      - Vad vill du arbeta med eller studera i framtiden? Varför?
      - Vad behöver du göra för att nå ditt mål?
      - Vem kan hjälpa dig?
    phrases:
      - Innan jag kom hit …
      - I mitt hemland jobbade jag som …
      - I framtiden vill jag …
      - Jag vill bli … eftersom …
      - För att nå mitt mål måste jag …
      - Jag ska prata med en studievägledare.
    model:
      - voice: alma
        text: Innan jag kom till Sverige bodde jag i en liten stad. Där jobbade jag i min pappas affär i sju år. Jag sålde mat och kläder, och jag pratade med kunderna hela dagarna.
      - voice: alma
        text: Jag tyckte om jobbet, för jag gillar att träffa människor. Men det var långa dagar, och vi var nästan aldrig lediga.
      - voice: alma
        text: I framtiden vill jag bli busschaufför. Jag tycker om att köra, och jag vill ha ett jobb där jag träffar många människor varje dag. Jag har också hört att det behövs fler busschaufförer i Sverige.
      - voice: alma
        text: För att nå mitt mål måste jag först bli klar med sfi. Sedan måste jag ta körkort, och efter det kan jag gå en utbildning till busschaufför.
      - voice: alma
        text: Nästa vecka ska jag prata med en studievägledare på skolan. Hon kan berätta vilka kurser jag behöver och hur lång tid det tar.
      - voice: alma
        text: Jag vet att det tar lång tid, men jag tror att jag klarar det. Min familj tycker också att det är en bra idé.
```

## 7. Tala C, pair – `content/speaking/c-tala-2.yaml`

At C the pair talks about a familiar question and keeps the conversation going. KP27 3C names *be om upprepning och förtydligande*, so the phrase cards include asking someone to repeat or explain.

```yaml
# file: content/speaking/c-tala-2.yaml
# Speaking pack 2, level C: the pair conversation.
# The partner (nst voice) says one line at a time; the learner answers after
# each line. The lines are general on purpose, so they fit any answer.
# Drafted 2026-11-19; not reviewed yet (docs/CONTENT.md).
id: c-tala-2
version: 1
level: C
skill: tala
title: Tala C – samtal i par
phraseCards:
  - title: Ask what your partner thinks
    phrases:
      - Vad tycker du?
      - Hur gör du?
      - Och du?
  - title: Say what you think
    phrases:
      - Jag tycker att …
      - Jag tror att … eftersom …
      - För mig är … viktigast.
  - title: Agree or not
    phrases:
      - Jag håller med.
      - Det tycker jag också.
      - Jag tycker inte riktigt så.
  - title: Ask again
    phrases:
      - Förlåt, kan du säga det igen?
      - Vad betyder …?
      - Menar du att …?
  - title: Finish together
    phrases:
      - Ska vi säga …?
      - Då är vi överens.
pairs:
  - id: c-p-handla
    status: draft
    kp27: [samtala.samtal-diskussioner, samtala.onskemal-asikter, sprak.uttal]
    theme: handla
    title: Att handla
    en: Shopping in a shop or online – which is better?
    question: Är det bättre att handla i en vanlig affär eller på nätet?
    mindmap:
      - priset
      - att känna på och prova varorna
      - tiden
      - att få hjälp av personalen
      - att lämna tillbaka varor
      - miljön
    goal: Berätta vad ni tycker och kom överens om vad som är viktigast när man handlar.
    partner:
      - voice: nst
        text: Hej! Ska vi börja? Jag handlar ofta kläder på nätet, eftersom det går snabbt. Hur brukar du handla?
      - voice: nst
        text: Okej. Jag tycker att det är svårt att veta om kläderna passar, när man handlar på nätet. Vad tycker du?
      - voice: nst
        text: Mm, det förstår jag. Och priset? Är det billigare på nätet, tycker du?
      - voice: nst
        text: Jag tänker också på miljön. Det blir många transporter när alla får paket hem. Håller du med?
      - voice: nst
        text: Nu måste vi bestämma oss. Vad är viktigast när man handlar, tycker vi?
    closing:
      voice: nst
      text: Bra, då säger vi det. Tack för ett trevligt samtal!
```

## 8. Mock C – `content/mocks/c-prov-1.yaml`

Everything in the mock is written for it alone (DECISIONS #72), with ids starting `cm1-`. It has exactly **one informal writing task**, as `WRITING_TASKS.C` requires.

```yaml
# file: content/mocks/c-prov-1.yaml
# Mock exam 1, level C. Everything here is written for this mock only: no
# item is used in a drill, so a remembered answer cannot inflate a score.
# The parts follow the test: Läsa, Höra, Skriva (one informal task) and
# Tala (an individual conversation and a pair conversation). Places and firms are fictional.
# Drafted 2026-11-19; not reviewed yet (docs/CONTENT.md).
id: c-prov-1
version: 1
level: C
skill: prov
title: Provövning C – 1
lasa:
  - id: cm1-simhall
    status: draft
    kp27: [lyssna-lasa.tabeller-diagram-kartor]
    theme: kultur och fritid
    instruction: Läs informationen och svara på frågorna.
    title: Ekdala simhall – öppettider
    blocks:
      - heading: Vanliga veckor
        lines:
          - Måndag–fredag 6.30–20.00
          - Lördag och söndag 9.00–16.00
      - heading: Jul och nyår
        lines:
          - Julafton och juldagen är simhallen stängd. Nyårsafton har vi öppet 9.00–13.00.
      - heading: Priser
        lines:
          - Vuxen 60 kronor. Barn under 16 år 30 kronor. Barn under 4 år badar gratis.
    items:
      - type: mc
        id: cm1-simhall-lordag
        prompt: När stänger simhallen på lördagar?
        options:
          - Klockan 13.00
          - Klockan 16.00
          - Klockan 20.00
        answer: 1
        explain: '"Lördag och söndag 9.00–16.00" – it closes at 16.00.'
      - type: mc
        id: cm1-simhall-jul
        prompt: Vilken dag är simhallen stängd?
        options:
          - Juldagen
          - Nyårsafton
          - Söndagar
        answer: 0
        explain: '"Julafton och juldagen är simhallen stängd." On New Year''s Eve it is open in the morning.'
      - type: short
        id: cm1-simhall-pris
        prompt: Vad kostar det för ett barn som är tio år?
        accept:
          - 30 kronor
          - '30'
          - 30 kr
          - trettio kronor
        model: 30 kronor.
        explain: '"Barn under 16 år 30 kronor." A ten-year-old is under 16.'

  - id: cm1-meddelanden
    status: draft
    kp27: [lyssna-lasa.berattelser-nyheter-instruktioner]
    theme: vardag
    instruction: Läs meddelandena. Vad vill personerna? Välj det alternativ som passar bäst.
    title: Två meddelanden
    blocks:
      - heading: A
        author: Peter, fastighetsskötare
        lines:
          - Hej! Jag kommer och lagar ert kylskåp på onsdag mellan 8 och 12. Kan någon vara hemma och öppna dörren? Svara på det här sms:et.
      - heading: B
        author: Lena
        lines:
          - Tack för en jättetrevlig kväll i går! Maten var så god. Nästa gång bjuder jag hem er till oss!
    items:
      - type: mc
        id: cm1-meddelanden-a
        prompt: A. Vad vill Peter?
        options:
          - Att någon öppnar dörren för honom
          - Att någon lagar kylskåpet
          - Att någon ringer honom på onsdag
        answer: 0
        explain: '"Kan någon vara hemma och öppna dörren?" Peter will fix the fridge himself.'
      - type: mc
        id: cm1-meddelanden-b
        prompt: B. Vad vill Lena?
        options:
          - Fråga om ett recept
          - Tacka för en middag
          - Be om ursäkt
        answer: 1
        explain: '"Tack för en jättetrevlig kväll … Maten var så god." Lena thanks you for a dinner.'

  - id: cm1-lekpark
    status: draft
    kp27:
      [
        lyssna-lasa.berattelser-nyheter-instruktioner,
        lyssna-lasa.skonlitteratur-sakprosa,
      ]
    theme: samhälle
    instruction: Läs texten från Ekdala kommuns webbplats och svara på frågorna.
    title: Ny lekpark vid sjön
    blocks:
      - lines:
          - Nu är den nya lekparken vid Ekdalasjön klar. Den har gungor, en stor sandlåda och en klätterställning som ser ut som ett skepp. Det finns också bänkar och bord, så att familjer kan äta sin matsäck i parken.
          - Kommunen har byggt lekparken eftersom många föräldrar har frågat efter en lekplats nära sjön. Barnen på två förskolor har fått vara med och bestämma hur den skulle se ut.
          - Lekparken öppnar lördagen den 6 maj klockan 11. Då bjuder kommunen på saft och bullar, och det blir musik för barnen. Alla är välkomna!
    items:
      - type: mc
        id: cm1-lekpark-varfor
        prompt: Varför har kommunen byggt lekparken?
        options:
          - Det fanns en gammal lekpark som var trasig.
          - Många föräldrar ville ha en lekplats nära sjön.
          - Förskolorna behövde en ny gård.
        answer: 1
        explain: '"… eftersom många föräldrar har frågat efter en lekplats nära sjön." Eftersom gives the reason.'
      - type: mc
        id: cm1-lekpark-barnen
        prompt: Vad har barnen på förskolorna gjort?
        options:
          - De har byggt klätterställningen.
          - De har varit med och bestämt hur parken ska se ut.
          - De har bakat bullar till öppningen.
        answer: 1
        explain: '"Barnen … har fått vara med och bestämma hur den skulle se ut."'
      - type: short
        id: cm1-lekpark-oppnar
        prompt: Vilken dag öppnar lekparken?
        accept:
          - lördagen den 6 maj
          - den 6 maj
          - 6 maj
          - lördag den 6 maj
          - lördagen den sjätte maj
          - den sjätte maj
          - på lördag den 6 maj
        model: Lördagen den 6 maj.
        explain: '"Lekparken öppnar lördagen den 6 maj klockan 11."'
hora:
  - id: cm1-bibliotek-utrop
    status: draft
    kp27: [lyssna-lasa.berattelser-nyheter-instruktioner]
    theme: kultur och fritid
    kind: utrop
    instruction: Du är på biblioteket och hör ett meddelande. Lyssna och svara på frågorna.
    title: Ett meddelande på biblioteket
    lines:
      - voice: alma
        text: Hej alla besökare! Biblioteket stänger om femton minuter. Om du vill låna böcker, gå till automaten vid entrén nu. Datorerna stängs av klockan 19.45. Välkommen tillbaka i morgon klockan tio!
        say: Hej alla besökare! Biblioteket stänger om femton minuter. Om du vill låna böcker, gå till automaten vid entrén nu. Datorerna stängs av klockan nitton och fyrtiofem. Välkommen tillbaka i morgon klockan tio!
    items:
      - type: mc
        id: cm1-bibliotek-utrop-nar
        prompt: När stänger biblioteket?
        options:
          - Om fem minuter
          - Om femton minuter
          - Om en timme
        answer: 1
        explain: '"Biblioteket stänger om femton minuter."'
      - type: mc
        id: cm1-bibliotek-utrop-lana
        prompt: Vad ska man göra om man vill låna böcker?
        options:
          - Gå till automaten vid entrén
          - Fråga personalen vid datorerna
          - Komma tillbaka i morgon
        answer: 0
        explain: '"Om du vill låna böcker, gå till automaten vid entrén nu."'
  - id: cm1-tandvard
    status: draft
    kp27:
      [
        lyssna-lasa.berattelser-nyheter-instruktioner,
        samtala.fragor-vagledning-intervju,
      ]
    theme: hälsa
    kind: dialog
    instruction: Yusuf ringer till tandvården. Lyssna på samtalet och svara på frågorna.
    title: Ett samtal till tandvården
    lines:
      - voice: alma
        speaker: Receptionisten
        text: Ekdala tandvård, det är Kerstin.
      - voice: nst
        speaker: Yusuf
        text: Hej, jag heter Yusuf Ahmadi. Jag har tid hos tandläkaren på torsdag klockan tio, men jag kan inte komma då. Kan jag få en annan tid?
      - voice: alma
        speaker: Receptionisten
        text: Ja, det går bra. Vi har en tid på måndag klockan två, eller på tisdag klockan halv nio.
      - voice: nst
        speaker: Yusuf
        text: På tisdag morgon är jag i skolan. Jag tar måndag klockan två.
      - voice: alma
        speaker: Receptionisten
        text: Då har du tid på måndag klockan fjorton. Kom tio minuter innan, så att du hinner fylla i ett papper.
      - voice: nst
        speaker: Yusuf
        text: Okej, tack så mycket. Hej då!
    items:
      - type: mc
        id: cm1-tandvard-varfor
        prompt: Varför ringer Yusuf?
        options:
          - Han har ont i en tand.
          - Han vill byta sin tid.
          - Han vill ha en ny tandläkare.
        answer: 1
        explain: '"Jag kan inte komma då. Kan jag få en annan tid?" He wants to change his appointment.'
      - type: short
        id: cm1-tandvard-ny-tid
        prompt: När är Yusufs nya tid?
        accept:
          - måndag klockan två
          - på måndag klockan två
          - måndag klockan 14
          - på måndag klockan 14
          - måndag kl. 14
          - måndag 14.00
          - måndag klockan fjorton
          - på måndag
          - måndag
        model: På måndag klockan två (14.00).
        explain: '"Jag tar måndag klockan två." Tuesday morning does not work, because he is at school.'
skriva:
  - id: cm1-skriv-flytt
    status: draft
    kp27: [samtala.berattelser-presentationer, samtala.onskemal-asikter, sprak.textstruktur]
    theme: boende
    register: informal
    title: Mejl till en vän som hjälpte dig
    en: An email to thank a friend who helped you move
    task:
      - Du har flyttat till en ny lägenhet. Din vän Omar hjälpte dig med flytten i lördags. Skriv ett mejl till Omar.
    points:
      - Tacka Omar för hjälpen.
      - Berätta hur du har det i den nya lägenheten.
      - Berätta vad du ska göra i lägenheten nu.
      - Bjud hem Omar och föreslå en dag.
    model:
      lines:
        - Hej Omar!
        - Tack så mycket för att du hjälpte mig med flytten i lördags! Utan dig hade det tagit hela dagen.
        - Nu har jag bott här i en vecka, och jag trivs jättebra. Lägenheten är ljus och köket är större än i min gamla lägenhet. Grannarna verkar trevliga också.
        - Jag har inte packat upp allt än. Nästa vecka ska jag köpa en ny soffa och sätta upp gardiner, eftersom det är så ljust på morgonen.
        - Vill du komma och äta middag hos mig på fredag? Då lagar jag din favoritmat!
        - Hälsningar
        - Jamal
      notes:
        - quote: Tack så mycket för att du hjälpte mig
          note: Thanks Omar right at the start. That is the first point and the reason for the email.
        - quote: Nu har jag bott här i en vecka
          note: Nu takes place 1, so the verb har comes second. The perfect fits, because Jamal still lives there.
        - quote: köket är större än i min gamla lägenhet
          note: A comparison (större än) makes the description more varied.
        - quote: eftersom det är så ljust på morgonen
          note: Eftersom gives the reason for the curtains.
        - quote: Vill du komma och äta middag hos mig på fredag?
          note: An invitation with a day, as the last point asks.
tala:
  tasks:
    - id: cm1-tala-mat
      status: draft
      kp27: [samtala.berattelser-presentationer, samtala.fragor-vagledning-intervju, sprak.uttal]
      theme: mat
      title: Mat och måltider
      en: Food and meals – tell the test leader
      task:
        - Samtalsledaren ber dig berätta om mat och måltider i ditt liv.
      points:
        - Vad brukar du äta till frukost och till middag?
        - Var handlar du mat? Varför där?
        - Berätta om en måltid som du minns särskilt.
        - Är maten i Sverige annorlunda än maten du åt förut? Hur?
      phrases:
        - Till frukost brukar jag …
        - Jag handlar oftast på … eftersom …
        - Jag minns en gång när …
        - Maten här är mer … än …
      model:
        - voice: alma
          text: Till frukost brukar jag äta bröd med ost och gurka, och jag dricker te med mjölk. På helgerna äter vi ägg och sitter länge vid bordet.
        - voice: alma
          text: Till middag lagar jag ofta ris eller pasta med kyckling och grönsaker. Mina barn tycker mest om pizza, men den äter vi bara på fredagar. Vi äter alltid tillsammans, och alla berättar om sin dag.
        - voice: alma
          text: Jag handlar oftast i en stor affär nära mitt hus, eftersom den är billig och har många olika varor. Ibland går jag till torget, för där är frukten färsk.
        - voice: alma
          text: Jag minns särskilt min brors bröllop. Vi var mer än tvåhundra gäster, och vi åt i flera timmar. Min mamma och mina mostrar hade lagat maten i tre dagar. Det var en fantastisk fest, och vi pratar fortfarande om den.
        - voice: alma
          text: Maten i Sverige är annorlunda. Den är inte lika stark, och man äter middag tidigare, ofta klockan fem eller sex. Men jag tycker om svensk fika, särskilt kanelbullar!
  pairs:
    - id: cm1-par-omrade
      status: draft
      kp27: [samtala.samtal-diskussioner, samtala.onskemal-asikter, sprak.uttal]
      theme: boende
      title: Ett bra bostadsområde
      en: What makes a good place to live?
      question: Vad är viktigt i ett bra bostadsområde?
      mindmap:
        - affärer nära
        - bra bussar
        - parker och natur
        - skolor och förskolor
        - trevliga grannar
        - lugnt och tyst
      goal: Berätta vad ni tycker och kom överens om vad som är viktigast.
      partner:
        - voice: nst
          text: Hej! Ska vi börja? Jag tycker att det är viktigt att ha affärer nära, för jag har ingen bil. Hur är det för dig?
        - voice: nst
          text: Okej. Hur är det där du bor? Vad tycker du om ditt område?
        - voice: nst
          text: Jag tycker också om parker. Det är skönt att gå ut i naturen på helgen. Vad tycker du?
        - voice: nst
          text: Nu måste vi välja. Vad är viktigast, tycker vi?
      closing:
        voice: nst
        text: Bra, då är vi överens. Tack för samtalet!
  phraseCards:
    - title: Ask what your partner thinks
      phrases:
        - Vad tycker du?
        - Och du?
    - title: Say what you think
      phrases:
        - Jag tycker att …
        - För mig är … viktigast.
    - title: Ask again
      phrases:
        - Förlåt, kan du säga det igen?
        - Menar du att …?
    - title: Finish together
      phrases:
        - Ska vi säga …?
        - Då är vi överens.
```

---

## Verification (for the integrating agent)

1. `npm run content`: no problems reported (schema, word ranges, unique ids and headwords, quotes in model answers).
2. `npm run audio` on the Mac, then `npm test`: `content/content.test.ts` passes, including the audio lock for every new clip, word and spoken line.
3. `npm run lint && npm run typecheck`, then `npm run test:e2e`. The C-empty e2e tests still pass, because drafts are left out of production builds.
4. `INCLUDE_DRAFTS=1 npm run content && npm run dev`, with Settings set to level C. Check that each of these shows the C content with a draft badge:
   - Exam → Läsa, Höra, Skriva, Tala
   - Exam → Mock exams → "Provövning C – 1"
   - Learn → Words: 42 C words. A D learner sees these before the D words.
   - Learn → Grammar: four new lessons after pack 1.
5. Hand the packs to Anna for review, following `docs/CONTENT.md`.

## Out of scope

- Level D content (more later, as Kul said).
- A C-specific writing rubric. `RUBRIC` in `src/domain/writing.ts` uses the D criteria, which partly fit C. It is worth a separate change.
- The plan's placement check (DECISIONS #17), which now has C content to use.
- Per-level mock timings. `EXAM_FORMAT` has one set of timings for every level.
