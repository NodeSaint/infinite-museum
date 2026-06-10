// Tier 1: optional BYO-key "living curator". When the visitor has pasted an
// Anthropic API key, we ask the model for a bespoke Codex on entry. Every path
// validates hard and falls back to the Tier 0 codex silently on any failure.
//
// NOTE: full implementation lands in build-order step 5. This stub keeps the
// keyless museum fully functional and always returns null (→ Tier 0) for now.

import type { Codex } from './types';

export async function maybeUpgradeWithCurator(
  _tier0: Codex,
  _apiKey: string,
): Promise<Codex | null> {
  return null;
}
