/**
 * parse-scores.ts
 * Extracts OTR score + 4 pillar scores from a Claude coaching response.
 * All regexes are anchored to the exact OUTPUT FORMAT defined in the system prompt.
 */

export interface PillarScores {
  pocket_cadence: number | null;
  rhyme_density: number | null;
  vocal_authority: number | null;
  wordplay: number | null;
}

export interface ParsedScores {
  otr_score: number | null;
  pillar_scores: PillarScores;
}

/**
 * Extract a decimal number that appears in "LABEL: X/10" or "LABEL: X.X/10" pattern.
 * Returns null if not found or out of valid range (0-10).
 */
function extractScore(text: string, labelPattern: RegExp): number | null {
  const match = text.match(labelPattern);
  if (!match) return null;
  const val = parseFloat(match[1]);
  if (isNaN(val) || val < 0 || val > 10) return null;
  return val;
}

/**
 * Parse all scores from a Claude coaching response string.
 * Returns null values for any score that can't be extracted.
 */
export function parseScores(response: string): ParsedScores {
  // OTR: 8.2/10  or  OTR: 8/10
  const otr_score = extractScore(response, /OTR:\s*([\d.]+)\s*\/\s*10/i);

  // Pillar lines from the TECHNICAL SCORECARD section:
  // "Pocket & Cadence: 7/10"  or  "Pocket & Cadence: 7.5/10"
  const pocket_cadence = extractScore(
    response,
    /Pocket\s*(?:&|and)\s*Cadence(?:\s*\(PC\))?:\s*([\d.]+)\s*\/\s*10/i
  );

  // "Rhyme Density: 8/10"
  const rhyme_density = extractScore(
    response,
    /Rhyme\s*Density(?:\s*\(RD\))?:\s*([\d.]+)\s*\/\s*10/i
  );

  // "Vocal Authority: 7/10"  (prompt uses "Vocal Authority" in scorecard)
  const vocal_authority = extractScore(
    response,
    /Vocal\s*Authority(?:\s*(?:&|and)\s*Breath)?(?:\s*\(VABC?\))?:\s*([\d.]+)\s*\/\s*10/i
  );

  // "Wordplay & Narrative: 9/10"
  const wordplay = extractScore(
    response,
    /Wordplay\s*(?:&|and)\s*Narrative(?:\s*\(WNO\))?:\s*([\d.]+)\s*\/\s*10/i
  );

  return {
    otr_score,
    pillar_scores: { pocket_cadence, rhyme_density, vocal_authority, wordplay },
  };
}

/**
 * Derive OTR from pillar scores if Claude didn't output an explicit OTR line.
 * Weights: PC 30% · RD 25% · VABC 25% · WNO 20%
 */
export function deriveOtr(pillars: PillarScores): number | null {
  const { pocket_cadence, rhyme_density, vocal_authority, wordplay } = pillars;
  if (
    pocket_cadence === null ||
    rhyme_density === null ||
    vocal_authority === null ||
    wordplay === null
  ) {
    return null;
  }
  const derived =
    pocket_cadence * 0.3 +
    rhyme_density * 0.25 +
    vocal_authority * 0.25 +
    wordplay * 0.2;
  return Math.round(derived * 10) / 10;
}
