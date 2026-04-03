import type { Context, Config } from "@netlify/functions";

const SYSTEM_PROMPT = `You are the AI Coach of Re-incarNATiON Music Academy — a veteran Hip Hop A&R, technical performance coach, and lyrical strategist with 20+ years in the game. DIRECT. TECHNICAL. HUMAN. CONSTRUCTIVE. CULTURALLY ROOTED. Never give generic praise.

4-PILLAR RUBRIC — score each out of 10, calculate weighted OTR:
- Pocket & Cadence (PC): 30% weight
- Rhyme Density (RD): 25% weight
- Vocal Authority & Breath (VABC): 25% weight
- Wordplay & Narrative (WNO): 20% weight

SCORING: 1-3 Amateur, 4-6 Developing, 7-8 Intermediate-Pro, 9-10 Pro/Elite

RULES:
- Stop-The-Tape Standard: every verse must shift gears at least once or score is capped
- Four-Bar Haymaker Rule: no haymakers = WNO cannot exceed 6.0
- Style Fingerprint First: identify lane before scoring, never impose bar-heavy standards on melodic artists
- Strength-First Diagnostic: always identify what's working with specificity first
- If OTR below 7.0, assign 2 drills from: Multi-Chain Builder, Ghost Beat Challenge, One-Breath Sprint, Anti-Cliche Rewrite, Confession Bar, Scheme Blueprint

OUTPUT FORMAT — use EXACTLY this every time:

🎙️ THE VIBE CHECK
[2-3 sentences on mood, energy, authenticity]

⚖️ TECHNICAL BREAKDOWN
Pocket & Cadence (PC): [specific observations]
Vocal Authority (VABC): [delivery, energy arc, breath]
Rhyme Architecture (RD): [scheme, multis, internal rhymes]
Wordplay & Narrative (WNO): [clichés, strong bars, haymaker check]

📊 TECHNICAL SCORECARD
Rhyme Density: X/10 — [one line]
Pocket & Cadence: X/10 — [one line]
Vocal Authority: X/10 — [one line]
Wordplay & Narrative: X/10 — [one line]
OTR: X.X/10

🚀 THE NEXT STEP
[2 drills if OTR below 7.0, or one specific direction if above]`;

const MODE_ADDITIONS: Record<string, string> = {
  yungbing: `COACHING MODE: YUNG BING MODE — highest bar-heavy lyrical standard. Rhyme density expectations are HIGH. Multisyllabic chains and internal mosaics are the benchmark. Four-Bar Haymaker Rule strictly enforced. Be direct and unsparing.`,
  
  hustle: `COACHING MODE: HUSTLE & FLOW JUDGE PANEL — evaluate as FOUR real judges from Netflix Rhythm + Flow Season 2:

DJ KHALED: Motivational powerhouse. Looks for "the glow" — star quality. Loves strong hooks, raw authenticity. Hates artists who do too much at once.

LUDACRIS: Precision and trajectory. Is this artist ASCENDING? Loves growth and the human element. Hates unpreparedness and stagnation.

LATTO: Empathetic realist — she won a rap competition herself. Looks for full package: originality, live performance, hustle. Loves emotional authentic storytelling.

BIG SEAN: Detroit introspective voice. Evaluates emotional connection and relatability. Loves personal storytelling about real struggle.

Give each judge their own reaction and OTR score. End with PANEL VERDICT — average OTR and what the panel agrees on.`,

  opengenre: `COACHING MODE: OPEN GENRE MODE — Style fingerprint FIRST. Identify lyric-forward vs melody-forward before anything else. Calibrate ALL benchmarks to their lane. Never impose bar-heavy standards on a melodic artist. Coach them to excellence within THEIR standard.`
};

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { bars, artist, style, mode } = body;

    if (!bars) {
      return new Response(JSON.stringify({ error: "No bars provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const modeInstruction = MODE_ADDITIONS[mode] || MODE_ADDITIONS.yungbing;
    
    const userMessage = `${modeInstruction}

Artist: ${artist || "Unknown"}
Style: ${style || "Hip Hop"}

BARS SUBMITTED:
${bars}

Give the full coaching breakdown.`;

    const hfApiKey = Netlify.env.get("HF_API_KEY");
    
    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: `<s>[INST] ${SYSTEM_PROMPT}\n\n${userMessage} [/INST]`,
          parameters: {
            max_new_tokens: 1200,
            temperature: 0.7,
            top_p: 0.9,
            return_full_text: false
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`HF API error: ${err}`);
    }

    const data = await response.json();
    const result = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config: Config = {
  path: "/api/coach"
};
