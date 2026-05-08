import { describe, it, expect } from "vitest";
import { parseScores, deriveOtr } from "./parse-scores.js";

const SAMPLE_RESPONSE = `
🎙️ THE VIBE CHECK
Bar heavy, locked in, no filler.

⚖️ TECHNICAL BREAKDOWN
Pocket & Cadence (PC): Consistent pocket throughout, never fights the beat.
Vocal Authority (VABC): Confident delivery, strong breath control on the long lines.
Rhyme Architecture (RD): Multi-syllabic chains throughout, nice internal work.
Wordplay & Narrative (WNO): Two clear haymakers, the "crowns" metaphor lands.

📊 TECHNICAL SCORECARD
Rhyme Density: 8/10 — Multisyllabic chains throughout
Pocket & Cadence: 7/10 — Solid lock, one bar felt rushed
Vocal Authority: 8/10 — Confident, energetic
Wordplay & Narrative: 9/10 — Two haymakers
OTR: 8.0/10

🚀 THE NEXT STEP
You're above 7 — push the pocket tighter on bar 3.
`;

describe("parseScores", () => {
  it("extracts OTR score", () => {
    const result = parseScores(SAMPLE_RESPONSE);
    expect(result.otr_score).toBe(8.0);
  });

  it("extracts all 4 pillar scores", () => {
    const result = parseScores(SAMPLE_RESPONSE);
    expect(result.pillar_scores.rhyme_density).toBe(8);
    expect(result.pillar_scores.pocket_cadence).toBe(7);
    expect(result.pillar_scores.vocal_authority).toBe(8);
    expect(result.pillar_scores.wordplay).toBe(9);
  });

  it("handles decimal OTR like 7.5", () => {
    const text = "OTR: 7.5/10";
    const result = parseScores(text);
    expect(result.otr_score).toBe(7.5);
  });

  it("returns null for missing scores", () => {
    const result = parseScores("No scorecard here at all.");
    expect(result.otr_score).toBeNull();
    expect(result.pillar_scores.pocket_cadence).toBeNull();
  });

  it("rejects out-of-range score", () => {
    const text = "OTR: 11/10";
    const result = parseScores(text);
    expect(result.otr_score).toBeNull();
  });

  it("handles Hustle & Flow panel — still extracts OTR from PANEL VERDICT line", () => {
    const text = "PANEL VERDICT — OTR: 7.8/10";
    const result = parseScores(text);
    expect(result.otr_score).toBe(7.8);
  });
});

describe("deriveOtr", () => {
  it("calculates weighted OTR from all 4 pillars", () => {
    // PC 7 * 0.3 + RD 8 * 0.25 + VABC 8 * 0.25 + WNO 9 * 0.2 = 2.1 + 2 + 2 + 1.8 = 7.9
    const result = deriveOtr({
      pocket_cadence: 7,
      rhyme_density: 8,
      vocal_authority: 8,
      wordplay: 9,
    });
    expect(result).toBe(7.9);
  });

  it("returns null if any pillar is missing", () => {
    const result = deriveOtr({
      pocket_cadence: 7,
      rhyme_density: null,
      vocal_authority: 8,
      wordplay: 9,
    });
    expect(result).toBeNull();
  });
});
