// Tier 1: optional BYO-key "living curator". When the visitor pastes an
// Anthropic API key, we ask the model — once, on entry — for a bespoke Codex:
// the museum name, epigraph, movements and artists. The keyless Tier-0 artwork
// + placard generators then run against THIS codex, so the bespoke canon flows
// all the way through (placards cite the model-written manifestos and feuds).
//
// Every path validates hard and falls back to the Tier-0 codex silently on any
// failure. No raw stack traces ever reach the visitor.

import type { Codex, Movement, Artist, Palette } from './types';
import { ART_SYSTEMS } from './types';
import { clamp } from '../core/prng';

// The model name lives in exactly ONE editable constant, as specified.
export const CURATOR_MODEL = 'claude-opus-4-8';

const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export type CuratorResult =
  | { ok: true; codex: Codex }
  | { ok: false; reason: string };

const HEX = /^#[0-9a-fA-F]{6}$/;

const SYSTEM_PROMPT = `You are the curator of an imaginary museum. You invent a self-consistent, entirely FICTIONAL history of art and return it as strict JSON.

Hard rules — non-negotiable:
- Everything is fictional by construction. NEVER reference real artists, real movements, real museums, real artworks, or real people. NEVER use the phrase "in the style of [a named real artist]".
- Drama is welcome: rivalry, forgery, censorship, restitution, scandal. FORBIDDEN: sexual content, graphic violence, and references to real-world tragedies.
- British English throughout. The register is parody-grade art criticism: portentous, faintly absurd, never winking.
- Return ONLY a single JSON object. No prose, no markdown fences, no commentary.`;

function buildUserPrompt(): string {
  return `Invent a fictional museum and its art history. Return JSON with EXACTLY this shape:

{
  "museumName": "The <Adjective> <Institution>",
  "epigraph": "a single aphoristic line about the museum",
  "founded": <year between 1900 and 1980>,
  "movements": [
    {
      "id": "m0",
      "name": "a coined movement name, e.g. Neo-Lacunism",
      "years": [<start>, <end>],
      "manifesto": "one line",
      "paletteBias": { "background": "#rrggbb", "ink": "#rrggbb", "colours": ["#rrggbb", "#rrggbb", "#rrggbb"] },
      "formAffinity": ["<2-3 of: ${ART_SYSTEMS.join(', ')}>"],
      "rivalWith": "<another movement id or omit>"
    }
  ],
  "artists": [
    {
      "id": "a0",
      "name": "a fictional full name",
      "lifespan": [<birth>, <death or 0 if living>],
      "movementId": "<one of the movement ids>",
      "temperament": "one adjective phrase, e.g. ascetic",
      "signatureTechnique": "a clause describing a fictional technique",
      "careerArc": "a one-line account of how the work changed over a life",
      "feudWith": "<another artist id or omit>",
      "scandal": "<one-line notoriety or omit>"
    }
  ]
}

Provide 5 to 7 movements and 12 to 16 artists. Every artist.movementId must match a movement id. Some artists should feud (set feudWith on both sides). Dark hex backgrounds, luminous accent colours. Output ONLY the JSON object.`;
}

export async function maybeUpgradeWithCurator(
  tier0: Codex,
  apiKey: string,
): Promise<CuratorResult> {
  let raw: string;
  try {
    raw = await callCurator(apiKey);
  } catch (err) {
    return { ok: false, reason: friendlyError(err) };
  }

  const parsed = extractJson(raw);
  if (!parsed) return { ok: false, reason: 'The curator’s reply could not be read. Showing the keyless museum.' };

  const codex = validateAndBuild(parsed, tier0.seed);
  if (!codex) return { ok: false, reason: 'The curator’s reply was incomplete. Showing the keyless museum.' };

  return { ok: true, codex };
}

async function callCurator(apiKey: string): Promise<string> {
  // Opus 4.8: no temperature/top_p (they 400); thinking omitted for fast JSON.
  const body = {
    model: CURATOR_MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt() }],
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      // Required for direct browser calls; the user has opted in by pasting a key.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const status = res.status;
    if (status === 401) throw new ApiError('That API key was not accepted.');
    if (status === 429) throw new ApiError('The curator is rate-limited just now.');
    if (status >= 500) throw new ApiError('The curator’s service is unavailable.');
    throw new ApiError(`The curator returned an error (${status}).`);
  }

  const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = json.content?.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('') ?? '';
  if (!text) throw new ApiError('The curator returned nothing.');
  return text;
}

class ApiError extends Error {}

function friendlyError(err: unknown): string {
  if (err instanceof ApiError) return `${err.message} Showing the keyless museum.`;
  // Network failure / CORS / offline — never surface the raw error.
  return 'Could not reach the curator (offline?). Showing the keyless museum.';
}

/** Pull the first balanced JSON object out of the model's reply. */
function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

// ---- Validation + clamping. Anything malformed → null → Tier 0 fallback. ----

function str(v: unknown, max = 400): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
}

function validPalette(v: unknown): Palette | null {
  if (!v || typeof v !== 'object') return null;
  const p = v as Record<string, unknown>;
  const bg = str(p.background, 7);
  const ink = str(p.ink, 7);
  const cols = Array.isArray(p.colours) ? p.colours.filter((c) => typeof c === 'string' && HEX.test(c)) : [];
  if (!bg || !HEX.test(bg) || !ink || !HEX.test(ink) || cols.length < 2) return null;
  return { background: bg, ink, colours: cols.slice(0, 5) };
}

function validYears(v: unknown): [number, number] | null {
  if (!Array.isArray(v) || v.length !== 2) return null;
  const a = Number(v[0]);
  const b = Number(v[1]);
  if (!Number.isFinite(a)) return null;
  return [Math.round(a), Number.isFinite(b) ? Math.round(b) : 0];
}

function validateAndBuild(data: unknown, seed: number): Codex | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  const museumName = str(d.museumName, 80);
  const epigraph = str(d.epigraph, 240);
  if (!museumName || !epigraph) return null;
  const founded = clamp(Math.round(Number(d.founded) || 1950), 1880, 1995);

  if (!Array.isArray(d.movements) || !Array.isArray(d.artists)) return null;

  const movements: Movement[] = [];
  for (const raw of d.movements.slice(0, 8)) {
    if (!raw || typeof raw !== 'object') continue;
    const m = raw as Record<string, unknown>;
    const id = str(m.id, 12);
    const name = str(m.name, 60);
    const manifesto = str(m.manifesto, 240);
    const years = validYears(m.years);
    const palette = validPalette(m.paletteBias);
    const affinity = Array.isArray(m.formAffinity)
      ? (m.formAffinity.filter((s) => ART_SYSTEMS.includes(s as never)) as Movement['formAffinity'])
      : [];
    if (!id || !name || !manifesto || !years || !palette || affinity.length === 0) continue;
    movements.push({
      id, name, years, manifesto, paletteBias: palette,
      formAffinity: affinity.slice(0, 3),
      rivalWith: typeof m.rivalWith === 'string' ? m.rivalWith : undefined,
    });
  }
  if (movements.length < 3) return null;
  const movementIds = new Set(movements.map((m) => m.id));

  const artists: Artist[] = [];
  for (const raw of d.artists.slice(0, 20)) {
    if (!raw || typeof raw !== 'object') continue;
    const a = raw as Record<string, unknown>;
    const id = str(a.id, 12);
    const name = str(a.name, 60);
    const lifespan = validYears(a.lifespan);
    let movementId = str(a.movementId, 12);
    if (!id || !name || !lifespan || !movementId) continue;
    if (!movementIds.has(movementId)) movementId = movements[0].id; // keep coherence
    artists.push({
      id, name, lifespan, movementId,
      temperament: str(a.temperament, 60) ?? 'reticent',
      signatureTechnique: str(a.signatureTechnique, 200) ?? 'working a single surface for years',
      careerArc: str(a.careerArc, 200) ?? 'grew quieter as the acclaim grew louder',
      feudWith: typeof a.feudWith === 'string' ? a.feudWith : undefined,
      scandal: str(a.scandal, 200) ?? undefined,
    });
  }
  if (artists.length < 5) return null;

  // Drop dangling feud/rival references so placards never cite a missing party.
  const artistIds = new Set(artists.map((a) => a.id));
  for (const a of artists) if (a.feudWith && !artistIds.has(a.feudWith)) a.feudWith = undefined;
  for (const m of movements) if (m.rivalWith && !movementIds.has(m.rivalWith)) m.rivalWith = undefined;

  return {
    seed, museumName, epigraph, founded, movements, artists,
    timeline: [{ year: founded, text: `${museumName} is founded.` }],
    source: 'tier1',
  };
}
