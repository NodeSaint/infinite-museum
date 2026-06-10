// Tier 0 generation: keyless, deterministic. A seed reproduces the entire
// Codex and every artwork derived from it. Coherence is enforced — an artwork's
// system is drawn from its artist's movement, its palette from that movement,
// its placard cites real (fictional) feuds and manifestos from the Codex.

import {
  mulberry32, deriveSeed, randInt, pick, sample, shuffle, chance,
  type Rng,
} from '../core/prng';
import type {
  Codex, Movement, Artist, Artwork, ArtSystem, CodexEvent, Palette,
} from './types';
import * as F from './fragments';

const colourName = (hex: string): string => {
  // crude warm/cool/etc. descriptor purely for prose flavour
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (r > g && r > b) return 'rust';
  if (b > r && b > g) return 'slate';
  if (g > r && g > b) return 'verdigris';
  return 'ash';
};

function template(tpl: string, tokens: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => tokens[k] ?? `{${k}}`);
}

function movementName(rng: Rng, used: Set<string>): string {
  for (let i = 0; i < 24; i++) {
    const name = chance(rng, 0.7)
      ? `${pick(rng, F.MOVEMENT_PREFIXES)}-${pick(rng, F.MOVEMENT_ROOTS)}`
      : pick(rng, F.MOVEMENT_ROOTS);
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  return `${pick(rng, F.MOVEMENT_PREFIXES)}-${pick(rng, F.MOVEMENT_ROOTS)}-${used.size}`;
}

function artistName(rng: Rng, used: Set<string>): string {
  for (let i = 0; i < 24; i++) {
    const name = `${pick(rng, F.GIVEN_NAMES)} ${pick(rng, F.SURNAMES)}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  return `${pick(rng, F.GIVEN_NAMES)} ${pick(rng, F.SURNAMES)} ${used.size}`;
}

export function generateCodex(seed: number): Codex {
  const rng = mulberry32(deriveSeed(seed, 'codex'));

  const founded = randInt(rng, 1901, 1979);
  const museumName = `The ${pick(rng, F.MUSEUM_ADJ)} ${pick(rng, F.MUSEUM_NOUN)}`;
  const epigraph = pick(rng, F.EPIGRAPHS);

  // Movements
  const movementCount = randInt(rng, 5, 8);
  const usedMovementNames = new Set<string>();
  const movements: Movement[] = [];
  let cursor = founded - randInt(rng, 10, 40);
  for (let i = 0; i < movementCount; i++) {
    const span = randInt(rng, 8, 22);
    const start = cursor;
    const end = start + span;
    cursor = end - randInt(rng, 0, 6); // movements overlap a little
    const palette: Palette = pick(rng, F.PALETTES);
    const noun = pick(rng, F.MANIFESTO_NOUNS);
    movements.push({
      id: `m${i}`,
      name: movementName(rng, usedMovementNames),
      years: [start, end],
      manifesto: template(pick(rng, F.MANIFESTO_TEMPLATES), { n: noun }),
      paletteBias: palette,
      formAffinity: sample(rng, F.SYSTEM_POOL, randInt(rng, 2, 3)) as ArtSystem[],
    });
  }
  // Movement rivalries (pair some up)
  const mShuffled = shuffle(rng, movements);
  for (let i = 0; i + 1 < mShuffled.length; i += 2) {
    if (chance(rng, 0.6)) {
      mShuffled[i].rivalWith = mShuffled[i + 1].id;
      mShuffled[i + 1].rivalWith = mShuffled[i].id;
    }
  }

  // Artists
  const artistCount = randInt(rng, 12, 20);
  const usedArtistNames = new Set<string>();
  const artists: Artist[] = [];
  for (let i = 0; i < artistCount; i++) {
    const movement = pick(rng, movements);
    const birth = randInt(rng, movement.years[0] - 35, movement.years[0] - 18);
    const death = chance(rng, 0.7) ? birth + randInt(rng, 52, 91) : 0;
    artists.push({
      id: `a${i}`,
      name: artistName(rng, usedArtistNames),
      lifespan: [birth, death],
      movementId: movement.id,
      temperament: pick(rng, F.TEMPERAMENTS),
      signatureTechnique: pick(rng, F.TECHNIQUES),
      careerArc: pick(rng, F.CAREER_ARCS),
      scandal: chance(rng, 0.35) ? pick(rng, F.SCANDALS) : undefined,
    });
  }
  // Artist feuds — pair within or across movements
  const aShuffled = shuffle(rng, artists);
  const feudCount = randInt(rng, 2, 4);
  for (let i = 0; i < feudCount * 2 && i + 1 < aShuffled.length; i += 2) {
    aShuffled[i].feudWith = aShuffled[i + 1].id;
    aShuffled[i + 1].feudWith = aShuffled[i].id;
  }

  // Timeline of fictional events
  const timeline: CodexEvent[] = [];
  timeline.push({ year: founded, text: `${museumName} is founded, reportedly to house a single disputed panel.` });
  for (const m of movements) {
    timeline.push({ year: m.years[0], text: `The ${m.name} movement issues its founding statement: “${m.manifesto}”` });
  }
  for (const a of artists) {
    if (a.scandal) timeline.push({ year: a.lifespan[0] + randInt(rng, 30, 55), text: `${a.name} ${a.scandal}.` });
  }
  timeline.sort((x, y) => x.year - y.year);

  return {
    seed, museumName, epigraph, founded, movements, artists, timeline,
    source: 'tier0',
  };
}

// ---- Artwork generation ----

export function generateArtwork(
  codex: Codex,
  artistId: string,
  roomSeed: number,
  index: number,
): Artwork {
  const artist = codex.artists.find((a) => a.id === artistId)!;
  const movement = codex.movements.find((m) => m.id === artist.movementId)!;
  const seed = deriveSeed(roomSeed, `art:${artistId}:${index}`);
  const rng = mulberry32(seed);

  const system: ArtSystem = pick(rng, movement.formAffinity);
  const palette = movement.paletteBias;

  // Title
  const titlePattern = pick(rng, F.TITLE_PATTERNS);
  const title = template(titlePattern, {
    abstract: pick(rng, F.TITLE_ABSTRACT),
    place: pick(rng, F.TITLE_PLACE),
    num: String(randInt(rng, 2, 97)),
  });

  const year = randInt(rng, Math.max(movement.years[0], artist.lifespan[0] + 22), movement.years[1] + 8);
  const medium = pick(rng, F.MEDIA);

  // Fictional physical dimensions
  const w = randInt(rng, 60, 220) * 10;
  const h = randInt(rng, 60, 200) * 10;
  const dimensions = `${h} × ${w} mm`;

  const placard = generatePlacard(rng, codex, artist, movement, { title, year, medium, dimensions, palette });

  // params filled in by the art system registry (kept empty here; the renderer
  // derives bounded params from the seed). We still stash the seed.
  return {
    id: `${artistId}-${index}`,
    seed,
    system,
    params: {},
    artistId,
    movementId: movement.id,
    title, year, medium, placard, dimensions,
  };
}

function generatePlacard(
  rng: Rng,
  codex: Codex,
  artist: Artist,
  movement: Movement,
  art: { title: string; year: number; medium: string; dimensions: string; palette: Palette },
): string {
  const rival = artist.feudWith ? codex.artists.find((a) => a.id === artist.feudWith) : undefined;
  const tokens: Record<string, string> = {
    title: art.title,
    artist: artist.name,
    year: String(art.year),
    movement: movement.name,
    manifesto: movement.manifesto,
    technique: artist.signatureTechnique,
    arc: artist.careerArc,
    medium: art.medium,
    dims: art.dimensions,
    temperament: artist.temperament,
    colour: colourName(art.palette.colours[0]),
    rival: rival ? rival.name : 'the Academy',
    feud: pick(rng, F.FEUD_ARCHETYPES),
  };
  const opener = template(pick(rng, F.PLACARD_OPENERS), tokens);
  const body = template(pick(rng, F.PLACARD_BODIES), tokens);
  const closer = template(pick(rng, F.PLACARD_CLOSERS), tokens);
  return `${opener} ${body} ${closer}`;
}

// Pick the artists whose work hangs in a given movement's wing.
export function artistsForMovement(codex: Codex, movementId: string): Artist[] {
  return codex.artists.filter((a) => a.movementId === movementId);
}

// ---- Room specs (nodes in the impossible graph) ----
import { hashSeed } from '../core/prng';
import type { RoomSpec, Anomaly, AnomalyKind } from './types';

const ANOMALY_PLACARDS: Record<AnomalyKind, string[]> = {
  'sealed-door': [
    'This door was sealed in {year} following the dispute. The room beyond is recorded as “in good order” and has not been entered since.',
    'Bricked, by request of the artist’s estate. The Foundation honours the request and declines to explain it.',
  ],
  'restituted-frame': [
    'The work formerly displayed here was restituted in 1977. The frame is retained as a record of the absence.',
    'Removed 1977. The Foundation considers the empty frame to be, in itself, the more honest exhibit.',
  ],
  'conservation-studio': [
    'Conservation in progress. The panel is being relieved of an earlier, unauthorised restoration.',
    'Behind the glass: a work under treatment. Visitors are asked not to photograph the conservator.',
  ],
};

/** Generate a room node from its seed. Doors derive neighbour ids; the same
 *  seed always yields the same room and the same neighbours — a deterministic,
 *  un-embeddable graph (the impossible floor plan). */
export function generateRoomSpec(codex: Codex, roomSeed: number, isAtrium = false): RoomSpec {
  const rng = mulberry32(deriveSeed(roomSeed, 'room'));
  const movement = pick(rng, codex.movements);
  const candidates = artistsForMovement(codex, movement.id);
  const roster = candidates.length ? candidates : codex.artists;

  const count = isAtrium ? randInt(rng, 2, 3) : randInt(rng, 3, 6);
  const artworks = [];
  for (let i = 0; i < count; i++) {
    const artist = pick(rng, roster);
    artworks.push(generateArtwork(codex, artist.id, roomSeed, i));
  }

  // 2–4 doors, each leading to a derived neighbour seed (as a hex id).
  const doorCount = isAtrium ? randInt(rng, 2, 3) : randInt(rng, 2, 4);
  const doors: string[] = [];
  for (let i = 0; i < doorCount; i++) {
    doors.push(roomId(deriveSeed(roomSeed, `door:${i}`)));
  }

  // Anomaly roughly every 12th room (deterministic on the seed).
  let anomaly: Anomaly | undefined;
  if (!isAtrium && hashSeed(`anom:${roomSeed}`) % 12 === 0) {
    const kinds: AnomalyKind[] = ['sealed-door', 'restituted-frame', 'conservation-studio'];
    const kind = pick(rng, kinds);
    const placard = template(pick(rng, ANOMALY_PLACARDS[kind]), {
      year: String(randInt(rng, codex.founded, codex.founded + 60)),
    });
    anomaly = { kind, placard };
  }

  return {
    id: roomId(roomSeed),
    seed: roomSeed,
    movementId: movement.id,
    title: isAtrium ? 'Atrium' : `${movement.name} Wing`,
    artworks,
    doors,
    anomaly,
    isAtrium,
  };
}

/** A room id is just its seed in hex — ids ARE seeds, so the graph is stateless. */
export function roomId(seed: number): string {
  return (seed >>> 0).toString(16).padStart(8, '0');
}

export function seedFromRoomId(id: string): number {
  return parseInt(id, 16) >>> 0;
}
