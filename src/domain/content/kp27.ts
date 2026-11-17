/**
 * The central content of KP27 course 3D (SKOLFS 2026:67, bilaga 3), one id per
 * point. 2D has the same points plus study technique, so 3D is the target.
 * Every content item names the points it trains, and the build reports which
 * points have no items yet.
 */
export const KP27_D_POINTS = {
  'lyssna-lasa.berattelser-nyheter-instruktioner':
    'Enkla berättelser, beskrivningar och dialoger. Enkla nyheter, meddelanden och instruktioner.',
  'lyssna-lasa.tabeller-diagram-kartor':
    'Enkel information. Tabeller, diagram och kartor.',
  'lyssna-lasa.skonlitteratur-sakprosa':
    'Enkla skönlitterära texter och enkel sakprosa.',
  'lyssna-lasa.strategier':
    'Strategier: dra slutsatser om sammanhanget, identifiera syftet med texten och läsa mellan raderna.',
  'samtala.samtal-diskussioner':
    'Enkla samtal och diskussioner, till exempel på arbetsplatser.',
  'samtala.fragor-vagledning-intervju':
    'Ställa och besvara frågor, till exempel vid studie- och yrkesvägledning och anställningsintervju.',
  'samtala.onskemal-asikter':
    'Framföra och efterfråga önskemål, information och tankar. Uttrycka och bemöta åsikter.',
  'samtala.berattelser-presentationer':
    'Enkla berättelser, beskrivningar och presentationer. Enkla meddelanden och instruktioner.',
  'samtala.anpassning':
    'Anpassning av kommunikation till syfte, mottagare och situation.',
  'samtala.sammanfattningar': 'Enkla muntliga och skriftliga sammanfattningar.',
  'sprak.uttal': 'Uttal, betoning och satsmelodi.',
  'sprak.ordforrad-bojning':
    'Ordförråd. Böjningsformer: tempus, bestämdhet och kongruens. Stavning.',
  'sprak.meningsbyggnad':
    'Meningsbyggnad i huvudsatser och bisatser. Interpunktion.',
  'sprak.textbindning':
    'Textbindning. Sambandsord och uttryck för tid, plats, orsak och förtydligande.',
  'sprak.textstruktur': 'Textstruktur, disposition och styckeindelning.',
  'digitalt.kallkritik':
    'Kännetecken för och skillnad mellan olika typer av information. Källkritiska frågor.',
} as const

export type Kp27Point = keyof typeof KP27_D_POINTS

export const KP27_POINT_IDS = Object.keys(KP27_D_POINTS) as Kp27Point[]
