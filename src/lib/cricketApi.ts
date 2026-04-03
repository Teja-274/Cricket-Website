// CricketData.org Live Stats API

const CRICKET_API_KEY = import.meta.env.VITE_CRICKET_API_KEY || ''
const BASE_URL = 'https://api.cricapi.com/v1'

export const isCricketApiConfigured = () => !!CRICKET_API_KEY

export interface LiveMatch {
  id: string
  teams: [string, string]
  score: string
  status: string
  venue: string
}

export interface SeasonStat {
  season: string
  matches: number
  runs?: number
  avg?: number
  sr?: number
  wickets?: number
  economy?: number
}

export async function fetchLiveMatches(): Promise<LiveMatch[]> {
  if (!CRICKET_API_KEY) return getMockMatches()

  try {
    const res = await fetch(`${BASE_URL}/currentMatches?apikey=${CRICKET_API_KEY}&offset=0`)
    if (!res.ok) {
      console.error('[CricketAPI] Error:', res.status)
      return getMockMatches()
    }
    const data = await res.json()
    if (data.status !== 'success' || !data.data) return getMockMatches()

    return data.data
      .filter((m: any) => m.matchType === 't20' || m.matchType === 'odi' || m.name?.toLowerCase().includes('ipl'))
      .slice(0, 10)
      .map((m: any) => ({
        id: m.id,
        teams: [m.teams?.[0] || 'TBA', m.teams?.[1] || 'TBA'],
        score: m.score?.map((s: any) => `${s.inning}: ${s.r}/${s.w} (${s.o} ov)`).join(' | ') || 'Yet to start',
        status: m.status || 'Upcoming',
        venue: m.venue || 'TBA',
      }))
  } catch (err) {
    console.error('[CricketAPI] Failed:', err)
    return getMockMatches()
  }
}

export async function searchPlayer(playerName: string): Promise<any> {
  if (!CRICKET_API_KEY) return null

  try {
    const res = await fetch(`${BASE_URL}/players?apikey=${CRICKET_API_KEY}&offset=0&search=${encodeURIComponent(playerName)}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.data?.[0] || null
  } catch {
    return null
  }
}

export async function fetchPlayerInfo(playerId: string): Promise<any> {
  if (!CRICKET_API_KEY) return null

  try {
    const res = await fetch(`${BASE_URL}/players_info?apikey=${CRICKET_API_KEY}&id=${playerId}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.data || null
  } catch {
    return null
  }
}

export async function fetchPlayerSeasonHistory(_playerName: string): Promise<SeasonStat[]> {
  // CricketData.org free tier doesn't have season-by-season history
  // Return mock data - can be replaced with Cricsheet.org CSV import later
  return [
    { season: 'IPL 2021', matches: 14, runs: 440, avg: 33.8, sr: 138.4 },
    { season: 'IPL 2022', matches: 16, runs: 521, avg: 37.2, sr: 142.1 },
    { season: 'IPL 2023', matches: 14, runs: 485, avg: 34.6, sr: 151.3 },
    { season: 'IPL 2024', matches: 15, runs: 557, avg: 39.8, sr: 158.7 },
    { season: 'IPL 2025', matches: 12, runs: 398, avg: 36.2, sr: 145.2 },
  ]
}

function getMockMatches(): LiveMatch[] {
  return [
    { id: '1', teams: ['Mumbai Indians', 'Chennai Super Kings'], score: 'MI 185/4 (18.2 ov)', status: 'In Progress', venue: 'Wankhede Stadium, Mumbai' },
    { id: '2', teams: ['Royal Challengers Bengaluru', 'Kolkata Knight Riders'], score: 'RCB 142/6 (20 ov) | KKR 98/3 (12.4 ov)', status: 'In Progress', venue: 'M. Chinnaswamy Stadium' },
    { id: '3', teams: ['Rajasthan Royals', 'Delhi Capitals'], score: 'RR 201/3 (20 ov) | DC 156/8 (20 ov)', status: 'RR won by 45 runs', venue: 'Sawai Mansingh Stadium' },
  ]
}
