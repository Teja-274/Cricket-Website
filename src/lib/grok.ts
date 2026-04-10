// Grok AI service - uses xAI API

const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY || ''

export const isGrokConfigured = () => !!GROK_API_KEY

export async function askGrok(userPrompt: string, systemPrompt: string): Promise<string> {
  if (!GROK_API_KEY) {
    return getMockResponse(userPrompt)
  }

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini-fast',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      console.error('[Grok] API error:', res.status)
      return getMockResponse(userPrompt)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || getMockResponse(userPrompt)
  } catch (err) {
    console.error('[Grok] Request failed:', err)
    return getMockResponse(userPrompt)
  }
}

// Fallback mock responses
function getMockResponse(prompt: string): string {
  const lower = prompt.toLowerCase()
  if (lower.includes('bid') || lower.includes('auction')) {
    return `Based on the current auction dynamics, I recommend a cautious approach. The player's domestic record is strong, but IPL performance carries more weight at auction. Consider setting a ceiling at 1.5x the base price unless you have a specific squad gap this player fills.`
  }
  if (lower.includes('compare') || lower.includes('vs')) {
    return `Both players bring value but in different ways. Player 1 offers more consistency with a higher average, while Player 2 brings explosive power with a superior strike rate. For T20 formats, the aggressive option often wins.`
  }
  if (lower.includes('squad') || lower.includes('gap')) {
    return `Your current squad composition needs attention in the middle-order finishing department. You have strong openers and a solid bowling attack, but lack a power-hitting option at #5-6.`
  }
  return `In IPL auctions, the key is balancing aggression with discipline. Focus on filling squad roles rather than chasing star names. The most successful franchise strategies target undervalued domestic performers and complement them with 2-3 marquee international signings.`
}

// System prompts
export const STRATEGIST_SYSTEM_PROMPT = `You are an elite IPL auction strategist advising a single franchise owner.
You have deep knowledge of Indian cricket: IPL, Ranji Trophy, Vijay Hazare Trophy, and Syed Mushtaq Ali Trophy.
Given a player's stats and the franchise's current state, provide:
1. FAIR VALUE: what this player is worth in Crores
2. BID CEILING: the absolute max the franchise should pay
3. RECOMMENDATION: BID AGGRESSIVELY | BID CAUTIOUSLY | SKIP
4. RTM ADVICE: use RTM card or not (only if applicable)
5. REASONING: 2-3 concise sentences explaining the call
Be decisive. This is a live auction with a 30-second timer. Keep responses under 150 words.`

export const SCOUT_SYSTEM_PROMPT = `You are a cricket scout specializing in Indian domestic and IPL cricket.
Analyze players based on their stats across formats (IPL, Ranji Trophy, Vijay Hazare Trophy, SMAT, T20I, ODI).
Classify players into tiers: International Ready, IPL Proven, Domestic Star, Emerging Talent.
Provide insights on strengths, weaknesses, ideal role, and auction value.
Keep responses concise and data-driven.`

export const COMPARE_SYSTEM_PROMPT = `You are a cricket analyst comparing two players.
Provide a clear verdict on which player is the better pick for an IPL franchise.
Consider: format suitability, consistency, match-winning ability, age/longevity, value for money.
Give a definitive recommendation, not a wishy-washy "both are good" answer.
Keep the response under 100 words.`

// Search cricket players using natural language
export const SEARCH_SYSTEM_PROMPT = `You are a cricket scout search engine.
Given a natural language query, return player names that match the criteria.
Return ONLY a JSON array of player names (use common Indian cricket player name format).
Example query: "young left-arm spinner who bowls well in death overs"
Example response: ["Axar Patel", "Kuldeep Yadav", "Yuzvendra Chahal"]
Return maximum 6 players. Only return the JSON array, no other text.`

// Squad analyzer for shortlists
export const SQUAD_ANALYZER_SYSTEM_PROMPT = `You are an IPL squad balance analyst.
Given a list of shortlisted players, evaluate the squad balance and provide:
1. STRENGTHS: 2-3 key strengths of this squad
2. GAPS: 2-3 areas needing improvement
3. VERDICT: One-line overall assessment
Keep response under 150 words. Be direct and actionable.`

// Price predictor
export const PRICE_PREDICTOR_SYSTEM_PROMPT = `You are an IPL auction price prediction expert.
Given a player's profile and stats, predict their likely auction price in Crores.
Consider: recent form, age, international reputation, scarcity of role, past auction prices.
Return in format:
PREDICTED PRICE: X.X Cr
LOW ESTIMATE: X.X Cr
HIGH ESTIMATE: X.X Cr
REASONING: One concise sentence.`
