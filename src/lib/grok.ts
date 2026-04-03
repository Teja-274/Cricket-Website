// Grok AI service - mock-ready, wire real API when available
// Replace with real Grok API key when ready

const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY || ''

export const isGrokConfigured = () => !!GROK_API_KEY

// Real implementation (uncomment when API key is ready):
// export async function askGrok(userPrompt: string, systemPrompt: string): Promise<string> {
//   const res = await fetch('https://api.x.ai/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${GROK_API_KEY}`,
//     },
//     body: JSON.stringify({
//       model: 'grok-2-latest',
//       messages: [
//         { role: 'system', content: systemPrompt },
//         { role: 'user', content: userPrompt },
//       ],
//       max_tokens: 800,
//     }),
//   })
//   const data = await res.json()
//   return data.choices?.[0]?.message?.content || ''
// }

// Mock AI responses
export async function askGrok(userPrompt: string, _systemPrompt: string): Promise<string> {
  await new Promise(r => setTimeout(r, 600 + Math.random() * 400))

  const lower = userPrompt.toLowerCase()

  if (lower.includes('bid') || lower.includes('auction')) {
    return `Based on the current auction dynamics, I recommend a cautious approach. The player's domestic record is strong, but IPL performance carries more weight at auction. Consider setting a ceiling at 1.5x the base price unless you have a specific squad gap this player fills. Monitor other teams' interest levels before committing.`
  }

  if (lower.includes('compare') || lower.includes('vs')) {
    return `Both players bring value but in different ways. Player 1 offers more consistency with a higher average, while Player 2 brings explosive power with a superior strike rate. For T20 formats, the aggressive option often wins, but in a long tournament, consistency provides more reliable returns.`
  }

  if (lower.includes('squad') || lower.includes('gap')) {
    return `Your current squad composition needs attention in the middle-order finishing department. You have strong openers and a solid bowling attack, but lack a power-hitting option at #5-6. Consider targeting left-handed finishers who can also contribute with medium pace or spin.`
  }

  if (lower.includes('rtm') || lower.includes('retain')) {
    return `RTM cards are your most valuable strategic asset. Save them for players who form the core of your batting lineup or your lead fast bowler. Using an RTM early on a mid-tier player means you can't match for a marquee signing later. Be patient.`
  }

  return `That's an interesting strategic question. In IPL auctions, the key is balancing aggression with discipline. Focus on filling squad roles rather than chasing star names. The most successful franchise strategies target undervalued domestic performers and complement them with 2-3 marquee international signings.`
}

// AI Strategist system prompt
export const STRATEGIST_SYSTEM_PROMPT = `You are an elite IPL auction strategist advising a single franchise owner.
You have deep knowledge of Indian cricket: IPL, Ranji Trophy, Vijay Hazare Trophy, and Syed Mushtaq Ali Trophy.
Given a player's stats and the franchise's current state, provide:
1. FAIR VALUE: what this player is worth in Crores
2. BID CEILING: the absolute max the franchise should pay
3. RECOMMENDATION: BID AGGRESSIVELY | BID CAUTIOUSLY | SKIP
4. RTM ADVICE: use RTM card or not (only if applicable)
5. REASONING: 2-3 concise sentences explaining the call
Be decisive. This is a live auction with a 30-second timer.`

// Scout system prompt
export const SCOUT_SYSTEM_PROMPT = `You are a cricket scout specializing in Indian domestic and IPL cricket.
Analyze players based on their stats across formats (IPL, Ranji Trophy, Vijay Hazare Trophy, SMAT, T20I, ODI).
Classify players into tiers: International Ready, IPL Proven, Domestic Star, Emerging Talent.
Provide insights on strengths, weaknesses, ideal role, and auction value.`
