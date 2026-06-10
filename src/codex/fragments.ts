// Hand-authored canon fragments. A seeded PRNG recombines these into a Codex.
// British English. The register is parody-grade art criticism: portentous,
// faintly absurd, never quite winking. Everything here is fictional by
// construction — no real artists, movements, museums or works.

import type { ArtSystem, Palette } from './types';

// ---- Palettes (movement bias) ----
export const PALETTES: Palette[] = [
  { background: '#14110d', ink: '#e7dcc8', colours: ['#c9622e', '#d8a24a', '#7d3b1f'] },
  { background: '#0d1014', ink: '#dce6ea', colours: ['#3f6f86', '#9fc0cc', '#1d3b49'] },
  { background: '#120d12', ink: '#ecd9e6', colours: ['#8a3d6b', '#c77aa0', '#46203a'] },
  { background: '#0f1310', ink: '#dde7d8', colours: ['#4f7a44', '#8db579', '#2a4525'] },
  { background: '#15120a', ink: '#efe6cf', colours: ['#b89a3e', '#e3c95f', '#6e5a1d'] },
  { background: '#100a0a', ink: '#ecd9d2', colours: ['#9e3b2e', '#cf6a52', '#5c1f17'] },
  { background: '#0b0d0f', ink: '#e2e6ea', colours: ['#5c6b7a', '#aab7c4', '#2c3741'] },
  { background: '#0e0c14', ink: '#ddd6ec', colours: ['#574a8a', '#8e7fc0', '#2d244e'] },
];

// ---- Movement name grammar ----
export const MOVEMENT_PREFIXES = [
  'Neo', 'Post', 'Anti', 'Proto', 'Ultra', 'Para', 'Counter', 'Trans', 'Sub', 'Inter',
];
export const MOVEMENT_ROOTS = [
  'Constructism', 'Tonalism', 'Verism', 'Suspensionism', 'Quietude', 'Frottage',
  'Severance', 'Threnody', 'Cartomancy', 'Stillness', 'Erasure', 'Annotation',
  'Lacunism', 'Vellum', 'Glaciation', 'Reticence', 'Murmuration', 'Cataloguism',
];

// One-line manifestos (templated; {n} = a noun the movement fixates on).
export const MANIFESTO_TEMPLATES = [
  'The {n} is not depicted; it is permitted to occur.',
  'Every surface is a confession the {n} would rather not make.',
  'We abolish the centre and grieve for it afterwards.',
  'Let the {n} finish the work the hand could only begin.',
  'Composition is a courtesy extended to the {n}; we withdraw it.',
  'Nothing is rendered that could instead be withheld.',
  'The frame is the only honest part of the {n}.',
  'We paint as one apologises: thoroughly, and too late.',
];
export const MANIFESTO_NOUNS = [
  'horizon', 'interval', 'pigment', 'witness', 'archive', 'threshold', 'remainder',
  'silence', 'grid', 'aftermath', 'margin', 'ledger',
];

// Which art systems a movement may favour (formAffinity is sampled from these).
export const SYSTEM_POOL: ArtSystem[] = [
  'flowfield', 'constructivist', 'weave', 'erosion', 'glitch', 'inkwash',
];

// ---- Artist name grammar ----
export const GIVEN_NAMES = [
  'Halvard', 'Iðunn', 'Mireille', 'Cosimo', 'Edda', 'Lubov', 'Tamsin', 'Ansel',
  'Vere', 'Ottoline', 'Caspar', 'Ingunn', 'Rafe', 'Solenne', 'Bartholomew',
  'Nadia', 'Emmerich', 'Perpetua', 'Lazar', 'Brisa', 'Casimir', 'Wynne',
  'Aurelio', 'Thea', 'Magnus', 'Liesel', 'Orinthia', 'Per', 'Damaris',
];
export const SURNAMES = [
  'Vane', 'Kestrel-Mowe', 'Asplund', 'Crane', 'Bellweather', 'Voss', 'Quill',
  'Marsh', 'Holt', 'Reszke', 'Fenn', 'Achterberg', 'Stross', 'Lindqvist',
  'Pemberton', 'Vall', 'Orlow', 'Brandt', 'Carrow', 'Sève', 'Mortmain',
  'Underhill', 'Calvert', 'Aalto', 'Wren', 'Drummond', 'Esterhazy',
];

export const TEMPERAMENTS = [
  'ascetic', 'volcanic', 'secretive', 'gregarious to a fault', 'monastic',
  'litigious', 'self-mythologising', 'pathologically modest', 'imperious',
  'haunted', 'methodical', 'incandescent', 'evasive', 'devout',
];

export const TECHNIQUES = [
  'grinding her own pigments from estuary silt',
  'painting only between the hours of three and five in the morning',
  'building the support from salvaged shutters before touching it',
  'working a single canvas for as long as eleven years',
  'burning each preparatory sketch the moment the work was begun',
  'mixing beeswax into every glaze until the surface refused light',
  'scoring the ground with a comb of his own teeth (so the legend insists)',
  'submerging finished panels in the harbour for a season before exhibiting',
  'refusing all brushes wider than a single sable hair',
  'overpainting completed works by other hands, with their grudging consent',
];

export const CAREER_ARCS = [
  'began in furious colour and ended in near-total grey',
  'spent a celebrated decade, then renounced the work and catalogued it instead',
  'was unknown until forty, then could not paint fast enough for the demand',
  'made the same image five hundred times, each one a fraction truer',
  'abandoned the figure after a single winter and never returned to it',
  'grew quieter as the acclaim grew louder, until the canvases were nearly bare',
  'was forged so often that the forgeries now define the style',
  'turned from the wall to the floor, and from the floor to the ceiling',
];

export const SCANDALS = [
  'exhibited a blank panel for nine years before admitting it was finished',
  'was twice expelled from the Academy and once, scandalously, reinstated',
  'sold the same painting to three collectors and painted two more to settle it',
  'denounced her own retrospective from the gallery floor, in evening dress',
  'is said to have signed works he had merely admired',
  'destroyed a rival’s masterwork and called it the rival’s finest collaboration',
  'left the entire estate to the museum on the condition it never be displayed',
];

// ---- Feud archetypes (two artists, one antagonism) ----
export const FEUD_ARCHETYPES = [
  'a dispute over which of them first abandoned the horizon line',
  'a stolen commission that neither would name in print',
  'the question of whether grey is a colour or an apology',
  'a single review, unsigned, that both believed the other had written',
  'a shared studio, a shared model, and an unshared bill',
  'the ownership of a technique that, on examination, neither could perform',
  'a public embrace at the Biennale that the lip-readers recorded as a threat',
];

// ---- Museum name + epigraph grammar ----
export const MUSEUM_ADJ = [
  'Severance', 'Threnody', 'Lacuna', 'Provisional', 'Withheld', 'Tidal',
  'Marginal', 'Posthumous', 'Reluctant', 'Apocryphal', 'Vellum', 'Antechamber',
];
export const MUSEUM_NOUN = [
  'Collection', 'Foundation', 'Institute', 'Wing', 'Bequest', 'Repository',
  'Estate', 'Kunsthalle', 'Archive', 'Cabinet',
];
export const EPIGRAPHS = [
  'A museum is a building that has decided to outlive its reasons.',
  'Everything here is true except the people, the places and the paintings.',
  'We do not collect art. We collect the silence around it.',
  'No work in this institution has ever existed elsewhere.',
  'The visitor is reminded that the rooms do not connect.',
  'What is hung here was never made, and is therefore beyond restoration.',
  'Attribution is a kindness we can no longer afford.',
];

// ---- Placard grammar (the product) ----
// Templates use tokens resolved against the artwork + codex:
//   {title} {artist} {year} {movement} {manifesto} {technique} {arc}
//   {medium} {dims} {temperament} {colour} {rival} {feud}
export const PLACARD_OPENERS = [
  'Painted in {year}, late in a career that {arc}, {title} is the work {artist} is said to have feared most.',
  '{title} arrives at the end of {artist}’s {temperament} middle period, and behaves accordingly.',
  'There is a temptation to read {title} ({year}) as a retreat. It is, in fact, a siege.',
  'Few works in the {movement} canon are as openly {temperament} as {title}.',
  'Begin, as {artist} did, with the edge: {title} concedes the centre and defends only its margins.',
  '{title} is the painting {movement} had been promising itself since the founding manifesto.',
];
export const PLACARD_BODIES = [
  'Working in {medium} and {technique}, the artist lets the {colour} accumulate until the surface seems less painted than weathered.',
  'The {colour} is not applied so much as permitted; one feels the hand withdrawing exactly where a lesser painter would have insisted.',
  'True to the movement’s creed — “{manifesto}” — the composition refuses the eye a place to rest, and is the better for it.',
  'Note the {medium}: {technique}, a discipline that here verges on penance.',
  'What reads at a distance as order resolves, at reading distance, into a thousand small refusals.',
];
export const PLACARD_CLOSERS = [
  'The rivalry with {rival} — {feud} — is everywhere in the brushwork, and nowhere in the records.',
  'Measuring {dims}, it was the last work to leave the studio before the events of {year}.',
  'Conservators note that the panel will not photograph; this placard is the only reliable witness.',
  'It hung, briefly, facing a work by {rival}; the two were never again exhibited in the same wing.',
  'Whether {title} is finished remains, by the artist’s explicit instruction, undecided.',
  'The Foundation acquired it under terms it has declined, repeatedly and with feeling, to disclose.',
];

// ---- Artwork title grammar ----
export const TITLE_PATTERNS = [
  '{abstract} (No. {num})',
  'Study for a {abstract}',
  'The {abstract} of {place}',
  '{abstract}, Withheld',
  'Untitled ({abstract})',
  '{place} at the Hour of {abstract}',
  'After the {abstract}',
];
export const TITLE_ABSTRACT = [
  'Threshold', 'Recension', 'Interval', 'Severance', 'Aftermath', 'Quietus',
  'Lacuna', 'Vellum', 'Erasure', 'Murmur', 'Remainder', 'Annotation', 'Tide',
  'Cartouche', 'Palimpsest', 'Reticence', 'Frottage', 'Glaciation',
];
export const TITLE_PLACE = [
  'Vøring', 'the Long Room', 'Cape Mourne', 'the Estuary', 'Saltmarsh',
  'the North Annexe', 'Cold Harbour', 'the Reading Room', 'Asplund Sound',
];

export const MEDIA = [
  'egg tempera and estuary silt on panel',
  'oil and beeswax on salvaged shutter',
  'graphite, ash and rabbit-skin glue on linen',
  'pigment suspended in marsh water on board',
  'tar, chalk and sable on prepared canvas',
  'ink and bleach on found vellum',
  'oxidised copper leaf and oil on oak',
];
